const db = require('../config/db');
const bcrypt = require('bcryptjs');

// ── CREATE ELECTION ──
async function createElection(req, res) {
  const { title, description, start_datetime, end_datetime } = req.body;
  if (!title || !start_datetime || !end_datetime)
    return res.status(400).json({ message: 'Title and dates are required.' });

  try {
    const [result] = await db.query(
      'INSERT INTO elections (title, description, start_datetime, end_datetime, status, created_by) VALUES (?,?,?,?,?,?)',
      [title, description, start_datetime, end_datetime, 'created', req.user.id]
    );
    res.status(201).json({ message: 'Election created.', election_id: result.insertId });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error.' });
  }
}

// ── ADD POSITION TO ELECTION ──
async function addPosition(req, res) {
  const { election_id, position_name } = req.body;
  try {
    const [result] = await db.query(
      'INSERT INTO positions (election_id, position_name) VALUES (?,?)',
      [election_id, position_name]
    );
    res.status(201).json({ message: 'Position added.', position_id: result.insertId });
  } catch (err) {
    res.status(500).json({ message: 'Server error.' });
  }
}

// ── ADD CANDIDATE ──
async function addCandidate(req, res) {
  const { position_id, name, description } = req.body;
  try {
    const [result] = await db.query(
      'INSERT INTO candidates (position_id, name, description) VALUES (?,?,?)',
      [position_id, name, description]
    );
    res.status(201).json({ message: 'Candidate added.', candidate_id: result.insertId });
  } catch (err) {
    res.status(500).json({ message: 'Server error.' });
  }
}

// ── REGISTER VOTER ──
async function registerVoter(req, res) {
  const { name, reg_number, email, password } = req.body;
  if (!name || !reg_number || !email || !password)
    return res.status(400).json({ message: 'All fields are required.' });

  try {
    const hash = await bcrypt.hash(password, 12);
    await db.query(
      'INSERT INTO voters (name, reg_number, email, password_hash) VALUES (?,?,?,?)',
      [name, reg_number, email, hash]
    );
    res.status(201).json({ message: 'Voter registered successfully.' });
  } catch (err) {
    if (err.code === 'ER_DUP_ENTRY')
      return res.status(409).json({ message: 'Voter already exists.' });
    res.status(500).json({ message: 'Server error.' });
  }
}

// ── GET ALL ELECTIONS ──
async function getElections(req, res) {
  try {
    const [rows] = await db.query('SELECT * FROM elections ORDER BY created_at DESC');
    res.json(rows);
  } catch (err) {
    res.status(500).json({ message: 'Server error.' });
  }
}

// ── ACTIVATE ELECTION ──
async function activateElection(req, res) {
  const { election_id } = req.params;
  try {
    await db.query(
      "UPDATE elections SET status = 'active' WHERE election_id = ?", [election_id]
    );
    res.json({ message: 'Election activated.' });
  } catch (err) {
    res.status(500).json({ message: 'Server error.' });
  }
}

// ── CLOSE ELECTION ──
async function closeElection(req, res) {
  const { election_id } = req.params;
  try {
    await db.query(
      "UPDATE elections SET status = 'closed' WHERE election_id = ?", [election_id]
    );
    res.json({ message: 'Election closed.' });
  } catch (err) {
    res.status(500).json({ message: 'Server error.' });
  }
}

// ── GET AUDIT LOGS ──
async function getAuditLogs(req, res) {
  try {
    const [rows] = await db.query(
      'SELECT * FROM audit_logs ORDER BY created_at DESC LIMIT 200'
    );
    res.json(rows);
  } catch (err) {
    res.status(500).json({ message: 'Server error.' });
  }
}

module.exports = {
  createElection, addPosition, addCandidate,
  registerVoter, getElections, activateElection,
  closeElection, getAuditLogs
};