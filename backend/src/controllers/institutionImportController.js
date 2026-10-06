const { FIELD_OPTIONS } = require("../utils/programField");
const axios = require("axios");
const mongoose = require("mongoose");
const XLSX = require("xlsx");
const fs = require("fs");
const path = require("path");
const { createHash } = require("crypto");
const Country = require("../models/Country");
const Institution = require("../models/Institution");
const Program = require("../models/Program");
const { normalizeProgramsArray } = require("../utils/normalizeProgramData");

const GROQ_URL = "https://api.groq.com/openai/v1/chat/completions";
const MODEL = process.env.GROQ_IMPORT_MODEL || "openai/gpt-oss-120b";
const MAX_BATCH_CHARACTERS = 10000;
let groqKeyCursor = 0;
const groqKeyCooldowns = new Map();
const groqKeysInFlight = new Set();
const IMPORT_OUTPUT_ROOT = path.join(__dirname, "..", "..", "import-output");
const IMPORT_CACHE_VERSION = "v6";

function workbookSessionId(buffer) {
    const hash = createHash("sha256").update(buffer).digest("hex");
    return `${IMPORT_CACHE_VERSION}-${hash}`;
}

function safePathPart(value, fallback) {
    const cleaned = String(value || "").replace(/[^a-zA-Z0-9_-]/g, "").slice(0, 100);
    return cleaned || fallback;
}

function saveImportJson(sessionId, groupId, fileName, value) {
    const directory = path.join(
        IMPORT_OUTPUT_ROOT,
        safePathPart(sessionId, "unknown-session"),
        safePathPart(groupId, "unknown-group")
    );
    fs.mkdirSync(directory, { recursive: true });
    fs.writeFileSync(path.join(directory, fileName), JSON.stringify(value, null, 2), "utf8");
    return directory;
}

function readImportJson(sessionId, groupId, fileName) {
    const filePath = path.join(
        IMPORT_OUTPUT_ROOT,
        safePathPart(sessionId, "unknown-session"),
        safePathPart(groupId, "unknown-group"),
        fileName
    );
    if (!fs.existsSync(filePath)) return null;
    try {
        return JSON.parse(fs.readFileSync(filePath, "utf8"));
    } catch (error) {
        console.warn(`Ignoring invalid import cache file ${filePath}: ${error.message}`);
        return null;
    }
}

const wait = (milliseconds) => new Promise((resolve) => setTimeout(resolve, milliseconds));

function retryDelayMs(error) {
    const headerValue = Number(error.response?.headers?.["retry-after"]);
    if (Number.isFinite(headerValue) && headerValue > 0) return Math.ceil(headerValue * 1000);
    const message = error.response?.data?.error?.message || "";
    const match = message.match(/try again in\s+([\d.]+)s/i);
    return match ? Math.ceil(Number(match[1]) * 1000) : 30000;
}

function getGroqKeys() {
    const keys = [];
    if (process.env.GROQ_API_KEY) keys.push(process.env.GROQ_API_KEY);
    for (let index = 1; process.env[`GROQ_API_KEY${index}`]; index += 1) {
        keys.push(process.env[`GROQ_API_KEY${index}`]);
    }
    return [...new Set(keys)];
}

function workbookRows(buffer) {
    const workbook = XLSX.read(buffer, { type: "buffer", cellDates: true });
    const sheets = {};
    for (const name of workbook.SheetNames) {
        sheets[name] = XLSX.utils.sheet_to_json(workbook.Sheets[name], {
            defval: null,
            raw: false,
        });
    }
    return sheets;
}

const INSTITUTION_COLUMN_PATTERN = /(^|\b)(university|institution|institute|college|school|provider|academy|hei|education provider|partner institution)(\b|$)/i;

function institutionNameFromLabel(value) {
    return String(value || "")
        .split(/\r?\n|\s+[·•]\s+/)[0]
        .replace(/\s+/g, " ")
        .trim();
}

