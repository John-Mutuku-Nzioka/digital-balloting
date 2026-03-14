const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const path = require('path');
require('dotenv').config();

const authRoutes    = require('./routes/authRoutes');
const adminRoutes   = require('./routes/adminRoutes');
const voteRoutes    = require('./routes/voteRoutes');
const resultsRoutes = require('./routes/resultsRoutes');

const app = express();

// ── SECURITY HEADERS ──
app.use(helmet({
  contentSecurityPolicy: false // we handle this manually
}));

// ── CORS ──
app.use(cors({
  origin: ['http://localhost:3000', 'http://127.0.0.1:3000'],
  methods: ['GET', 'POST', 'PUT'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

// ── BODY PARSING ──
app.use(express.json({ limit: '10kb' })); // prevent large payload attacks
app.use(express.urlencoded({ extended: true, limit: '10kb' }));

// ── STATIC FILES ──
app.use(express.static(path.join(__dirname, '../frontend')));

// ── ROUTES ──
app.use('/api/auth',    authRoutes);
app.use('/api/admin',   adminRoutes);
app.use('/api/vote',    voteRoutes);
app.use('/api/results', resultsRoutes);

// ── 404 HANDLER ──
app.use((req, res) => {
  res.status(404).json({ message: 'Route not found.' });
});

// ── GLOBAL ERROR HANDLER ──
app.use((err, req, res, next) => {
  console.error('Unhandled error:', err.message);
  res.status(500).json({ message: 'An unexpected error occurred.' });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`✅ Server running on port ${PORT}`));