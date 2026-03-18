const rateLimit = require('express-rate-limit');

const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 5,
  validate: { xForwardedForHeader: false },
  message: { message: 'Too many login attempts. Please try again in 15 minutes.' }
});

const otpLimiter = rateLimit({
  windowMs: 10 * 60 * 1000,
  max: 3,
  validate: { xForwardedForHeader: false },
  message: { message: 'Too many OTP attempts. Please try again later.' }
});

module.exports = { loginLimiter, otpLimiter };