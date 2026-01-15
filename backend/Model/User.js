const mongoose = require("mongoose");
const userSchema = new mongoose.Schema({
  name: String,
  email: { type: String, unique: true },
  phone: { type: String, unique: true, sparse: true }, // Added phone field
  password: String,
  friends: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],
  subscription: {
    plan: { type: String, enum: ["Free", "Bronze", "Silver", "Gold"], default: "Free" },
    paymentDate: Date,
    usageCount: { type: Number, default: 0 }
  },
  lastPasswordReset: Date,
  lastForgotRequest: { type: Date },
  loginHistory: [{
    device: String,
    browser: String,
    os: String,
    ip: String,
    time: { type: Date, default: Date.now }
  }],
  lastForgotRequest: { type: Date },
  lastResetDate: { type: String }, // Store YYYY-MM-DD for once-per-day check
  lastForgotDate: { type: String }, // YYYY-MM-DD for forgot password daily limit
  resumeAccess: { type: Boolean, default: false },
  profileLanguage: { type: String, default: "English" }
}, { timestamps: true });

module.exports = mongoose.model("User", userSchema);
