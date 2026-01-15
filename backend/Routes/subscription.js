const express = require("express");
const router = express.Router();
const Subscription = require("../Model/Subscription");
const User = require("../Model/User");
const Razorpay = require("razorpay");

const getISTTime = () => {
    const now = new Date();
    const utc = now.getTime() + (now.getTimezoneOffset() * 60000);
    return new Date(utc + (3600000 * 5.5));
};

const checkPaymentTime = (req, res, next) => {
    const istTime = getISTTime();
    const hour = istTime.getHours();
    if (hour !== 10) {
        return res.status(403).json({ error: "Payments are only allowed between 10:00 AM and 11:00 AM IST" });
    }
    next();
};
const razorpay = new Razorpay({
    key_id: process.env.RAZORPAY_KEY_ID || "rzp_test_mock",
    key_secret: process.env.RAZORPAY_KEY_SECRET || "mock_secret"
});

router.post("/create-order", checkPaymentTime, async (req, res) => {
    try {
        const { amount, currency = "INR" } = req.body;
        const options = {
            amount: amount * 100,
            currency,
            receipt: `receipt_${Date.now()}`
        };
        let order;
        if (process.env.RAZORPAY_KEY_ID) {
            order = await razorpay.orders.create(options);
        } else {
            order = { ...options, id: `order_${Date.now()}` };
        }

        res.json(order);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});
router.post("/verify-payment", async (req, res) => {
    try {
        const { razorpay_order_id, razorpay_payment_id, razorpay_signature, userId, plan, amount } = req.body;

        await Subscription.create({
            user: userId,
            plan,
            amount,
            paymentId: razorpay_payment_id,
            orderId: razorpay_order_id,
            status: "active",
            validUntil: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) // 30 days
        });

        // Update user's subscription and reset usage count
        await User.findByIdAndUpdate(userId, {
            "subscription.plan": plan,
            "subscription.paymentDate": new Date(),
            "subscription.usageCount": 0 // Reset monthly usage on new subscription
        });

        const { sendInvoiceMail } = require("../utils/mailer");
        const user = await User.findById(userId);
        if (user && user.email) {
            await sendInvoiceMail(user.email, plan, amount, razorpay_payment_id);
            console.log(`[INVOICE] Email sent to user ${user.email} for plan ${plan}`);
        }

        res.json({ status: "success", plan });
    } catch (err) {
        res.status(500).json({ error: err.message });
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

module.exports = router;
