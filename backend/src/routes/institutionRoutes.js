const express = require("express");
const { 
    getInstitutions, 
    getInstitutionById, 
    addInstitution,
    updateInstitution,
    crawlAndAddPrograms,
    getCrawlStatus,
    getPendingPrograms,
    approvePrograms,
    rejectCrawl
} = require("../controllers/institutionController");
const { authMiddleware } = require("../middleware/authMiddleWare");
const { adminMiddleware } = require("../middleware/adminMiddleware");
const upload = require("../middleware/upload");
const spreadsheetUpload = require("../middleware/spreadsheetUpload");
const { discoverGroups, extractInstitutions, extractPrograms, commitImport } = require("../controllers/institutionImportController");

const router = express.Router();

router.post("/get", authMiddleware, getInstitutions);
router.post("/add", authMiddleware, adminMiddleware, upload.single('logo'), addInstitution);
router.post("/import/groups", authMiddleware, adminMiddleware, spreadsheetUpload.single("file"), discoverGroups);
router.post("/import/extract-institutions", authMiddleware, adminMiddleware, spreadsheetUpload.single("file"), extractInstitutions);
router.post("/import/extract-programs", authMiddleware, adminMiddleware, spreadsheetUpload.single("file"), extractPrograms);
router.post("/import/commit", authMiddleware, adminMiddleware, commitImport);

// Specific routes MUST come before generic /:id routes
router.post("/:institutionId/crawl", authMiddleware, adminMiddleware, crawlAndAddPrograms);
router.get("/:institutionId/crawl-status", authMiddleware, getCrawlStatus);
router.get("/:institutionId/programs/pending", authMiddleware, getPendingPrograms);
router.post("/:institutionId/programs/approve", authMiddleware, adminMiddleware, approvePrograms);
router.post("/:institutionId/programs/reject", authMiddleware, adminMiddleware, rejectCrawl);

// Generic ID routes come last
router.get("/:id", authMiddleware, getInstitutionById);
router.put("/:id", authMiddleware, adminMiddleware, upload.single('logo'), updateInstitution);

module.exports = router;
