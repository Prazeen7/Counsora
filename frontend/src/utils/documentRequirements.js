const hasDocumentValue = (value) => value !== undefined && value !== null &&
    !["", "n/a", "not specified"].includes(String(value).trim().toLowerCase());

export const hasDocumentRequirements = (documents = {}) => {
    if (!documents) return false;
    // The schema supplies sponsor count 1 and level-change false even for empty documents.
    return [documents.incomeSources, documents.sponsors, documents.banks]
        .some((values) => Array.isArray(values) && values.some(hasDocumentValue)) ||
        hasDocumentValue(documents.minIncomeAmount) ||
        hasDocumentValue(documents.previousVisaRefusal) ||
        (hasDocumentValue(documents.minSponsorCount) && Number(documents.minSponsorCount) !== 1) ||
        documents.levelChangeAfterRefusal === true;
};

export const getProgramAdditionalRequirements = (programs = []) => {
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