function institutionGroupingKey(value) {
    return institutionNameFromLabel(value)
        .toLowerCase()
        .normalize("NFKD")
        .replace(/[\u0300-\u036f]/g, "")
        .replace(/\([^)]*\)/g, " ")
        .replace(/[^a-z0-9]+/g, " ")
        .split(" ")
        .filter((token) => token && token !== "the" && token !== "of")
        .map((token) => token === "sciences" ? "science" : token)
        .join(" ");
}

function groupedWorkbook(sheets) {
    const groups = [];
    for (const [sheetName, originalRows] of Object.entries(sheets)) {
        if (!originalRows.length) continue;
        const headers = [...new Set(originalRows.flatMap((row) => Object.keys(row)))];
        const identityColumn = headers.find((header) => INSTITUTION_COLUMN_PATTERN.test(header));
        if (!identityColumn) {
            groups.push({ label: sheetName, sheets: { [sheetName]: originalRows } });
            continue;
        }
        const rowsByInstitution = new Map();
        let lastIdentity = "";
        for (const row of originalRows) {
            const value = String(row[identityColumn] || "").trim();
            if (value) lastIdentity = value;
            const identity = value || lastIdentity || `Unidentified ${sheetName}`;
            const key = institutionGroupingKey(identity) || `unidentified-${sheetName}`;
            if (!rowsByInstitution.has(key)) {
                rowsByInstitution.set(key, { label: institutionNameFromLabel(identity), rows: [] });
            }
            rowsByInstitution.get(key).rows.push({ ...row, [identityColumn]: identity });
        }
        for (const { label, rows } of rowsByInstitution.values()) {
            groups.push({ label, sheets: { [sheetName]: rows } });
        }
    }
    const merged = new Map();
    for (const group of groups) {
        const key = institutionGroupingKey(group.label);
        if (!merged.has(key)) merged.set(key, { label: group.label, sheets: {} });
        const target = merged.get(key);
        for (const [sheetName, rows] of Object.entries(group.sheets)) {
            target.sheets[sheetName] = [...(target.sheets[sheetName] || []), ...rows];
        }
    }
    return [...merged.values()].map((group, index) => ({ ...group, id: `group-${index}` }));
}

function selectGroup(buffer, groupId) {
    const groups = groupedWorkbook(workbookRows(buffer));
    return groups.find((group) => group.id === groupId);
}

function parseGroqJson(content) {
    const cleaned = content.trim().replace(/^```(?:json)?\s*/i, "").replace(/\s*```$/, "");
    return JSON.parse(cleaned);
}

async function askGroq(system, payload) {
    const keys = getGroqKeys();
    if (!keys.length) throw new Error("No GROQ_API_KEY or GROQ_API_KEY1... keys are configured");
    let lastError;
    let rateLimitRetries = 0;
    let generationRetries = 0;
    while (rateLimitRetries <= Math.max(6, keys.length * 3) && generationRetries <= 2) {
        const now = Date.now();
        let keyIndex = -1;
        for (let offset = 0; offset < keys.length; offset += 1) {
            const candidate = (groqKeyCursor + offset) % keys.length;
            if (!groqKeysInFlight.has(keys[candidate]) && (groqKeyCooldowns.get(keys[candidate]) || 0) <= now) {
                keyIndex = candidate;
                break;
            }
        }

        if (keyIndex === -1) {
            const earliest = Math.min(...keys.map((key) => groqKeyCooldowns.get(key) || now));
            await wait(Math.max(250, earliest - now));
            continue;
        }

        groqKeysInFlight.add(keys[keyIndex]);
        try {
            const response = await axios.post(GROQ_URL, {
                model: MODEL,
                temperature: 0,
                max_completion_tokens: 3000,
                response_format: { type: "json_object" },
                messages: [
                    { role: "system", content: `${system}\nReturn the final response as one valid JSON object only.` },
                    { role: "user", content: JSON.stringify(payload) },
                ],
            }, {
                headers: { Authorization: `Bearer ${keys[keyIndex]}` },
                timeout: 120000,
                maxContentLength: 20 * 1024 * 1024,
            });
            groqKeyCursor = (keyIndex + 1) % keys.length;
            return parseGroqJson(response.data.choices[0].message.content);
        } catch (error) {
            lastError = error;
            const status = error.response?.status;
            const code = error.response?.data?.error?.code;
            if (code === "json_validate_failed") {
                if (generationRetries >= 2) throw error;
                generationRetries += 1;
                groqKeyCursor = (keyIndex + 1) % keys.length;
                console.warn(`Groq returned incomplete JSON; retrying batch (${generationRetries}/2).`);
                continue;
            }
            if (status !== 429 && code !== "rate_limit_exceeded") throw error;
            const delay = retryDelayMs(error) + 500;
            groqKeyCooldowns.set(keys[keyIndex], Date.now() + delay);
            groqKeyCursor = (keyIndex + 1) % keys.length;
            rateLimitRetries += 1;
            console.warn(`Groq import key ${keyIndex + 1} rate limited; retrying after available-key cooldown.`);
        } finally {
            groqKeysInFlight.delete(keys[keyIndex]);
        }
    }
    throw lastError;
}

