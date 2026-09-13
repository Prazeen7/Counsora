const mongoose = require("mongoose");
const Country = require("../models/Country");
const CostSheet = require("../models/CostSheet");
const { calculateEstimate, validateCostSheet } = require("../utils/costEstimation");

async function findCountry(req, res) {
    if (!mongoose.isObjectIdOrHexString(req.params.countryId)) {
        res.status(400).json({ error: "Invalid country ID" });
        return null;
    }
    const country = await Country.findOne({ _id: req.params.countryId, isActive: true }).select("code name currency").lean();
    if (!country) res.status(404).json({ error: "Active country not found" });
    return country;
}

async function respondWithEstimate(req, res, values) {
    try {
        const country = await findCountry(req, res);
        if (!country) return;
        const sheet = await CostSheet.findOne({ country: country._id }).lean();
        if (!sheet) return res.status(404).json({ error: "No cost sheet configured for this country", code: "COST_SHEET_NOT_FOUND" });
        let estimate;
        try { estimate = calculateEstimate(sheet, values); }
        catch (err) { return res.status(400).json({ error: err.message }); }
        res.json({ countryId: country._id, country, templateSource: "database", ...estimate });
    } catch (err) {
        res.status(500).json({ error: "Unable to load cost estimation" });
    }
}

const getCostSheet = (req, res) => respondWithEstimate(req, res, {});
const estimateCosts = (req, res) => {
    if (!req.body || typeof req.body !== "object" || Array.isArray(req.body)
        || Object.keys(req.body).some((key) => key !== "values")) {
        return res.status(400).json({ error: "Provide an object containing values only" });
    }
    return respondWithEstimate(req, res, req.body.values);
};

async function saveCostSheet(req, res) {
    try { validateCostSheet(req.body); }
    catch (err) { return res.status(400).json({ error: err.message }); }
    try {
        const country = await findCountry(req, res);
        if (!country) return;
        const sheet = await CostSheet.findOneAndUpdate({ country: country._id },
            { $set: { title: req.body.title, currency: req.body.currency, stages: req.body.stages } },
            { upsert: true, new: true, runValidators: true, setDefaultsOnInsert: true });
        res.json(sheet);
    } catch (err) {
        res.status(err.code === 11000 ? 409 : 500).json({ error: err.code === 11000 ? "Cost sheet was modified concurrently. Retry the request." : "Unable to save cost sheet" });
    }
}

async function deleteCostSheet(req, res) {
    if (!mongoose.isObjectIdOrHexString(req.params.countryId)) return res.status(400).json({ error: "Invalid country ID" });
    try {
        const sheet = await CostSheet.findOneAndDelete({ country: req.params.countryId });
        if (!sheet) return res.status(404).json({ error: "Cost sheet not found" });
        res.json({ message: "Cost sheet deleted" });
    } catch {
        res.status(500).json({ error: "Unable to delete cost sheet" });
    }
}

module.exports = { getCostSheet, estimateCosts, saveCostSheet, deleteCostSheet };
