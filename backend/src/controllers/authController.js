const User = require("../models/User");
const hashPassword = require("../utils/hashPassword");
const comparePassword = require("../utils/comparePassword")
const jwt = require("jsonwebtoken");
const crypto = require("crypto");
const { hashToken, sendVerificationEmail } = require("../utils/emailVerification");

const createVerificationStatusToken = (user) => jwt.sign(
    { id: user._id, purpose: "verification-status" },
    process.env.JWT_SECRET,
    { expiresIn: "24h" }
);

function verificationSession(user) {
    return {
        token: jwt.sign({ id: user._id, role: user.role, email: user.email, sessionToken: user.sessionToken },
            process.env.JWT_SECRET, { expiresIn: "7d" }),
        user: { id: user._id, name: user.name, email: user.email, role: user.role, isVerified: user.isVerified, isApproved: user.isApproved },
    };
}

const signUp = async (req, res) => {
    try {
        const { firstName, lastName, email, password, role, organizationName } = req.body;

        // Superadmins are provisioned separately, never through public signup.
        if (role !== undefined && !["admin", "counselor"].includes(role)) {
            return res.status(400).json({ error: "Invalid signup role" });
        }

        // Basic validation
        if (!firstName || !lastName || !email || !password) {
            return res.status(400).json({
                error: "All fields are required",
            });
        }

        // Check if user already exists
        const existingUser = await User.findOne({
            email: email.toLowerCase(),
        });

        if (existingUser) {
            return res.status(400).json({
                error: "Email is already registered",
            });
        }

        // Check if organizationName is provided or not
        if (role === "counselor" && !organizationName) {
            return res.status(400).json({
                error: "Organization name is required for counselors",
            });
        }

        // Hash password
        const hashedPassword = await hashPassword(password);

        // Create user
        const user = await User.create({
            name: `${firstName} ${lastName}`,
            email: email.toLowerCase(),
            password: hashedPassword,
            role: role || "counselor",
            organizationName:
                role === "counselor" ? organizationName : undefined,
            isVerified: false,
        });

        let emailSent = true;
        try {
            await sendVerificationEmail(user);
        } catch (error) {
            emailSent = false;
            console.error("Verification email delivery failed:", error.message);
        }

        return res.status(201).json({
            message: emailSent ? "Check your email to verify your account" : "Account created, but the verification email could not be sent. Please try resending it.",
            emailSent,
            verificationStatusToken: createVerificationStatusToken(user),
            user: {
                id: user._id,
                name: user.name,
                email: user.email,
                role: user.role,
                isVerified: user.isVerified,
            },
        });
    } catch (error) {
        console.error("Signup error:", error);

        return res.status(500).json({ error: error.message });
    }
};

const login = async (req, res) => {
    try {
        const { email, password } = req.body;

        if (!email || !password) {
            return res.status(400).json({
                error: "Email and password are required",
            });
        }

        // Check if user exists or not
        const existingUser = await User.findOne({
            email: email.toLowerCase(),
        });

        // check if the user is registered
        if (!existingUser) {
            return res.status(400).json({
                error: "No account found with this email address"
            });
        }

        if (!["admin", "counselor", "superAdmin"].includes(existingUser.role)) {
            return res.status(403).json({ error: "Invalid account role" });
        }

        // password verification
        const passwordCheck = await comparePassword(password, existingUser.password);
        if (!passwordCheck) {
            return res.status(400).json({
                error: "Incorrect password"
            })
        }

        if (existingUser.isVerified !== true) {
            // Do not hold the login response open while SMTP connects. The user
            // is sent to the verification route immediately; delivery continues
            // in the background and failures are logged without exposing secrets.
            sendVerificationEmail(existingUser, { force: true }).catch((error) => {
                console.error("Automatic verification email failed", { code: error.code, responseCode: error.responseCode });
            });
            return res.status(403).json({
                error: "Please verify your email before logging in",
                code: "EMAIL_NOT_VERIFIED",
                verificationStatusToken: createVerificationStatusToken(existingUser),
                message: "We sent a verification email. Check your inbox to continue.",
                emailSent: true,
            });
        }

        if (existingUser.isApproved !== true) {
            return res.status(403).json({
                error: "Your account is awaiting admin approval",
                code: "ACCOUNT_NOT_APPROVED",
            });
        }

        const sessionToken = crypto.randomBytes(32).toString("hex");
        existingUser.sessionToken = sessionToken;
        await existingUser.save();

        // creating JWT token
        const token = jwt.sign(
            {
                id: existingUser._id,
                role: existingUser.role,
                email: existingUser.email,
                sessionToken: existingUser.sessionToken,
            },
            process.env.JWT_SECRET,
            { expiresIn: "7d" }
        );



        return res.status(200).json({
            message: "Logged in successfully",
            token,
            user: {
                id: existingUser._id,
                name: existingUser.name,
                email: existingUser.email,
                role: existingUser.role,
                isVerified: existingUser.isVerified,
                isApproved: existingUser.isApproved,
            }
        })
    } catch (error) {
        console.error("SLogin error:", error);

        return res.status(500).json({ error: error.message });
    }
}