function batchWorkbook(sheets, { maxCharacters = MAX_BATCH_CHARACTERS, maxRows = Number.POSITIVE_INFINITY } = {}) {
    const batches = [];
    let current = {};
    let currentSize = 2;
    let currentRows = 0;
    const flush = () => {
        if (Object.keys(current).length) batches.push(current);
        current = {};
        currentSize = 2;
        currentRows = 0;
    };
    for (const [sheetName, rows] of Object.entries(sheets)) {
        for (const row of rows) {
            const rowSize = JSON.stringify(row).length + sheetName.length + 8;
            if ((currentSize + rowSize > maxCharacters || currentRows >= maxRows) && currentSize > 2) flush();
            if (!current[sheetName]) current[sheetName] = [];
            current[sheetName].push(row);
            currentSize += rowSize;
            currentRows += 1;
        }
    }
    flush();
    return batches;
}

function mergeExtractedObjects(existing, incoming) {
    if (Array.isArray(existing) && Array.isArray(incoming)) {
        const values = [...existing];
        const seen = new Set(values.map((value) => JSON.stringify(value)));
        for (const value of incoming) {
            const key = JSON.stringify(value);
            if (!seen.has(key)) {
                seen.add(key);
                values.push(value);
            }
        }
        return values;
    }
    if (existing && incoming && typeof existing === "object" && typeof incoming === "object") {
        const merged = { ...existing };
        for (const [key, value] of Object.entries(incoming)) {
            merged[key] = key in merged ? mergeExtractedObjects(merged[key], value) : value;
        }
        return merged;
    }
    return existing !== null && existing !== undefined && existing !== "" ? existing : incoming;
}

async function extractInBatches(system, sheets, context, resultKey, identity, onBatch, mergeDuplicate, batchOptions) {
    const merged = [];
    const seen = new Map();
    const batches = batchWorkbook(sheets, batchOptions);
    for (let index = 0; index < batches.length; index += 1) {
        const result = await askGroq(system, {
            ...context,
            sheets: batches[index],
            batch: { number: index + 1, total: batches.length },
        });
        if (onBatch) onBatch(index, result);
        for (const item of result[resultKey] || []) {
            const key = identity(item);
            if (!key) continue;
            if (seen.has(key)) {
                if (mergeDuplicate) {
                    const existingIndex = seen.get(key);
                    merged[existingIndex] = mergeDuplicate(merged[existingIndex], item);
                }
                continue;
            }
            seen.set(key, merged.length);
            merged.push(item);
        }
    }
    return merged;
}

const institutionShape = `Return {"institutions":[]} only. Each institution must contain:
importKey (stable short string), name, countryCode (ISO-2), type (Public|Private|Community|Other),
website, email, contactNumber, campuses [{name,address,city,contactNumber,email,mapEmbedUrl}],
applicationFee {amount,currency}, entryRequirements {undergraduate:{gpa:{type,score},languageRequirement:[]},postgraduate:{gpa:{type,score},languageRequirement:[]}},
documents {incomeSources:[],sponsors:[],minSponsorCount,minIncomeAmount,banks:[],previousVisaRefusal,levelChangeAfterRefusal},
scholarships [{name,value,description,eligibility,url}], awards [{title,issuer,year,description}], description, isActive.
The source institution value may combine a name and location, for example "University Name · City, Country" or place the location on a new line. Put ONLY the institution's proper name in name. Use the city/country portion to set countryCode and campus location fields when supported by the source. Do not leave bullets, city names, or country names appended to name.
Use null, empty strings, arrays, or safe defaults when source data is absent. Never invent factual data.`;

