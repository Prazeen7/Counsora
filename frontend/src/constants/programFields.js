export const FIELD_OPTIONS = [
    "Allied Health",
    "Management, Business and Accounting",
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
    "Hair, Beauty and Makeup",
    "Travel and Tourism",
    "Trades",
    "Other",
];

export function normalizeProgramFields(value) {
    const entries = Array.isArray(value) ? value : [value];
    return [...new Set(entries
        .filter(entry => typeof entry === "string")
        .flatMap(entry => entry.split(/[;|\n]+/))
        .map(entry => entry.trim())
        .map(entry => entry.toLowerCase() === "creative, performing and visual arts"
            ? "Creative Media, Communication and Arts" : entry)
        .filter(Boolean))];
}

export function formatProgramFields(value) {
    return normalizeProgramFields(value).join(" • ");
}

export function matchesProgramField(value, selected) {
    const fields = normalizeProgramFields(value);
    return selected === "all" || fields.includes(selected) ||
        (selected === "Other" && fields.some(field => !FIELD_OPTIONS.includes(field)));
}
