const path = require('node:path');
const assert = require('node:assert/strict');
require('../src/config/systemCa');
require('dotenv').config({ path: path.join(__dirname, '../.env'), quiet: true });
const mongoose = require('mongoose');
const Country = require('../src/models/Country');
const StudyGuide = require('../src/models/StudyGuide');
const entries = require('../import-data/germany-study-guide.json');

async function main() {
    assert.equal(new Set(entries.map(entry => entry.label)).size, entries.length);
    // Validate all content before accessing the database.
    await Promise.all(entries.map(entry => new StudyGuide({ ...entry, country: new mongoose.Types.ObjectId() }).validate()));
    await mongoose.connect(process.env.MONGODB_URI, { serverSelectionTimeoutMS: 15000 });
    const countries = await Country.find({ code: 'DE', name: /^Germany$/i }).lean();
    assert.equal(countries.length, 1, 'Expected exactly one Germany country.');
    const country = countries[0];
    await StudyGuide.init();
    const query = { country: country._id, label: { $in: entries.map(entry => entry.label) } };
    const existing = await StudyGuide.find(query).lean();
    const missing = entries.filter(entry => !existing.some(record => record.label === entry.label));
    console.log(JSON.stringify({ country: country.name, topics: entries.length, toInsert: missing.length, mode: process.argv.includes('--apply') ? 'apply' : 'dry-run' }));
    if (!process.argv.includes('--apply')) return;
    for (const entry of missing) {
        await StudyGuide.updateOne({ country: country._id, label: entry.label }, { $setOnInsert: { ...entry, country: country._id } }, { upsert: true, runValidators: true });
    }
    const saved = await StudyGuide.find(query).lean();
    assert.equal(saved.length, entries.length);
    for (const entry of missing) {
        const actual = saved.find(record => record.label === entry.label);
        for (const field of ['title', 'description', 'category', 'introduction', 'order', 'sections']) assert.deepEqual(actual[field], entry[field]);
    }
    console.log(JSON.stringify({ verified: saved.length, inserted: missing.length }));
}
main().catch(error => { console.error(`${error.name}: Study guide import failed; check input and database access.`); process.exitCode = 1; }).finally(() => mongoose.disconnect());
