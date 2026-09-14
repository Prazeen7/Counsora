const path = require('node:path');
const assert = require('node:assert/strict');
require('../src/config/systemCa');
require('dotenv').config({ path: path.join(__dirname, '../.env'), quiet: true });
const mongoose = require('mongoose');
const Country = require('../src/models/Country');
const StudyGuide = require('../src/models/StudyGuide');
const entries = require('./data/new-zealand-study-guide.json');

async function main() {
    assert.equal(new Set(entries.map(entry => entry.label)).size, entries.length);
    // Validate all content before accessing the database.
    await Promise.all(entries.map(entry => new StudyGuide({ ...entry, country: new mongoose.Types.ObjectId() }).validate()));
    assert.deepEqual(entries.map(entry => entry.order), entries.map((_, index) => index + 1));
    if (process.argv.includes('--validate-only')) {
        console.log(JSON.stringify({ validated: entries.length }));
        return;
    }
    await mongoose.connect(process.env.MONGODB_URI, { serverSelectionTimeoutMS: 15000 });
    const countries = await Country.find({ code: 'NZ', name: /^New Zealand$/i }).lean();
    assert.equal(countries.length, 1, 'Expected exactly one New Zealand country.');
    const country = countries[0];
    await StudyGuide.init();
    const query = { country: country._id };
    const existing = await StudyGuide.find(query).lean();
    assert.ok(existing.every(record => entries.some(entry => entry.label === record.label)), 'Unexpected topics: review before reordering the guide.');
    const missing = entries.filter(entry => !existing.some(record => record.label === entry.label));
    console.log(JSON.stringify({ country: country.name, topics: entries.length, toInsert: missing.length, toUpdate: existing.length, mode: process.argv.includes('--apply') ? 'apply' : 'dry-run' }));
    if (!process.argv.includes('--apply')) return;
    // Publish the revised topics and their order together, retaining existing IDs.
    await mongoose.connection.transaction(async session => {
        for (const entry of entries) {
            await StudyGuide.updateOne({ country: country._id, label: entry.label }, { $set: { ...entry, country: country._id } }, { upsert: true, runValidators: true, session });
        }
    });
    const saved = await StudyGuide.find(query).sort({ order: 1 }).lean();
    assert.equal(saved.length, entries.length);
    assert.deepEqual(saved.map(entry => entry.label), entries.map(entry => entry.label));
    for (const entry of entries) {
        const actual = saved.find(record => record.label === entry.label);
        for (const field of ['title', 'description', 'category', 'introduction', 'order', 'sections']) assert.deepEqual(actual[field], entry[field]);
    }
    console.log(JSON.stringify({ verified: saved.length, inserted: missing.length, updated: existing.length, topics: saved.map(entry => entry.label) }));
}
main().catch(error => { console.error(`${error.name}: Study guide import failed; check input and database access.`); process.exitCode = 1; }).finally(() => mongoose.disconnect());

