const express = require('express');
const router  = express.Router();
const { voterLogin, verifyOTP, adminLogin } = require('../controllers/authController');
const { loginLimiter, otpLimiter }          = require('../middleware/rateLimiter');
const {
  validate,
  voterLoginRules,
  adminLoginRules,
  otpRules
} = require('../middleware/validator');

router.post('/voter-login',
  loginLimiter,
  voterLoginRules,
  validate,
  voterLogin
);

router.post('/verify-otp',
  otpLimiter,
  otpRules,
  validate,
  verifyOTP
);

router.post('/admin-login',
  loginLimiter,
  adminLoginRules,
  validate,
  adminLogin
);

module.exports = router;