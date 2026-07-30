const User = require("../models/User");
const hashPassword = require("../utils/hashPassword");

const signUp = async (req, res) => {
    try {
        const { firstName, lastName, email, password, role, organizationName } = req.body;

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

        return res.status(201).json({
            message: "User registered successfully",
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

module.exports = {
    signUp,
};