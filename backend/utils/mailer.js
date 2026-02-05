const { Resend } = require('resend');

const resend = new Resend(process.env.RESEND_API_KEY);

console.log("[MAIL] Using Resend HTTP API");
console.log("[MAIL] RESEND_API_KEY:", process.env.RESEND_API_KEY ? "Set ✓" : "NOT SET ❌");

const sendMail = async (to, subject, html) => {
    console.log(`[MAIL] Sending email to: ${to}`);
    try {
        const { data, error } = await resend.emails.send({
            from: "InternArea <onboarding@resend.dev>",
            to: [to],
            subject: subject,
            html: html,
        });

        if (error) {
            console.error(`[MAIL] ❌ Failed:`, error.message);
            return false;
        }

        console.log(`[MAIL] ✅ Sent! ID: ${data.id}`);
        return true;
    } catch (error) {
        console.error(`[MAIL] ❌ Error:`, error.message);
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
