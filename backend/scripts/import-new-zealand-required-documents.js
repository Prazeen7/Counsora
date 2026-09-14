const path = require('node:path');
const assert = require('node:assert/strict');
require('../src/config/systemCa');
require('dotenv').config({ path: path.join(__dirname, '../.env'), quiet: true });
const mongoose = require('mongoose');
const Country = require('../src/models/Country');
const Document = require('../src/models/Document');
const entries = require('../import-data/new-zealand-required-documents.json');

async function main() {
    assert.equal(new Set(entries.map(entry => entry.title)).size, entries.length);
    assert.ok(entries.every(entry => entry.section && entry.source && entry.details));
    await mongoose.connect(process.env.MONGODB_URI, { serverSelectionTimeoutMS: 15000 });
    const countries = await Country.find({ code: 'NZ', name: /^New Zealand$/i }).select('name code').lean();
    assert.equal(countries.length, 1, 'Expected exactly one New Zealand country record.');
    const country = countries[0];
    const records = entries.map((entry, index) => ({ ...entry, country: country._id, type: 'required_documents', order: index + 1 }));
    await Promise.all(records.map(record => new Document(record).validate()));
    const query = { country: country._id, type: 'required_documents', title: { $in: entries.map(entry => entry.title) } };
    const existing = await Document.find(query).select('title').lean();
    const titles = new Set(existing.map(entry => entry.title));
    const missing = records.filter(entry => !titles.has(entry.title));
    const apply = process.argv.includes('--apply');
    console.log(JSON.stringify({ country: country.name, entries: entries.length, sections: [...new Set(entries.map(entry => entry.section))], existing: existing.length, toInsert: missing.length, mode: apply ? 'apply' : 'dry-run' }));
    if (!apply) return;
    for (const record of missing) {
        await Document.updateOne({ country: record.country, type: record.type, title: record.title }, { $setOnInsert: record }, { upsert: true, runValidators: true });
    }
    const saved = await Document.find(query).sort({ order: 1 }).lean();
    assert.equal(saved.length, entries.length);
    for (const expected of missing) {
        const actual = saved.find(entry => entry.title === expected.title);
        for (const field of ['section', 'source', 'details', 'order']) assert.equal(actual[field], expected[field]);
    }
    console.log(JSON.stringify({ verified: saved.length, inserted: missing.length }));
}

main().catch(error => { console.error(`${error.name}: Import failed; check database access and input validation.`); process.exitCode = 1; })
    .finally(() => mongoose.disconnect());
