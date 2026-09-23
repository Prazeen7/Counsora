const { test } = require("node:test");
const assert = require("node:assert/strict");
const Program = require("../models/Program");
const { getProgramsByInstitution } = require("./programController");
const { buildInstitutionProgramSummary } = require("../utils/institutionProgramSummary");

const institutionId = "507f1f77bcf86cd799439011";
const rows = Array.from({ length: 29 }, (_, index) => ({
    _id: String(index), degree_name: `Program ${index}`, isActive: true,
    level: index === 28 ? "Master" : "Bachelor", field: ["Allied Health"],
    intakes: [index === 28 ? "December" : "January"],
}));

async function request(t, query, role = "counselor") {
    const calls = {};
    t.mock.method(Program, "find", filter => {
        calls.filter = filter;
        const query = {
            sort(value) { calls.sort = value; return this; },
            skip(value) { calls.offset = value; return this; },
            limit(value) { calls.limit = value; return this; },
            select(value) { calls.projection = value; return this; },
            async lean() { return rows.slice(calls.offset || 0, calls.limit ? (calls.offset || 0) + calls.limit : undefined); },
        };
        return query;
    });
    t.mock.method(Program, "countDocuments", async filter => { calls.countFilter = filter; return rows.length; });
    const res = { status(code) { this.code = code; return this; }, json(body) { this.body = body; return this; } };
    await getProgramsByInstitution({ params: { institutionId }, query, user: { role } }, res);
    return { ...res, calls };
}

test("institution pages are bounded, ordered and report the remaining pages", async t => {
    const first = await request(t, { limit: "12", offset: "0" });
    assert.equal(first.body.programs.length, 12);
    assert.deepEqual(first.body.pagination, { total: 29, offset: 0, limit: 12, hasMore: true });
    assert.deepEqual(first.calls.sort, { isDimmed: 1, isPinned: -1, _id: 1 });
    t.mock.restoreAll();
    const last = await request(t, { limit: "12", offset: "24" });
    assert.equal(last.body.programs.length, 5);
    assert.equal(last.body.programs[0]._id, "24");
    assert.equal(last.body.pagination.hasMore, false);
});

test("filters apply to both page and count; search treats regex syntax literally", async t => {
    const result = await request(t, { limit: "12", search: "Science (A+B)", level: "Master", field: "Allied Health", intake: "December", tuition: "under20000" });
    assert.deepEqual(result.calls.filter, result.calls.countFilter);
    assert.equal(result.calls.filter.level, "Master");
    assert.equal(result.calls.filter.field, "Allied Health");
    assert.equal(result.calls.filter.intakes, "December");
    const search = new RegExp(result.calls.filter.degree_name.$regex, "i");
    assert.equal(search.test("Science (A+B)"), true);
    assert.equal(search.test("Science AAAB"), false);
    assert.ok(result.calls.filter.$expr);
});

test("non-admin users cannot request inactive programs", async t => {
    const result = await request(t, { limit: "12", includeInactive: "true", status: "inactive" });
    assert.equal(result.calls.filter.isActive, true);
    t.mock.restoreAll();
    const admin = await request(t, { limit: "12", includeInactive: "true", status: "inactive" }, "admin");
    assert.equal(admin.calls.filter.isActive, false);
});

test("page sizes and negative offsets are clamped", async t => {
    const result = await request(t, { limit: "999999", offset: "-2" });
    assert.equal(result.calls.limit, 100);
    assert.equal(result.calls.offset, 0);
});

test("summaries include options outside the first page without returning program documents", async t => {
    const result = await request(t, { summary: "true" });
    assert.equal(result.body.total, 29);
    assert.ok(result.body.intakes.includes("December"));
    assert.ok(result.body.levels.includes("Master"));
    assert.equal(result.body.programs, undefined);
    assert.ok(result.calls.projection);
});

test("summary preserves institution-wide requirement and scholarship fallbacks", () => {
    const summary = buildInstitutionProgramSummary([
        { _id: "1", degree_name: "Course A", level: "Bachelor", campuses: ["Main"], scholarship: { description: "Half tuition" }, entry_requirements: { academic: { score: 3.5 }, additional_requirements: ["Transcript."] } },
        { _id: "2", degree_name: "Course B", level: "Bachelor", campuses: ["Main"], scholarship: { description: "Half tuition" }, entry_requirements: { academic: { score: 2.5 }, additional_requirements: ["Transcript"] } },
    ]);
    assert.equal(summary.undergraduate.gpa.score, 2.5);
    assert.equal(summary.documents.length, 1);
    assert.equal(summary.documents[0].programs.length, 2);
    assert.equal(summary.campuses.length, 1);
    assert.deepEqual(summary.scholarships[0].programNames, ["Course A", "Course B"]);
});
