import { formatLanguageRequirement } from "./formatLanguageRequirement.js";
import { normalizeProgramFields } from "../constants/programFields.js";

const hasValue = value => value !== undefined && value !== null && String(value).trim() !== "";
const components = ["listening", "reading", "writing", "speaking", "literacy", "comprehension", "conversation", "production"];

export function hasResolvedRequirements(requirements) {
    return Boolean(requirements.academic?.length || requirements.languages?.length ||
        requirements.fieldRequirements?.some(hasResolvedRequirements));
}

function languageText(name, score = {}) {
    const bands = components.filter(key => hasValue(score[key]))
        .map(key => `${key[0].toUpperCase()}${key.slice(1)}: ${score[key]}`);
    const minimum = score.minimum_band ?? score.minimum;
    if (hasValue(minimum)) bands.unshift(`Minimum: ${minimum}`);
    if (!hasValue(score.overall) && !bands.length) return null;
    return formatLanguageRequirement(`${name}${hasValue(score.overall) ? ` ${score.overall}` : ""}`, bands);
}

export function resolveProgramRequirements(program, institution) {
    const level = program.level === "Certificate" && /postgraduate|post[ -]graduate|graduate certificate|pgcert/i.test(program.degree_name || "")
        ? "Postgraduate Certificate" : String(program.level || "");
    const levelKey = /master|postgraduate|pg\s+(?:diploma|certificate)|phd|doctoral|doctorate|research/i.test(level) ? "postgraduate"
        : /diploma/i.test(level) ? "diploma"
        : /foundation|associate|bachelor|undergraduate|ug\s+certificate/i.test(level) ? "undergraduate" : null;
    const general = institution?.entryRequirements?.[levelKey];
    const fields = normalizeProgramFields(program.field);
    const matching = (institution?.entryRequirements?.fields || []).filter(item =>
        item.level === levelKey && normalizeProgramFields(item.field).some(field => fields.includes(field)));
    if (matching.length) {
        return { academic: [], languages: [], generalLanguage: false, fieldRequirements: matching.map(item => {
            const specific = item.requirements || {};
            const gpa = { ...general?.gpa };
            if (hasValue(specific.gpa?.minimumQualification)) gpa.minimumQualification = specific.gpa.minimumQualification;
            if (hasValue(specific.gpa?.score)) {
                gpa.score = specific.gpa.score;
                gpa.type = specific.gpa.type;
                gpa.scale = specific.gpa.scale;
            }
            const languages = (specific.languageRequirement || []).filter(test => languageText(test.testType, test));
            return { field: item.field, ...resolveProgramRequirements(program, { entryRequirements: {
                [levelKey]: { gpa, languageRequirement: languages.length ? languages : general?.languageRequirement },
            } }) };
        }) };
    }
    const academic = program.entry_requirements?.academic || {};
    const rows = [];
    const addRow = (label, specific, fallback) => {
        if (hasValue(specific)) rows.push({ label, value: specific, general: false });
        else if (hasValue(fallback)) rows.push({ label, value: fallback, general: true });
    };
    addRow("Academic", academic.minimum_qualification,
        general?.gpa?.minimumQualification || (general?.gpa?.type === "Qualification" ? general.gpa.score : null));
    // Only program-specific fields are shown; institutions no longer edit field requirements.
    addRow("Field", academic.field_requirement);
    const specificScore = hasValue(academic.score);
    const score = specificScore ? academic.score : general?.gpa?.type === "Qualification" ? null : general?.gpa?.score;
    const scale = specificScore ? academic.scale : general?.gpa?.scale;
    const type = specificScore ? academic.score_type : general?.gpa?.type;
    if (hasValue(score)) rows.push({ label: type || "Score", general: !specificScore,
        value: `${score}${hasValue(scale) ? ` / ${scale}` : ""}` });

    const language = program.entry_requirements?.language_requirements;
    const specificLanguages = [
        ["IELTS", language?.english?.ielts, program.ielts],
        ["TOEFL", language?.english?.toefl, program.toefl],
        ["PTE", language?.english?.pte, program.pte],
        ["Duolingo", language?.english?.duolingo],
        ["TestDaF", language?.german?.testdaf],
        ["DSH", language?.german?.dsh],
    ].map(([name, score, fallback]) => languageText(name, { ...score, overall: score?.overall ?? fallback })).filter(Boolean);
    for (const [name, value] of [["Cambridge", language?.english?.cambridge], ["English CEFR", language?.english?.cefr], ["German CEFR", language?.german?.cefr]]) {
        if (hasValue(value)) specificLanguages.push(`${name} ${value}`);
    }
    // Language tests form a set of alternatives: do not add general tests to a specific set.
    const languages = specificLanguages.length ? specificLanguages : (general?.languageRequirement || [])
        .map(test => languageText(test.testType === "Other" ? test.testName || "Other" : test.testType || test.testName || "Test", test)).filter(Boolean);
    return { academic: rows, languages, generalLanguage: !specificLanguages.length && languages.length > 0 };
}
