const mongoose = require("mongoose");

const documentSchema = new mongoose.Schema({
    country: { type: mongoose.Schema.Types.ObjectId, ref: "Country", required: true },
    type: { type: String, enum: ["required_documents", "process_flow"], required: true },
    title: { type: String, required: true, trim: true, maxlength: 300 },
    section: { type: String, trim: true, default: "", maxlength: 200 },
    source: { type: String, trim: true, default: "", maxlength: 1000 },
    timeline: { type: String, trim: true, default: "", maxlength: 1000 },
    details: { type: String, trim: true, default: "", maxlength: 20000 },
    order: { type: Number, default: 0, min: 0, validate: Number.isInteger },
    preview: {
        type: new mongoose.Schema({
            name: String,
            mimeType: { type: String, enum: ["image/jpeg", "image/png", "application/pdf"] },
            size: Number,
        }, { _id: false }),
        default: null,
    },
    // Keep small previews with their record, but never include bytes in list responses.
    previewData: { type: Buffer, select: false },
}, { timestamps: true, toJSON: { transform(_doc, result) { delete result.previewData; return result; } } });

documentSchema.index({ country: 1, type: 1, order: 1, createdAt: 1 });
module.exports = mongoose.model("Document", documentSchema);
