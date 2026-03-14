const { body, validationResult } = require('express-validator');

// Return errors if validation fails
function validate(req, res, next) {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      message: errors.array()[0].msg
    });
  }
  next();
}

// Voter login rules
const voterLoginRules = [
  body('reg_number')
    .trim()
    .notEmpty().withMessage('Registration number is required.')
    .isLength({ max: 50 }).withMessage('Invalid registration number.'),
  body('password')
    .notEmpty().withMessage('Password is required.')
    .isLength({ max: 100 }).withMessage('Invalid password.')
];

// Admin login rules
const adminLoginRules = [
  body('email')
    .trim()
    .notEmpty().withMessage('Email is required.')
    .isEmail().withMessage('Invalid email address.'),
  body('password')
    .notEmpty().withMessage('Password is required.')
    .isLength({ max: 100 }).withMessage('Invalid password.')
];

// OTP rules
const otpRules = [
  body('voter_id')
    .notEmpty().withMessage('Voter ID is required.')
    .isInt().withMessage('Invalid voter ID.'),
  body('otp')
    .trim()
    .notEmpty().withMessage('OTP is required.')
    .isLength({ min: 6, max: 6 }).withMessage('OTP must be 6 digits.')
    .isNumeric().withMessage('OTP must contain only numbers.')
];

// Register voter rules
const registerVoterRules = [
  body('name')
    .trim()
    .notEmpty().withMessage('Name is required.')
    .isLength({ max: 100 }).withMessage('Name too long.'),
  body('reg_number')
    .trim()
    .notEmpty().withMessage('Registration number is required.')
    .isLength({ max: 50 }).withMessage('Registration number too long.'),
  body('email')
    .trim()
    .notEmpty().withMessage('Email is required.')
    .isEmail().withMessage('Invalid email address.'),
  body('password')
    .notEmpty().withMessage('Password is required.')
    .isLength({ min: 8 }).withMessage('Password must be at least 8 characters.')
];

// Create election rules
const createElectionRules = [
  body('title')
    .trim()
    .notEmpty().withMessage('Election title is required.')
    .isLength({ max: 200 }).withMessage('Title too long.'),
  body('start_datetime')
    .notEmpty().withMessage('Start date is required.')
    .isISO8601().withMessage('Invalid start date format.'),
  body('end_datetime')
    .notEmpty().withMessage('End date is required.')
    .isISO8601().withMessage('Invalid end date format.')
];

// Vote submission rules
const voteSubmitRules = [
  body('election_id')
    .notEmpty().withMessage('Election ID is required.')
    .isInt().withMessage('Invalid election ID.'),
  body('votes')
    .isArray({ min: 1 }).withMessage('Votes must be a non-empty array.'),
  body('votes.*.position_id')
    .isInt().withMessage('Invalid position ID.'),
  body('votes.*.candidate_id')
    .isInt().withMessage('Invalid candidate ID.')
];

module.exports = {
  validate,
  voterLoginRules,
  adminLoginRules,
  otpRules,
  registerVoterRules,
  createElectionRules,
  voteSubmitRules
};