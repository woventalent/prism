const router = require('express').Router();
const pool   = require('../db');
const { authenticate, requireClientAccess, requireClientAdmin } = require('../middleware/auth');

router.use(authenticate);
router.use(requireClientAccess);

// ── GET /api/knowledge/:section ─── any workspace member ─────
router.get('/:section', async (req, res) => {
  try {
    const { rows } = await pool.query(
      'SELECT data FROM knowledge_base WHERE section = $1 AND client_id = $2',
      [req.params.section, req.clientId]
    );
    res.json(rows[0]?.data ?? null);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

// ── PUT /api/knowledge/:section ─── workspace admin only ─────
router.put('/:section', requireClientAdmin, async (req, res) => {
  try {
    const { rows } = await pool.query(`
      INSERT INTO knowledge_base (section, client_id, data)
      VALUES ($1, $2, $3::jsonb)
      ON CONFLICT (client_id, section)
      DO UPDATE SET data = $3::jsonb, updated_at = NOW()
      RETURNING data
    `, [req.params.section, req.clientId, JSON.stringify(req.body)]);
    res.json(rows[0].data);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;
