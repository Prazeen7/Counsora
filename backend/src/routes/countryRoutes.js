const express = require("express");
const router = express.Router();
const { getCountries, getAllCountries, createCountry, updateCountry, deleteCountry } = require("../controllers/countryController");
const { authMiddleware } = require("../middleware/authMiddleware");
const { superAdminMiddleware } = require("../middleware/adminMiddleware");

router.get("/get", authMiddleware, getCountries);
router.get("/all", authMiddleware, superAdminMiddleware, getAllCountries);
router.post("/", authMiddleware, superAdminMiddleware, createCountry);
router.patch("/:id", authMiddleware, superAdminMiddleware, updateCountry);
router.delete("/:id", authMiddleware, superAdminMiddleware, deleteCountry);

module.exports = router;
