const { test } = require("node:test");
const assert = require("node:assert/strict");
const levelFilter = require("../utils/programLevelSelectionFilter");
const Program = require("../models/Program");
const Institution = require("../models/Institution");
const { getAllProgram } = require("./programController");

test("qualification limits levels and multiple checkboxes narrow the selection", () => {
    assert.equal(levelFilter({}), null);
    assert.deepEqual(levelFilter({ academicLevel: "bachelors" }), { level: { $in: ["PG Diploma", "PG Certificate", "Master"] } });
    assert.deepEqual(levelFilter({ academicLevel: "high_school" }), { level: { $in: ["Foundation", "UG Certificate", "Diploma", "Bachelor"] } });
    assert.deepEqual(levelFilter({ academicLevel: "masters" }), { level: { $in: ["PhD", "Doctoral", "Research"] } });
    assert.deepEqual(levelFilter({ academicLevel: "phd" }), { level: { $in: ["Research"] } });
    assert.deepEqual(levelFilter({ academicLevel: "bachelors", levels: "PG Diploma,Master" }), { level: { $in: ["PG Diploma", "Master"] } });
    assert.throws(() => levelFilter({ academicLevel: "bachelors", levels: "Bachelor" }));
    assert.throws(() => levelFilter({ levels: "Master" }));
    assert.throws(() => levelFilter({ academicLevel: "masters", levels: ["Research"] }));
});

test("selected levels filter the entire result before pagination and counting", async t => {
    let pipeline;
    t.mock.method(Program, "aggregate", stages => {
        pipeline = stages;
        return { allowDiskUse: async () => [{ programs: [], count: [{ total: 73 }] }] };
    });
    t.mock.method(Program, "find", () => ({ populate() { return this; }, lean: async () => [] }));
    t.mock.method(Institution, "distinct", async () => []);
    const res = { status(code) { this.code = code; return this; }, json(body) { this.body = body; return this; } };
    await getAllProgram({ query: { academicLevel: "bachelors", levels: "PG Diploma,PG Certificate", limit: "12", offset: "24" } }, res);
    assert.equal(res.code, 200);
    const selectionIndex = pipeline.findIndex(stage => stage.$match?.level?.$in?.includes("PG Certificate"));
    const facetIndex = pipeline.findIndex(stage => stage.$facet);
    assert.ok(selectionIndex >= 0 && selectionIndex < facetIndex);
    assert.deepEqual(pipeline[selectionIndex].$match.level.$in, ["PG Diploma", "PG Certificate"]);
    assert.equal(res.body.pagination.total, 73);
    assert.equal(res.body.pagination.offset, 24);
});

test("invalid level selection returns a client error before querying the database", async () => {
    const res = { status(code) { this.code = code; return this; }, json(body) { this.body = body; return this; } };
    await getAllProgram({ query: { academicLevel: "bachelors", levels: "PhD" } }, res);
    assert.equal(res.code, 400);
});
