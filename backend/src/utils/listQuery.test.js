const { test } = require('node:test');
const assert = require('node:assert/strict');
const { parseListQuery } = require('./listQuery');

test('list queries default to bounded pages and treat search punctuation literally', () => {
    assert.deepEqual(parseListQuery(), { page: 1, limit: 25, search: '' });
    const result = parseListQuery({ page: '2', limit: '10', search: '  A+B (NZ).  ' });
    const search = new RegExp(result.search, 'i');
    assert.ok(search.test('A+B (NZ).'));
    assert.ok(!search.test('AAAB NZx'));
    assert.equal(result.page, 2);
    assert.equal(result.limit, 10);
});

test('list queries reject unbounded, malformed, and injected parameters', () => {
    for (const query of [
        { page: '0' }, { page: '-1' }, { page: '1.5' }, { page: '1x' },
        { page: '9007199254740991', limit: '100' }, { page: ['1'] },
        { limit: '0' }, { limit: '101' }, { limit: '-1' }, { limit: '10x' },
        { limit: { $gt: 1 } }, { search: ['name'] }, { search: { $ne: '' } }, { search: 'a'.repeat(201) },
    ]) assert.throws(() => parseListQuery(query));
});
