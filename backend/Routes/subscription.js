const express = require("express");
const router = express.Router();
const axios = require("axios");
const Subscription = require("../Model/Subscription");
const User = require("../Model/User");

// ✅ PayPal Configuration - Fixed according to best practices
// NO fallback to "sb" - must have real credentials
const PAYPAL_CLIENT_ID = process.env.PAYPAL_CLIENT_ID;
const PAYPAL_CLIENT_SECRET = process.env.PAYPAL_CLIENT_SECRET;

// Validate credentials at startup
if (!PAYPAL_CLIENT_ID || !PAYPAL_CLIENT_SECRET) {
    console.error("❌ FATAL: Missing PayPal credentials in .env file!");
    console.error("   Required: PAYPAL_CLIENT_ID, PAYPAL_CLIENT_SECRET");
    // Don't throw in module load - will break server. Log and handle in routes.
}

// Use explicit PAYPAL_MODE instead of NODE_ENV for safer control
// Set PAYPAL_MODE=sandbox in .env for testing, PAYPAL_MODE=live for production
const PAYPAL_API = process.env.PAYPAL_MODE === "live"
    ? "https://api-m.paypal.com"
    : "https://api-m.sandbox.paypal.com";

console.log(`[PayPal] Mode: ${process.env.PAYPAL_MODE || 'sandbox (default)'}, API: ${PAYPAL_API}`);


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
    // PRODUCTION: Only allow payments from 10:00 AM to 10:59 AM IST (hour === 10)
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
    try {
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
    } catch (error) {
        console.error("[PayPal] Failed to get access token:", error.response?.data || error.message);
        throw error;
    }
}

