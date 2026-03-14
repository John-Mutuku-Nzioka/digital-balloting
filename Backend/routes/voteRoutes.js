const express = require('express');
const router  = express.Router();
const { verifyToken, requireVoter } = require('../middleware/authMiddleware');
const { getBallot, submitVote }     = require('../controllers/voteController');
const { validate, voteSubmitRules } = require('../middleware/validator');

router.use(verifyToken, requireVoter);

router.get('/ballot',                           getBallot);
router.post('/submit', voteSubmitRules, validate, submitVote);

module.exports = router;
