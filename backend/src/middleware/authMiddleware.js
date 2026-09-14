const jwt = require("jsonwebtoken");
const User = require("../models/User");
const { subscriptionError } = require('../utils/subscription');
const authenticatedRequests = new WeakSet();

const authMiddleware = async (req, res, next) => {
    // API and route guards share one validation per request.
    if (authenticatedRequests.has(req)) return next();
    const authHeader = req.headers.authorization;
    const bearer = typeof authHeader === 'string' && /^Bearer ([^\s,]+)$/i.exec(authHeader);

    if (!bearer) {
        return res.status(401).json({
            error: "Authentication token is missing",
        });
    }

    const token = bearer[1];

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        if (!decoded || typeof decoded !== 'object' || typeof decoded.id !== 'string' ||
            !/^[a-f0-9]{24}$/i.test(decoded.id) || typeof decoded.sessionToken !== 'string' || !decoded.sessionToken.trim()) {
            return res.status(401).json({ error: 'Invalid session token' });
        }

        const user = await User.findById(decoded.id);

        if (!user) {
            return res.status(401).json({
                error: "User not found",
            });
        }

        if (!["admin", "counselor", "superAdmin"].includes(user.role)) {
            return res.status(403).json({ error: "Invalid account role" });
        }

        if (!user.sessionToken || user.sessionToken !== decoded.sessionToken) {
            return res.status(401).json({
                error: "You have been logged out because your account was used on another device.",
            });
        }

        if (user.isVerified !== true) {
            return res.status(403).json({ error: "Please verify your email before continuing", code: "EMAIL_NOT_VERIFIED" });
        }

        if (user.isApproved !== true) {
            return res.status(403).json({ error: "Your account is awaiting admin approval", code: "ACCOUNT_NOT_APPROVED" });
        }

        const subscriptionFailure = subscriptionError(user);
        if (subscriptionFailure) return res.status(403).json(subscriptionFailure);

        req.user = user;
        authenticatedRequests.add(req);
        

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
