const { BrevoClient } = require("@getbrevo/brevo");

const brevo = new BrevoClient({
  apiKey: process.env.BREVO_API_KEY,
});

// ─── Base sender ───────────────────────────────────────────
const sendMail = async ({ to, subject, html }) => {
  try {
    await brevo.transactionalEmails.sendTransacEmail({
      subject: subject,
      htmlContent: html,
      sender: {
        name: "Internshala Clone",
        email: process.env.MAIL_FROM,
      },
      to: [{ email: to }],
    });
    
    console.log("✅ Email sent to:", to);
    return { success: true };

  } catch (error) {
    console.error("❌ Email error:", error.message);
    return { success: false, error };
  }
};

// ─── OTP Mail ──────────────────────────────────────────────
const sendOTPMail = async (toEmail, otp) => {
  return sendMail({
    to: toEmail,
    subject: "Your OTP Verification Code",
    html: `
      <div style="font-family:Arial,sans-serif;max-width:420px;margin:auto;
                  padding:24px;border:1px solid #e0e0e0;border-radius:10px;">
        <h2 style="color:#4F46E5;">OTP Verification</h2>
        <p>Your one-time password is:</p>
        <h1 style="letter-spacing:10px;color:#111;">${otp}</h1>
        <p>Valid for <strong>10 minutes</strong> only.</p>
        <p style="color:#aaa;font-size:12px;">
          If you didn't request this, ignore this email.
        </p>
      </div>`,
  });
};

// ─── Password Reset Mail ───────────────────────────────────
const sendPasswordResetMail = async (toEmail, newPassword) => {
  return sendMail({
    to: toEmail,
    subject: "Your Password Has Been Reset",
    html: `
      <div style="font-family:Arial,sans-serif;max-width:420px;margin:auto;
                  padding:24px;border:1px solid #e0e0e0;border-radius:10px;">
        <h2 style="color:#4F46E5;">Password Reset</h2>
        <p>Your new temporary password is:</p>
        <h2 style="background:#f3f4f6;padding:10px 20px;border-radius:6px;
                   letter-spacing:3px;">${newPassword}</h2>
        <p>Please log in and change this password immediately.</p>
      </div>`,
  });
};

// ─── Invoice Mail ──────────────────────────────────────────
const sendInvoiceMail = async (toEmail, { userName, planName, amount, date, invoiceId }) => {
  return sendMail({
    to: toEmail,
    subject: `Invoice - ${planName} Plan Activated`,
    html: `
      <div style="font-family:Arial,sans-serif;max-width:500px;margin:auto;
                  padding:24px;border:1px solid #e0e0e0;border-radius:10px;">
        <h2 style="color:#4F46E5;">Payment Successful 🎉</h2>
        <p>Hi <strong>${userName}</strong>, your subscription is now active.</p>
        <hr/>
        <table width="100%">
          <tr style="background:#f9fafb;">
            <td style="padding:8px;"><strong>Invoice ID</strong></td>
            <td style="padding:8px;">${invoiceId}</td>
          </tr>
          <tr>
            <td style="padding:8px;"><strong>Plan</strong></td>
            <td style="padding:8px;">${planName}</td>
          </tr>
          <tr style="background:#f9fafb;">
            <td style="padding:8px;"><strong>Amount</strong></td>
            <td style="padding:8px;">₹${amount}</td>
          </tr>
          <tr>
            <td style="padding:8px;"><strong>Date</strong></td>
            <td style="padding:8px;">${date}</td>
          </tr>
        </table>
      </div>`,
  });
};

// ─── Login OTP Mail ────────────────────────────────────────
const sendLoginOTPMail = async (toEmail, { otp, browser, device, ip }) => {
  return sendMail({
    to: toEmail,
    subject: "Login Verification OTP",
    html: `
      <div style="font-family:Arial,sans-serif;max-width:420px;margin:auto;
                  padding:24px;border:1px solid #e0e0e0;border-radius:10px;">
        <h2 style="color:#4F46E5;">Login Attempt Detected</h2>
        <ul style="background:#f9fafb;padding:14px 20px;border-radius:6px;">
          <li><strong>Browser:</strong> ${browser}</li>
          <li><strong>Device:</strong> ${device}</li>
          <li><strong>IP:</strong> ${ip}</li>
        </ul>
        <p>Your OTP is:</p>
        <h1 style="letter-spacing:10px;color:#111;">${otp}</h1>
        <p>Valid for <strong>10 minutes</strong>.</p>
      </div>`,
  });
};

module.exports = {
  sendMail,
  sendOTPMail,
  sendPasswordResetMail,
  sendInvoiceMail,
  sendLoginOTPMail,
};