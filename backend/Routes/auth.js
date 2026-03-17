const express = require("express");
const router = express.Router();
const User = require("../Model/User");
const Otp = require("../Model/Otp");
const { generateOTP } = require("../utils/otp");
const { sendOTPMail, sendMail } = require("../utils/mailer");
const axios = require("axios");
const jwt = require("jsonwebtoken");

const getISTTime = () => {
    const now = new Date();
    const utc = now.getTime() + (now.getTimezoneOffset() * 60000);
    return new Date(utc + (3600000 * 5.5));
};
function getTodayKey() {
    return new Date().toISOString().split("T")[0]; // YYYY-MM-DD
}

function getNextAllowedDate(lastDate) {
    const d = new Date(lastDate);
    d.setDate(d.getDate() + 1);
    return d.toISOString().split("T")[0];
}


router.post("/login", async (req, res) => {
    try {
        let { identifier, password } = req.body; 
        if (identifier && identifier.includes('@')) {
            identifier = identifier.toLowerCase();
        }

        const user = await User.findOne({
            $or: [{ email: identifier }, { phone: identifier }]
        });

        if (!user) {
            return res.status(404).json({ error: "Email is wrong" });
        }
 
        if (user.password !== password) {
            return res.status(401).json({ error: "Password fails" });
        }

        const istTime = getISTTime();

        console.log(`[DEBUG] Login: Email=${identifier}, Device=${req.body.device}, Browser=${req.body.browser}, Hour=${istTime.getHours()}`);

        // Mobile Access Restriction (10 AM - 1 PM IST)
        if (req.body.device && req.body.device.toLowerCase().includes("mobile")) {
            const hour = istTime.getHours();
            if (hour < 10 || hour >= 13) {
                return res.status(403).json({
                    error: "Access denied. Mobile users can only log in between 10:00 AM and 1:00 PM IST."
                });
            }
        }

        // Chrome Security Rule
        if (req.body.browser === "Chrome" && !req.body.otpVerified) {
            return res.json({ status: "OTP_REQUIRED", message: "OTP verification required for Chrome" });
        }
        user.loginHistory.push({
            device: req.body.device || "Unknown",
            browser: req.body.browser || "Unknown",
            os: req.body.os || "Unknown",
            ip: req.body.ip || "127.0.0.1",
            time: istTime
        });
        await user.save();

        const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, { expiresIn: "7d" });
        res.json({ status: "SUCCESS", user, token });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

router.post("/register", async (req, res) => {
    try {
        let { name, email, phone, password } = req.body;

        if (email) email = email.toLowerCase();
 
        const existingUser = await User.findOne({
            $or: [{ email: email }, { phone: phone }]
        });

        if (existingUser) {
            return res.status(409).json({ error: "Credentials already exist" });
        }

         const newUser = new User({
            name,
            email,
            phone,
            password,
            photo: "https://via.placeholder.com/100", // Default avatar
            createdAt: new Date().toISOString()
        });

        await newUser.save();
        const token = jwt.sign({ id: newUser._id }, process.env.JWT_SECRET, { expiresIn: "7d" });
        res.status(201).json({ status: "SUCCESS", user: newUser, token });

    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

const connect = require("../db");

router.post("/record-login", async (req, res) => {
    try {
        await connect();  
        const { email, device, browser, os, ip, otpVerified, name, isRefresh } = req.body;

        console.log(`[record-login] Request received for: ${email}, isRefresh: ${isRefresh}, otpVerified: ${otpVerified}`);

        if (!email) {
            console.error("[record-login] Error: Email is missing in request body.");
            return res.status(400).json({ error: "Email is required" });
        }

        let user = await User.findOne({ email });

        if (!user) {
            console.log(`[record-login] Creating new user for: ${email}`);
            user = await User.create({
                email,
                name: name || "Internshala User",
                loginHistory: []
            });
        }

        const istTime = getISTTime();

        // Mobile Access Restriction (10 AM - 1 PM IST)
        if (device && device.toLowerCase().includes("mobile")) {
            const hour = istTime.getHours();
            console.log(`[record-login] Mobile Check: Hour=${hour}`);
            if (hour < 10 || hour >= 13) {
                console.warn(`[record-login] Blocked: Mobile access outside 10AM-1PM IST (Attempt: ${hour}h)`);
                return res.status(403).json({
                    status: "BLOCKED",
                    error: "Access denied. Mobile users can only log in between 10:00 AM and 1:00 PM IST."
                });
            }
        }
 
        if (isRefresh && otpVerified) {
            console.log(`[record-login] Session refresh for ${email}`);
            return res.json({ status: "SUCCESS", user });
        }
 
        if (browser === "Chrome" && !otpVerified) {
            return res.status(200).json({ status: "OTP_REQUIRED", message: "OTP verification required for Chrome" });
        } 
        if (!isRefresh) {
            user.loginHistory.push({
                device,
                browser,
                os,
                ip,
                time: istTime
            });
            await user.save();
        }

        const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, { expiresIn: "7d" });
        res.json({ status: "SUCCESS", user, token });
    } catch (err) {
        console.error("[record-login] CRITICAL Error:", err);
        console.error("[record-login] Stack:", err.stack);
        res.status(500).json({
            error: "Internal Server Error",
            details: err.message,
            stack: process.env.NODE_ENV === 'development' ? err.stack : undefined
        });
    }
});



// Twilio client for phone OTP
const twilio = require("twilio");
const client = twilio(process.env.TWILIO_SID, process.env.TWILIO_AUTH);
 
const VALID_PURPOSES = [
    'LOGIN_CHROME_GOOGLE',
    'LOGIN_CHROME_PASSWORD',
    'LANGUAGE_FRENCH',
    'FORGOT_PASSWORD_EMAIL',
    'FORGOT_PASSWORD_SMS',
    'RESUME_PAYMENT'
];
 
router.post("/send-otp", async (req, res) => {
    try {
        let { identifier, purpose } = req.body;

        await connect();  

        if (!identifier) return res.status(400).json({ error: "Identifier required" });
        if (!purpose) return res.status(400).json({ error: "Purpose required" });
        if (!VALID_PURPOSES.includes(purpose)) {
            return res.status(400).json({ error: `Invalid purpose. Valid: ${VALID_PURPOSES.join(', ')}` });
        }

        if (identifier.includes('@')) identifier = identifier.toLowerCase();

        const user = await User.findOne({
            $or: [{ email: identifier }, { phone: identifier }]
        });
        if (!user) return res.status(404).json({ error: "User not found" });

        const today = getTodayKey();

        if (purpose === 'FORGOT_PASSWORD_EMAIL' || purpose === 'FORGOT_PASSWORD_SMS') {
            if (user.lastForgotDate === today) {
                return res.status(429).json({
                    error: `You already used forgot password today (${today}). You can use it again on ${getNextAllowedDate(today)}.`
                });
            }
            user.lastForgotDate = today;
            await user.save();
        }

        if (isEmail || purpose === 'FORGOT_PASSWORD_EMAIL' || purpose === 'FORGOT_PASSWORD_SMS') {
            const otp = generateOTP();
            const targetEmail = user.email; // Always use the registered email

            await Otp.deleteMany({ email: targetEmail, purpose: purpose });

            await Otp.create({
                email: targetEmail,
                otp,
                purpose: purpose,
                isUsed: false,
                expiresAt: new Date(Date.now() + 300000) 
            });

            const emailSent = await sendOTPMail(targetEmail, otp);
            if (!emailSent) {
                console.error(`[send-otp] FAILED to send email to ${targetEmail}`);
                return res.status(500).json({ error: "Email service failed. Please try again or check spam folder." });
            }
            console.log(`[send-otp] OTP sent to ${targetEmail} for purpose: ${purpose}`);
            return res.json({ message: `OTP sent to your registered email: ${targetEmail.replace(/(.{2})(.*)(@.*)/, "$1***$3")}`, purpose: purpose });
        }

        await client.verify.v2.services(process.env.TWILIO_VERIFY_SID)
            .verifications.create({ to: `+91${identifier}`, channel: "sms" });

        console.log(`[send-otp] SMS OTP sent to ${identifier} for purpose: ${purpose}`);
        res.json({ message: "OTP sent via SMS", purpose: purpose });
    } catch (err) {
        console.error("[send-otp] Error:", err);
        res.status(500).json({ error: "Failed to send OTP" });
    }
});

 
router.post("/verify-otp", async (req, res) => {
    try {
        let { identifier, otp, purpose } = req.body;

        await connect();  

        if (!identifier) return res.status(400).json({ error: "Identifier required" });
        if (!otp) return res.status(400).json({ error: "OTP required" });
        if (!purpose) return res.status(400).json({ error: "Purpose required" });
        if (!VALID_PURPOSES.includes(purpose)) {
            return res.status(400).json({ error: `Invalid purpose. Valid: ${VALID_PURPOSES.join(', ')}` });
        }

        if (identifier && identifier.includes('@')) identifier = identifier.toLowerCase();
        if (isEmail || purpose === 'FORGOT_PASSWORD_EMAIL' || purpose === 'FORGOT_PASSWORD_SMS') {
            const user = await User.findOne({
                $or: [{ email: identifier }, { phone: identifier }]
            });
            if (!user) return res.status(404).json({ error: "User not found" });

            // EMAIL FLOW: Verify from DB with purpose
            const validOtp = await Otp.findOne({
                email: user.email, // Always check against registered email
                otp: otp,
                purpose: purpose,
                isUsed: false,
                expiresAt: { $gt: new Date() }
            });

            if (!validOtp) {
                console.log(`[verify-otp] Invalid OTP for ${user.email}, purpose: ${purpose}`);
                return res.status(400).json({ error: "Invalid or Expired OTP" });
            } 
            validOtp.isUsed = true;
            await validOtp.save();

            console.log(`[verify-otp] OTP verified for ${user.email}, purpose: ${purpose}`);
        } else {
            const check = await client.verify.v2.services(process.env.TWILIO_VERIFY_SID)
                .verificationChecks
                .create({ to: `+91${identifier}`, code: otp });

            if (check.status !== "approved") {
                return res.status(400).json({ error: "Invalid OTP" });
            }
            console.log(`[verify-otp] SMS OTP verified for ${identifier}, purpose: ${purpose}`);
        }

        res.json({ status: "SUCCESS", message: "OTP Verified", purpose: purpose });
    } catch (err) {
        console.error("Verify OTP Error:", err.message);
        res.status(400).json({ error: "Invalid OTP" });
    }
});

router.post("/verify-phone-forgot-otp", async (req, res) => {
    try {
        const { phone, otp } = req.body;

        const check = await client.verify.v2.services(process.env.TWILIO_VERIFY_SID)
            .verificationChecks
            .create({ to: `+91${phone}`, code: otp });

        if (check.status !== "approved")
            return res.status(400).json({ error: "Invalid OTP" });

        res.json({ success: true });
    } catch (err) {
        res.status(400).json({ error: "Invalid OTP" });
    }
});

router.post("/reset-password", async (req, res) => {
    try {
        let { identifier, otp, newPassword } = req.body;
        if (identifier && identifier.includes('@')) identifier = identifier.toLowerCase();

        await connect();

        const user = await User.findOne({
            $or: [{ email: identifier }, { phone: identifier }]
        });
        if (!user) return res.status(404).json({ error: "User not found" });

        // For forgot password, we ALWAYS verify against the registered email in Otp model
        const validOtp = await Otp.findOne({
            email: user.email,
            otp,
            isUsed: false,
            expiresAt: { $gt: new Date() }
        });

        if (!validOtp) return res.status(400).json({ error: "Invalid or expired OTP" });

        if (user.password === newPassword) {
            return res.status(400).json({ error: "New password cannot be the same as your old password" });
        }

        user.password = newPassword;
        user.lastPasswordReset = getISTTime();
        await user.save();

        validOtp.isUsed = true;
        await validOtp.save();

        res.json({ status: "SUCCESS", message: "Password reset successfully" });

    } catch (err) {
        console.error(err.message);
        res.status(500).json({ error: "Failed to reset password" });
    }
});

router.get("/history/:email", async (req, res) => {
    try {
        let { email } = req.params;
        if (email) email = email.toLowerCase();
        const user = await User.findOne({ email });
        if (!user) return res.status(404).json({ error: "User not found" });

        res.json({ history: user.loginHistory });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

module.exports = router;
