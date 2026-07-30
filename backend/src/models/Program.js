const mongoose = require("mongoose");

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

const programSchema = new mongoose.Schema(
    {
        institution: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Institution",
            required: true,
        },

        name: {
            type: String,
            required: true,
            trim: true,
        },

        level: {
            type: String,
            enum: [
                "Certificate",
                "Diploma",
                "Bachelor",
                "Master",
                "PhD",
                "Other",
            ],
            default: "Other",
        },

        field: {
            type: String,
            trim: true,
        },

        duration: {
            type: String,
            trim: true,
        },

        tuitionFee: {
            value: String,
            currency: String,
            per: {
                type: String,
                enum: ["semester", "year", "total"],
                default: "year",
            },
        },

        applicationFee: {
            value: String,
            currency: String,
        },

        entryRequirements: [String],

        intakes: [String],

        requiredDocuments: [String],

        scholarships: [scholarshipSchema],

        awards: [awardSchema],

        description: {
            type: String,
            trim: true,
        },

        isActive: {
            type: Boolean,
            default: true,
        },
    },
    {
        timestamps: true,
    }
);

module.exports = mongoose.model("Program", programSchema);