const programShape = `Return {"programs":[]} only. Each program must contain institutionKey matching an approved institution importKey, degree_name, level (Foundation|UG Certificate|PG Certificate|Diploma|PG Diploma|Bachelor|Master|PhD|Doctoral|Research|null), field [] (include every substantially supported category from supplied allowedFields; use multiple labels for interdisciplinary courses, deduplicate, and use [] when unknown; never split commas inside category names), credits [], format, scholarship {available,description,url}, intakes [], campuses [], duration, accreditation, entry_requirements {academic:{minimum_qualification,field_requirement,score_type,score,scale},language_requirements:{english:{ielts:{overall,listening,reading,writing,speaking},toefl:{overall,listening,reading,writing,speaking},pte:{overall,listening,reading,writing,speaking},duolingo:{overall,listening,reading,writing,speaking},cambridge,cefr},german:{cefr,testdaf:{overall,listening,reading,writing,speaking},dsh:{overall,listening,reading,writing,speaking}},other_languages:[]},additional_requirements:[]}, tuition_fees [{credits,annual_fee_eur}], application_fees, application_deadline, url, isActive. Never invent factual data; use null/empty values. url is required: use the institution website only when no program URL exists.`;

function cleanInstitutionName(value) {
    return String(value || "")
        .split(/\r?\n|\s+[·•]\s+/)[0]
        .replace(/\s+/g, " ")
        .trim();
}

function usableUrl(value) {
    const normalized = String(value || "").trim();
    return normalized && !/^(n\/?a|none|null|unknown)$/i.test(normalized) ? normalized : "";
}

function programImportUrl(program, institutions, sessionId, groupId, index) {
    const institution = institutions.find((item) => item.importKey === program.institutionKey) || institutions[0];
    const website = usableUrl(institution?.website);
    if (website) return website;
    const programPart = String(program.degree_name || `program-${index + 1}`)
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/^-|-$/g, "")
        .slice(0, 80);
    return `urn:counsora:spreadsheet-import:${safePathPart(sessionId, "session")}:${safePathPart(groupId, "group")}:${programPart || `program-${index + 1}`}`;
}

function normalizeInstitutionLanguageRequirement(value) {
    const values = Array.isArray(value) ? value : value == null || value === "" ? [] : [value];
    return values.map((entry) => {
        if (entry && typeof entry === "object") {
            return {
                testType: entry.testType || "",
                overall: entry.overall == null ? "" : String(entry.overall),
                minimum: entry.minimum == null ? "" : String(entry.minimum),
                hasIndividualScores: entry.hasIndividualScores === true,
                listening: entry.listening == null ? "" : String(entry.listening),
                reading: entry.reading == null ? "" : String(entry.reading),
                writing: entry.writing == null ? "" : String(entry.writing),
                speaking: entry.speaking == null ? "" : String(entry.speaking),
                literacy: entry.literacy == null ? "" : String(entry.literacy),
                comprehension: entry.comprehension == null ? "" : String(entry.comprehension),
                conversation: entry.conversation == null ? "" : String(entry.conversation),
                production: entry.production == null ? "" : String(entry.production),
            };
        }
        const text = String(entry).trim();
        const test = text.match(/\b(IELTS(?:\s+Academic)?|TOEFL|PTE(?:\s+Academic)?|Duolingo|Cambridge|CEFR)\b/i)?.[1] || text;
        const score = text.match(/\b\d+(?:\.\d+)?\b/)?.[0] || "";
        return {
            testType: test,
            overall: score,
            minimum: "",
            hasIndividualScores: false,
            listening: "",
            reading: "",
            writing: "",
            speaking: "",
            literacy: "",
            comprehension: "",
            conversation: "",
            production: "",
        };
    });
}

