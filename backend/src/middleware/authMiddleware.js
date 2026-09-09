const jwt = require("jsonwebtoken");
const User = require("../models/User");

const authMiddleware = async (req, res, next) => {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
        return res.status(401).json({
            error: "Authentication token is missing",
        });
    }

    const token = authHeader.split(" ")[1];

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);

        const user = await User.findById(decoded.id);

        if (!user) {
            return res.status(401).json({
                error: "User not found",
            });
        }

        if (user.sessionToken !== decoded.sessionToken) {
            return res.status(401).json({
                error: "You have been logged out because your account was used on another device.",
            });
        }

        if (!user.isVerified) {
            return res.status(403).json({ error: "Please verify your email before continuing", code: "EMAIL_NOT_VERIFIED" });
        }

        req.user = user;
        

        next();
    } catch (error) {
        return res.status(401).json({
            error: "Invalid or expired token",
        });
    }
};

module.exports = {
    authMiddleware,
};
