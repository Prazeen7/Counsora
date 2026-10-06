import { test } from "node:test";
import assert from "node:assert/strict";
import { hasResolvedRequirements, resolveProgramRequirements } from "./resolveProgramRequirements.js";

test("Canterbury-style education programs display inherited field requirements", () => {
    const field = "Education, Teaching and Childcare";
    const institution = { entryRequirements: { fields: [{ field, level: "postgraduate", requirements: {
        gpa: { minimumQualification: "Bachelor" },
        languageRequirement: [{ testType: "IELTS", overall: "7" }],
    } }] } };
    for (const [degree_name, fields] of [
        ["Master of Early Childhood Education Digital Pedagogy", [field]],
        ["Master of Literacy in Education", [field, "English and Study Pathways"]],
        ["Postgraduate Diploma in Education", [field]],
    ]) {
        const requirements = resolveProgramRequirements({ degree_name, level: "Master", field: fields }, institution);
        assert.equal(requirements.academic.length, 0);
        assert.equal(requirements.languages.length, 0);
        assert.equal(hasResolvedRequirements(requirements), true, degree_name);
        assert.equal(requirements.fieldRequirements[0].academic[0].value, "Bachelor");
        assert.deepEqual(requirements.fieldRequirements[0].languages, ["IELTS 7"]);
    }
    assert.equal(hasResolvedRequirements({ academic: [], languages: [], fieldRequirements: [
        { academic: [], languages: [] },
    ] }), false);
    assert.equal(hasResolvedRequirements({ academic: [{ value: "Bachelor" }], languages: [] }), true);
    assert.equal(hasResolvedRequirements({ academic: [], languages: ["IELTS 7"] }), true);
});

const undergraduate = { gpa: { minimumQualification: "Higher Secondary", type: "GPA", score: "3", scale: "4" },
    languageRequirement: [{ testType: "IELTS", overall: "6.5", minimum: "6" }] };
const institution = { entryRequirements: { undergraduate, postgraduate: {
    gpa: { minimumQualification: "Bachelor", type: "Percentage", score: "60", scale: "100" },
} } };

test("field requirements match field and level, retain defaults, and respect program overrides", () => {
    const scoped = { entryRequirements: { ...institution.entryRequirements, fields: [
        { field: "Allied Health", level: "undergraduate", requirements: {
            gpa: { score: "80", type: "Percentage", scale: "100" },
            languageRequirement: [{ testType: "IELTS", overall: "7" }],
        } },
        { field: "Other", level: "undergraduate", requirements: { gpa: { score: "70" } } },
    ] } };
    const program = { level: "Bachelor", field: ["Allied Health", "Other"] };
    const result = resolveProgramRequirements(program, scoped);
    assert.equal(result.fieldRequirements.length, 2);
    assert.equal(result.fieldRequirements[0].academic[0].value, "Higher Secondary");
    assert.equal(result.fieldRequirements[0].academic[1].value, "80 / 100");
    assert.deepEqual(result.fieldRequirements[0].languages, ["IELTS 7"]);
    assert.deepEqual(result.fieldRequirements[1].languages, ["IELTS 6.5 (Minimum: 6)"]);
    const override = resolveProgramRequirements({ ...program, entry_requirements: {
        academic: { score: "90", score_type: "Percentage" },
        language_requirements: { english: { toefl: { overall: "100" } } },
    } }, scoped).fieldRequirements[0];
    assert.equal(override.academic[1].value, "90");
    assert.deepEqual(override.languages, ["TOEFL 100"]);
    for (const unmatched of [{ ...program, level: "Master" }, { ...program, field: "Trades" }]) {
        assert.deepEqual(resolveProgramRequirements(unmatched, scoped), resolveProgramRequirements(unmatched, institution));
    }
});

