const nodemailer = require("nodemailer");

const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST || "smtp.gmail.com",
    port: Number(process.env.SMTP_PORT) || 587,
    secure: false,
    auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
    },
});

const sendMail = async (to, subject, html) => {
    try {
        const info = await transporter.sendMail({
            from: process.env.MAIL_FROM || '"InternArea Security" <no-reply@internarea.com>',
            to,
            subject,
            html,
        });
        console.log(`[MAIL] Message sent: ${info.messageId}`);
        return true;
    } catch (error) {
        console.error(`[MAIL ERROR] ${error}`);
        return false;
    }
};

const sendOtpMail = async (email, otp) => {
    const html = `
    <h2>Security Verification</h2>
    <p>Your OTP is:</p>
    <h1>${otp}</h1>
    <p>Valid for 5 minutes.</p>
  `;
    return await sendMail(email, "Login Security OTP", html);
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
