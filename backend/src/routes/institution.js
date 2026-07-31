const express = require("express");
const { getInstitutions, getInstitutionById
} = require("../controllers/institutionController");
const { authMiddleware } = require("../middleware/authMiddleWare");

const router = express.Router();

router.post("/get", authMiddleware, getInstitutions);
router.get("/:id", authMiddleware, getInstitutionById);

module.exports = router;