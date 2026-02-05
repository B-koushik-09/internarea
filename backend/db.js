const mongoose = require("mongoose");
require("dotenv").config();

const MONGODB_URI = process.env.DATABASE_URL;

// Cache connection for serverless (prevents new connection on every request)
let cached = global.mongoose;

if (!cached) {
    cached = global.mongoose = { conn: null, promise: null };
}

async function connect() {
    if (cached.conn) {
        console.log("Using cached database connection");
        return cached.conn;
    }

    if (!cached.promise) {
        const opts = {
            bufferCommands: false,
        };

        console.log("Creating new database connection");
        cached.promise = mongoose.connect(MONGODB_URI, opts).then((mongoose) => {
            console.log("Database is connected");
            return mongoose;
        });
    }

    try {
        cached.conn = await cached.promise;
    } catch (e) {
        cached.promise = null;
        console.error("Database connection error:", e.message);
        throw e;
    }

    return cached.conn;
}

module.exports = { connect };