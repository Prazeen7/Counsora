const mongoose = require("mongoose");
const Country = require("../models/Country");
const CostSheet = require("../models/CostSheet");
const { calculateEstimate, validateCostSheet } = require("../utils/costEstimation");
const { getTodayRates, findRate, getFallbackRate } = require("../utils/nrbForex");

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
        let forex = null;
        try {
            const today = await getTodayRates();
            let currentRate = findRate(today.rates, country.currency);
            let source = "NRB";
            if (!currentRate) { currentRate = await getFallbackRate(country.currency); source = currentRate ? "open.er-api.com" : "NRB"; }
            forex = { ...today, rates: currentRate ? [currentRate] : [], currency: country.currency,
                source, unavailable: !currentRate };
        } catch { forex = { date: new Date().toISOString().slice(0, 10), rates: [], currency: country.currency, unavailable: true }; }
        let totalNpr = 0;
        let conversionMissing = false;
        const stagesWithConversion = estimate.stages.map((stage) => {
            let stageTotalNpr = 0;
            const items = stage.items.map((item) => {
            if (item.amount === null) return item;
            const rate = findRate(forex.rates, item.currency);
            const convertedNpr = rate ? item.amount * rate.sell / (Number(rate.currency?.unit) || 1) : null;
            if (convertedNpr !== null) { totalNpr += convertedNpr; stageTotalNpr += convertedNpr; }
            else if (item.currency?.toLowerCase() !== "npr") { conversionMissing = true; }
            return { ...item, forexRate: rate ? { buy: rate.buy, sell: rate.sell, unit: rate.currency?.unit || 1, date: rate.date } : null, convertedNpr };
            });
            return { ...stage, items, subtotalNpr: stageTotalNpr || (items.some((item) => item.amount !== null && item.currency?.toLowerCase() !== "npr" && item.convertedNpr === null) ? null : stageTotalNpr) };
        });
        res.json({ countryId: country._id, country, templateSource: "database", forex, ...estimate, stages: stagesWithConversion, totalNpr: conversionMissing ? null : totalNpr });
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
    try {
        const country = await findCountry(req, res);
        if (!country) return;
        try { validateCostSheet(req.body, { countryCurrency: country.currency }); }
        catch (err) { return res.status(400).json({ error: err.message }); }
        const sheet = await CostSheet.findOneAndUpdate({ country: country._id },
            { $set: { title: req.body.title, stages: req.body.stages }, $unset: { currency: 1 } },
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
