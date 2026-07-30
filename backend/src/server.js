const dotenv = require("dotenv");
const connectDB = require("./config/db");
const app = require("./app");

// load .env into global process.env 
dotenv.config();

const PORT = process.env.PORT;

const startServer = async () => {
    // connect DB
    await connectDB();

    // start express server
    app.listen(PORT, () => {
        console.log(`Server running on http://localhost:${PORT}`);
    });
};

startServer();