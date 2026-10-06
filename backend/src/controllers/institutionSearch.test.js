const { test } = require("node:test");
const assert = require("node:assert/strict");
const Institution = require("../models/Institution");
const { getInstitutions } = require("./institutionController");

async function search(t, value) {
    let pipeline;
    let countQuery;
    t.mock.method(Institution, "aggregate", async stages => { pipeline = stages; return []; });
    t.mock.method(Institution, "countDocuments", async query => { countQuery = query; return 0; });
    t.mock.method(Institution, "distinct", async () => []);
    const res = { status(code) { this.code = code; return this; }, json(body) { this.body = body; return this; } };
    await getInstitutions({ body: { search: value, page: 1, limit: 12 } }, res);
    return { ...res, pipeline, countQuery };
}

test("institution search tolerates extra spaces and matches words in any order", async t => {
    const result = await search(t, "  Otago   University  ");
    assert.equal(result.code, 200);
    const query = result.pipeline[0].$match;
    assert.deepEqual(query, result.countQuery);
    const matches = name => query.$and.every(({ name: filter }) => new RegExp(filter.$regex, filter.$options).test(name));
    assert.equal(matches("University of Otago"), true);
    assert.equal(matches("University of Auckland"), false);
    assert.ok(result.pipeline.findIndex(stage => stage.$skip !== undefined) > 0);
});

test("institution names containing punctuation are searched literally", async t => {
    const result = await search(t, "Institute (A+B)");
    const matches = name => result.countQuery.$and.every(({ name: filter }) => new RegExp(filter.$regex, filter.$options).test(name));
    assert.equal(matches("Institute (A+B)"), true);
    assert.equal(matches("Institute AAAB"), false);
});

test("blank searches clear the name filter", async t => {
    const result = await search(t, "   ");
    assert.deepEqual(result.countQuery, {});
});

test("invalid search input returns a client error", async t => {
    const result = await search(t, { name: "Otago" });
    assert.equal(result.code, 400);
    assert.equal(result.pipeline, undefined);
});
