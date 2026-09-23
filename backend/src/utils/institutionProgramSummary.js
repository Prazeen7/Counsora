const { normalizeProgramFields } = require("./programField");
// Institution-wide metadata is returned separately from paginated program cards.
function buildInstitutionProgramSummary(programs) {
    const unique = (values) => [...new Set(values.filter(Boolean))].sort();
    const scholarships = new Map();
    for (const program of programs) {
        const value = program.scholarship?.description?.trim();
        if (!value) continue;
        const key = value.replace(/\s+/g, " ").toLowerCase();
        if (!scholarships.has(key)) scholarships.set(key, {
            name: "Program scholarship", value, description: value,
            url: program.scholarship.url, programNames: [],
        });
        const group = scholarships.get(key);
        if (program.degree_name && !group.programNames.includes(program.degree_name)) group.programNames.push(program.degree_name);
        if (!group.url) group.url = program.scholarship.url;
    }
    return {
        total: programs.length,
        levels: unique(programs.map(program => program.level)),
        fields: unique(programs.flatMap(program => normalizeProgramFields(program.field))),
        intakes: unique(programs.flatMap(program => Array.isArray(program.intakes) ? program.intakes : String(program.intakes || "").split(",").map(value => value.trim()))),
        campuses: getDisplayCampuses(null, programs),
        undergraduate: deriveLowestProgramRequirements(programs, true),
        postgraduate: deriveLowestProgramRequirements(programs, false),
        scholarships: [...scholarships.values()],
        documents: getProgramAdditionalRequirements(programs),
    };
}

module.exports = { buildInstitutionProgramSummary };
function hasLanguageScore(score) {
    return ["overall", "minimum_band", "listening", "reading", "writing", "speaking", "literacy", "comprehension", "conversation", "production"]
        .some((key) => score?.[key] !== undefined && score[key] !== null && score[key] !== "");
}

const hasValue = (value) => value !== undefined && value !== null && String(value).trim() !== "";

const isUndergraduateLevel = (level = "") =>
    /foundation|diploma|associate|bachelor|undergraduate/i.test(level);

const deriveLowestProgramRequirements = (programs, undergraduate) => {
    const matchingPrograms = programs.filter((program) =>
        undergraduate
            ? isUndergraduateLevel(program.level)
            : !isUndergraduateLevel(program.level)
    );

    const academicOptions = matchingPrograms
        .map((program) => program.entry_requirements?.academic)
        .filter(Boolean);
    const scoredAcademicOptions = academicOptions
        .map((academic) => ({ academic, numericScore: Number.parseFloat(academic.score) }))
        .filter(({ numericScore }) => Number.isFinite(numericScore))
        .sort((a, b) => a.numericScore - b.numericScore);
    const lowestAcademic = scoredAcademicOptions[0]?.academic || academicOptions.find(
        (academic) => hasValue(academic.minimum_qualification)
    );

    const tests = [
        ["IELTS", "english", "ielts"],
        ["TOEFL", "english", "toefl"],
        ["PTE", "english", "pte"],
        ["Duolingo", "english", "duolingo"],
        ["TestDaF", "german", "testdaf"],
        ["DSH", "german", "dsh"],
    ];
    const languageRequirement = tests.flatMap(([testType, language, testKey]) => {
        const options = matchingPrograms
            .map((program) => program.entry_requirements?.language_requirements?.[language]?.[testKey])
            .filter(hasLanguageScore)
            .map((test) => ({ test, numericOverall: Number.parseFloat(test.overall) }))
            .sort((a, b) => {
                if (Number.isFinite(a.numericOverall) && Number.isFinite(b.numericOverall)) {
                    return a.numericOverall - b.numericOverall;
                }
                return Number.isFinite(a.numericOverall) ? -1 : 1;
            });
        if (!options.length) return [];

        const test = options[0].test;
        const individualFields = ["listening", "reading", "writing", "speaking", "literacy", "comprehension", "conversation", "production"];
        return [{
            testType,
            overall: test.overall,
            minimum_band: test.minimum_band,
            ...Object.fromEntries(individualFields.map((field) => [field, test[field]])),
            hasIndividualScores: individualFields.some((field) => hasValue(test[field])),
        }];
    });

    return {
        gpa: lowestAcademic
            ? {
                type: lowestAcademic.score_type || "Score",
                score: lowestAcademic.score,
                scale: lowestAcademic.scale,
                minimumQualification: lowestAcademic.minimum_qualification,
                fieldRequirement: lowestAcademic.field_requirement,
            }
            : null,
        languageRequirement,
    };
};

const hasDocumentValue = (value) => value !== undefined && value !== null &&
    !["", "n/a", "not specified"].includes(String(value).trim().toLowerCase());

const getProgramAdditionalRequirements = (programs = []) => {
    const requirements = new Map();
    programs.forEach((program, programIndex) => {
        const raw = program?.entry_requirements?.additional_requirements;
        const values = Array.isArray(raw) ? raw : typeof raw === "string" ? raw.split(/\r?\n|\s*\|\s*/) : [];
        const seen = new Set();
        values
            .filter((value) => typeof value === "string" && hasDocumentValue(value))
            .forEach((value) => {
                const text = value.trim().replace(/\s+/g, " ");
                const key = text.toLowerCase().replace(/[.!;]+$/, "").trim();
                if (!key || seen.has(key)) return;
                seen.add(key);
                if (!requirements.has(key)) requirements.set(key, { text, programs: [] });
                requirements.get(key).programs.push({
                    id: program._id || `program-${programIndex}`,
                    name: program.degree_name || program.program || `Program ${programIndex + 1}`,
                    level: program.level || "",
                });
            });
    });
    return [...requirements.values()].sort((a, b) =>
        b.programs.length - a.programs.length || a.text.localeCompare(b.text)
    );
};
const getDisplayCampuses = (institution, programs = []) => {
    // Prefer institution-level campuses
    if (institution?.campuses?.length > 0) {
        return institution.campuses;
    }

    const campuses = [];

    const normalize = (name) =>
        name
            .trim()
            .toLowerCase()
            .replace(/\s+/g, " ");

    for (const program of programs) {
        if (!Array.isArray(program.campuses)) continue;

        for (const rawName of program.campuses) {
            if (!rawName || typeof rawName !== "string") continue;

            const name = rawName.trim();
            const normalizedName = normalize(name);

            // Check if this location is already represented
            const alreadyExists = campuses.some((campus) => {
                const existingName = normalize(campus.name);

                return (
                    existingName.includes(normalizedName) ||
                    normalizedName.includes(existingName)
                );
            });

            if (!alreadyExists) {
                campuses.push({
                    name,
                    address: "",
                    city: "",
                    contactNumber: "",
                    email: "",
                    mapEmbedUrl: `https://www.google.com/maps?q=${encodeURIComponent(
                        name
                    )}&output=embed`,
                });
            }
        }
    }

    return campuses;
};
