const mongoose = require("mongoose");
const { isAmount, validateCostSheet } = require("../utils/costEstimation");

const itemSchema = new mongoose.Schema({
    key: { type: String, required: true },
    label: { type: String, required: true },
    amount: { type: Number, default: null, validate: (value) => value === null || isAmount(value) },
    currency: { type: String, required: true, trim: true, maxlength: 32 },
    note: String,
    unit: { type: String, enum: ["money", "percent", "months"] },
    includeInTotal: Boolean,
    calculation: { type: new mongoose.Schema({
        type: { type: String, enum: ["copy", "percentage", "emi"], required: true },
        baseKey: { type: String, required: true },
        rateKey: String,
        termKey: String,
        rate: Number,
    }, { _id: false }), default: undefined },
}, { _id: false });
const stageSchema = new mongoose.Schema({
    key: { type: String, required: true },
    title: { type: String, required: true },
    items: [itemSchema],
}, { _id: false });
const costSheetSchema = new mongoose.Schema({
    country: { type: mongoose.Schema.Types.ObjectId, ref: "Country", required: true, unique: true },
    title: { type: String, required: true },
    stages: [stageSchema],
}, { timestamps: true });
costSheetSchema.pre("validate", function () {
    // Country-specific currency authorization is enforced by the controller;
    // the model validates shape and allows the selected currency through.
    validateCostSheet({ title: this.title, stages: this.stages.toObject() }, { skipCurrencyValidation: true });
});

module.exports = mongoose.model("CostSheet", costSheetSchema);
