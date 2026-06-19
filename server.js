const express = require('express');
const cors = require('cors');
const path = require('path');
require('dotenv').config();

const { initializeDatabase } = require('./db');

const app = express();

// ── Middleware ────────────────────────────────────────────────
app.use(cors());
app.use(express.json());

// Serve static frontend files from /public
app.use(express.static(path.join(__dirname, 'public')));

// ── API Routes ───────────────────────────────────────────────
app.use('/api', require('./routes/auth'));
app.use('/api/tasks', require('./routes/tasks'));

// ── Fallback: serve index.html for any non-API route ─────────
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// ── Connect to MySQL and start server ────────────────────────
const PORT = process.env.PORT || 5000;

initializeDatabase()
  .then(() => {
    console.log('✅ Connected to MySQL — database and tables ready');
    app.listen(PORT, () => {
      console.log(`🚀 TaskFlow server running on http://localhost:${PORT}`);
    });
  })
  .catch((err) => {
    console.error('❌ MySQL connection error:', err.message);
    process.exit(1);
  });
