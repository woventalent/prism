const router = require('express').Router();
const pool   = require('../db');
const { authenticate, authorize } = require('../middleware/auth');

router.use(authenticate);

// ── GET /api/knowledge/:section ─────── all authed users ─────
router.get('/:section', async (req, res) => {
  try {
    const { rows } = await pool.query(
      'SELECT data FROM knowledge_base WHERE section = $1', [req.params.section]
    );
    res.json(rows[0]?.data ?? null);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

// ── PUT /api/knowledge/:section ─── admin + recruiter ────────
router.put('/:section', authorize('admin', 'recruiter'), async (req, res) => {
  try {
    const { rows } = await pool.query(`
      INSERT INTO knowledge_base (section, data)
      VALUES ($1, $2::jsonb)
      ON CONFLICT (section)
      DO UPDATE SET data = $2::jsonb, updated_at = NOW()
      RETURNING data
    `, [req.params.section, JSON.stringify(req.body)]);
    res.json(rows[0].data);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;
