const mongoose = require("mongoose");

// ========== SUB-SCHEMAS ==========

const academicRequirementSchema = new mongoose.Schema(
    {
        minimum_qualification: {
            type: String,
            enum: ["Higher Secondary", "Diploma", "Bachelor", "Master", "Doctoral", null],
            default: null,
        },
        field_requirement: { type: String, default: null },
        score_type: { type: String, enum: ["GPA", "Percentage", null], default: null },
        score: { type: Number, default: null },
        scale: { type: Number, default: null },
    },
    { _id: false }
);

const languageScoreSchema = new mongoose.Schema(
    {
        overall: { type: Number, default: null },
        minimum_band: { type: Number, min: 0, default: null },
        listening: { type: Number, default: null },
        reading: { type: Number, default: null },
        writing: { type: Number, default: null },
        speaking: { type: Number, default: null },
    },
    { _id: false }
);

const englishLanguageSchema = new mongoose.Schema(
    {
        ielts: { type: languageScoreSchema, default: () => ({}) },
        toefl: { type: languageScoreSchema, default: () => ({}) },
        pte: { type: languageScoreSchema, default: () => ({}) },
        duolingo: { type: languageScoreSchema, default: () => ({}) },
        cambridge: { type: String, default: null },
        cefr: { type: String, default: null },
    },
    { _id: false }
);

const germanLanguageSchema = new mongoose.Schema(
    {
        cefr: { type: String, default: null },
        testdaf: { type: languageScoreSchema, default: () => ({}) },
        dsh: { type: languageScoreSchema, default: () => ({}) },
    },
    { _id: false }
);

const languageRequirementsSchema = new mongoose.Schema(
    {
        english: { type: englishLanguageSchema, default: () => ({}) },
        german: { type: germanLanguageSchema, default: () => ({}) },
        other_languages: { type: [String], default: [] },
    },
    { _id: false }
);

const entryRequirementsSchema = new mongoose.Schema(
    {
        academic: { type: academicRequirementSchema, default: () => ({}) },
        language_requirements: { type: languageRequirementsSchema, default: () => ({}) },
        additional_requirements: { type: [String], default: [] },
    },
    { _id: false }
);

const scholarshipSchema = new mongoose.Schema(
    {
        available: { type: Boolean, default: false },
        description: { type: String, default: null },
        url: { type: String, default: null },
    },
    { _id: false }
);

const tuitionFeeSchema = new mongoose.Schema(
    {
        credits: { type: String, default: null },
        annual_fee_eur: { type: Number, default: null },
    },
    { _id: false }
);

// ========== MAIN PROGRAM SCHEMA ==========

const programSchema = new mongoose.Schema(
    {
        // --- RELATIONAL FIELD (no denormalized name) ---
        institutionId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Institution",
            required: true,
            index: true,
        },

        // --- ORIGINAL PROGRAM FIELDS ---
        degree_name: {
            type: String,
            required: true,
            trim: true,
        },
        level: {
            type: String,
            enum: ["Foundation", "Diploma", "Bachelor", "Master", "PhD", "Doctoral", "Research", null],
            default: null,
        },
        field: {
            type: String,
            default: null,
            trim: true,
        },
        specialization: {
            type: [String],
            default: [],
        },
        credits: {
            type: [String],
            default: [],
        },
        format: {
            type: String,
            default: null,
        },
        scholarship: {
            type: scholarshipSchema,
            default: () => ({
                available: false,
                description: null,
                url: null,
            }),
        },
        intakes: {
            type: [String],
            default: [],
        },
        campuses: {
            type: [String],
            default: [],
        },
        duration: {
            type: String,
            default: null,
        },
        accreditation: {
            type: String,
            default: null,
        },
        entry_requirements: {
            type: entryRequirementsSchema,
            default: () => ({
                academic: {},
                language_requirements: {},
                additional_requirements: [],
            }),
        },
        tuition_fees: {
            type: [tuitionFeeSchema],
            default: [],
        },
        application_fees: {
            type: String,
            default: null,
        },
        application_deadline: {
            type: String,
            default: null,
        },
        url: {
            type: String,
            trim: true,
            default: null,
        },
        isActive: {
            type: Boolean,
            default: true,
        },
    },
    { timestamps: true }
);

// ========== INDEXES ==========

programSchema.index({ degree_name: "text" });
programSchema.index({ institutionId: 1, level: 1, isActive: 1 });
programSchema.index({ institutionId: 1, field: 1 });

// ========== OPTIONAL: VIRTUAL FOR INSTITUTION NAME ==========
// This gives you a virtual property that resolves to the populated institution's name.
// You must use .populate('institutionId') for this to work.
programSchema.virtual("institutionName").get(function () {
    if (this.institutionId && this.institutionId.name) {
        return this.institutionId.name;
    }
    return null;
});

// Include virtuals when converting to JSON/objects
programSchema.set("toJSON", { virtuals: true });
programSchema.set("toObject", { virtuals: true });

// ========== EXPORT ==========

module.exports = mongoose.model("Program", programSchema);
