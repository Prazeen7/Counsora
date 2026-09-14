const path = require("node:path");
const assert = require("node:assert/strict");
require("../src/config/systemCa");
require("dotenv").config({ path: path.join(__dirname, "../.env"), quiet: true });
const mongoose = require("mongoose");
const Country = require("../src/models/Country");
const CostSheet = require("../src/models/CostSheet");
const { validateCostSheet } = require("../src/utils/costEstimation");
const sheet = require("./data/new-zealand-cost-sheet.json");

async function main() {
  validateCostSheet(sheet, { countryCurrency: "NZD" });
  if (process.argv.includes("--validate-only")) {
    console.log("New Zealand cost sheet validated.");
    return;
  }
  await mongoose.connect(process.env.MONGODB_URI, { serverSelectionTimeoutMS: 15000 });
  const country = await Country.findOne({ code: "NZ", name: /^New Zealand$/i }).lean();
  assert.ok(country, "New Zealand must exist.");
  console.log(JSON.stringify({ country: country.name, stages: sheet.stages.length, fields: sheet.stages.reduce((n, s) => n + s.items.length, 0), mode: process.argv.includes("--apply") ? "apply" : "dry-run" }));
  if (!process.argv.includes("--apply")) return;
  await CostSheet.findOneAndUpdate({ country: country._id }, { $set: { country: country._id, title: sheet.title, stages: sheet.stages } }, { upsert: true, returnDocument: "after", runValidators: true });
  const saved = await CostSheet.findOne({ country: country._id }).lean();
  assert.equal(saved.title, sheet.title);
  assert.deepEqual(saved.stages, sheet.stages);
  console.log(JSON.stringify({ verified: true, title: saved.title, stages: saved.stages.map((stage) => stage.title) }));
}
main().catch((error) => { console.error(`${error.name}: New Zealand cost-sheet import failed.`); process.exitCode = 1; }).finally(() => mongoose.disconnect());
