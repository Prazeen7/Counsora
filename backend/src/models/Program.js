const mongoose = require("mongoose");

// Sub-schema for entry requirements - strict format
const entryRequirementsSchema = new mongoose.Schema(
    {
        academic: {
            type: String,
            default: null,
        },
        language: {
            type: String,
            default: null,
        },
    },
    { _id: false }
);

// Individual program schema with strict types for consistency
const programSchema = new mongoose.Schema(
    {
        degree_name: {
            type: String,
            required: true,
            trim: true,
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
            type: String,
            default: null,
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
            default: () => ({ academic: null, language: null }),
        },

        tuition_fees: {
            type: [String],
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
            required: true,
            trim: true,
        },

        isActive: {
            type: Boolean,
            default: true,
        },
    },
    { _id: true }
);

// Main schema linking programs to institution
const institutionProgramsSchema = new mongoose.Schema(
    {
        institution: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Institution",
            required: true,
            unique: true,
        },

        programs: [programSchema],

        lastCrawled: {
            type: Date,
            default: Date.now,
        },

        crawlStatus: {
            type: String,
            enum: ["pending", "in_progress", "pending_review", "completed", "failed"],
            default: "pending",
        },
    },
    {
        timestamps: true,
    }
);

// Index for text search on program names
institutionProgramsSchema.index({ "programs.degree_name": "text" });

module.exports = mongoose.model("Program", institutionProgramsSchema);