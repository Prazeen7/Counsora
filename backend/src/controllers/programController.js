const programGpaFilter = require("../utils/programGpaFilter");
const programEnglishFilter = require("../utils/programEnglishFilter");
const programAcademicLevelFilter = require("../utils/programAcademicLevelFilter");
const Program = require("../models/Program");
const Institution = require("../models/Institution");
const mongoose = require("mongoose");


// Get all programs for an institution
const getProgramsByInstitution = async (req, res) => {
    try {
        const { institutionId } = req.params;

        if (!mongoose.Types.ObjectId.isValid(institutionId)) {
            return res.status(400).json({
                error: "Invalid institution ID",
            });
        }

        const programs = await Program.find({
            institutionId,
            isActive: true,
        }).lean();

        return res.status(200).json({
            count: programs.length,
            programs,
        });

    } catch (error) {
        console.error("Error fetching programs:", error);

        return res.status(500).json({
            error: error.message,
        });
    }
};


const VALID_LEVELS = ["Foundation", "Diploma", "Bachelor", "Master", "PhD", "Doctoral", "Research", null];
const VALID_FIELDS = [
    "Allied Health",
    "Management, Business and Accounting",
    "Creative, Performing and Visual Arts",
    "Creative Media, Communication and Arts",
    "Education, Teaching and Childcare",
    "Engineering, Built Environment and Aviation",
    "English and Study Pathways",
    "Information Systems and Technology",
    "Law, Criminology and Justice",
    "Nursing, Paramedicine and Health",
    "Psychology, Social Work and Community Services",
    "Safety Sciences",
    "Science, Environment and Agriculture",
    "Service Industries",
    "Sport, Recreation & Exercise",
    "Cookery and Hotel Management",
    "Trades",
    "Other",
    null,
];
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
        sanitized.field = typeof sanitized.field === "string"
            ? sanitized.field.trim() || null
            : null;
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
        const gpa = Number(req.query.gpa ?? 0);
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
            "programInstitution.campuses.name": { $regex: `^\\s*${location.trim().replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}\\s*$`, $options: "i" },
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
        const fieldOfStudy = req.query.fieldOfStudy;
        if (fieldOfStudy !== undefined && fieldOfStudy !== "" &&
            (typeof fieldOfStudy !== "string" || !VALID_FIELDS.includes(fieldOfStudy))) {
            return res.status(400).json({ error: "Select a valid field of study" });
        }
        const fieldFilter = !fieldOfStudy ? null : fieldOfStudy === "Other"
            ? { field: { $exists: true, $nin: [...VALID_FIELDS.filter(field => field !== "Other"), ""] } }
            : { field: fieldOfStudy };
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
        if (req.query.gpa !== undefined && (typeof req.query.gpa !== "string" ||
            !req.query.gpa.trim() || !Number.isFinite(gpa) || gpa < 0 || gpa > 4)) {
            return res.status(400).json({ error: "GPA must be a number between 0 and 4" });
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
        if (paginated || gpa > 0 || englishFilter || academicLevelFilter || programLevelFilter || fieldFilter || locationFilter || countryFilter || searchFilter) {
            const orderStages = sortOrder ? [
                { $addFields: {
                    sortFee: { $convert: {
                        input: { $arrayElemAt: ["$tuition_fees.annual_fee_eur", 0] },
                        to: "double", onError: 0, onNull: 0,
                    } },
                } },
                { $sort: { sortFee: sortOrder === "highToLow" ? -1 : 1, _id: 1 } },
            ] : seed ? [
                { $project: {
                    _id: 1,
                    shuffleOrder: { $toHashedIndexKey: { $concat: [{ $literal: seed }, ":", { $toString: "$_id" }] } },
                } },
                { $sort: { shuffleOrder: 1, _id: 1 } },
            ] : [{ $project: { _id: 1 } }, { $sort: { _id: 1 } }];
            const [result] = await Program.aggregate([
                { $match: { isActive: true } },
                ...(searchFilter || countryFilter || locationFilter ? [
                    { $lookup: { from: "institutions", localField: "institutionId", foreignField: "_id", as: "programInstitution" } },
                ] : []),
                ...(searchFilter ? [{ $match: searchFilter }] : []),
                ...(countryFilter ? [{ $match: countryFilter }] : []),
                ...(programLevelFilter ? [{ $match: programLevelFilter }] : []),
                ...(locationFilter ? [{ $match: locationFilter }] : []),
                ...(fieldFilter ? [{ $match: fieldFilter }] : []),
                ...(academicLevelFilter ? [{ $match: academicLevelFilter }] : []),
                ...(englishFilter ? [{ $match: englishFilter }] : []),
                ...(gpa > 0 ? programGpaFilter(gpa) : []),
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
                select: "name country logo campuses entryRequirements applicationFee documents",
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
            institution: program.institutionId,
            institutionId: program.institutionId?._id,
            institutionName: program.institutionId?.name,
            institutionLogo: program.institutionId?.logo,
            country: program.institutionId?.country,
            institutionData: program.institutionId,
        }));

        if (paginated) {
            const total = matchingTotal;
            const institutionIds = await Program.distinct("institutionId", { isActive: true });
            const campusValues = await Institution.distinct("campuses.name", { _id: { $in: institutionIds } });
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
