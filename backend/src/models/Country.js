const mongoose = require("mongoose");

const countrySchema = new mongoose.Schema(
    {
        code: {
            type: String,
            required: true,
            unique: true,
            uppercase: true,
            trim: true,
            minlength: 2,
            maxlength: 2,
        },

        name: {
            type: String,
            required: true,
            unique: true,
            trim: true,
        },

        currency: {
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

module.exports = mongoose.model("Country", countrySchema);