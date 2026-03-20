const express = require("express");
const router = express.Router();
const axios = require("axios");
const connect = require("../db");
const Subscription = require("../Model/Subscription");
const User = require("../Model/User");
 
const { getPayPalAccessToken, getISTTime, isPaymentWindowOpen, PAYPAL_API } = require("../utils/paypal");


const checkPaymentTime = (req, res, next) => {
    if (!isPaymentWindowOpen()) {
        return res.status(403).json({
            error: "Payments are only allowed between 11:00 AM and 5:00 PM IST",
            currentISTHour: getISTTime().getHours()
        });
    }
    next();
};
 
 
router.post("/create-paypal-order", checkPaymentTime, async (req, res) => {
    try {
        const { amount, amountINR, plan, userId } = req.body;
        if (!amount || !plan || !userId) {
            return res.status(400).json({ error: "Missing required fields: amount, plan, userId" });
        }

        const usdAmount = parseFloat(amount).toFixed(2);

        if (parseFloat(usdAmount) < 1.00) {
            return res.status(400).json({ error: "Minimum PayPal amount is $1.00" });
        }

        console.log(`[PayPal] Creating order: Plan=${plan}, USD=${usdAmount}, INR=${amountINR || 'N/A'}`);

        const accessToken = await getPayPalAccessToken();

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


router.post("/capture-paypal-order", async (req, res) => {
    try {
        await connect();
        const { orderID, userId, plan, amount } = req.body;

        if (!orderID || !userId || !plan || !amount) {
            return res.status(400).json({ error: "Missing required fields" });
        }
        const accessToken = await getPayPalAccessToken();

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

        await Subscription.create({
            user: userId,
            plan,
            amount,
            paymentId: paymentId,
            orderId: orderID,
            paymentGateway: "paypal",
            status: "active",
            validUntil: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) 
        });

        await User.findByIdAndUpdate(userId, {
            "subscription.plan": plan,
            "subscription.paymentDate": new Date(),
            "subscription.usageCount": 0 
        });
        const { sendInvoiceMail } = require("../utils/mailer");
        const user = await User.findById(userId);
        if (user && user.email) {
            await sendInvoiceMail(user.email, {
                userName: user.userName || user.name || "Subscriber",
                planName: plan,
                amount: amount,
                date: new Date().toLocaleDateString("en-IN"),
                invoiceId: paymentId
            });
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

router.get("/check-limit/:userId", async (req, res) => {
    try {
        await connect();
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
 
router.get("/status/:userId", async (req, res) => {
    try {
        await connect();
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
 
router.get("/payment-window", (req, res) => {
    const isOpen = isPaymentWindowOpen();
    const istTime = getISTTime();
    const hour = istTime.getHours();

    res.json({
        isOpen,
        currentHour: hour,
        message: isOpen
            ? "Payment window is open (11:00 AM - 5:00 PM IST)"
            : "Payment window is closed. Payments are only allowed between 11:00 AM - 5:00 PM IST."
    });
});

module.exports = router;
