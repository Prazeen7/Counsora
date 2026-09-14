const router = require("express").Router();
const { authMiddleware } = require("../middleware/authMiddleware");
const { adminMiddleware } = require("../middleware/adminMiddleware");
const upload = require("../middleware/documentUpload");
const { listDocuments, saveDocument, previewDocument, deleteDocument } = require("../controllers/documentController");

router.use(authMiddleware);
router.get("/", listDocuments);
router.get("/:id/preview", previewDocument);
router.post("/", adminMiddleware, upload, saveDocument);
router.put("/:id", adminMiddleware, upload, saveDocument);
router.delete("/:id", adminMiddleware, deleteDocument);
module.exports = router;
