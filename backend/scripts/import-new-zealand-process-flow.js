const path = require("node:path");
const assert = require("node:assert/strict");
require("../src/config/systemCa");
require("dotenv").config({ path: path.join(__dirname, "../.env"), quiet: true });
const mongoose = require("mongoose");
const Country = require("../src/models/Country");
const Document = require("../src/models/Document");

const stages = [
    { title: "Offer Application", details: "Prepare the required documents and apply for an offer from the institution." },
    { title: "Visa Documentation", details: "Prepare the visa documents, medical examination results, and police clearance report before lodging the visa application." },
    { title: "Visa Lodgement", details: "Submit the visa application with the prepared supporting documents." },
    { title: "Interview (if required)", details: "Attend an interview if requested. Some applicants may not require an interview." },
    { title: "Approval in Principle (AIP)", details: "Receive Approval in Principle (AIP) before proceeding with tuition fee payment." },
    { title: "Tuition Fee Payment", details: "Pay the tuition fee after Approval in Principle (AIP) is approved." },
];

async function main() {
    await mongoose.connect(process.env.MONGODB_URI, { serverSelectionTimeoutMS: 15000 });
    const countries = await Country.find({ code: "NZ", name: /^New Zealand$/i }).lean();
    assert.equal(countries.length, 1, "Expected one New Zealand record.");
    const scope = { country: countries[0]._id, type: "process_flow" };
    const existing = await Document.find(scope).select("title order").lean();
    // Refuse to silently overwrite unrelated stages added after this import.
    assert.ok(existing.every((entry) => stages.some((stage) => stage.title === entry.title)), "Unexpected existing stages; review before importing.");
    assert.equal(new Set(existing.map((entry) => entry.title)).size, existing.length, "Duplicate stages require review.");
    console.log(JSON.stringify({ country: "New Zealand", existing: existing.length, stages, mode: process.argv.includes("--apply") ? "apply" : "dry-run" }));
    if (!process.argv.includes("--apply")) return;
    for (const [index, stage] of stages.entries()) {
        await Document.updateOne(
            { ...scope, title: stage.title },
            { $set: { ...stage, section: "New Zealand Flow", stage: "", timeline: "", source: "", order: index + 1 } },
            { upsert: true, runValidators: true },
        );
    }
    const saved = await Document.find(scope).sort({ order: 1 }).lean();
    assert.equal(saved.length, stages.length);
    assert.deepEqual(saved.map(({ title, details, order }) => ({ title, details, order })), stages.map((stage, index) => ({ ...stage, order: index + 1 })));
    console.log(JSON.stringify({ verified: saved.length, titles: saved.map((stage) => stage.title) }));
}

main().catch((error) => {
    console.error(`${error.name}: New Zealand process-flow import failed.`);
    process.exitCode = 1;
}).finally(() => mongoose.disconnect());
