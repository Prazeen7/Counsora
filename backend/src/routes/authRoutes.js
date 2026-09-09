const express = require("express");
const { signUp, login, verifyEmail, resendVerification, verificationStatus, updateVerificationEmail } = require("../controllers/authController");


const router = express.Router();

router.post("/signup", signUp);
router.post("/login", login);
router.post("/verify-email", verifyEmail);
router.post("/verification-status", verificationStatus);
router.post("/resend-verification", resendVerification);
router.post("/verification-email", updateVerificationEmail);

module.exports = router;
