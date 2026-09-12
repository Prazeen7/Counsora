const path = require("node:path");
const fs = require("node:fs");
const assert = require("node:assert/strict");
const { createHash } = require("node:crypto");
require("../src/config/systemCa");
require("dotenv").config({ path: path.join(__dirname, "../.env"), quiet: true });
const mongoose = require("mongoose");
const Country = require("../src/models/Country");
const Document = require("../src/models/Document");
const entries = require("../import-data/germany-required-documents.json");

async function main() {
    const args = process.argv.slice(2);
    const pdfPath = args.find((arg) => !arg.startsWith("--"));
    if (!pdfPath) throw new Error("Provide the source PDF path. Add --apply to import; otherwise this is a dry run.");
    const previewData = fs.readFileSync(pdfPath);
    assert.equal(previewData.subarray(0, 5).toString(), "%PDF-");
    assert.ok(previewData.length <= 5 * 1024 * 1024, "PDF exceeds the preview size limit.");
    assert.equal(new Set(entries.map((entry) => entry.title)).size, entries.length);
    await mongoose.connect(process.env.MONGODB_URI, { serverSelectionTimeoutMS: 15000 });
    const countries = await Country.find({ code: "DE", name: /^Germany$/i }).select("name code").lean();
    assert.equal(countries.length, 1, "Expected exactly one existing Germany country record.");
    const country = countries[0];
    const documents = entries.map((entry, index) => ({
        ...entry,
        country: country._id,
        type: "required_documents",
        order: index + 1,
        preview: { name: path.basename(pdfPath), mimeType: "application/pdf", size: previewData.length },
        previewData,
    }));
    await Promise.all(documents.map((fields) => new Document(fields).validate()));
    const query = { country: country._id, type: "required_documents", title: { $in: entries.map((entry) => entry.title) } };
    const existing = await Document.find(query).select("title").lean();
    const existingTitles = new Set(existing.map((entry) => entry.title));
    const missing = documents.filter((entry) => !existingTitles.has(entry.title));
    console.log(JSON.stringify({ country: country.name, countryId: String(country._id), sourceEntries: entries.length, existing: existing.length, toInsert: missing.length, mode: args.includes("--apply") ? "apply" : "dry-run" }));
    if (!args.includes("--apply")) return;
    for (const fields of missing) {
        // Reruns preserve existing edits and avoid inserting the same title again.
        await Document.updateOne({ country: fields.country, type: fields.type, title: fields.title }, { $setOnInsert: fields }, { upsert: true, runValidators: true });
    }
    const saved = await Document.find(query).select("+previewData").sort({ order: 1 }).lean();
    assert.equal(saved.length, entries.length, "Checklist verification count does not match.");
    const digest = (buffer) => createHash("sha256").update(buffer).digest("hex");
    for (const expected of missing) {
        const actual = saved.find((entry) => entry.title === expected.title);
        for (const field of ["source", "details", "order"]) assert.equal(actual[field], expected[field]);
        // Lean MongoDB binary values expose their underlying buffer.
        const bytes = Buffer.isBuffer(actual.previewData) ? actual.previewData : actual.previewData.buffer;
        assert.equal(digest(bytes), digest(previewData));
    }
    console.log(JSON.stringify({ verified: saved.length, inserted: missing.length, titles: saved.map((entry) => entry.title) }));
}

main().catch((error) => { console.error(`${error.name}: Import failed; check database access and input validation.`); process.exitCode = 1; })
    .finally(() => mongoose.disconnect());
