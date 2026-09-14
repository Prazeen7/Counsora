const express = require("express");
const router = express.Router();
const { 
    getProgramsByInstitution, 
    createProgram, 
    updateProgram, 
    deleteProgram,
    getAllProgram
} = require("../controllers/programController");
const { authMiddleware } = require("../middleware/authMiddleware");
const { adminMiddleware } = require("../middleware/adminMiddleware");

// Get programs by institution (auth required)
router.get("/institution/:institutionId", authMiddleware, getProgramsByInstitution);

// Get all programs
router.get("/get", authMiddleware, getAllProgram);

// Create new program (admin only)
router.post("/", authMiddleware, adminMiddleware, createProgram);

// Update program (admin only)
router.put("/:programId", authMiddleware, adminMiddleware, updateProgram);

// Delete program (admin only)
router.delete("/:programId", authMiddleware, adminMiddleware, deleteProgram);

module.exports = router;