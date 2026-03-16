const mongoose = require("mongoose");

const resumeSchema = new mongoose.Schema({
    user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    details: {
        name: String,
        email: String,
        phone: String,
        address: String,
        education: String,
        skills: String,
        experience: String,
        achievements: String,
        strengths: String,
        personalDetails: String,
        photo: String
    },
    paymentId: String,
    createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model("Resume", resumeSchema);
