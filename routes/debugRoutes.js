const express = require('express');
const router = express.Router();
const db = require('../config/db');

// Debug route to check DB connectivity and users table schema.
// Only enabled when DEBUG_ALLOW=true in env to avoid exposing in production.
router.get('/db', async (req, res) => {
  if (process.env.DEBUG_ALLOW !== 'true') return res.status(404).json({ message: 'Not found' });
  try {
    // simple ping
    await db.query('SELECT 1');
    // describe users table
    const [cols] = await db.query('DESCRIBE users');
    return res.json({ ok: true, columns: cols });
  } catch (err) {
    console.error('DB debug error:', err);
    return res.status(500).json({ ok: false, error: err.message });
  }
});

module.exports = router;