test("missing program requirements use the appropriate institution level and source labels", () => {
    for (const level of ["Foundation", "Bachelor", "Undergraduate"]) {
        const result = resolveProgramRequirements({ level }, institution);
        assert.equal(result.academic[0].value, "Higher Secondary");
        assert.ok(result.academic.every(row => row.general));
        assert.deepEqual(result.languages, ["IELTS 6.5 (Minimum: 6)"]);
        assert.equal(result.generalLanguage, true);
    }
    assert.equal(resolveProgramRequirements({ level: "Master" }, institution).academic[0].value, "Bachelor");
    assert.equal(resolveProgramRequirements({ level: "Unknown" }, institution).academic.length, 0);
});

test("diploma defaults are separate, while postgraduate diplomas retain postgraduate defaults", () => {
    const scoped = { entryRequirements: { ...institution.entryRequirements, diploma: {
        gpa: { minimumQualification: "Higher Secondary", type: "Percentage", score: "50", scale: "100" },
        languageRequirement: [{ testType: "IELTS", overall: "5.5" }],
    } } };
    for (const level of ["Diploma", "Advanced Diploma"]) {
        const result = resolveProgramRequirements({ level }, scoped);
        assert.equal(result.academic[1].value, "50 / 100");
        assert.deepEqual(result.languages, ["IELTS 5.5"]);
    }
    assert.equal(resolveProgramRequirements({ level: "Postgraduate Diploma" }, scoped).academic[0].value, "Bachelor");
    assert.equal(resolveProgramRequirements({ level: "PG Diploma" }, scoped).academic[0].value, "Bachelor");
    assert.equal(resolveProgramRequirements({ level: "PG Certificate" }, scoped).academic[0].value, "Bachelor");
    assert.deepEqual(resolveProgramRequirements({ level: "UG Certificate" }, scoped).academic,
        resolveProgramRequirements({ level: "Bachelor" }, scoped).academic);
    assert.equal(resolveProgramRequirements({ level: "Certificate", degree_name: "Postgraduate Certificate in Education" }, scoped).academic[0].value, "Bachelor");
    assert.deepEqual(resolveProgramRequirements({ level: "Diploma" }, institution).academic, []);
    const override = resolveProgramRequirements({ level: "Diploma", entry_requirements: {
        academic: { score: "65", score_type: "Percentage" },
    } }, scoped);
    assert.equal(override.academic[1].value, "65");
    scoped.entryRequirements.fields = [{ field: "Trades", level: "diploma", requirements: {
        languageRequirement: [{ testType: "IELTS", overall: "6" }],
    } }];
    assert.deepEqual(resolveProgramRequirements({ level: "Diploma", field: "Trades" }, scoped)
        .fieldRequirements[0].languages, ["IELTS 6"]);
});

test("specific academic values override defaults without borrowing the general scale", () => {
    const result = resolveProgramRequirements({ level: "Bachelor", entry_requirements: { academic: { score: 75, score_type: "Percentage" } } }, institution);
    assert.deepEqual(result.academic, [
        { label: "Academic", value: "Higher Secondary", general: true },
        { label: "Percentage", value: "75", general: false },
    ]);
});

test("specific language alternatives override general tests and zero is a valid score", () => {
    const result = resolveProgramRequirements({ level: "Bachelor", entry_requirements: {
        academic: { score: 0 }, language_requirements: { english: { toefl: { overall: 80 } } },
    } }, institution);
    assert.deepEqual(result.languages, ["TOEFL 80"]);
    assert.equal(result.generalLanguage, false);
    assert.equal(result.academic[1].value, "0");
    assert.equal(result.academic[1].general, false);
});

test("empty saved test shells do not create requirements", () => {
    const result = resolveProgramRequirements({ level: "Bachelor" }, { entryRequirements: { undergraduate: {
        gpa: { score: "" }, languageRequirement: [{ testType: "IELTS", overall: "" }],
    } } });
    assert.deepEqual(result, { academic: [], languages: [], generalLanguage: false });
});
