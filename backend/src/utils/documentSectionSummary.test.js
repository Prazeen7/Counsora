const { test } = require('node:test');
const assert = require('node:assert/strict');
const { summarizeDocumentCountries } = require('./documentCountrySummary');

test('counts country collections once and uses their first item date', () => {
    const records = [
        { country: { _id: 'NZ', name: 'New Zealand' }, type: 'required_documents', section: 'Personal Documents', title: 'Passport', createdAt: '2026-01-01' },
        { country: { _id: 'NZ', name: 'New Zealand' }, type: 'required_documents', section: ' Personal Documents ', title: 'Photo', createdAt: '2026-09-15' },
        { country: { _id: 'NZ' }, type: 'required_documents', section: 'Financial Documents', createdAt: '2026-09-14' },
    ];
    const result = summarizeDocumentCountries(records, new Date('2026-09-08'));
    assert.equal(result.total, 1);
    assert.equal(result.addedRecently, 0);
    assert.deepEqual(result.latest.map(section => section.title), ['New Zealand documents']);
    assert.equal(result.latest[0].createdAt.toISOString(), '2026-01-01T00:00:00.000Z');
    assert.equal(JSON.stringify(result).includes('Passport'), false);
});

test('combines document types within each country', () => {
    const result = summarizeDocumentCountries([
        { country: { _id: 'NZ' }, type: 'required_documents', section: '' },
        { country: { _id: 'NZ' }, type: 'process_flow', section: '' },
        { country: { _id: 'AU' }, type: 'required_documents', section: 'General' },
    ], new Date());
    assert.equal(result.total, 2);
    assert.equal(result.addedRecently, 0);
    assert.ok(result.latest.every(section => section.title === 'Unknown country documents'));
    assert.equal(new Set(result.latest.map(section => section._id)).size, 2);
});

test('latest list is capped without reducing totals and supports empty data', () => {
    const result = summarizeDocumentCountries(Array.from({ length: 8 }, (_, i) => ({ country: { _id: String(i), name: String(i) }, section: `Section ${i}`, createdAt: `2026-09-${10 + i}` })), new Date('2026-09-01'));
    assert.equal(result.total, 8);
    assert.equal(result.addedRecently, 8);
    assert.equal(result.latest.length, 5);
    assert.equal(result.latest[0].title, '7 documents');
    assert.deepEqual(summarizeDocumentCountries([], new Date()), { total: 0, addedRecently: 0, latest: [] });
});

