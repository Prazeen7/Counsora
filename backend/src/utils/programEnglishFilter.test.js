const { test } = require("node:test");
const assert = require("node:assert/strict");
const filter = require("./programEnglishFilter");

test("English filter validates applicant scores", () => {
    assert.equal(filter({}), null);
    assert.throws(() => filter({ testScore: "7" }), /valid English/);
    for (const testScore of ["-1", "abc", " ", [], "Infinity"]) {
        assert.throws(() => filter({ englishTest: "ielts", testScore }), /non-negative/);
    }
    assert.ok(filter({ englishTest: "ielts", testScore: "0" }).$expr);
});

test("MongoDB matches equal/lower scores, inherited defaults, overrides and minimum bands", {
    skip: process.env.RUN_MONGO_FILTER_TESTS !== "1",
}, async () => {
    require("dotenv").config({ quiet: true });
    const mongoose = require("mongoose");
    await mongoose.connect(process.env.MONGODB_URI, { serverSelectionTimeoutMS: 10000 });
    try {
        const language = (overall, minimum_band) => ({ languageRequirement: [{ testType: "IELTS", overall, minimum_band }] });
        const institution = { entryRequirements: { postgraduate: language("6.5", "6"), diploma: language("5.5", "5") } };
        const base = { level: "Master", field: ["Education, Teaching and Childcare"], programInstitution: [institution] };
        const direct = scores => ({ language_requirements: { english: { ielts: scores } } });
        const fieldInstitution = scores => [{ entryRequirements: { ...institution.entryRequirements, fields: [{
            field: base.field[0], level: "postgraduate", requirements: language(...scores),
        }] } }];
        const fixtures = [
            { ...base, _id: "general" },
            { ...base, _id: "equal", entry_requirements: direct({ overall: 7, listening: 7, reading: 7, writing: 7, speaking: 7 }) },
            { ...base, _id: "lower", entry_requirements: direct({ overall: 6, minimum_band: 5.5 }) },
            { ...base, _id: "higher-overall", entry_requirements: direct({ overall: 7.5 }) },
            { ...base, _id: "higher-component", entry_requirements: direct({ overall: 6, writing: 7.5 }) },
            { ...base, _id: "higher-minimum", entry_requirements: direct({ overall: 6, minimum_band: 7.5 }) },
            { ...base, _id: "field", programInstitution: fieldInstitution(["7", "7"]) },
            { ...base, _id: "higher-field", programInstitution: fieldInstitution(["7.5", "7"]) },
            { ...base, _id: "legacy-field", field: ` ${base.field[0]} | English and Study Pathways |`, programInstitution: fieldInstitution(["7.5", "7"]) },
            { ...base, _id: "multiple-fields", field: [...base.field, "English and Study Pathways"], programInstitution: [{ entryRequirements: {
                ...institution.entryRequirements, fields: [
                    { field: base.field[0], level: "postgraduate", requirements: language("6", "6") },
                    { field: "English and Study Pathways", level: "postgraduate", requirements: language("8", "8") },
                ],
            } }] },
            { ...base, _id: "override", programInstitution: fieldInstitution(["8", "8"]), entry_requirements: direct({ overall: 6 }) },
            { ...base, _id: "other-test", entry_requirements: { language_requirements: { english: { toefl: { overall: 80 } } } } },
            { ...base, _id: "empty-shell", entry_requirements: direct({ overall: null }) },
            { ...base, _id: "unknown", programInstitution: [] },
            { ...base, _id: "unknown-scores", programInstitution: fieldInstitution(["Unknown", ""]) },
            { ...base, _id: "unknown-shell", programInstitution: [], entry_requirements: direct({ overall: null }) },
            { ...base, _id: "diploma", level: "Diploma" },
            { ...base, _id: "legacy-minimum", programInstitution: [{ entryRequirements: {
                postgraduate: { languageRequirement: [{ testType: "IELTS", overall: "6", minimum: "7.5" }] },
            } }] },
        ];
        const query = { englishTest: "ielts", testScore: "7", listeningScore: "7", readingScore: "7", writingScore: "7", speakingScore: "7" };
        // Literal fixtures exercise the actual MongoDB expressions without writing data.
        const rows = await mongoose.connection.db.aggregate([{ $documents: fixtures }, { $match: filter(query) }]).toArray();
        assert.deepEqual(rows.map(row => row._id).sort(), ["general", "equal", "lower", "field", "override", "empty-shell", "diploma",
            "unknown", "unknown-scores", "unknown-shell", "other-test"].sort());
    } finally {
        await mongoose.disconnect();
    }
});
