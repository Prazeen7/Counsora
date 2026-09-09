const mongoose = require("mongoose");

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },

    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },

    password: {
      type: String,
      required: true,
    },

    role: {
      type: String,
      enum: ["admin", "counselor", "superAdmin"],
      default: "counselor",
    },

    organizationName: {
      type: String,
      trim: true,
      required: function () {
        return this.role === "counselor";
      },
    },

    sessionToken: {
      type: String,
      default: null,
    },

    isApproved: {
      type: Boolean,
      default: false,
    },

    isVerified: {
      type: Boolean,
      default: false,
    },

    verificationTokenHash: { type: String, select: false },
    verificationLoginSession: { type: String, default: null },
    verificationTokenExpiresAt: { type: Date, select: false },
    verificationEmailSentAt: { type: Date, select: false },

    isActive: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model("User", userSchema);
