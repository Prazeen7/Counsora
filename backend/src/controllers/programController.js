const applicantAcademicScore = require("../utils/applicantAcademicScore");
const { FIELD_OPTIONS, normalizeProgramField, normalizeProgramFields, programFieldFilter } = require("../utils/programField");
const programGpaFilter = require("../utils/programGpaFilter");
const programEnglishFilter = require("../utils/programEnglishFilter");
const programAcademicLevelFilter = require("../utils/programAcademicLevelFilter");
const Program = require("../models/Program");
const Institution = require("../models/Institution");
const mongoose = require("mongoose");
const { buildInstitutionProgramSummary } = require("../utils/institutionProgramSummary");


// Fetch a program page or institution-wide summary; unpaged access supports exports.
const getProgramsByInstitution = async (req, res) => {
    try {
        const { institutionId } = req.params;

        if (!mongoose.Types.ObjectId.isValid(institutionId)) {
            return res.status(400).json({
                error: "Invalid institution ID",
            });
        }

        const includeInactive = req.query.includeInactive === "true" &&
            ["admin", "superAdmin"].includes(req.user?.role);
        const baseFilter = {
            institutionId,
            ...(includeInactive ? {} : { isActive: true }),
        };
        if (req.query.summary === "true") {
            const rows = await Program.find(baseFilter)
                .select("degree_name level field intakes campuses scholarship entry_requirements").lean();
            return res.json(buildInstitutionProgramSummary(rows));
        }
        const filter = { ...baseFilter };
        const { search, level, field, intake, tuition, status } = req.query;
        if (includeInactive && ["active", "inactive"].includes(status)) filter.isActive = status === "active";
        if (search) filter.degree_name = { $regex: String(search).replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), $options: "i" };
        if (level && level !== "all") filter.level = level;
        if (field && field !== "all") Object.assign(filter, programFieldFilter(field));
        if (intake && intake !== "all") filter.intakes = intake;
        if (["under20000", "20000to30000", "above30000"].includes(tuition)) {
            const fee = { $min: { $filter: {
                input: { $map: { input: { $ifNull: ["$tuition_fees", []] }, as: "fee", in: {
                    $convert: { input: "$$fee.annual_fee_eur", to: "double", onError: 0, onNull: 0 },
                } } }, as: "amount", cond: { $gt: ["$$amount", 0] },
            } } };
            filter.$expr = tuition === "under20000"
                ? { $and: [{ $gt: [fee, 0] }, { $lt: [fee, 20000] }] }
                : tuition === "above30000" ? { $gt: [fee, 30000] }
                    : { $and: [{ $gte: [fee, 20000] }, { $lte: [fee, 30000] }] };
        }
        const paginated = req.query.limit !== undefined;
        const limit = Math.min(100, Math.max(1, Number.parseInt(req.query.limit, 10) || 12));
        const offset = Math.max(0, Number.parseInt(req.query.offset, 10) || 0);
        let query = Program.find(filter).sort({ isDimmed: 1, isPinned: -1, _id: 1 });
        if (paginated) query = query.skip(offset).limit(limit);
        const [programs, total] = await Promise.all([
            query.lean(), paginated ? Program.countDocuments(filter) : Promise.resolve(null),
        ]);

        return res.status(200).json({
            count: programs.length,
            programs: programs.map(program => ({ ...program, field: normalizeProgramFields(program.field) })),
            ...(paginated ? { pagination: { total, offset, limit, hasMore: offset + programs.length < total } } : {}),
        });

    } catch (error) {
        console.error("Error fetching programs:", error);

        return res.status(500).json({
            error: error.message,
        });
    }
};


const VALID_LEVELS = ["Foundation", "Diploma", "Bachelor", "Master", "PhD", "Doctoral", "Research", null];
const VALID_FIELDS = FIELD_OPTIONS;
const VALID_QUALIFICATIONS = ["Higher Secondary", "Diploma", "Bachelor", "Master", "Doctoral", null];
const VALID_SCORE_TYPES = ["GPA", "Percentage", null];

const parseNumberOrNull = (val) => {
    if (val === null || val === undefined || val === "") return null;
    const num = Number(val);
    return Number.isNaN(num) ? null : num;
};

