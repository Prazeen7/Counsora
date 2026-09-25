const mongoose = require("mongoose");

const campusSchema = new mongoose.Schema(
    {
        name: {
            type: String,
            trim: true,
        },

        address: {
            type: String,
            required: true,
            trim: true,
        },

        city: {
            type: String,
            trim: true,
        },

        contactNumber: {
            type: String,
            trim: true,
        },

        email: {
            type: String,
            trim: true,
            lowercase: true,
        },

        mapEmbedUrl: {
            type: String,
            trim: true,
            default: null,
        },
    },
    { _id: false }
);

const gpaSchema = new mongoose.Schema(
    {
        minimumQualification: { type: String, trim: true },
        fieldRequirement: { type: String, trim: true },
        scale: { type: String, trim: true },
        type: {
            type: String,
            enum: ["GPA", "Percentage", "Qualification", ""],
            default: "",
        },
        score: {
            type: String,
            trim: true,
        },
    },
    { _id: false }
);

const languageRequirementSchema = new mongoose.Schema(
    {
        testType: String,
        testName: String,
        overall: String,
        minimum: String,
        minimum_band: String,
        hasIndividualScores: Boolean,

        listening: String,
        reading: String,
        writing: String,
        speaking: String,

        literacy: String,
        comprehension: String,
        conversation: String,
        production: String,
    },
    { _id: false }
);

const entryRequirementSchema = new mongoose.Schema(
    {
        gpa: gpaSchema,
        languageRequirement: [languageRequirementSchema],
    },
    { _id: false }
);

const scholarshipSchema = new mongoose.Schema(
    {
        name: {
            type: String,
            required: true,
            trim: true,
        },
        value: String,
        description: String,
        eligibility: String,
        url: {
            type: String,
            trim: true,
        },
    },
    { _id: false }
);

const awardSchema = new mongoose.Schema(
    {
        title: {
            type: String,
            required: true,
            trim: true,
        },
        issuer: String,
        year: Number,
        description: String,
    },
    { _id: false }
);

const requiredDocumentSchema = new mongoose.Schema(
    {
        incomeSources: [String],
        sponsors: [String],
        minSponsorCount: {
            type: Number,
            default: 1,
        },
        minIncomeAmount: String,
        banks: [String],
        previousVisaRefusal: String,
        levelChangeAfterRefusal: {
            type: Boolean,
            default: false,
        },
    },
    { _id: false }
);

const institutionSchema = new mongoose.Schema(
    {
        name: {
            type: String,
            required: true,
            trim: true,
        },

        country: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Country",
            required: true,
        },

        campuses: [campusSchema],

        type: {
            type: String,
            enum: ["Public", "Private", "Community", "Other"],
            default: "Other",
        },

        website: {
            type: String,
            trim: true,
        },

        email: {
            type: String,
            trim: true,
            lowercase: true,
        },

        contactNumber: {
            type: String,
            trim: true,
        },

        logo: {
            url: String,
            publicId: String,
        },

        applicationFee: {
            amount: Number,
            currency: String,
        },

        entryRequirements: {
            diploma: entryRequirementSchema,
            undergraduate: entryRequirementSchema,
            postgraduate: entryRequirementSchema,
            fields: [{
                _id: false,
                field: { type: String, required: true, trim: true },
                level: { type: String, enum: ["diploma", "undergraduate", "postgraduate"], required: true },
                requirements: entryRequirementSchema,
            }],
        },

        documents: requiredDocumentSchema,

        scholarships: [scholarshipSchema],

        awards: [awardSchema],

        description: {
            type: String,
            trim: true,
        },

        whyUniversity: {
            type: String,
            trim: true,
            default: "",
        },

        isPinned: { type: Boolean, default: false },
        isDimmed: { type: Boolean, default: false },

        isActive: {
            type: Boolean,
            default: true,
        },

        importFingerprint: {
            type: String,
            unique: true,
            sparse: true,
            index: true,
        },

        crawlStatus: {
            type: String,
            enum: ["pending", "in_progress", "pending_review", "completed", "failed"],
            default: "pending",
        },

        lastCrawled: {
            type: Date,
            default: null,
        },
    },
    {
        timestamps: true,
    }
);

module.exports = mongoose.model("Institution", institutionSchema);
