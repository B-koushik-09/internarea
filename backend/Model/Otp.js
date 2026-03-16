const mongoose = require("mongoose");

 
const OTP_PURPOSES = [
    'LOGIN_CHROME_GOOGLE',
    'LOGIN_CHROME_PASSWORD',
    'LANGUAGE_FRENCH',
    'FORGOT_PASSWORD_EMAIL',
    'FORGOT_PASSWORD_SMS',
    'RESUME_PAYMENT'
];

const otpSchema = new mongoose.Schema({
    email: { type: String, required: true, index: true },
    otp: { type: String, required: true },
    purpose: {
        type: String,
        required: true,
        enum: OTP_PURPOSES,
        index: true
    },
    isUsed: { type: Boolean, default: false },
    expiresAt: { type: Date, required: true, index: { expires: 0 } } // TTL index
}, { timestamps: true });

// Compound index for efficient lookups
otpSchema.index({ email: 1, purpose: 1, isUsed: 1 });

module.exports = mongoose.model("Otp", otpSchema);
module.exports.OTP_PURPOSES = OTP_PURPOSES;
