const mongoose = require("mongoose");
const User = require("./Model/User");
const { connect } = require("./db");

// Force lowercase for consistency as per recent changes
const checkUser = async (email) => {
    try {
        await connect();
        console.log("Connected to DB...");

        console.log(`Checking for user: ${email}`);

        const user = await User.findOne({ email: email.toLowerCase() });

        if (user) {
            console.log("\n--- USER FOUND ---");
            console.log(`ID: ${user._id}`);
            console.log(`Name: ${user.name}`);
            console.log(`Email: ${user.email}`);
            console.log(`Phone: ${user.phone || "N/A"}`);
            console.log(`Password (raw): ${user.password}`); // Showing raw for debugging purposes as per user request context
            console.log("------------------\n");
        } else {
            console.log("\n--- USER NOT FOUND ---\n");
        }
    } catch (err) {
        console.error("Error:", err.message);
    } finally {
        mongoose.disconnect();
    }
};

const emailToCheck = process.argv[2];

if (!emailToCheck) {
    console.log("Usage: node check_user.js <email>");
    process.exit(1);
}

checkUser(emailToCheck);
