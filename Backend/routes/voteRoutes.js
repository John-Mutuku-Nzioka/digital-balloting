const express = require('express');
const router  = express.Router();
const { verifyToken, requireVoter } = require('../middleware/authMiddleware');
const { getBallot, submitVote, changePassword } = require('../controllers/voteController');
const { validate, voteSubmitRules } = require('../middleware/validator');

router.use(verifyToken, requireVoter);

router.get('/ballot',                           getBallot);
router.post('/submit', voteSubmitRules, validate, submitVote);
router.post('/change-password', verifyToken, requireVoter, changePassword);

module.exports = router;
