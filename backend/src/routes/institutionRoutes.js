const express = require("express");
const { getInstitutions, getInstitutionById, addInstitution
} = require("../controllers/institutionController");
const { authMiddleware } = require("../middleware/authMiddleWare");
const upload = require("../middleware/upload");

const router = express.Router();

router.post("/get", authMiddleware, getInstitutions);
router.get("/:id", authMiddleware, getInstitutionById);
router.post("/add", authMiddleware, upload.single('logo'), addInstitution);

module.exports = router;