const sanitizeLanguageScore = (scoreObj) => {
    if (!scoreObj || typeof scoreObj !== "object") return {};
    return {
        overall: parseNumberOrNull(scoreObj.overall),
        minimum_band: parseNumberOrNull(scoreObj.minimum_band),
        listening: parseNumberOrNull(scoreObj.listening),
        reading: parseNumberOrNull(scoreObj.reading),
        writing: parseNumberOrNull(scoreObj.writing),
        speaking: parseNumberOrNull(scoreObj.speaking),
    };
};

const sanitizeProgramData = (data) => {
    const sanitized = { ...data };
    delete sanitized._id;
    delete sanitized.institutionId;
    delete sanitized.name;
    delete sanitized.tuitionFee;

    if (sanitized.field !== undefined) {
        sanitized.field = normalizeProgramFields(sanitized.field);
    }
    if (sanitized.specialization !== undefined) {
        const values = Array.isArray(sanitized.specialization)
            ? sanitized.specialization
            : [sanitized.specialization];
        sanitized.specialization = values
            .map((value) => typeof value === "string" ? value.trim() : "")
            .filter(Boolean);
    }
    if (sanitized.level !== undefined) {
        sanitized.level = VALID_LEVELS.includes(sanitized.level) ? sanitized.level : null;
    }

    if (sanitized.entry_requirements) {
        const er = { ...sanitized.entry_requirements };
        if (er.academic) {
            er.academic = {
                ...er.academic,
                minimum_qualification: VALID_QUALIFICATIONS.includes(er.academic.minimum_qualification)
                    ? er.academic.minimum_qualification
                    : null,
                score_type: VALID_SCORE_TYPES.includes(er.academic.score_type)
                    ? er.academic.score_type
                    : null,
                score: parseNumberOrNull(er.academic.score),
                scale: parseNumberOrNull(er.academic.scale),
                field_requirement: er.academic.field_requirement || null,
            };
        }

        if (er.language_requirements) {
            const lr = { ...er.language_requirements };
            if (lr.english) {
                lr.english = {
                    ...lr.english,
                    ielts: sanitizeLanguageScore(lr.english.ielts),
                    toefl: sanitizeLanguageScore(lr.english.toefl),
                    pte: sanitizeLanguageScore(lr.english.pte),
                    duolingo: sanitizeLanguageScore(lr.english.duolingo),
                    cambridge: lr.english.cambridge || null,
                    cefr: lr.english.cefr || null,
                };
            }
            if (lr.german) {
                lr.german = {
                    ...lr.german,
                    cefr: lr.german.cefr || null,
                    testdaf: sanitizeLanguageScore(lr.german.testdaf),
                    dsh: sanitizeLanguageScore(lr.german.dsh),
                };
            }
            er.language_requirements = lr;
        }

        sanitized.entry_requirements = er;
    }

    return sanitized;
};

// Create one program
const createProgram = async (req, res) => {
    try {
        const { institutionId, ...programData } = req.body;

        if (!institutionId) {
            return res.status(400).json({
                error: "institutionId is required",
            });
        }

        if (!mongoose.Types.ObjectId.isValid(institutionId)) {
            return res.status(400).json({
                error: "Invalid institutionId",
            });
        }

        const sanitizedData = sanitizeProgramData(programData);

        const program = await Program.create({
            institutionId,
            ...sanitizedData,
        });

        return res.status(201).json(program);

    } catch (error) {
        console.error("Error creating program:", error);

        return res.status(500).json({
            error: error.message,
        });
    }
};

// Update one program
const updateProgram = async (req, res) => {
    try {
        const { programId } = req.params;

        if (!mongoose.Types.ObjectId.isValid(programId)) {
            return res.status(400).json({
                error: "Invalid program ID",
            });
        }

        const updateData = sanitizeProgramData(req.body);
        if (updateData.isDimmed === true) updateData.isPinned = false;
        else if (updateData.isPinned === true) updateData.isDimmed = false;

        const program = await Program.findByIdAndUpdate(
            programId,
            updateData,
            {
                returnDocument: 'after',
                runValidators: true,
            }
        );

        if (!program) {
            return res.status(404).json({
                error: "Program not found",
            });
        }

        return res.status(200).json(program);

    } catch (error) {
        console.error("Error updating program:", error);

        return res.status(500).json({
            error: error.message,
        });
    }
};


