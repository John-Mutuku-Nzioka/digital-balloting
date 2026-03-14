const db = require('../config/db');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const { sendOTP } = require('../utils/emailService');
require('dotenv').config();

// ── VOTER LOGIN (Step 1: password check) ──
async function voterLogin(req, res) {
  const { reg_number, password } = req.body;
  if (!reg_number || !password)
    return res.status(400).json({ message: 'All fields are required.' });

  try {
    const [rows] = await db.query(
      'SELECT * FROM voters WHERE reg_number = ?', [reg_number]
    );
    if (rows.length === 0)
      return res.status(401).json({ message: 'Invalid credentials.' });

    const voter = rows[0];
    const match = await bcrypt.compare(password, voter.password_hash);
    if (!match)
      return res.status(401).json({ message: 'Invalid credentials.' });

    // Generate 6-digit OTP
    const otp = crypto.randomInt(100000, 999999).toString();
    const expires = new Date(Date.now() + 10 * 60 * 1000); // 10 min

    await db.query(
      'UPDATE voters SET otp_code = ?, otp_expires_at = ? WHERE voter_id = ?',
      [otp, expires, voter.voter_id]
    );

    await sendOTP(voter.email, otp);

    // Log the action
    await db.query(
      'INSERT INTO audit_logs (user_id, user_type, action_type, details, ip_address) VALUES (?,?,?,?,?)',
      [voter.voter_id, 'voter', 'LOGIN_ATTEMPT', 'OTP sent', req.ip]
    );

    res.json({ message: 'OTP sent to your email.', voter_id: voter.voter_id });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error.' });
  }
}

// ── VOTER OTP VERIFY (Step 2: issue JWT) ──
async function verifyOTP(req, res) {
  const { voter_id, otp } = req.body;
  if (!voter_id || !otp)
    return res.status(400).json({ message: 'All fields are required.' });

  try {
    const [rows] = await db.query(
      'SELECT * FROM voters WHERE voter_id = ?', [voter_id]
    );
    if (rows.length === 0)
      return res.status(404).json({ message: 'Voter not found.' });

    const voter = rows[0];

    if (voter.otp_code !== otp)
      return res.status(401).json({ message: 'Invalid OTP.' });

    if (new Date() > new Date(voter.otp_expires_at))
      return res.status(401).json({ message: 'OTP has expired.' });

    // Clear OTP after use
    await db.query(
      'UPDATE voters SET otp_code = NULL, otp_expires_at = NULL WHERE voter_id = ?',
      [voter.voter_id]
    );

    const token = jwt.sign(
      { id: voter.voter_id, role: 'voter', email: voter.email },
      process.env.JWT_SECRET,
      { expiresIn: '30m' }
    );

    await db.query(
      'INSERT INTO audit_logs (user_id, user_type, action_type, details, ip_address) VALUES (?,?,?,?,?)',
      [voter.voter_id, 'voter', 'LOGIN_SUCCESS', 'OTP verified', req.ip]
    );

    res.json({ message: 'Login successful.', token, name: voter.name });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error.' });
  }
}

// ── ADMIN LOGIN ──
async function adminLogin(req, res) {
  const { email, password } = req.body;
  if (!email || !password)
    return res.status(400).json({ message: 'All fields are required.' });

  try {
    const [rows] = await db.query(
      'SELECT * FROM admins WHERE email = ?', [email]
    );
    if (rows.length === 0)
      return res.status(401).json({ message: 'Invalid credentials.' });

    const admin = rows[0];
    const match = await bcrypt.compare(password, admin.password_hash);
    if (!match)
      return res.status(401).json({ message: 'Invalid credentials.' });

    const token = jwt.sign(
      { id: admin.admin_id, role: 'admin', email: admin.email },
      process.env.JWT_SECRET,
      { expiresIn: '30m' }
    );

    await db.query(
      'INSERT INTO audit_logs (user_id, user_type, action_type, details, ip_address) VALUES (?,?,?,?,?)',
      [admin.admin_id, 'admin', 'ADMIN_LOGIN', 'Admin logged in', req.ip]
    );

    res.json({ message: 'Login successful.', token, name: admin.name });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error.' });
  }
}

module.exports = { voterLogin, verifyOTP, adminLogin };