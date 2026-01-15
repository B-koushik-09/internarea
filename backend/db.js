const mongoose = require("mongoose")
require('dotenv').config()
database = process.env.DATABASE_URL
const url = database
module.exports.connect = async () => {
    try {
        await mongoose.connect(url);
        console.log("Database is connected");
    } catch (err) {
        console.error("Database connection error:", err.message);
        throw err; // Propagate error so index.js can handle it
    }
}