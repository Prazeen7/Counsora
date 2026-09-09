const crypto = require("crypto");
const nodemailer = require("nodemailer");
const User = require("../models/User");
const path = require("path");
const verificationEmailTemplate = require("./verificationEmailTemplate");

const hashToken = (token) => crypto.createHash("sha256").update(token).digest("hex");

async function sendVerificationEmail(user) {
    const { SMTP_HOST, SMTP_USER, SMTP_PASS, EMAIL_FROM, FRONTEND_URL } = process.env;
    if (!SMTP_HOST || !EMAIL_FROM || !FRONTEND_URL) {
        throw new Error("Email verification is not configured");
    }
    const token = crypto.randomBytes(32).toString("hex");
    const now = new Date();
    // Atomically limit delivery attempts across concurrent requests and server instances.
    const claimed = await User.findOneAndUpdate({
        _id: user._id,
        email: user.email,
        isVerified: { $ne: true },
        $or: [
            { verificationEmailSentAt: { $exists: false } },
            { verificationEmailSentAt: { $lte: new Date(Date.now() - 60000) } },
        ],
    }, { $set: {
        verificationTokenHash: hashToken(token),
        verificationTokenExpiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
        verificationEmailSentAt: now,
    } });
    if (!claimed) return { sent: false };

    const link = new URL("/verify-email", FRONTEND_URL);
    link.hash = new URLSearchParams({ token }).toString();
    const port = Number(process.env.SMTP_PORT || 587);
    const transport = nodemailer.createTransport({
        host: SMTP_HOST, port, secure: port === 465,
        ...(SMTP_USER && { auth: { user: SMTP_USER, pass: SMTP_PASS } }),
        connectionTimeout: 10000, greetingTimeout: 10000, socketTimeout: 15000,
    });
    try {
        await transport.sendMail({
        from: EMAIL_FROM, to: user.email,
        subject: "Verify your Counsora email",
        text: `Verify your email to finish signing up for Counsora:\n\n${link}\n\nThis link expires in 24 hours. If you did not sign up, ignore this email.`,
        html: verificationEmailTemplate(user.name, link.toString()),
        attachments: [{ filename: "counsora-logo.png", path: path.join(__dirname, "../assets/logo.png"), cid: "counsora-logo" }],
        });
        return { sent: true };
    } catch (error) {
        // Release only this failed attempt so it cannot erase a newer token.
        await User.updateOne({ _id: user._id, verificationTokenHash: hashToken(token) }, {
            $unset: { verificationTokenHash: "", verificationTokenExpiresAt: "", verificationEmailSentAt: "" },
        });
        throw error;
    } finally {
        transport.close();
    }
}

module.exports = { hashToken, sendVerificationEmail };
