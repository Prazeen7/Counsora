const path = require("node:path");
const assert = require("node:assert/strict");
require("../src/config/systemCa");
require("dotenv").config({ path: path.join(__dirname, "../.env"), quiet: true });
const mongoose = require("mongoose");
const Country = require("../src/models/Country");
const Document = require("../src/models/Document");
const entries = require("../import-data/germany-required-documents.json");

async function main() {
    await mongoose.connect(process.env.MONGODB_URI, { serverSelectionTimeoutMS: 15000 });
    const countries = await Country.find({ code: "DE", name: /^Germany$/i }).lean();
    assert.equal(countries.length, 1, "Expected one Germany record.");
    const country = countries[0];
    const query = { country: country._id, type: "required_documents", title: { $in: entries.map((entry) => entry.title) } };
    const existing = await Document.find(query).select("title source section preview").lean();
    assert.equal(existing.length, entries.length, "Expected all imported checklist entries.");
    assert.equal(new Set(existing.map((entry) => entry.title)).size, entries.length);
    const changes = entries.map((entry) => ({
        _id: existing.find((record) => record.title === entry.title)._id,
        title: entry.title, section: entry.section, source: entry.source,
    }));
    await Promise.all(changes.map((entry) => new Document({ ...entry, country: country._id, type: "required_documents" }).validate()));
    console.log(JSON.stringify({ country: country.name, entries: changes.length, sections: [...new Set(changes.map((entry) => entry.section))] }));
    if (!process.argv.includes("--apply")) return;
    await Document.bulkWrite(changes.map((entry) => ({ updateOne: {
        filter: { _id: entry._id, country: country._id, type: "required_documents" },
        update: { $set: { section: entry.section, source: entry.source } },
    } })));
    const saved = await Document.find(query).select("title section source preview").lean();
    for (const entry of changes) {
        const actual = saved.find((record) => String(record._id) === String(entry._id));
        assert.equal(actual.section, entry.section);
        assert.equal(actual.source, entry.source);
        assert.deepEqual(actual.preview, existing.find((record) => String(record._id) === String(entry._id)).preview);
    }
    console.log(JSON.stringify({ verified: saved.length, sourcePdfLabelsRemaining: saved.filter((entry) => /\.pdf/i.test(entry.source)).length }));
}
main().catch((error) => { console.error(`${error.name}: Checklist grouping failed.`); process.exitCode = 1; })
    .finally(() => mongoose.disconnect());