// Delete one program
const deleteProgram = async (req, res) => {
    try {
        const { programId } = req.params;

        if (!mongoose.Types.ObjectId.isValid(programId)) {
            return res.status(400).json({
                error: "Invalid program ID",
            });
        }

        const program = await Program.findByIdAndDelete(programId);

        if (!program) {
            return res.status(404).json({
                error: "Program not found",
            });
        }

        return res.status(200).json({
            message: "Program deleted successfully",
            programId,
        });

    } catch (error) {
        console.error("Error deleting program:", error);

        return res.status(500).json({
            error: error.message,
        });
    }
};


// Get all programs
const getAllProgram = async (req, res) => {
    try {
        const paginated = req.query.limit !== undefined || req.query.offset !== undefined;
        const limit = Number(req.query.limit ?? 60);
        const offset = Number(req.query.offset ?? 0);
        const seed = req.query.seed;
        let gpa;
        try { gpa = applicantAcademicScore(req.query); }
        catch (error) { return res.status(400).json({ error: error.message }); }
        const sortOrder = req.query.sortOrder;
        if (sortOrder !== undefined && !["", "highToLow", "lowToHigh"].includes(sortOrder)) {
            return res.status(400).json({ error: "Select a valid sort order" });
        }
        const location = req.query.location;
        const search = req.query.search;
        if (search !== undefined && (typeof search !== "string" || search.length > 200)) {
            return res.status(400).json({ error: "Invalid program search" });
        }
        const country = req.query.country;
        if (country !== undefined && country !== "" && !mongoose.Types.ObjectId.isValid(country)) {
            return res.status(400).json({ error: "Invalid country" });
        }
        if (location !== undefined && (typeof location !== "string" || location.length > 300)) {
            return res.status(400).json({ error: "Invalid program location" });
        }
        const locationFilter = location?.trim() ? {
            "programInstitution.campuses.city": { $regex: `^\\s*${location.trim().replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}\\s*$`, $options: "i" },
        } : null;
        const searchFilter = search?.trim() ? {
            $or: [
                { degree_name: { $regex: search.trim().replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), $options: "i" } },
                { level: { $regex: search.trim().replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), $options: "i" } },
                { field: { $regex: search.trim().replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), $options: "i" } },
                { campuses: { $regex: search.trim().replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), $options: "i" } },
                { "programInstitution.name": { $regex: search.trim().replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), $options: "i" } },
            ],
        } : null;
        const countryFilter = country ? { "programInstitution.country": new mongoose.Types.ObjectId(country) } : null;
        const fieldOfStudy = normalizeProgramField(req.query.fieldOfStudy);
        if (fieldOfStudy !== undefined && fieldOfStudy !== "" &&
            (typeof fieldOfStudy !== "string" || !VALID_FIELDS.includes(fieldOfStudy))) {
            return res.status(400).json({ error: "Select a valid field of study" });
        }
        const fieldFilter = programFieldFilter(fieldOfStudy);
        let englishFilter;
        let academicLevelFilter;
        let programLevelFilter;
        try {
            englishFilter = programEnglishFilter(req.query);
            academicLevelFilter = programAcademicLevelFilter(req.query.academicLevel);
            const programLevel = req.query.programLevel;
            if (programLevel !== undefined && !["all", "undergraduate", "postgraduate"].includes(programLevel)) {
                throw new Error("Select a valid program level");
            }
            if (programLevel === "undergraduate" || programLevel === "postgraduate") {
                // Reuse the same level grouping and legacy degree-name fallback.
                programLevelFilter = programAcademicLevelFilter(programLevel === "undergraduate" ? "high_school" : "bachelors");
            }
        } catch (error) {
            return res.status(400).json({ error: error.message });
        }
        if (seed !== undefined && (typeof seed !== "string" || !/^[a-zA-Z0-9-]{1,64}$/.test(seed))) {
            return res.status(400).json({ error: "Invalid shuffle seed" });
        }
        if (paginated && (!Number.isSafeInteger(limit) || limit < 1 || limit > 60 ||
            !Number.isSafeInteger(offset) || offset < 0)) {
            return res.status(400).json({ error: "Limit must be between 1 and 60 and offset must be a non-negative integer" });
        }
        let randomizedIds;
        let matchingTotal;
        {
            const orderStages = sortOrder ? [
                { $addFields: {
                    sortFee: { $convert: {
                        input: { $arrayElemAt: ["$tuition_fees.annual_fee_eur", 0] },
                        to: "double", onError: 0, onNull: 0,
                    } },
                } },
                { $sort: { listingRank: 1, sortFee: sortOrder === "highToLow" ? -1 : 1, _id: 1 } },
            ] : seed ? [
                { $project: {
                    _id: 1,
                    listingRank: 1,
                    shuffleOrder: { $toHashedIndexKey: { $concat: [{ $literal: seed }, ":", { $toString: "$_id" }] } },
                } },
                { $sort: { listingRank: 1, shuffleOrder: 1, _id: 1 } },
            ] : [{ $project: { _id: 1, listingRank: 1 } }, { $sort: { listingRank: 1, _id: 1 } }];
            const [result] = await Program.aggregate([
                { $match: { isActive: true } },
                { $lookup: { from: "institutions", localField: "institutionId", foreignField: "_id", as: "programInstitution" } },
                { $addFields: { listingRank: { $cond: [
                    { $or: [
                        { $eq: ["$isDimmed", true] },
                        { $eq: [{ $arrayElemAt: ["$programInstitution.isDimmed", 0] }, true] },
                    ] },
                    2,
                    { $cond: [{ $eq: ["$isPinned", true] }, 0, 1] },
                ] } } },
                ...(searchFilter ? [{ $match: searchFilter }] : []),
                ...(countryFilter ? [{ $match: countryFilter }] : []),
                ...(programLevelFilter ? [{ $match: programLevelFilter }] : []),
                ...(locationFilter ? [{ $match: locationFilter }] : []),
                ...(fieldFilter ? [{ $match: fieldFilter }] : []),
                ...(academicLevelFilter ? [{ $match: academicLevelFilter }] : []),
                ...(englishFilter ? [{ $match: englishFilter }] : []),
                ...(gpa !== null ? programGpaFilter(gpa) : []),
                { $facet: {
                    programs: [...orderStages, ...(paginated ? [{ $skip: offset }, { $limit: limit }] : [])],
                    count: [{ $count: "total" }],
                } },
            ]).allowDiskUse(true);
            randomizedIds = result.programs;
            matchingTotal = result.count[0]?.total || 0;
        }
        const query = Program.find({
            isActive: true,
            ...(randomizedIds ? { _id: { $in: randomizedIds.map(program => program._id) } } : {}),
        });
        if (paginated && !randomizedIds) query.sort({ _id: 1 }).skip(offset).limit(limit);
        let programs = await query
            .populate({
                path: "institutionId",
                select: "name country logo campuses entryRequirements applicationFee documents isDimmed",
                populate: {
                    path: "country",
                    select: "name code currency",
                },
            })
            .lean();

        if (randomizedIds) {
            const positions = new Map(randomizedIds.map((program, index) => [String(program._id), index]));
            programs.sort((a, b) => positions.get(String(a._id)) - positions.get(String(b._id)));
        }

        const allPrograms = programs.map((program) => ({
            ...program,
            field: normalizeProgramFields(program.field),
            institution: program.institutionId,
            institutionId: program.institutionId?._id,
            institutionName: program.institutionId?.name,
            institutionLogo: program.institutionId?.logo,
            country: program.institutionId?.country,
            institutionData: program.institutionId,
        }));

        if (paginated) {
            const total = matchingTotal;
            const locationInstitutionQuery = {};
            if (country) {
                locationInstitutionQuery.country = new mongoose.Types.ObjectId(country);
            }
            const institutionIds = await Institution.distinct("_id", locationInstitutionQuery);
            const campusValues = await Institution.distinct("campuses.city", {
                _id: { $in: institutionIds },
            });
            const locationsByName = new Map();
            campusValues.filter(value => typeof value === "string" && value.trim()).forEach(value => {
                const location = value.trim();
                const key = location.toLowerCase();
                if (!locationsByName.has(key)) locationsByName.set(key, location);
            });
            const locations = [...locationsByName.values()].sort((a, b) => a.localeCompare(b));
            return res.status(200).json({
                programs: allPrograms,
                locations,
                pagination: { total, offset, limit, hasMore: offset + programs.length < total },
            });
        }
        return res.status(200).json(allPrograms);

    } catch (error) {
        console.error("Error fetching programs:", error);

        return res.status(500).json({
            error: error.message,
        });
    }
};


module.exports = {
    getProgramsByInstitution,
    createProgram,
    updateProgram,
    deleteProgram,
    getAllProgram,
};
