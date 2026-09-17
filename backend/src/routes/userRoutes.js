const express = require("express");
const User = require("../models/User");
const { authMiddleware } = require("../middleware/authMiddleware");
const { superAdminMiddleware } = require("../middleware/adminMiddleware");
const { sendApprovalEmail } = require("../utils/emailVerification");
const router = express.Router();
const { createSubscription } = require('../utils/subscription');
const { parseListQuery } = require('../utils/listQuery');

router.get("/", authMiddleware, superAdminMiddleware, async (req, res) => {
    let params;
    try { params = parseListQuery(req.query); }
    catch (error) { return res.status(400).json({ error: error.message }); }
    const { page, limit, search } = params;
    const { view = "all", organization } = req.query;
    const filter = {};
    if (organization !== undefined && (typeof organization !== "string" || organization.length > 300)) {
        return res.status(400).json({ error: "Invalid organization" });
    }
    if (search) filter.$or = ["name", "email", "organizationName"].map(field => ({ [field]: { $regex: search, $options: "i" } }));
    if (view === "verify") filter.isApproved = false;
    if (view === "admin") filter.role = "admin";
    if (view === "counselor") {
        filter.role = "counselor";
        if (organization && organization !== "all") filter.organizationName = organization;
    }
    if (!["all", "verify", "admin", "counselor"].includes(view)) {
        return res.status(400).json({ error: "Invalid user view" });
    }
    try {
        const [users, total, organizations] = await Promise.all([
            User.find(filter).select("name email role organizationName isVerified isApproved isActive createdAt subscriptionDuration subscriptionStartsAt subscriptionExpiresAt")
                .sort({ createdAt: -1, _id: -1 }).skip((page - 1) * limit).limit(limit).lean(),
            User.countDocuments(filter),
            User.distinct("organizationName", { role: "counselor", organizationName: { $nin: [null, ""] } }),
        ]);
        res.set("Cache-Control", "no-store");
        return res.json({ users, total, page, limit, organizations: organizations.sort() });
    } catch {
        return res.status(500).json({ error: "Unable to load users" });
    }
});

router.patch("/:userId/approval", authMiddleware, superAdminMiddleware, async (req, res) => {
    const { approved } = req.body;
    if (typeof approved !== "boolean") return res.status(400).json({ error: "approved must be a boolean" });
    try {
        const user = await User.findOneAndUpdate(
            { _id: req.params.userId, isVerified: true },
            { $set: { isApproved: approved, isActive: approved } },
            { new: true }
        ).select("name email role organizationName isVerified isApproved isActive createdAt").lean();
        if (!user) return res.status(409).json({ error: "Only verified users can be approved or rejected" });
        if (approved) {
            sendApprovalEmail(user).catch((error) => console.error("Approval email delivery failed", {
                code: error.code, command: error.command, responseCode: error.responseCode,
            }));
        }
        return res.json({ user });
    } catch (error) {
        if (error.name === "CastError") return res.status(400).json({ error: "Invalid user id" });
        return res.status(500).json({ error: "Unable to update account approval" });
    }
});

router.patch('/:userId/subscription', authMiddleware, superAdminMiddleware, async (req, res) => {
    if (!/^[a-f0-9]{24}$/i.test(req.params.userId)) return res.status(400).json({ error: 'Invalid user id' });
    let subscription;
    try { subscription = createSubscription(req.body || {}); }
    catch (error) { return res.status(400).json({ error: error.message }); }
    try {
        const user = await User.findOneAndUpdate(
            { _id: req.params.userId, role: { $in: ['admin', 'counselor'] } },
            { $set: subscription }, { new: true, runValidators: true }
        ).select('name email role subscriptionDuration subscriptionStartsAt subscriptionExpiresAt').lean();
        if (!user) return res.status(404).json({ error: 'No eligible user found. Superadmins do not need subscriptions.' });
        return res.json({ user });
    } catch { return res.status(500).json({ error: 'Unable to update subscription' }); }
});

module.exports = router;
