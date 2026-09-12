const path = require("node:path");
const assert = require("node:assert/strict");
require("../src/config/systemCa");
require("dotenv").config({ path: path.join(__dirname, "../.env"), quiet: true });
const mongoose = require("mongoose");
const Country = require("../src/models/Country");
const Document = require("../src/models/Document");

const stages = [
    { title: "Offer Application", timeline: "", details: "Checklist same like UK." },
    { title: "Deposit of requested amount (Fees)", timeline: "", details: "Recommended to pay 1 year fee." },
    { title: "Letter of Acceptance", timeline: "", details: "Receive the acceptance letter after the institution completes its assessment." },
    { title: "Visa documents preparation", timeline: "", details: "Prepare the required visa documents." },
    { title: "Online Application Submission - VISA", timeline: "", details: "Submit the visa application online." },
    { title: "Waiting for Interview date", timeline: "", details: "Wait for the assigned interview date." },
    { title: "Attend Interview", timeline: "", details: "Attend the visa interview." },
    { title: "Block Living Cost after request from the Embassy", timeline: "", details: "Block the required living cost after the Embassy requests it." },
    { title: "Visa Waiting", timeline: "3-4 weeks", details: "Wait for the visa decision." },
];

async function main() {
    await mongoose.connect(process.env.MONGODB_URI, { serverSelectionTimeoutMS: 15000 });
    const countries = await Country.find({ code: "DE", name: /^Germany$/i }).select("name code").lean();
    assert.equal(countries.length, 1, "Expected one Germany record.");
    const country = countries[0];
    const existing = await Document.find({ country: country._id, type: "process_flow" }).select("title").lean();
    const existingTitles = new Set(existing.map((entry) => entry.title));
    const missing = stages.filter((stage) => !existingTitles.has(stage.title));
    console.log(JSON.stringify({ country: country.name, sourceStages: stages.length, existing: existing.length, toInsert: missing.length, mode: process.argv.includes("--apply") ? "apply" : "dry-run" }));
    if (!process.argv.includes("--apply")) return;
    for (const [index, stage] of stages.entries()) {
        await Document.updateOne(
            { country: country._id, type: "process_flow", title: stage.title },
            { $setOnInsert: { ...stage, country: country._id, type: "process_flow", section: "Germany Flow", order: index + 1, preview: null } },
            { upsert: true, runValidators: true },
        );
    }
    const saved = await Document.find({ country: country._id, type: "process_flow", title: { $in: stages.map((stage) => stage.title) } }).sort({ order: 1 }).lean();
    assert.equal(saved.length, stages.length);
    assert.deepEqual(saved.map((entry) => entry.title), stages.map((stage) => stage.title));
    assert.ok(saved.every((entry) => entry.section === "Germany Flow" && !entry.preview));
    console.log(JSON.stringify({ verified: saved.length, stages: saved.map((entry) => ({ title: entry.title, timeline: entry.timeline, details: entry.details })) }));
}

main().catch((error) => { console.error(`${error.name}: Germany process-flow import failed.`); process.exitCode = 1; })
    .finally(() => mongoose.disconnect());
