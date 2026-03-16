const mongoose = require("mongoose");

const connectDB = async () => {
    const MONGO_URI = process.env.DATABASE_URL || process.env.MONGO_URL;

    if (!MONGO_URI) {
        throw new Error("❌ FATAL: DATABASE_URL is not defined in environment variables!");
    }

    console.log("[DB] Connecting to MongoDB...");

    await mongoose.connect(MONGO_URI, {
        serverSelectionTimeoutMS: 5000,
    });

    console.log("✅ MongoDB Connected Successfully");
};

module.exports = connectDB;