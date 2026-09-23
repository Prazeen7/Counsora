const { test } = require("node:test");
const assert = require("node:assert/strict");
const Institution = require("./Institution");

test("institution requirements retain program-style academic fields and language scores", () => {
    const requirements = {
        gpa: { type: "GPA", score: "3.0", scale: "4.0", minimumQualification: "Bachelor", fieldRequirement: "Related engineering field" },
        languageRequirement: [
            { testType: "IELTS", overall: "6.5", minimum_band: "6", minimum: "6", listening: "6.5", reading: "6", writing: "6", speaking: "7", hasIndividualScores: true },
            { testType: "German CEFR", overall: "B2" },
            { testType: "Other", testName: "Custom exam", overall: "0" },
        ],
    };
    const original = new Institution({ entryRequirements: { undergraduate: requirements, postgraduate: requirements } });
    const restored = new Institution(JSON.parse(JSON.stringify(original.toObject())));
    for (const level of ["undergraduate", "postgraduate"]) {
        assert.deepEqual(restored.entryRequirements[level].toObject(), requirements);
    }
});

test("legacy qualification and minimum-score requirements remain readable", () => {
    const institution = new Institution({ entryRequirements: { undergraduate: {
        gpa: { type: "Qualification", score: "Higher secondary completed" },
        languageRequirement: [{ testType: "IELTS", minimum: "6", overall: "6.5" }],
    } } });
    assert.equal(institution.entryRequirements.undergraduate.gpa.score, "Higher secondary completed");
    assert.equal(institution.entryRequirements.undergraduate.languageRequirement[0].minimum, "6");
});