const verifyEmail = async (req, res) => {
    const { token } = req.body;
    if (typeof token !== "string" || !/^[a-f0-9]{64}$/.test(token)) {
        return res.status(400).json({ error: "Invalid verification link. Request a new email." });
    }
    try {
        const sessionToken = crypto.randomBytes(32).toString("hex");
        const user = await User.findOneAndUpdate({
            verificationTokenHash: hashToken(token),
            verificationTokenExpiresAt: { $gt: new Date() },
            isVerified: false,
        }, {
            $set: { isVerified: true, sessionToken, verificationLoginSession: sessionToken },
            $unset: { verificationTokenHash: "", verificationTokenExpiresAt: "", verificationEmailSentAt: "" },
        }, { new: true });
        if (!user) return res.status(400).json({ error: "This link has expired or was already used. Try logging in or request a new email." });
        res.set("Cache-Control", "no-store");
        return res.json({ message: "Email verified. Welcome to Counsora!", isVerified: true, email: user.email, ...verificationSession(user) });
    } catch {
        return res.status(500).json({ error: "Unable to verify your email. Please try again." });
    }
};

const verificationStatus = async (req, res) => {
    const { token, statusToken } = req.body;
    res.set("Cache-Control", "no-store");
    if (statusToken) {
        let claims;
        try {
            claims = jwt.verify(statusToken, process.env.JWT_SECRET);
            if (claims.purpose !== "verification-status" || !claims.id) throw new Error("Invalid purpose");
        } catch {
            return res.status(400).json({ error: "Verification session expired. Please log in again." });
        }
        try {
            const user = await User.findById(claims.id);
            const isVerified = user?.isVerified === true;
            // Reuse the session created by verification. Polling must not log out
            // the email tab or restore a session replaced by a later login.
            const canCompleteLogin = isVerified && user.sessionToken && user.verificationLoginSession === user.sessionToken;
            return res.json({ isVerified, ...(canCompleteLogin ? verificationSession(user) : {}) });
        } catch {
            return res.status(503).json({ error: "Unable to check verification status" });
        }
    }
    if (typeof token !== "string" || !/^[a-f0-9]{64}$/.test(token)) {
        return res.json({ valid: false });
    }
    try {
        const user = await User.exists({
            verificationTokenHash: hashToken(token),
            verificationTokenExpiresAt: { $gt: new Date() },
            isVerified: false,
        });
        return res.json({ valid: Boolean(user) });
    } catch {
        return res.status(503).json({ error: "Unable to check verification link" });
    }
};

const updateVerificationEmail = async (req, res) => {
    const { email, statusToken, automatic = false } = req.body;
    let claims;
    try {
        claims = jwt.verify(statusToken, process.env.JWT_SECRET);
        if (claims.purpose !== "verification-status" || !claims.id) throw new Error("Invalid purpose");
    } catch {
        return res.status(400).json({ error: "Verification session expired. Please log in again." });
    }
    if (typeof email !== "string" || email.trim().length > 254 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
        return res.status(400).json({ error: "Enter a valid email address" });
    }
    const normalizedEmail = email.trim().toLowerCase();
    try {
        const current = await User.findById(claims.id);
        if (!current || current.isVerified) {
            return res.status(409).json({ error: "Only an unverified account can change its email here." });
        }
        let user = current;
        if (current.email !== normalizedEmail) {
            // Changing the address invalidates all links sent to the previous address.
            user = await User.findOneAndUpdate({
                _id: claims.id, email: current.email, isVerified: false,
                $or: [
                    { verificationEmailSentAt: { $exists: false } },
                    { verificationEmailSentAt: { $lte: new Date(Date.now() - 60000) } },
                ],
            }, {
                $set: { email: normalizedEmail },
                $unset: { verificationTokenHash: "", verificationTokenExpiresAt: "", verificationEmailSentAt: "" },
            }, { new: true, runValidators: true });
            if (!user) return res.status(409).json({ error: "Please wait one minute after the last email, then try again. The account may also have been updated in another tab." });
        }
        sendVerificationEmail(user, { force: automatic === true }).catch((error) => {
            console.error("Updated verification email delivery failed", {
                code: error.code, command: error.command, responseCode: error.responseCode,
            });
        });
        return res.json({
            email: user.email,
            emailSent: true,
            message: "Verification email requested. Check your inbox shortly.",
        });
    } catch (error) {
        if (error.code === 11000) return res.status(409).json({ error: "This email address is already registered." });
        return res.status(500).json({ error: "Unable to update your email. Please try again." });
    }
};

const resendVerification = async (req, res) => {
    const { email } = req.body;
    if (typeof email !== "string" || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
        return res.status(400).json({ error: "Enter a valid email address" });
    }
    try {
        const user = await User.findOne({ email: email.trim().toLowerCase() });
        if (user && !user.isVerified) await sendVerificationEmail(user);
        return res.json({ message: "If this account needs verification, an email has been sent. Allow a minute before requesting another." });
    } catch (error) {
        // Log diagnostic metadata only; never expose SMTP credentials or tokens.
        console.error("Verification email resend failed", {
            code: error.code || "VERIFICATION_ERROR",
            command: error.command,
            responseCode: error.responseCode,
        });
        return res.status(503).json({ error: "Unable to send verification email. Please try again later." });
    }
};

const currentUser = (req, res) => {
    const user = req.user;
    res.set("Cache-Control", "no-store");
    return res.json({ user: {
        id: user._id, name: user.name, email: user.email,
                role: user.role, isVerified: user.isVerified,
        isApproved: user.isApproved,
    } });
};

module.exports = {
    currentUser,
    updateVerificationEmail,
    verificationStatus,
    verifyEmail,
    resendVerification,
    signUp,
    login
};
