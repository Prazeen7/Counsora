const express = require("express");
const { getInstitutions, getInstitutionById, addInstitution
} = require("../controllers/institutionController");
const { authMiddleware } = require("../middleware/authMiddleWare");

const router = express.Router();

router.post("/get", authMiddleware, getInstitutions);
router.get("/:id", authMiddleware, getInstitutionById);
router.post("/add", authMiddleware, addInstitution);

module.exports = router;