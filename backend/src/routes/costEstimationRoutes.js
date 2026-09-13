const router = require("express").Router();
const { authMiddleware } = require("../middleware/authMiddleware");
const { superAdminMiddleware } = require("../middleware/adminMiddleware");
const { getCostSheet, estimateCosts, saveCostSheet } = require("../controllers/costEstimationController");

router.use(authMiddleware);
router.get("/:countryId", getCostSheet);
router.post("/:countryId/estimate", estimateCosts);
router.put("/:countryId", superAdminMiddleware, saveCostSheet);

module.exports = router;
