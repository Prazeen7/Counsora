const express = require("express");
const { signUp, login, verifyEmail, resendVerification, verificationStatus, updateVerificationEmail, currentUser } = require("../controllers/authController");
const { authMiddleware } = require("../middleware/authMiddleware");


const router = express.Router();

router.post("/signup", signUp);
router.post("/login", login);
router.get("/me", authMiddleware, currentUser);
router.post("/verify-email", verifyEmail);
router.post("/verification-status", verificationStatus);
router.post("/resend-verification", resendVerification);
router.post("/verification-email", updateVerificationEmail);

module.exports = router;
