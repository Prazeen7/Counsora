// Express app 
const express = require("express");
const cors = require("cors");
const authRoutes = require("./routes/authRoutes");
const institutionRoutes = require("./routes/institution");
const countryRoutes = require("./routes/countryRoutes");

const app = express();

app.use(cors());
app.use(express.json());

app.get('/', (req, res) => {
    res.json({ message: "API is running"});
});
app.use("/api/auth", authRoutes);
app.use("/api/institution", institutionRoutes)
app.use("/api/country", countryRoutes);

module.exports = app;