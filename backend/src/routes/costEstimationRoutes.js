const router = require("express").Router();
const { authMiddleware } = require("../middleware/authMiddleware");
const { adminMiddleware } = require("../middleware/adminMiddleware");
const { getCostSheet, estimateCosts, saveCostSheet, deleteCostSheet } = require("../controllers/costEstimationController");
const { getTodayRates, getFallbackRate } = require("../utils/nrbForex");
const Country = require("../models/Country");
const { findRate } = require("../utils/nrbForex");

router.use(authMiddleware);
router.get("/:countryId", getCostSheet);
router.post("/:countryId/estimate", estimateCosts);
router.get("/:countryId/forex/today", async (req, res) => {
    try {
        const country = await Country.findOne({ _id: req.params.countryId, isActive: true }).select("currency").lean();
        if (!country) return res.status(404).json({ error: "Active country not found" });
        const today = await getTodayRates();
        let rate = findRate(today.rates, country.currency);
        let source = "NRB";
        if (!rate) { rate = await getFallbackRate(country.currency); source = rate ? "open.er-api.com" : "NRB"; }
        return res.json({ ...today, currency: country.currency, rates: rate ? [rate] : [], source, unavailable: !rate });
    }
    catch { res.status(502).json({ error: "Nepal Rastra Bank forex rates are temporarily unavailable" }); }
});
router.put("/:countryId", adminMiddleware, saveCostSheet);
router.delete("/:countryId", adminMiddleware, deleteCostSheet);

module.exports = router;
