/**
 * Normalize program data from crawler to ensure consistent schema
 */

// ---------- Basic helpers ----------

function normalizeString(value) {
    if (value === null || value === undefined) return null;
    if (typeof value === "string") return value.trim() || null;
    return String(value);
}

function normalizeStringArray(value) {
    if (!value) return [];

    if (Array.isArray(value)) {
        return value
            .map((item) => normalizeString(item))
            .filter(Boolean);
    }

    const normalized = normalizeString(value);
    return normalized ? [normalized] : [];
}

function normalizeNumber(value) {
    if (value === null || value === undefined || value === "") return null;

    const num = Number(value);
    return Number.isNaN(num) ? null : num;
}

function normalizeEnum(value, allowedValues, fallback = null) {
    const normalized = normalizeString(value);
    if (normalized === null) return fallback;
    const match = allowedValues.find(
        (allowed) => allowed.toLowerCase() === normalized.toLowerCase()
    );
    return match || fallback;
}

// ---------- Academic requirements ----------

function normalizeAcademicRequirement(value) {
    if (!value || typeof value !== "object") {
        return {
            minimum_qualification: null,
            field_requirement: null,
            score_type: null,
            score: null,
            scale: null,
        };
    }

    return {
        minimum_qualification: normalizeEnum(value.minimum_qualification, [
            "Higher Secondary", "Diploma", "Bachelor", "Master", "Doctoral",
        ]),
        field_requirement: normalizeString(value.field_requirement),
        score_type: normalizeEnum(value.score_type, ["GPA", "Percentage"]),
        score: normalizeNumber(value.score),
        scale: normalizeNumber(value.scale),
    };
}

// ---------- Language requirements ----------

function normalizeLanguageScore(value) {
    if (!value || typeof value !== "object") {
        return {
            overall: null,
            minimum_band: null,
            listening: null,
            reading: null,
            writing: null,
            speaking: null,
        };
    }

    return {
        overall: normalizeNumber(value.overall),
        minimum_band: normalizeNumber(value.minimum_band),
        listening: normalizeNumber(value.listening),
        reading: normalizeNumber(value.reading),
        writing: normalizeNumber(value.writing),
        speaking: normalizeNumber(value.speaking),
    };
}

function normalizeEnglishLanguage(value) {
    if (!value || typeof value !== "object") {
        return {
            ielts: {},
            toefl: {},
            pte: {},
            duolingo: {},
            cambridge: null,
            cefr: null,
        };
    }

    return {
        ielts: normalizeLanguageScore(value.ielts),
        toefl: normalizeLanguageScore(value.toefl),
        pte: normalizeLanguageScore(value.pte),
        duolingo: normalizeLanguageScore(value.duolingo),
        cambridge: normalizeString(value.cambridge),
        cefr: normalizeString(value.cefr),
    };
}

function normalizeGermanLanguage(value) {
    if (!value || typeof value !== "object") {
        return {
            cefr: null,
            testdaf: {},
            dsh: {},
        };
    }

    return {
        cefr: normalizeString(value.cefr),
        testdaf: normalizeLanguageScore(value.testdaf),
        dsh: normalizeLanguageScore(value.dsh),
    };
}

function normalizeLanguageRequirements(value) {
    if (!value || typeof value !== "object") {
        return {
            english: {},
            german: {},
            other_languages: [],
        };
    }

    return {
        english: normalizeEnglishLanguage(value.english),
        german: normalizeGermanLanguage(value.german),
        other_languages: normalizeStringArray(value.other_languages),
    };
}

// ---------- Entry requirements ----------

function normalizeEntryRequirements(value) {
    if (!value || typeof value !== "object") {
        return {
            academic: {},
            language_requirements: {},
            additional_requirements: [],
        };
    }

    return {
        academic: normalizeAcademicRequirement(value.academic),
        language_requirements: normalizeLanguageRequirements(value.language_requirements),
        additional_requirements: normalizeStringArray(value.additional_requirements),
    };
}

// ---------- Scholarship ----------

function normalizeScholarship(value) {
    if (!value || typeof value !== "object") {
        return {
            available: false,
            description: null,
            url: null,
        };
    }

    return {
        available: value.available === true,
        description: normalizeString(value.description),
        url: normalizeString(value.url),
    };
}

// ---------- Tuition Fee ----------
function normalizeTuitionFee(value) {
    if (!value || typeof value !== "object") {
        return null;
    }

    return {
        credits: normalizeString(value.credits),
        annual_fee_eur: normalizeNumber(value.annual_fee_eur),
    };
}

function normalizeTuitionFees(value) {
    if (!value) return [];

    if (!Array.isArray(value)) {
        value = [value];
    }

    return value
        .map(normalizeTuitionFee)
        .filter(Boolean);
}

// ---------- Program ----------

function normalizeProgramData(program) {
    if (!program || typeof program !== "object") {
        throw new Error("Invalid program data: not an object");
    }

    if (!program.degree_name) {
        throw new Error("Invalid program data: missing degree_name");
    }

    if (!program.url) {
        throw new Error("Invalid program data: missing url");
    }

    return {
        degree_name: normalizeString(program.degree_name),
        level: normalizeEnum(program.level, [
            "Foundation", "Diploma", "Bachelor", "Master", "PhD", "Doctoral", "Research",
        ]),
        field: normalizeString(program.field),
        specialization: normalizeStringArray(program.specialization),
        credits: normalizeStringArray(program.credits),
        format: normalizeString(program.format),

        scholarship: normalizeScholarship(program.scholarship),

        intakes: normalizeStringArray(program.intakes),
        campuses: normalizeStringArray(program.campuses),
        duration: normalizeString(program.duration),
        accreditation: normalizeString(program.accreditation),

        entry_requirements: normalizeEntryRequirements(program.entry_requirements),

        tuition_fees: normalizeTuitionFees(program.tuition_fees),
        application_fees: normalizeString(program.application_fees),
        application_deadline: normalizeString(program.application_deadline),

        url: normalizeString(program.url),

        isActive: program.isActive !== false,
    };
}

// ---------- Programs array ----------

function normalizeProgramsArray(programs) {
    if (!Array.isArray(programs)) {
        throw new Error("Programs data must be an array");
    }

    const normalized = [];
    const errors = [];

    programs.forEach((program, index) => {
        try {
            normalized.push(normalizeProgramData(program));
        } catch (error) {
            console.error(
                `Error normalizing program at index ${index}:`,
                error.message
            );

            errors.push({
                index,
                error: error.message,
                program: program?.degree_name || "unknown",
            });
        }
    });

    return { normalized, errors };
}

module.exports = {
    normalizeProgramData,
    normalizeProgramsArray,
    normalizeString,
    normalizeStringArray,
    normalizeEnum,
    normalizeEntryRequirements,
};
