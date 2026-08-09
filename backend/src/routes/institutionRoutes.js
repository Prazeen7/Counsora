const express = require("express");
const { 
    getInstitutions, 
    getInstitutionById, 
    addInstitution,
    crawlAndAddPrograms,
    getCrawlStatus,
    getPendingPrograms,
    approvePrograms,
    rejectCrawl
} = require("../controllers/institutionController");
const { authMiddleware } = require("../middleware/authMiddleWare");
const upload = require("../middleware/upload");

const router = express.Router();

router.post("/get", authMiddleware, getInstitutions);
router.post("/add", authMiddleware, upload.single('logo'), addInstitution);

// Specific routes MUST come before generic /:id routes
router.post("/:institutionId/crawl", authMiddleware, crawlAndAddPrograms);
router.get("/:institutionId/crawl-status", authMiddleware, getCrawlStatus);
router.get("/:institutionId/programs/pending", authMiddleware, getPendingPrograms);
router.post("/:institutionId/programs/approve", authMiddleware, approvePrograms);
router.post("/:institutionId/programs/reject", authMiddleware, rejectCrawl);

// Generic ID route comes last
router.get("/:id", authMiddleware, getInstitutionById);

module.exports = router;