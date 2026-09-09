const express = require("express");
const User = require("../models/User");
const { authMiddleware } = require("../middleware/authMiddleware");
const { superAdminMiddleware } = require("../middleware/adminMiddleware");
const router = express.Router();

router.get("/", authMiddleware, superAdminMiddleware, async (req, res) => {
    const page = Math.max(1, parseInt(req.query.page, 10) || 1);
    const limit = 25;
    try {
        const [users, total] = await Promise.all([
            User.find().select("name email role organizationName isVerified isApproved isActive createdAt")
                .sort({ createdAt: -1, _id: -1 }).skip((page - 1) * limit).limit(limit).lean(),
            User.countDocuments(),
        ]);
        res.set("Cache-Control", "no-store");
        return res.json({ users, total, page, limit });
    } catch {
        return res.status(500).json({ error: "Unable to load users" });
    }
});

module.exports = router;
