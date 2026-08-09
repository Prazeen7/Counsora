// Express app 
require('dotenv').config(); // Load env variables first
const express = require("express");
const cors = require("cors");
const authRoutes = require("./routes/authRoutes");
const institutionRoutes = require("./routes/institutionRoutes");
const countryRoutes = require("./routes/countryRoutes");
const programRoutes = require("./routes/programRoutes");

// Initialize Cloudinary configuration early
require("./config/cloudinary");

const app = express();

app.use(cors());
app.use(express.json());

app.get('/', (req, res) => {
    res.json({ message: "API is running"});
});
app.use("/api/auth", authRoutes);
app.use("/api/institution", institutionRoutes)
app.use("/api/country", countryRoutes);
app.use("/api/program", programRoutes);

module.exports = app;