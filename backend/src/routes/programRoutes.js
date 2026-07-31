const express = require("express");
const router = express.Router();
const { getProgramsByInstitution } = require("../controllers/programController");
const { authMiddleware } = require("../middleware/authMiddleWare");

router.get("/institution/:institutionId", authMiddleware, getProgramsByInstitution);

module.exports = router;