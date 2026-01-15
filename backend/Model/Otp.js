const mongoose = require("mongoose");

/**
 * OTP PURPOSE ENUM
 * - LOGIN_CHROME_GOOGLE: Chrome + Google Login
 * - LOGIN_CHROME_PASSWORD: Chrome + Email/Password Login
 * - LANGUAGE_FRENCH: French Language Unlock
 * - FORGOT_PASSWORD_EMAIL: Forgot Password via Email
 * - FORGOT_PASSWORD_SMS: Forgot Password via SMS
 */
const OTP_PURPOSES = [
    'LOGIN_CHROME_GOOGLE',
    'LOGIN_CHROME_PASSWORD',
    'LANGUAGE_FRENCH',
    'FORGOT_PASSWORD_EMAIL',
    'FORGOT_PASSWORD_SMS'
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
