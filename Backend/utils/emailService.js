const nodemailer = require('nodemailer');
require('dotenv').config();

const transporter = nodemailer.createTransport({
  host: process.env.EMAIL_HOST,
  port: process.env.EMAIL_PORT,
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS
  }
});

async function sendOTP(toEmail, otpCode) {
  await transporter.sendMail({
    from: `"Digital Balloting System" <johnnzioka803@gmail.com>`,
    to: toEmail,
    subject: 'Your OTP Code - Digital Balloting System',
    html: `
      <h2>Your One-Time Password</h2>
      <p>Use the code below to complete your login:</p>
      <h1 style="color:#1a73e8; letter-spacing:8px">${otpCode}</h1>
      <p>This code is valid for <strong>10 minutes</strong>.</p>
      <p>If you did not request this, please ignore this email.</p>
    `
  });
}

module.exports = { sendOTP };