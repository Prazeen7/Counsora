const router = require("express").Router();
const { authMiddleware } = require("../middleware/authMiddleware");
const { adminMiddleware } = require("../middleware/adminMiddleware");
const { getCostSheet, estimateCosts, saveCostSheet, deleteCostSheet } = require("../controllers/costEstimationController");

router.use(authMiddleware);
router.get("/:countryId", getCostSheet);
router.post("/:countryId/estimate", estimateCosts);
router.put("/:countryId", adminMiddleware, saveCostSheet);
router.delete("/:countryId", adminMiddleware, deleteCostSheet);

module.exports = router;
