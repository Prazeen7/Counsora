const Country = require("../models/Country");
const mongoose = require("mongoose");
const Institution = require("../models/Institution");
const Document = require("../models/Document");
const CostSheet = require("../models/CostSheet");
const StudyGuide = require("../models/StudyGuide");
const { parseListQuery } = require("../utils/listQuery");

const getCountries = async (req, res) => {
    try {
        const countries = await Country.find({ isActive: true })
            .select("code name currency")
            .sort({ name: 1 });

        res.status(200).json(countries);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

const getAllCountries = async (req, res) => {
    let params;
    try { params = parseListQuery(req.query); }
    catch (err) { return res.status(400).json({ error: err.message }); }
    try {
        const { page, limit, search } = params;
        const filter = search ? { $or: ["name", "code", "currency"].map(field => ({ [field]: { $regex: search, $options: "i" } })) } : {};
        const [countries, total] = await Promise.all([
            Country.find(filter).sort({ name: 1, _id: 1 }).skip((page - 1) * limit).limit(limit).lean(),
            Country.countDocuments(filter),
        ]);
        res.status(200).json({ countries, total, page, limit });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

const createCountry = async (req, res) => {
    const fields = req.body;
    const allowed = ["code", "name", "currency", "isActive"];
    if (!fields || typeof fields !== "object" || Array.isArray(fields) || Object.keys(fields).some((key) => !allowed.includes(key))) {
        return res.status(400).json({ error: "Provide code, name, currency, and isActive only." });
    }
    if (typeof fields.code !== "string" || !/^[a-z]{2}$/i.test(fields.code.trim())) return res.status(400).json({ error: "Country code must contain two letters." });
    if (typeof fields.name !== "string" || !fields.name.trim()) return res.status(400).json({ error: "Country name is required." });
    if ("currency" in fields && typeof fields.currency !== "string") return res.status(400).json({ error: "Currency must be text." });
    if ("isActive" in fields && typeof fields.isActive !== "boolean") return res.status(400).json({ error: "isActive must be true or false." });
    try {
        const country = await Country.create(fields);
        res.status(201).json(country);
    } catch (err) {
        res.status(err.code === 11000 ? 409 : err.name === "ValidationError" ? 400 : 500)
            .json({ error: err.code === 11000 ? "A country with this code or name already exists." : err.message });
    }
};

const updateCountry = async (req, res) => {
    if (!mongoose.isObjectIdOrHexString(req.params.id)) return res.status(400).json({ error: "Invalid country ID" });
    const allowed = ["code", "name", "currency", "isActive", "createdAt", "updatedAt", "__v"];
    const changes = req.body;
    if (!changes || Array.isArray(changes) || typeof changes !== "object" || !Object.keys(changes).length || Object.keys(changes).some((key) => !allowed.includes(key))) {
        return res.status(400).json({ error: "Provide country fields only. The ID cannot be edited." });
    }
    for (const key of ["code", "name", "currency"]) {
        if (key in changes && (typeof changes[key] !== "string" || (key !== "currency" && !changes[key].trim()))) return res.status(400).json({ error: `Invalid ${key}` });
    }
    if ("isActive" in changes && typeof changes.isActive !== "boolean") return res.status(400).json({ error: "isActive must be true or false" });
    for (const key of ["createdAt", "updatedAt"]) {
        if (key in changes && (typeof changes[key] !== "string" || !Number.isFinite(Date.parse(changes[key])))) return res.status(400).json({ error: `Invalid ${key}` });
    }
    if ("__v" in changes && (!Number.isInteger(changes.__v) || changes.__v < 0)) return res.status(400).json({ error: "Version must be a non-negative integer" });
    try {
        const country = await Country.findByIdAndUpdate(req.params.id, { $set: changes }, { new: true, runValidators: true, overwriteImmutable: true, timestamps: false });
        if (!country) return res.status(404).json({ error: "Country not found" });
        res.json(country);
    } catch (err) {
        res.status(err.code === 11000 ? 409 : err.name === "ValidationError" || err.name === "CastError" ? 400 : 500)
            .json({ error: err.code === 11000 ? "A country with this code or name already exists." : err.message });
    }
};

const deleteCountry = async (req, res) => {
    if (!mongoose.isObjectIdOrHexString(req.params.id)) return res.status(400).json({ error: "Invalid country ID" });
    try {
        if (await Institution.exists({ country: req.params.id })) return res.status(409).json({ error: "This country is used by institutions. Reassign them before deleting it." });
        if (await Document.exists({ country: req.params.id })) return res.status(409).json({ error: "This country is used by documents. Reassign or delete those documents first." });
        if (await CostSheet.exists({ country: req.params.id })) return res.status(409).json({ error: "This country is used by a cost sheet. Remove or reassign the cost sheet before deleting it." });
        if (await StudyGuide.exists({ country: req.params.id })) return res.status(409).json({ error: "This country is used by study guides. Reassign or delete those guides first." });
        const country = await Country.findByIdAndDelete(req.params.id);
        if (!country) return res.status(404).json({ error: "Country not found" });
        res.json({ message: "Country deleted" });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

module.exports = { getCountries, getAllCountries, createCountry, updateCountry, deleteCountry };
