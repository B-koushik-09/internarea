const { MailtrapClient } = require("mailtrap");

const TOKEN = process.env.MAILTRAP_TOKEN;

console.log("[MAIL] Using Mailtrap SDK");
console.log("[MAIL] MAILTRAP_TOKEN:", TOKEN ? "Set ✓" : "NOT SET ❌");

const client = new MailtrapClient({ token: TOKEN });

const sender = {
    email: "hello@demomailtrap.com", // Mailtrap's verified demo sender
    name: "InternArea Security",
};

const sendMail = async (to, subject, html) => {
    if (!TOKEN) {
        console.error("[MAIL] ❌ MAILTRAP_TOKEN not configured");
        return false;
    }

    console.log(`[MAIL] Sending email to: ${to}`);

    try {
        const result = await client.send({
            from: sender,
            to: [{ email: to }],
            subject: subject,
            html: html,
            category: "OTP Verification",
        });

        console.log(`[MAIL] ✅ Sent to ${to}`);
        return true;
    } catch (error) {
        console.error("[MAIL] ❌ Mailtrap Error:", error.message || error);
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