import { test } from "node:test";
import assert from "node:assert/strict";
import { resolveProgramRequirements } from "./resolveProgramRequirements.js";

const undergraduate = { gpa: { minimumQualification: "Higher Secondary", type: "GPA", score: "3", scale: "4" },
    languageRequirement: [{ testType: "IELTS", overall: "6.5", minimum: "6" }] };
const institution = { entryRequirements: { undergraduate, postgraduate: {
    gpa: { minimumQualification: "Bachelor", type: "Percentage", score: "60", scale: "100" },
} } };

test("missing program requirements use the appropriate institution level and source labels", () => {
    for (const level of ["Foundation", "Diploma", "Bachelor", "Undergraduate"]) {
        const result = resolveProgramRequirements({ level }, institution);
        assert.equal(result.academic[0].value, "Higher Secondary");
        assert.ok(result.academic.every(row => row.general));
        assert.deepEqual(result.languages, ["IELTS 6.5 (Minimum: 6)"]);
        assert.equal(result.generalLanguage, true);
    }
    assert.equal(resolveProgramRequirements({ level: "Master" }, institution).academic[0].value, "Bachelor");
    assert.equal(resolveProgramRequirements({ level: "Unknown" }, institution).academic.length, 0);
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