// ✅ CREATE PAYPAL ORDER ENDPOINT
// POST /api/subscription/create-paypal-order
router.post("/create-paypal-order", checkPaymentTime, async (req, res) => {
    try {
        const { amount, amountINR, plan, userId } = req.body;

        // Validate input
        if (!amount || !plan || !userId) {
            return res.status(400).json({ error: "Missing required fields: amount, plan, userId" });
        }

        // Amount is already in USD with 2 decimal places from frontend
        // Ensure proper format: "10.00" not "10"
        const usdAmount = parseFloat(amount).toFixed(2);

        // Validate minimum PayPal amount ($1.00)
        if (parseFloat(usdAmount) < 1.00) {
            return res.status(400).json({ error: "Minimum PayPal amount is $1.00" });
        }

        console.log(`[PayPal] Creating order: Plan=${plan}, USD=${usdAmount}, INR=${amountINR || 'N/A'}`);

        // Get PayPal access token
        const accessToken = await getPayPalAccessToken();

        // Create PayPal order in USD
        const orderData = {
            intent: "CAPTURE",
            purchase_units: [
                {
                    amount: {
                        currency_code: "USD",
                        value: usdAmount  // Must be string like "10.00"
                    },
                    description: `InternArea ${plan} Plan Subscription`
                }
            ],
            application_context: {
                brand_name: "InternArea",
                landing_page: "NO_PREFERENCE",
                user_action: "PAY_NOW",
                return_url: "http://localhost:3000/subscription?success=true",
                cancel_url: "http://localhost:3000/subscription?cancelled=true"
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

        console.log(`[PayPal] Order created successfully: ${response.data.id} for plan ${plan} - $${usdAmount}`);

        res.json({
            id: response.data.id,
            amount: usdAmount,
            plan: plan
        });
    } catch (err) {
        console.error("[PayPal] Create order error:", err.response?.data || err.message);
        const errorMessage = err.response?.data?.details?.[0]?.description ||
            err.response?.data?.message ||
            err.message ||
            "Failed to create PayPal order";
        res.status(500).json({ error: errorMessage });
    }
});


// ✅ CAPTURE PAYPAL ORDER ENDPOINT
// POST /api/subscription/capture-paypal-order
router.post("/capture-paypal-order", async (req, res) => {
    try {
        const { orderID, userId, plan, amount } = req.body;

        // Validate input
        if (!orderID || !userId || !plan || !amount) {
            return res.status(400).json({ error: "Missing required fields" });
        }

        // Get PayPal access token
        const accessToken = await getPayPalAccessToken();

        // Capture the order
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

        // Save subscription to database
        await Subscription.create({
            user: userId,
            plan,
            amount,
            paymentId: paymentId,
            orderId: orderID,
            paymentGateway: "paypal",
            status: "active",
            validUntil: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) // 30 days
        });

        // Update user's subscription and reset usage count
        await User.findByIdAndUpdate(userId, {
            "subscription.plan": plan,
            "subscription.paymentDate": new Date(),
            "subscription.usageCount": 0 // Reset monthly usage on new subscription
        });

        // Send invoice email
        const { sendInvoiceMail } = require("../utils/mailer");
        const user = await User.findById(userId);
        if (user && user.email) {
            await sendInvoiceMail(user.email, plan, amount, paymentId);
            console.log(`[INVOICE] Email sent to user ${user.email} for plan ${plan}`);
        }

        console.log(`[PayPal] Payment captured successfully: ${paymentId} for plan ${plan}`);

        res.json({
            status: "success",
            plan,
            paymentId,
            message: `Successfully subscribed to ${plan} plan!`
        });
    } catch (err) {
        console.error("[PayPal] Capture order error:", err.response?.data || err.message);
        res.status(500).json({ error: err.response?.data?.message || err.message });
    }
});

// ✅ CHECK APPLICATION LIMIT ENDPOINT
// GET /api/subscription/check-limit/:userId
router.get("/check-limit/:userId", async (req, res) => {
    try {
        const user = await User.findById(req.params.userId);
        if (!user) return res.status(404).json({ error: "User not found" });

        const plan = user.subscription?.plan || "Free";
        const limits = { Free: 1, Bronze: 3, Silver: 5, Gold: Infinity };
        const limit = limits[plan] || 1;

        // Count applications this month
        const startOfMonth = new Date();
        startOfMonth.setDate(1);
        startOfMonth.setHours(0, 0, 0, 0);

        const Application = require("../Model/Application");
        const monthlyCount = await Application.countDocuments({
            "user._id": req.params.userId,
            createdAt: { $gte: startOfMonth }
        });

        const canApply = limit === Infinity || monthlyCount < limit;

        res.json({
            allowed: canApply,
            used: monthlyCount,
            limit: limit === Infinity ? "Unlimited" : limit,
            plan,
            message: canApply
                ? `You can apply (${monthlyCount}/${limit === Infinity ? '∞' : limit} used this month)`
                : `Monthly limit reached (${monthlyCount}/${limit}). Upgrade your plan for more applications.`
        });
    } catch (err) {
        console.error("[check-limit] Error:", err);
        res.status(500).json({ error: err.message });
    }
});

// ✅ GET USER'S CURRENT SUBSCRIPTION
// GET /api/subscription/status/:userId
router.get("/status/:userId", async (req, res) => {
    try {
        const user = await User.findById(req.params.userId);
        if (!user) return res.status(404).json({ error: "User not found" });

        const plan = user.subscription?.plan || "Free";
        const paymentDate = user.subscription?.paymentDate;

        res.json({
            plan,
            paymentDate,
            isActive: true
        });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// ✅ CHECK PAYMENT TIME WINDOW (for frontend)
// GET /api/subscription/payment-window
router.get("/payment-window", (req, res) => {
    const istTime = getISTTime();
    const hour = istTime.getHours();
    const isOpen = hour >= 12;

    res.json({
        isOpen,
        currentHour: hour,
        message: isOpen
            ? "Payment window is open (12:00 PM - 12:00 AM IST for Testing)"
            : "Payment window is closed. Payments are only allowed between 12:00 PM - 12:00 AM IST."
    });
});

module.exports = router;
