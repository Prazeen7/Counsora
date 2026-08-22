const mongoose = require("mongoose");

// Academic requirement schema
const academicRequirementSchema = new mongoose.Schema(
    {
        minimum_qualification: {
            type: String,
            enum: ["Higher Secondary", "Diploma", "Bachelor", "Master", "Doctoral", null],
            default: null,
        },
        field_requirement: {
            type: String,
            default: null,
        },
        score_type: {
            type: String,
            enum: ["GPA", "Percentage", null],
            default: null,
        },
        score: {
            type: Number,
            default: null,
        },
        scale: {
            type: Number,
            default: null,
        },
    },
    { _id: false }
);

// Generic language score schema
const languageScoreSchema = new mongoose.Schema(
    {
        overall: { type: Number, default: null },
        listening: { type: Number, default: null },
        reading: { type: Number, default: null },
        writing: { type: Number, default: null },
        speaking: { type: Number, default: null },
    },
    { _id: false }
);

// English language requirements
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

// German language requirements
const germanLanguageSchema = new mongoose.Schema(
    {
        cefr: { type: String, default: null },
        testdaf: { type: languageScoreSchema, default: () => ({}) },
        dsh: { type: languageScoreSchema, default: () => ({}) },
    },
    { _id: false }
);

// Language requirements schema
const languageRequirementsSchema = new mongoose.Schema(
    {
        english: { type: englishLanguageSchema, default: () => ({}) },
        german: { type: germanLanguageSchema, default: () => ({}) },
        other_languages: {
            type: [String],
            default: [],
        },
    },
    { _id: false }
);

// Entry requirements schema
const entryRequirementsSchema = new mongoose.Schema(
    {
        academic: {
            type: academicRequirementSchema,
            default: () => ({}),
        },
        language_requirements: {
            type: languageRequirementsSchema,
            default: () => ({}),
        },
        additional_requirements: {
            type: [String],
            default: [],
        },
    },
    { _id: false }
);

// Scholarship schema
const scholarshipSchema = new mongoose.Schema(
    {
        available: {
            type: Boolean,
            default: false,
        },
        description: {
            type: String,
            default: null,
        },
        url: {
            type: String,
            default: null,
        },
    },
    { _id: false }
);

// Tuition Fee schema
const tuitionFeeSchema = new mongoose.Schema(
    {
        credits: {
            type: String,
            default: null,
        },
        annual_fee_eur: {
            type: Number,
            default: null,
        },
    },
    { _id: false }
);

// Individual program schema
const programSchema = new mongoose.Schema(
    {
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
            enum: [
                "Allied Health",
                "Management, Business and Accounting",
                "Creative, Performing and Visual Arts",
                "Creative Media, Communication and Arts",
                "Education, Teaching and Childcare",
                "Engineering, Built Environment and Aviation",
                "English and Study Pathways",
                "Information Systems and Technology",
                "Law, Criminology and Justice",
                "Nursing, Paramedicine and Health",
                "Psychology, Social Work and Community Services",
                "Safety Sciences",
                "Science, Environment and Agriculture",
                "Service Industries",
                "Trades",
                "Other",
                null,
            ],
            default: null,
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
