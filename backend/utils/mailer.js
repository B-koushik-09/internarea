const { MailtrapClient } = require("mailtrap");

// Initialize Mailtrap Client
const TOKEN = process.env.MAILTRAP_TOKEN;
const ENDPOINT = "https://send.api.mailtrap.io/";

const client = new MailtrapClient({ token: TOKEN, endpoint: ENDPOINT });

console.log("[MAIL] Initializing Mailtrap API...");
console.log("[MAIL] MAILTRAP_TOKEN:", TOKEN ? "Set ✓" : "NOT SET ❌");

const sendMail = async (to, subject, html) => {
    console.log(`[MAIL] Sending email to: ${to}`);

    if (!TOKEN) {
        console.error("[MAIL] ❌ MAILTRAP_TOKEN not configured");
        return false;
    }

    const sender = {
        email: "mailtrap@demomailtrap.com", // Default sender for free tier
        name: "InternArea Security",
    };

    const recipients = [
        {
            email: to,
        }
    ];

    try {
        const response = await client.send({
            from: sender,
            to: recipients,
            subject: subject,
            html: html,
            category: "OTP Verification",
        });

        console.log(`[MAIL] ✅ Sent via Mailtrap! Success: ${response.success}`);
        return true;
    } catch (error) {
        console.error(`[MAIL] ❌ Mailtrap Failed:`, error);
        return false;
    }
};

const sendOtpMail = async (email, otp) => {
    const html = `
        <h2>Security Verification</h2>
        <p>Your OTP is:</p>
        <h1 style="font-size: 32px; letter-spacing: 5px; color: #2563eb;">${otp}</h1>
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
