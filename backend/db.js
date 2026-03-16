const mongoose = require("mongoose");

const connectDB = async () => {
    const MONGO_URI = process.env.DATABASE_URL || process.env.MONGO_URL;

    if (!MONGO_URI) {
        throw new Error("DATABASE_URL is not defined");
    }

    console.log("MongoDB Connected Successfully");
};

module.exports = connectDB;