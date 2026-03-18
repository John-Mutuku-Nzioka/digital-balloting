const express = require('express');
const router  = express.Router();
const { verifyToken, requireAdmin } = require('../middleware/authMiddleware');
const {
  createElection, addPosition, addCandidate,
  registerVoter, getElections, activateElection,
  closeElection, getAuditLogs, getVoters
} = require('../controllers/adminController');
router.get('/voters', getVoters);
const {
  validate,
  registerVoterRules,
  createElectionRules
} = require('../middleware/validator');

router.use(verifyToken, requireAdmin);

router.post('/election',        createElectionRules, validate, createElection);
router.post('/position',        addPosition);
router.post('/candidate',       addCandidate);
router.post('/register-voter',  registerVoterRules,  validate, registerVoter);
router.get('/elections',        getElections);
router.put('/election/:election_id/activate', activateElection);
router.put('/election/:election_id/close',    closeElection);
router.get('/audit-logs',       getAuditLogs);

module.exports = router;