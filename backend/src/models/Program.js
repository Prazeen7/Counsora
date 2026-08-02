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

const gpaSchema = new mongoose.Schema(
    {
        type: {
            type: String,
            enum: ["GPA", "Percentage", ""],
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
        overall: String,
        minimum: String,
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
        languageRequirement: languageRequirementSchema,
    },
    { _id: false }
);

const programSchema = new mongoose.Schema(
    {
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

        campuses: [
            {
                type: String,
                trim: true,
            },
        ],

        entryRequirements: {
            undergraduate: entryRequirementSchema,
            postgraduate: entryRequirementSchema,
        },

        intakes: [String],

        scholarships: [scholarshipSchema],

        isActive: {
            type: Boolean,
            default: true,
        },
    },
    { _id: true }
);

const institutionProgramsSchema = new mongoose.Schema(
    {
        institution: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Institution",
            required: true,
            unique: true,
        },

        programs: [programSchema],
    },
    {
        timestamps: true,
    }
);

module.exports = mongoose.model("Program", institutionProgramsSchema);