function normalizeSchemaString(value) {
    if (value === null || value === undefined) return "";
    if (Array.isArray(value)) {
        return value.map(normalizeSchemaString).filter(Boolean).join("; ");
    }
    if (typeof value === "object") {
        return Object.entries(value)
            .map(([key, entry]) => `${key}: ${normalizeSchemaString(entry)}`)
            .filter((entry) => !entry.endsWith(": "))
            .join("; ");
    }
    return String(value).trim();
}

function normalizeSchemaNumber(value, fallback = null) {
    if (value === null || value === undefined || value === "") return fallback;
    if (typeof value === "number" && Number.isFinite(value)) return value;
    const match = normalizeSchemaString(value).replace(/,/g, "").match(/-?\d+(?:\.\d+)?/);
    return match ? Number(match[0]) : fallback;
}

function normalizeInstitutionEntryRequirements(value) {
    const source = value && typeof value === "object" ? value : {};
    const normalizeLevel = (level) => {
        const entry = level && typeof level === "object" ? level : {};
        const gpa = entry.gpa && typeof entry.gpa === "object"
            ? entry.gpa
            : { type: "", score: entry.gpa == null ? "" : String(entry.gpa) };
        return {
            ...entry,
            gpa: {
                type: ["GPA", "Percentage", "Qualification", ""].includes(gpa.type) ? gpa.type : "",
                score: gpa.score == null ? "" : String(gpa.score),
            },
            languageRequirement: normalizeInstitutionLanguageRequirement(entry.languageRequirement),
        };
    };
    return {
        undergraduate: normalizeLevel(source.undergraduate),
        postgraduate: normalizeLevel(source.postgraduate),
    };
}

