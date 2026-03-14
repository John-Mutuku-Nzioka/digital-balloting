const { sendOTP } = require('./utils/emailService');

async function test() {
  try {
    await sendOTP('joshmasinde420@gmail.com', '450221');
    console.log('✅ Email sent successfully!');
  } catch (err) {
    console.error('❌ Email error:', err.message);
  }
  process.exit();
}

test();