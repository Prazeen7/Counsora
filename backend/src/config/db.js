// DB connection module
const mongoose = require("mongoose");

const connectDB = async () => {
    try {
        const conn = await mongoose.connect(process.env.MONGODB_URI);

        console.log(`MongoDB connected: ${conn.connection.host}`);
    } catch (error) {
        console.error("MongoDB connection failed:", error.message);

        // If the DB connection fails, stop the server immediately
        process.exit(1);
    }
}

module.exports = connectDB;