async function discoverGroups(req, res) {
    try {
        if (!req.file) return res.status(400).json({ error: "Spreadsheet file is required" });
        const sessionId = workbookSessionId(req.file.buffer);
        const cachedManifest = readImportJson(sessionId, "manifest", "groups.json");
        if (Array.isArray(cachedManifest)) {
            return res.json({ sessionId, groups: cachedManifest, cached: true });
        }
        const groups = groupedWorkbook(workbookRows(req.file.buffer));
        const manifest = groups.map(({ id, label, sheets }) => ({ id, label, rowCount: Object.values(sheets).reduce((total, rows) => total + rows.length, 0) }));
        saveImportJson(sessionId, "manifest", "groups.json", manifest);
        res.json({ sessionId, groups: manifest, cached: false });
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
}

async function extractInstitutions(req, res) {
    try {
        if (!req.file) return res.status(400).json({ error: "Spreadsheet file is required" });
        const sessionId = workbookSessionId(req.file.buffer);
        const cached = readImportJson(sessionId, req.body.groupId, "institution-merged.json");
        if (Array.isArray(cached?.institutions) && cached.institutions.length) {
            return res.json({ institutions: cached.institutions, cached: true });
        }
        const group = req.body.groupId ? selectGroup(req.file.buffer, req.body.groupId) : null;
        const sheets = group?.sheets || workbookRows(req.file.buffer);
        if (req.body.groupId && !group) return res.status(400).json({ error: "Spreadsheet group was not found" });
        const countries = await Country.find({ isActive: true }).select("_id code name currency").lean();
        const extracted = await extractInBatches(
            `You transform one university group's spreadsheet rows into the application's institution schema. Return exactly one institution for this group unless the group unmistakably contains multiple institutions. ${institutionShape}`,
            sheets,
            { countries: countries.map(({ code, name }) => ({ code, name })) },
            "institutions",
            () => group?.id || req.body.groupId || "single-institution-group",
            (index, result) => saveImportJson(sessionId, req.body.groupId, `institution-batch-${index + 1}.json`, result),
            mergeExtractedObjects
        );
        const byCode = new Map(countries.map((c) => [c.code.toUpperCase(), c]));
        const institutions = extracted.map((item, index) => {
            const country = byCode.get(String(item.countryCode || "").toUpperCase());
            return { ...item, name: cleanInstitutionName(item.name), importKey: item.importKey || `institution-${index + 1}`, country: country?._id || null, countryName: country?.name || item.countryCode || "", currency: country?.currency || item.applicationFee?.currency || "" };
        });
        saveImportJson(sessionId, req.body.groupId, "institution-merged.json", { institutions });
        res.json({ institutions, cached: false });
    } catch (error) {
        console.error("Groq institution extraction failed:", error.response?.data || error);
        res.status(500).json({ error: error.response?.data?.error?.message || error.message });
    }
}

async function extractPrograms(req, res) {
    try {
        if (!req.file) return res.status(400).json({ error: "Spreadsheet file is required" });
        const sessionId = workbookSessionId(req.file.buffer);
        const institutions = JSON.parse(req.body.institutions || "[]");
        if (!institutions.length) return res.status(400).json({ error: "Approved institutions are required" });
        const cached = readImportJson(sessionId, req.body.groupId, "program-merged.json");
        if (Array.isArray(cached?.programs)) {
            const programs = cached.programs.map((program, index) => ({
                ...program,
                url: usableUrl(program.url) || programImportUrl(program, institutions, sessionId, req.body.groupId, index),
            }));
            return res.json({ programs, cached: true });
        }
        const group = req.body.groupId ? selectGroup(req.file.buffer, req.body.groupId) : null;
        const sheets = group?.sheets || workbookRows(req.file.buffer);
        if (req.body.groupId && !group) return res.status(400).json({ error: "Spreadsheet group was not found" });
        const allowedFields = FIELD_OPTIONS;
        const extractedPrograms = await extractInBatches(
            `You transform one batch of spreadsheet rows into the application's program schema. ${programShape}`,
            sheets,
            { approvedInstitutions: institutions.map(({ importKey, name, website }) => ({ importKey, name, website })), allowedFields },
            "programs",
            (item) => `${item.institutionKey || ""}|${item.degree_name || ""}|${item.url || ""}`.toLowerCase(),
            (index, result) => saveImportJson(sessionId, req.body.groupId, `program-batch-${index + 1}.json`, result),
            null,
            { maxCharacters: 6000, maxRows: 3 }
        );
        const programs = extractedPrograms.map((program, index) => ({
            ...program,
            url: usableUrl(program.url) || programImportUrl(program, institutions, sessionId, req.body.groupId, index),
        }));
        saveImportJson(sessionId, req.body.groupId, "program-merged.json", { programs });
        res.json({ programs, cached: false });
    } catch (error) {
        console.error("Groq program extraction failed:", error.response?.data || error);
        res.status(500).json({ error: error.response?.data?.error?.message || error.message });
    }
}

async function commitImport(req, res) {
    const session = await mongoose.startSession();
    try {
        const { institutions, programs, sessionId, groupId } = req.body;
        if (!Array.isArray(institutions) || !institutions.length) return res.status(400).json({ error: "Institutions are required" });
        const { normalized, errors } = normalizeProgramsArray(programs || []);
        if (errors.length) return res.status(400).json({ error: "Some programs do not match the program schema", details: errors });
        const processed = [];
        const sourceFingerprint = sessionId && groupId ? `${sessionId}:${groupId}` : null;
        await session.withTransaction(async () => {
            const idByKey = new Map();
            for (const item of institutions) {
                if (!item.name || !item.country) throw new Error(`Institution ${item.name || item.importKey} needs a valid name and country`);
                const { importKey, countryName, countryCode, currency, ...data } = item;
                const applicationFee = data.applicationFee && typeof data.applicationFee === "object"
                    ? data.applicationFee
                    : {};
                const documents = data.documents && typeof data.documents === "object" ? data.documents : {};
                const sanitized = {
                    ...data,
                    name: normalizeSchemaString(data.name),
                    type: ["Public", "Private", "Community", "Other"].includes(data.type) ? data.type : "Other",
                    website: normalizeSchemaString(data.website),
                    email: normalizeSchemaString(data.email),
                    contactNumber: normalizeSchemaString(data.contactNumber),
                    description: normalizeSchemaString(data.description),
                    isActive: data.isActive !== false,
                    entryRequirements: normalizeInstitutionEntryRequirements(data.entryRequirements),
                    campuses: (Array.isArray(data.campuses) ? data.campuses : [])
                        .filter((campus) => campus.address || campus.city)
                        .map((campus) => {
                            const address = normalizeSchemaString(campus.address || campus.city);
                            return {
                                name: normalizeSchemaString(campus.name),
                                address,
                                city: normalizeSchemaString(campus.city),
                                contactNumber: normalizeSchemaString(campus.contactNumber),
                                email: normalizeSchemaString(campus.email),
                                mapEmbedUrl: normalizeSchemaString(campus.mapEmbedUrl) || `https://www.google.com/maps?q=${encodeURIComponent(address)}&output=embed`,
                            };
                        }),
                    scholarships: (Array.isArray(data.scholarships) ? data.scholarships : [])
                        .filter((scholarship) => normalizeSchemaString(scholarship?.name))
                        .map((scholarship) => ({
                            name: normalizeSchemaString(scholarship.name),
                            value: normalizeSchemaString(scholarship.value),
                            description: normalizeSchemaString(scholarship.description),
                            eligibility: normalizeSchemaString(scholarship.eligibility),
                            url: normalizeSchemaString(scholarship.url),
                        })),
                    awards: (Array.isArray(data.awards) ? data.awards : [])
                        .filter((award) => normalizeSchemaString(award?.title))
                        .map((award) => ({
                            title: normalizeSchemaString(award.title),
                            issuer: normalizeSchemaString(award.issuer),
                            year: normalizeSchemaNumber(award.year),
                            description: normalizeSchemaString(award.description),
                        })),
                    documents: {
                        incomeSources: Array.isArray(documents.incomeSources) ? documents.incomeSources.map(normalizeSchemaString).filter(Boolean) : [],
                        sponsors: Array.isArray(documents.sponsors) ? documents.sponsors.map(normalizeSchemaString).filter(Boolean) : [],
                        minSponsorCount: normalizeSchemaNumber(documents.minSponsorCount, 1),
                        minIncomeAmount: normalizeSchemaString(documents.minIncomeAmount),
                        banks: Array.isArray(documents.banks) ? documents.banks.map(normalizeSchemaString).filter(Boolean) : [],
                        previousVisaRefusal: normalizeSchemaString(documents.previousVisaRefusal),
                        levelChangeAfterRefusal: documents.levelChangeAfterRefusal === true,
                    },
                    applicationFee: {
                        amount: normalizeSchemaNumber(applicationFee.amount, 0),
                        currency: normalizeSchemaString(applicationFee.currency || currency),
                    },
                    ...(sourceFingerprint ? { importFingerprint: sourceFingerprint } : {}),
                };
                let institution = sourceFingerprint
                    ? await Institution.findOne({ importFingerprint: sourceFingerprint }).session(session)
                    : null;
                if (!institution) {
                    const candidates = await Institution.find({ country: item.country }).session(session);
                    institution = candidates.find((candidate) => institutionGroupingKey(candidate.name) === institutionGroupingKey(sanitized.name)) || null;
                }
                if (institution) {
                    institution = await Institution.findByIdAndUpdate(
                        institution._id,
                        { $set: sanitized },
                        { new: true, runValidators: true, session }
                    );
                } else {
                    const created = await Institution.create([sanitized], { session });
                    institution = created[0];
                }
                idByKey.set(importKey, institution._id);
                processed.push(institution);
            }
            const docs = normalized.map((program, index) => {
                const institutionId = idByKey.get(programs[index].institutionKey);
                if (!institutionId) throw new Error(`Program ${program.degree_name} has no approved institution`);
                return { ...program, institutionId };
            });
            for (const doc of docs) {
                const existing = await Program.findOne({
                    institutionId: doc.institutionId,
                    degree_name: { $regex: `^${doc.degree_name.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}$`, $options: "i" },
                }).session(session);
                if (existing) {
                    await Program.findByIdAndUpdate(existing._id, { $set: doc }, { runValidators: true, session });
                } else {
                    await Program.create([doc], { session });
                }
            }
        });
        res.status(201).json({ message: "Institutions and programs imported", institutionCount: processed.length, programCount: normalized.length });
    } catch (error) {
        res.status(400).json({ error: error.message });
    } finally {
        await session.endSession();
    }
}

module.exports = { discoverGroups, extractInstitutions, extractPrograms, commitImport };
