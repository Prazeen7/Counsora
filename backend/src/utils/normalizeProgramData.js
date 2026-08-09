/**
 * Normalize program data from crawler to ensure consistent schema
 */

function normalizeString(value) {
    if (value === null || value === undefined) return null;
    if (typeof value === 'string') return value.trim() || null;
    if (typeof value === 'object') return JSON.stringify(value);
    return String(value);
}

function normalizeStringArray(value) {
    if (!value) return [];
    if (Array.isArray(value)) {
        return value.map(item => {
            if (typeof item === 'string') return item.trim();
            if (typeof item === 'object') return JSON.stringify(item);
            return String(item);
        }).filter(Boolean);
    }
    if (typeof value === 'string') return [value.trim()].filter(Boolean);
    return [];
}

function normalizeEntryRequirements(value) {
    if (!value || typeof value !== 'object') {
        return { academic: null, language: null };
    }
    
    return {
        academic: normalizeString(value.academic),
        language: normalizeString(value.language)
    };
}

function normalizeProgramData(program) {
    // Ensure required fields exist
    if (!program || typeof program !== 'object') {
        throw new Error('Invalid program data: not an object');
    }

    if (!program.degree_name) {
        throw new Error('Invalid program data: missing degree_name');
    }

    if (!program.url) {
        throw new Error('Invalid program data: missing url');
    }

    return {
        degree_name: normalizeString(program.degree_name),
        credits: normalizeStringArray(program.credits),
        format: normalizeString(program.format),
        scholarship: normalizeString(program.scholarship),
        intakes: normalizeStringArray(program.intakes),
        campuses: normalizeStringArray(program.campuses),
        duration: normalizeString(program.duration),
        accreditation: normalizeString(program.accreditation),
        entry_requirements: normalizeEntryRequirements(program.entry_requirements),
        tuition_fees: normalizeStringArray(program.tuition_fees),
        application_fees: normalizeString(program.application_fees),
        application_deadline: normalizeString(program.application_deadline),
        url: normalizeString(program.url),
        isActive: program.isActive !== false // default to true
    };
}

function normalizeProgramsArray(programs) {
    if (!Array.isArray(programs)) {
        throw new Error('Programs data must be an array');
    }

    const normalized = [];
    const errors = [];

    programs.forEach((program, index) => {
        try {
            normalized.push(normalizeProgramData(program));
        } catch (error) {
            console.error(`Error normalizing program at index ${index}:`, error.message);
            errors.push({
                index,
                error: error.message,
                program: program?.degree_name || 'unknown'
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
    normalizeEntryRequirements
};
