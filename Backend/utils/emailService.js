require('dotenv').config();

async function sendOTP(toEmail, otpCode) {
  const response = await fetch('https://api.brevo.com/v3/smtp/email', {
    method: 'POST',
    headers: {
      'accept': 'application/json',
      'api-key': process.env.BREVO_API_KEY,
      'content-type': 'application/json'
    },
    body: JSON.stringify({
      sender: {
        name: 'Digital Balloting System',
        email: process.env.EMAIL_USER
      },
      to: [{ email: toEmail }],
      subject: 'Your OTP Code - Digital Balloting System',
      htmlContent: `
        <div style="font-family: Arial, sans-serif; max-width: 400px; margin: 0 auto;">
          <h2 style="color: #1a1a2e;">Your One-Time Password</h2>
          <p>Use the code below to complete your login:</p>
          <h1 style="color: #c9a84c; letter-spacing: 8px; font-size: 36px;">${otpCode}</h1>
          <p>This code is valid for <strong>10 minutes</strong>.</p>
          <p style="color: #999; font-size: 12px;">If you did not request this, please ignore this email.</p>
        </div>
      `
    })
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(`Brevo API error: ${JSON.stringify(error)}`);
  }

  return await response.json();
}

module.exports = { sendOTP };
