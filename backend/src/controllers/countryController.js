const Country = require("../models/Country");

const getCountries = async (req, res) => {
    try {
        const countries = await Country.find({ isActive: true })
            .select("code name currency")
            .sort({ name: 1 });

        res.status(200).json(countries);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

module.exports = { getCountries };