const mongoose = require("mongoose");
const { isAmount, validateCostSheet } = require("../utils/costEstimation");

const itemSchema = new mongoose.Schema({
    key: { type: String, required: true },
    label: { type: String, required: true },
    amount: { type: Number, default: null, validate: (value) => value === null || isAmount(value) },
    note: String,
}, { _id: false });
const stageSchema = new mongoose.Schema({
    key: { type: String, required: true },
    title: { type: String, required: true },
    items: [itemSchema],
}, { _id: false });
const costSheetSchema = new mongoose.Schema({
    country: { type: mongoose.Schema.Types.ObjectId, ref: "Country", required: true, unique: true },
    title: { type: String, required: true },
    currency: { type: String, enum: ["NPR"], default: "NPR" },
    stages: [stageSchema],
}, { timestamps: true });
costSheetSchema.pre("validate", function () {
    validateCostSheet({ title: this.title, currency: this.currency, stages: this.stages.toObject() });
});

module.exports = mongoose.model("CostSheet", costSheetSchema);
