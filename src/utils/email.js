'use strict';

const nodemailer = require('nodemailer');

let transporter = null;

function getTransporter() {
  if (!transporter) {
    transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: parseInt(process.env.SMTP_PORT || '587', 10),
      secure: process.env.SMTP_PORT === '465',
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      },
    });
  }
  return transporter;
}

/**
 * Send a password reset email.
 * @param {string} toEmail
 * @param {string} name
 * @param {string} resetUrl - Full URL with token
 */
async function sendPasswordResetEmail(toEmail, name, resetUrl) {
  const transport = getTransporter();
  const expiresMinutes = 60;

  await transport.sendMail({
    from: `"NestQuest" <${process.env.SMTP_FROM || 'no-reply@nestquest.com'}>`,
    to: toEmail,
    subject: 'Reset your NestQuest password',
    text: `
Hi ${name},

You requested a password reset for your NestQuest account.

Click the link below to reset your password (expires in ${expiresMinutes} minutes):

${resetUrl}

If you didn't request this, you can safely ignore this email.

Best,
The NestQuest Team
    `.trim(),
    html: `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <style>
    body { font-family: -apple-system, sans-serif; color: #333; margin: 0; padding: 0; }
    .container { max-width: 560px; margin: 40px auto; padding: 32px; }
    .logo { font-size: 24px; font-weight: 700; color: #10b981; margin-bottom: 32px; }
    h1 { font-size: 20px; margin-bottom: 16px; }
    p { line-height: 1.6; margin-bottom: 16px; }
    .btn { display: inline-block; padding: 14px 28px; background: #10b981; color: #fff; border-radius: 8px; text-decoration: none; font-weight: 600; margin: 16px 0; }
    .footer { margin-top: 32px; font-size: 12px; color: #999; }
  </style>
</head>
<body>
  <div class="container">
    <div class="logo">NestQuest</div>
    <h1>Reset your password</h1>
    <p>Hi ${name},</p>
    <p>You requested a password reset for your NestQuest account. Click the button below to set a new password. This link expires in <strong>${expiresMinutes} minutes</strong>.</p>
    <a href="${resetUrl}" class="btn">Reset Password</a>
    <p>Or copy this link into your browser:<br><small>${resetUrl}</small></p>
    <p>If you didn't request this, you can safely ignore this email — your password won't change.</p>
    <div class="footer">© ${new Date().getFullYear()} NestQuest. All rights reserved.</div>
  </div>
</body>
</html>
    `.trim(),
  });
}

/**
 * Send a booking confirmation email.
 * @param {string} toEmail
 * @param {object} booking
 */
async function sendBookingConfirmationEmail(toEmail, booking) {
  const transport = getTransporter();

  await transport.sendMail({
    from: `"NestQuest" <${process.env.SMTP_FROM || 'no-reply@nestquest.com'}>`,
    to: toEmail,
    subject: `Viewing confirmed — ${booking.property?.title || 'Your Property'} (${booking.reference})`,
    html: `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <style>
    body { font-family: -apple-system, sans-serif; color: #333; }
    .container { max-width: 560px; margin: 40px auto; padding: 32px; }
    .logo { font-size: 24px; font-weight: 700; color: #10b981; margin-bottom: 32px; }
    .card { background: #f8fafc; border-radius: 12px; padding: 24px; margin: 24px 0; }
    .label { font-size: 12px; color: #6b7280; text-transform: uppercase; letter-spacing: 0.05em; }
    .value { font-size: 16px; font-weight: 600; margin-top: 4px; margin-bottom: 16px; }
    .reference { font-size: 24px; font-weight: 700; color: #10b981; letter-spacing: 0.05em; }
  </style>
</head>
<body>
  <div class="container">
    <div class="logo">NestQuest</div>
    <h1>Your viewing is confirmed!</h1>
    <p>Hi ${booking.guestDetails?.name},</p>
    <p>We've confirmed your property viewing. Here are the details:</p>
    <div class="card">
      <div class="label">Reference</div>
      <div class="reference">${booking.reference}</div>
      <div class="label">Property</div>
      <div class="value">${booking.property?.title}</div>
      <div class="label">Address</div>
      <div class="value">${booking.property?.address}</div>
      <div class="label">Date</div>
      <div class="value">${booking.date}</div>
      <div class="label">Time</div>
      <div class="value">${booking.slot}</div>
    </div>
    <p>If you need to cancel or reschedule, please log into your NestQuest account.</p>
    <div style="margin-top: 32px; font-size: 12px; color: #999;">© ${new Date().getFullYear()} NestQuest.</div>
  </div>
</body>
</html>
    `.trim(),
  });
}

module.exports = {
  sendPasswordResetEmail,
  sendBookingConfirmationEmail,
};
