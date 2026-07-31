const express = require("express");
const router = express.Router();
const { getCountries } = require("../controllers/countryController");
const { authMiddleware } = require("../middleware/authMiddleWare");

router.get("/get", authMiddleware, getCountries);

module.exports = router;