const path = require("node:path");
const assert = require("node:assert/strict");
require("../src/config/systemCa");
require("dotenv").config({ path: path.join(__dirname, "../.env"), quiet: true });
const mongoose = require("mongoose");
const Country = require("../src/models/Country");
const Document = require("../src/models/Document");

// Assign documents where they are first prepared; they remain part of the
// supporting package submitted at visa lodgement.
const assignments = {
    "Offer Application": [
        "Updated CV",
        "Valid passport and previous passport copy",
        "English proficiency test certificate",
        "Academic documents and professional registration",
        "Gap evidence documents (if applicable)",
    ],
    "Visa Documentation": [
        "Passport photograph",
        "Citizenship certificate",
        "Birth verification or registration",
        "Police report",
        "Valid offer letter",
        "Handwritten Statement of Purpose",
        "Pre-medical examination evidence",
        "Loan sanction letter and mortgage deed",
        "Funds and liquid savings evidence",
        "Property valuation and land ownership",
        "Property and land tax receipts (if applicable)",
        "Tax clearance certificates",
        "Sponsor relationship verification and citizenship",
        "Sponsorship letter",
        "Form INZ 1226",
        "Income certificate",
        "Employment income evidence (if applicable)",
        "Business income evidence (if applicable)",
        "Lease income evidence (if applicable)",
        "Agricultural income evidence (if applicable)",
        "Vehicle income evidence (if applicable)",
        "Foreign income evidence (if applicable)",
        "Ward or DAO verification documents (if applicable)",
        "Clarification and declaration letters (if requested)",
    ],
    "Tuition Fee Payment": [
        "Fee payment proof after Approval in Principle",
        "Loan disbursement letter, SWIFT copy and account statement",
        "SWIFT copy and bank balance account statement",
    ],
};

async function main() {
    await mongoose.connect(process.env.MONGODB_URI, { serverSelectionTimeoutMS: 15000 });
    const country = await Country.findOne({ code: "NZ", name: /^New Zealand$/i }).lean();
    assert.ok(country, "New Zealand must exist.");
    const scope = { country: country._id, type: "required_documents" };
    const documents = await Document.find(scope).lean();
    const stages = await Document.find({ country: country._id, type: "process_flow" }).lean();
    const mapping = new Map(Object.entries(assignments).flatMap(([stage, titles]) => titles.map((title) => [title, stage])));
    assert.equal(documents.length, mapping.size, "Review checklist changes before assigning stages.");
    assert.equal(new Set(documents.map((doc) => doc.title)).size, documents.length, "Duplicate document titles require review.");
    for (const stage of Object.keys(assignments)) assert.ok(stages.some((entry) => entry.title === stage), `Missing stage: ${stage}`);
    for (const document of documents) assert.ok(mapping.has(document.title), `Unmapped document: ${document.title}`);
    console.log(JSON.stringify({ mode: process.argv.includes("--apply") ? "apply" : "dry-run", assignments }));
    if (!process.argv.includes("--apply")) return;
    for (const document of documents) {
        await Document.updateOne({ ...scope, _id: document._id }, { $set: { stage: mapping.get(document.title) } }, { runValidators: true });
    }
    const saved = await Document.find(scope).lean();
    assert.equal(saved.length, documents.length);
    for (const document of saved) assert.equal(document.stage, mapping.get(document.title));
    console.log(JSON.stringify({ verified: saved.length, byStage: Object.fromEntries(stages.map((stage) => [stage.title, saved.filter((doc) => doc.stage === stage.title).length])) }));
}

main().catch((error) => {
    console.error(`${error.name}: New Zealand document stage assignment failed.`);
    process.exitCode = 1;
}).finally(() => mongoose.disconnect());
