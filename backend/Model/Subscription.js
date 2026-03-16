const mongoose = require("mongoose");

const subscriptionSchema = new mongoose.Schema({
    user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    plan: { type: String, enum: ["Free", "Bronze", "Silver", "Gold"], required: true },
    amount: Number,
    paymentId: String,
    orderId: String,
    paymentGateway: { type: String, default: "paypal" },
    invoiceUrl: String,
    status: { type: String, enum: ["active", "expired"], default: "active" },
    validUntil: Date
}, { timestamps: true });

module.exports = mongoose.model("Subscription", subscriptionSchema);
