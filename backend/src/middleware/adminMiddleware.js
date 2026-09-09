const adminMiddleware = (req, res, next) => {
    if (!["admin", "superAdmin"].includes(req.user?.role)) {
        return res.status(403).json({
            error: "Access denied. Admins only.",
        });
    }

    next();
};

const superAdminMiddleware = (req, res, next) => {
    if (req.user?.role !== "superAdmin") return res.status(403).json({ error: "Access denied. Superadmins only." });
    next();
};

module.exports = { adminMiddleware, superAdminMiddleware };
