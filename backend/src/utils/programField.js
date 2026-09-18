const FIELD_OPTIONS = [
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

const MERGED_ARTS_FIELD = "Creative Media, Communication and Arts";
const LEGACY_ARTS_FIELD = "Creative, Performing and Visual Arts";

function normalizeProgramField(value) {
    if (typeof value !== "string") return value;
    const trimmed = value.trim();
    return trimmed.toLowerCase() === LEGACY_ARTS_FIELD.toLowerCase()
        ? MERGED_ARTS_FIELD : trimmed;
}

// Accept legacy scalars without splitting commas inside category names.
// Semicolon, pipe and newline delimiters also support spreadsheet input.
function normalizeProgramFields(value) {
    const entries = Array.isArray(value) ? value : [value];
    return [...new Set(entries
        .filter(entry => typeof entry === "string")
        .flatMap(entry => entry.split(/[;|\n]+/))
        .map(normalizeProgramField)
        .filter(Boolean))];
}

function programFieldFilter(value) {
    if (!value) return null;
    if (value !== "Other") return { field: value }; // MongoDB matches array membership.
    const known = [...FIELD_OPTIONS, "", null];
    return { $or: [
        { field: "Other" },
        { field: { $elemMatch: { $nin: known } } },
        { $and: [{ field: { $type: "string" } }, { field: { $nin: known } }] },
    ] };
}

module.exports = { FIELD_OPTIONS, MERGED_ARTS_FIELD, LEGACY_ARTS_FIELD, normalizeProgramField, normalizeProgramFields, programFieldFilter };
