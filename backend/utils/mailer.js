const axios = require("axios");

const TOKEN = process.env.MAILTRAP_TOKEN;

console.log("[MAIL] Using Mailtrap Email API (HTTP)");
console.log("[MAIL] MAILTRAP_TOKEN:", TOKEN ? "Set ✓" : "NOT SET ❌");

const sendMail = async (to, subject, html) => {
    if (!TOKEN) {
        console.error("[MAIL] ❌ MAILTRAP_TOKEN not configured");
        return false;
    }

    try {
        await axios.post(
            "https://send.api.mailtrap.io/api/send",
            {
                from: {
                    email: "bllkoushik@gmail.com",
                    name: "InternArea Security",
                },
                to: [{ email: to }],
                subject: subject,
                html: html,
                category: "OTP Verification",
            },
            {
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${TOKEN}`,
                },
            }
        );

        console.log(`[MAIL] ✅ Sent to ${to}`);
        return true;
    } catch (error) {
        console.error("[MAIL] ❌ Mailtrap Error:", error.response?.data || error.message);
        return false;
    }
};

const sendOtpMail = async (email, otp) => {
    const html = `
    <h2>Security Verification</h2>
    <p>Your OTP is:</p>
    <h1 style="font-size:32px;letter-spacing:5px;color:#2563eb;">${otp}</h1>
    <p>Valid for 5 minutes.</p>
  `;
    return await sendMail(email, "Login Security OTP - InternArea", html);
};

const sendInvoiceMail = async (email, plan, amount, paymentId) => {
    const html = `
    <h2>Payment Successful</h2>
    <p>Thank you for subscribing to the <strong>${plan}</strong> plan.</p>
    <p>Amount Paid: ₹${amount}</p>
    <p>Payment ID: ${paymentId}</p>
    <p>Date: ${new Date().toLocaleString()}</p>
  `;
    return await sendMail(email, "Subscription Invoice - InternArea", html);
};

module.exports = { sendOtpMail, sendInvoiceMail, sendMail };
