const mongoose = require("mongoose");

const connectDB = async () => {
    const MONGO_URI = process.env.DATABASE_URL || process.env.MONGO_URL;

    if (!MONGO_URI) {
        throw new Error("DATABASE_URL is not defined");
    }

    if (mongoose.connection.readyState >= 1) {
        return;
    }

    try {
        await mongoose.connect(MONGO_URI);
        console.log("MongoDB Connected Successfully");
    } catch (error) {
        console.error("MongoDB Connection Error:", error);
        throw error;
    }
};

module.exports = connectDB;