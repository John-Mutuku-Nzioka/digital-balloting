const db = require('../config/db');
const crypto = require('crypto');
const { encrypt } = require('../utils/encryption');
const bcrypt = require('bcryptjs');

// ── GET ACTIVE BALLOT FOR VOTER ──
async function getBallot(req, res) {
  try {
    const [elections] = await db.query(
      "SELECT * FROM elections WHERE status = 'active' LIMIT 1"
    );
    if (elections.length === 0)
      return res.status(404).json({ message: 'No active election found.' });

    const election = elections[0];

    // Check if voter already voted
    const [voter] = await db.query(
      'SELECT voted_flag FROM voters WHERE voter_id = ?', [req.user.id]
    );
    if (voter[0].voted_flag === 1)
      return res.status(403).json({ message: 'You have already voted.' });

    const [positions] = await db.query(
      'SELECT * FROM positions WHERE election_id = ?', [election.election_id]
    );

    for (let pos of positions) {
      const [candidates] = await db.query(
        'SELECT candidate_id, name, description FROM candidates WHERE position_id = ?',
        [pos.position_id]
      );
      pos.candidates = candidates;
    }

    res.json({ election, positions });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error.' });
  }
}

// ── SUBMIT VOTE ──
// votes = [{ position_id, candidate_id }, ...]
async function submitVote(req, res) {
  const { election_id, votes } = req.body;
  if (!election_id || !votes || !Array.isArray(votes))
    return res.status(400).json({ message: 'Invalid vote data.' });

  const conn = await db.getConnection();
  try {
    await conn.beginTransaction();

    // Check voter hasn't voted
    const [voter] = await conn.query(
      'SELECT voted_flag FROM voters WHERE voter_id = ? FOR UPDATE', [req.user.id]
    );
    if (voter[0].voted_flag === 1) {
      await conn.rollback();
      return res.status(403).json({ message: 'You have already voted.' });
    }

    // Check election is still active
    const [election] = await conn.query(
      "SELECT * FROM elections WHERE election_id = ? AND status = 'active'",
      [election_id]
    );
    if (election.length === 0) {
      await conn.rollback();
      return res.status(400).json({ message: 'Election is not active.' });
    }

    // Insert each vote encrypted
    for (const vote of votes) {
      const transaction_id = crypto.randomUUID();
      const voteData = JSON.stringify({
        candidate_id: vote.candidate_id,
        position_id: vote.position_id
      });
      const encryptedVote = encrypt(voteData);

      await conn.query(
        'INSERT INTO votes (transaction_id, election_id, position_id, encrypted_vote) VALUES (?,?,?,?)',
        [transaction_id, election_id, vote.position_id, encryptedVote]
      );
    }

    // Mark voter as voted
    await conn.query(
      'UPDATE voters SET voted_flag = 1 WHERE voter_id = ?', [req.user.id]
    );

    // Audit log
    await conn.query(
      'INSERT INTO audit_logs (user_id, user_type, action_type, details, ip_address) VALUES (?,?,?,?,?)',
      [req.user.id, 'voter', 'VOTE_CAST', `Election ${election_id}`, req.ip]
    );

    await conn.commit();
    res.json({ message: 'Vote submitted successfully.' });
  } catch (err) {
    await conn.rollback();
    console.error(err);
    res.status(500).json({ message: 'Server error.' });
  } finally {
    conn.release();
  }
}

// ── CHANGE PASSWORD ──
async function changePassword(req, res) {
  const { current_password, new_password } = req.body;
  if (!current_password || !new_password)
    return res.status(400).json({ message: 'All fields are required.' });
  if (new_password.length < 8)
    return res.status(400).json({ message: 'New password must be at least 8 characters.' });

  try {
    const [rows] = await db.query(
      'SELECT * FROM voters WHERE voter_id = ?', [req.user.id]
    );
    if (rows.length === 0)
      return res.status(404).json({ message: 'Voter not found.' });

    const match = await bcrypt.compare(current_password, rows[0].password_hash);
    if (!match)
      return res.status(401).json({ message: 'Current password is incorrect.' });

    const hash = await bcrypt.hash(new_password, 12);
    await db.query(
      'UPDATE voters SET password_hash = ? WHERE voter_id = ?',
      [hash, req.user.id]
    );

    await db.query(
      'INSERT INTO audit_logs (user_id, user_type, action_type, details, ip_address) VALUES (?,?,?,?,?)',
      [req.user.id, 'voter', 'PASSWORD_CHANGED', 'Voter changed password', req.ip]
    );

    res.json({ message: 'Password changed successfully.' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error.' });
  }
}

module.exports = { getBallot, submitVote, changePassword };