const mongoose = require("mongoose");
const dotenv = require("dotenv");
const Country = require("./src/models/Country");

dotenv.config();

const test = async () => {
    try {
        await mongoose.connect(process.env.MONGODB_URI);

        const country = await Country.create({
            code: "AU",
            name: "Australia",
            currency: "AUD",
        });

        console.log(country);

        await mongoose.disconnect();
    } catch (err) {
        console.error(err.message);
    }
};

test();