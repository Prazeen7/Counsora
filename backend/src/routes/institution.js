const express = require("express");
const { getInstitutions } = require("../controllers/institution");
const { authMiddleware } = require("../middleware/authMiddleWare");

const router = express.Router();

router.post("/get", authMiddleware, getInstitutions);

module.exports = router;