const express = require('express');
const router = express.Router();
const { verifyToken, requireAdmin } = require('../middleware/authMiddleware');
const { getResults } = require('../controllers/resultsController');

router.get('/:election_id', verifyToken, requireAdmin, getResults);

module.exports = router;