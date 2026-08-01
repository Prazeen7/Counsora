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
            required: true,
            trim: true,
        },
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
        key: {
            type: String,
            required: true,
            trim: true,
        },
        value: {
            type: String,
            trim: true,
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

        website: String,

        logo: {
            url: String,
            publicId: String,
        },

        applicationFee: {
            amount: Number,
            currency: String,
        },

        entryRequirements: {
            undergraduate: {
                gpa: String,
                qualification: String
            },
            postgraduate: {
                gpa: String,
                qualification: String
            },
            language: {
                IELTS: [],
                TOEFL: [],
                PTE: [],
                Duolingo: [],
                others: []
            }
        },

        intakes: [String],

        requiredDocuments: [requiredDocumentSchema],

        scholarships: [scholarshipSchema],

        awards: [awardSchema],

        description: String,

        isActive: {
            type: Boolean,
            default: true,
        },
    },
    {
        timestamps: true,
    }
);

module.exports = mongoose.model("Institution", institutionSchema);