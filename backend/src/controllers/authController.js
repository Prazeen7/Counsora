const User = require("../models/User");
const hashPassword = require("../utils/hashPassword");
const comparePassword = require("../utils/comparePassword")
const jwt = require("jsonwebtoken");
const crypto = require("crypto");

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

        // password verification
        const passwordCheck = await comparePassword(password, existingUser.password);
        if (!passwordCheck) {
            return res.status(400).json({
                error: "Incorrect password"
            })
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


        //  email verification check
        // if (!existingUser.isVerified) { 
        // return res.status(403).json({  error: 'Please verify your email before logging in',  }); }

        return res.status(200).json({
            message: "Logged in successfully",
            token,
            user: {
                id: existingUser._id,
                name: existingUser.name,
                email: existingUser.email,
                role: existingUser.role,
                isVerified: existingUser.isVerified,
            }
        })
    } catch (error) {
        console.error("SLogin error:", error);

        return res.status(500).json({ error: error.message });
    }
}

module.exports = {
    signUp,
    login
};