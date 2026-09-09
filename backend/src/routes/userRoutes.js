const express = require("express");
const User = require("../models/User");
const { authMiddleware } = require("../middleware/authMiddleware");
const { superAdminMiddleware } = require("../middleware/adminMiddleware");
const router = express.Router();

router.get("/", authMiddleware, superAdminMiddleware, async (req, res) => {
    const page = Math.max(1, parseInt(req.query.page, 10) || 1);
    const limit = 25;
    const { view = "all", organization } = req.query;
    const filter = {};
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
            User.find(filter).select("name email role organizationName isVerified isApproved isActive createdAt")
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
        return res.json({ user });
    } catch (error) {
        if (error.name === "CastError") return res.status(400).json({ error: "Invalid user id" });
        return res.status(500).json({ error: "Unable to update account approval" });
    }
});

module.exports = router;
