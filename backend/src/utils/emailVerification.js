const crypto = require("crypto");
const { sendMail } = require("./mailDelivery");
const User = require("../models/User");
const path = require("path");
const verificationEmailTemplate = require("./verificationEmailTemplate");

async function sendApprovalEmail(user) {
    const { SMTP_HOST, EMAIL_FROM, FRONTEND_URL } = process.env;
    if (!SMTP_HOST || !EMAIL_FROM || !FRONTEND_URL) throw new Error("Email delivery is not configured");
    const dashboardUrl = new URL(user.role === "counselor" ? "/" : "/admin/dashboard", FRONTEND_URL).toString();
    const safeName = String(user.name || "there").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
    const safeUrl = dashboardUrl.replace(/&/g, "&amp;").replace(/"/g, "&quot;");
        await sendMail({
            from: EMAIL_FROM, to: user.email,
            subject: "Your Counsora account is active",
            text: `Hi ${user.name || "there"}, your Counsora account has been approved. You can now use the service: ${dashboardUrl}`,
            html: `<!doctype html><html><body style="margin:0;background:#f4f3ff;font-family:Arial,sans-serif;color:#201b3b"><table width="100%" cellpadding="0" cellspacing="0"><tr><td align="center" style="padding:40px 16px"><table width="560" style="max-width:560px;background:#fff;border-radius:20px;overflow:hidden"><tr><td style="height:6px;background:#4f46e5"></td></tr><tr><td style="padding:36px 32px"><img src="cid:counsora-logo" width="64" height="64" alt="Counsora logo" style="display:block;margin:auto"><h1 style="text-align:center;font-size:28px">Your account is active</h1><p style="font-size:16px;line-height:1.7">Hi ${safeName},</p><p style="font-size:16px;line-height:1.7;color:#6b6375">Your Counsora account has been approved. You can now use the service and access your dashboard.</p><p style="text-align:center;margin:30px 0"><a href="${safeUrl}" style="background:#4f46e5;color:#fff;padding:16px 30px;border-radius:10px;text-decoration:none;font-weight:700">Open Counsora</a></p><p style="font-size:13px;color:#6b6375;text-align:center">Welcome to Counsora.</p></td></tr></table></td></tr></table></body></html>`,
            attachments: [{ filename: "counsora-logo.png", path: path.join(__dirname, "../assets/logo.png"), cid: "counsora-logo" }],
        });
}

const hashToken = (token) => crypto.createHash("sha256").update(token).digest("hex");

async function sendVerificationEmail(user) {
    const { SMTP_HOST, EMAIL_FROM, FRONTEND_URL } = process.env;
    if (!SMTP_HOST || !EMAIL_FROM || !FRONTEND_URL) {
        throw new Error("Email verification is not configured");
    }
    const token = crypto.randomBytes(32).toString("hex");
    const now = new Date();
    // Atomically limit delivery attempts across concurrent requests and server instances.
    const deliveryFilter = {
        _id: user._id,
        email: user.email,
        isVerified: { $ne: true },
        $and: [{ $or: [
            { verificationEmailDelivery: { $ne: "sending" } },
            { verificationEmailSentAt: { $lte: new Date(Date.now() - 180000) } },
        ] }],
        $or: [
            { verificationEmailSentAt: { $exists: false } },
            { verificationEmailSentAt: null },
            { verificationEmailSentAt: { $lte: new Date(Date.now() - 60000) } },
        ],
    };
    const claimed = await User.findOneAndUpdate(deliveryFilter, { $set: {
        verificationTokenHash: hashToken(token),
        verificationTokenExpiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
        verificationEmailSentAt: now,
        verificationEmailDelivery: "sending",
    } });
    if (!claimed) return { sent: false };

    const link = new URL("/verify-email", FRONTEND_URL);
    link.hash = new URLSearchParams({ token }).toString();
    try {
        await sendMail({
        messageId: `<verification-${hashToken(token)}@counsora.local>`,
        from: EMAIL_FROM, to: user.email,
        subject: "Verify your Counsora email",
        text: `Verify your email to finish signing up for Counsora:\n\n${link}\n\nThis link expires in 24 hours. If you did not sign up, ignore this email.`,
        html: verificationEmailTemplate(user.name, link.toString()),
        attachments: [{ filename: "counsora-logo.png", path: path.join(__dirname, "../assets/logo.png"), cid: "counsora-logo" }],
        });
    } catch (error) {
        // Release only this failed attempt so it cannot erase a newer token.
        await User.updateOne({ _id: user._id, verificationTokenHash: hashToken(token) }, {
            $unset: { verificationEmailSentAt: "" },
            $set: { verificationEmailDelivery: "failed" },
        });
        throw error;
    }
    // A status-write failure must never invalidate an already delivered link.
    await User.updateOne({ _id: user._id, verificationTokenHash: hashToken(token) }, {
        $set: { verificationEmailDelivery: "sent" },
    });
    return { sent: true };
}

module.exports = { hashToken, sendVerificationEmail, sendApprovalEmail };
