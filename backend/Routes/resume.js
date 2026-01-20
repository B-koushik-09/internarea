const express = require("express");
const router = express.Router();
const axios = require("axios");
const Resume = require("../Model/Resume");
const User = require("../Model/User");

// ✅ PayPal Configuration
const PAYPAL_CLIENT_ID = process.env.PAYPAL_CLIENT_ID;
const PAYPAL_CLIENT_SECRET = process.env.PAYPAL_CLIENT_SECRET;
const PAYPAL_API = process.env.PAYPAL_MODE === "live"
    ? "https://api-m.paypal.com"
    : "https://api-m.sandbox.paypal.com";

// ✅ IST TIME UTILITIES
const getISTTime = () => {
    const now = new Date();
    const utc = now.getTime() + (now.getTimezoneOffset() * 60000);
    return new Date(utc + (3600000 * 5.5));
};

// ✅ PAYMENT TIME RESTRICTION MIDDLEWARE (10:00 AM - 11:00 AM IST)
const checkPaymentTime = (req, res, next) => {
    const istTime = getISTTime();
    const hour = istTime.getHours();
    if (hour !== 10) {
        return res.status(403).json({
            error: "Payments are only allowed between 10:00 AM and 11:00 AM IST",
            currentISTHour: hour
        });
    }
    next();
};

// ✅ GET PAYPAL ACCESS TOKEN
async function getPayPalAccessToken() {
    const auth = Buffer.from(`${PAYPAL_CLIENT_ID}:${PAYPAL_CLIENT_SECRET}`).toString("base64");
    const response = await axios.post(
        `${PAYPAL_API}/v1/oauth2/token`,
        "grant_type=client_credentials",
        {
            headers: {
                Authorization: `Basic ${auth}`,
                "Content-Type": "application/x-www-form-urlencoded"
            }
        }
    );
    return response.data.access_token;
}

// ✅ CREATE RESUME PAYPAL ORDER
router.post("/create-order", checkPaymentTime, async (req, res) => {
    try {
        const { amount, userId } = req.body;

        if (!amount || !userId) {
            return res.status(400).json({ error: "Missing required fields: amount, userId" });
        }

        const usdAmount = parseFloat(amount).toFixed(2);

        if (parseFloat(usdAmount) < 1.00) {
            return res.status(400).json({ error: "Minimum PayPal amount is $1.00" });
        }

        console.log(`[Resume PayPal] Creating order: USD=${usdAmount}`);

        const accessToken = await getPayPalAccessToken();

        const orderData = {
            intent: "CAPTURE",
            purchase_units: [
                {
                    amount: {
                        currency_code: "USD",
                        value: usdAmount
                    },
                    description: "InternArea Premium Resume Builder"
                }
            ],
            application_context: {
                brand_name: "InternArea",
                landing_page: "NO_PREFERENCE",
                user_action: "PAY_NOW",
                return_url: "http://localhost:3000/ResumeBuilder?success=true",
                cancel_url: "http://localhost:3000/ResumeBuilder?cancelled=true"
            }
        };

        const response = await axios.post(
            `${PAYPAL_API}/v2/checkout/orders`,
            orderData,
            {
                headers: {
                    Authorization: `Bearer ${accessToken}`,
                    "Content-Type": "application/json"
                }
            }
        );

        console.log(`[Resume PayPal] Order created: ${response.data.id}`);

        res.json({
            id: response.data.id,
            amount: usdAmount
        });
    } catch (err) {
        console.error("[Resume PayPal] Create order error:", err.response?.data || err.message);
        res.status(500).json({ error: err.response?.data?.message || err.message || "Failed to create order" });
    }
});

// ✅ CAPTURE RESUME PAYPAL ORDER
router.post("/capture-order", async (req, res) => {
    try {
        const { orderID, userId, details } = req.body;

        if (!orderID || !userId || !details) {
            return res.status(400).json({ error: "Missing required fields" });
        }

        const accessToken = await getPayPalAccessToken();

        // Capture the PayPal order
        const captureResponse = await axios.post(
            `${PAYPAL_API}/v2/checkout/orders/${orderID}/capture`,
            {},
            {
                headers: {
                    Authorization: `Bearer ${accessToken}`,
                    "Content-Type": "application/json"
                }
            }
        );

        const captureData = captureResponse.data;
        const paymentId = captureData.purchase_units?.[0]?.payments?.captures?.[0]?.id || orderID;

        console.log(`[Resume PayPal] Payment captured: ${paymentId}`);

        // Create the resume
        const newResume = await Resume.create({
            user: userId,
            details,
            paymentId
        });

        // Update user profile
        await User.findByIdAndUpdate(userId, {
            resumeAccess: true,
            $push: { resumes: newResume._id }
        });

        // Send invoice email
        const { sendMail } = require("../utils/mailer");
        const user = await User.findById(userId);
        if (user && user.email) {
            await sendMail(
                user.email,
                "InternArea Resume Builder - Payment Confirmation",
                `<h2>Thank you for your purchase!</h2>
                <p>Your premium resume has been generated successfully.</p>
                <p><strong>Payment ID:</strong> ${paymentId}</p>
                <p><strong>Amount:</strong> $1.00 USD (₹50)</p>
                <p>Your resume is now attached to your profile and will be used for future internship applications.</p>`
            );
            console.log(`[Resume] Confirmation email sent to ${user.email}`);
        }

        res.json({
            status: "success",
            paymentId,
            resume: newResume,
            message: "Resume generated and saved to profile!"
        });
    } catch (err) {
        console.error("[Resume PayPal] Capture error:", err.response?.data || err.message);
        res.status(500).json({ error: err.response?.data?.message || err.message });
    }
});

// ✅ CREATE RESUME (legacy - requires paymentId)
router.post("/create", async (req, res) => {
    try {
        const { userId, details, paymentId } = req.body;
        if (!paymentId) return res.status(400).json({ error: "Payment required" });
        const newResume = await Resume.create({
            user: userId,
            details,
            paymentId
        });
        await User.findByIdAndUpdate(userId, {
            resumeAccess: true,
            $push: { resumes: newResume._id }
        });

        res.json({ message: "Resume generated and saved", resume: newResume });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// ✅ GET MY RESUMES
router.get("/my/:userId", async (req, res) => {
    const resumes = await Resume.find({ user: req.params.userId });
    res.json(resumes);
});

module.exports = router;
