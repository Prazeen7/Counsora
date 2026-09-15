const { test } = require('node:test');
const assert = require('node:assert/strict');
const { getDashboard } = require('./dashboardController');
const models = ['Institution', 'Document', 'CostSheet', 'StudyGuide'].map(name => require('../models/' + name));

function response() {
    return { statusCode: 200, status(code) { this.statusCode = code; return this; }, json(body) { this.body = body; return this; } };
}

for (const days of [undefined, '7', '30']) {
test(`dashboard scopes counts and newest entries for ${days || 'default'} days`, async t => {
    const country = '6aa2921f0c5137fc476a7339';
    for (const Model of models) {
        t.mock.method(Model, 'countDocuments', async filter => {
            assert.equal(filter.country, country);
            if (filter.createdAt) {
                assert.ok(Math.abs(Date.now() - filter.createdAt.$gte.getTime() - Number(days || 30) * 86400000) < 5000);
                return 2;
            }
            return 12;
        });
        t.mock.method(Model, 'find', filter => {
            assert.deepEqual(filter, { country });
            const query = {
                select(fields) { assert.ok(!fields.includes('previewData')); return this; },
                sort(sort) { assert.deepEqual(sort, { createdAt: -1, _id: -1 }); return this; },
                limit(limit) { assert.equal(limit, 5); return this; },
                populate(field) { assert.equal(field, 'country'); return this; },
                lean: async () => [{ title: 'Latest entry' }],
            };
            return query;
        });
    }
    const invalid = response();
    await getDashboard({ query: { country: 'invalid' } }, invalid);
    assert.equal(invalid.statusCode, 400);
    assert.equal(models[0].countDocuments.mock.callCount(), 0);
    const res = response();
    await getDashboard({ query: { country, days } }, res);
    assert.equal(res.statusCode, 200);
    assert.equal(res.body.days, Number(days || 30));
    for (const key of ['institutions', 'costSheets', 'studyGuides']) {
        assert.equal(res.body[key].total, 12);
        assert.equal(res.body[key].addedRecently, 2);
        assert.equal(res.body[key].latest.length, 1);
    }
    assert.equal(res.body.documents.total, 1);
    assert.equal(res.body.documents.latest[0].title, 'Unknown country documents');
});
}

test('dashboard rejects unsupported or malformed periods', async () => {
    for (const days of ['0', '14', '365', '', ['7'], { value: '7' }]) {
        const res = response();
        await getDashboard({ query: { days } }, res);
        assert.equal(res.statusCode, 400);
    }
});

test('worldwide dashboard returns zero counts and empty lists', async t => {
    for (const Model of models) {
        t.mock.method(Model, 'countDocuments', async filter => { assert.equal(filter.country, undefined); return 0; });
        t.mock.method(Model, 'find', filter => {
            assert.deepEqual(filter, {});
            return { select() { return this; }, sort() { return this; }, limit() { return this; }, populate() { return this; }, lean: async () => [] };
        });
    }
    const res = response();
    await getDashboard({ query: {} }, res);
    assert.equal(res.statusCode, 200);
    assert.deepEqual(res.body.institutions, { total: 0, addedRecently: 0, latest: [] });
});

test('dashboard reports query failures without leaking database errors', async t => {
    t.mock.method(models[0], 'countDocuments', async () => { throw Error('private connection details'); });
    for (const Model of models) {
        if (Model !== models[0]) t.mock.method(Model, 'countDocuments', async () => 0);
        t.mock.method(Model, 'find', () => ({ select() { return this; }, sort() { return this; }, limit() { return this; }, populate() { return this; }, lean: async () => [] }));
    }
    const res = response();
    await getDashboard({ query: {} }, res);
    assert.equal(res.statusCode, 500);
    assert.deepEqual(res.body, { error: 'Unable to load the dashboard.' });
});
