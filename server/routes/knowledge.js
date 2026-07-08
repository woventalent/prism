const router = require('express').Router();
const pool   = require('../db');
const { authenticate, requireClientAccess, requireClientAdmin } = require('../middleware/auth');

// Built-in sections whitelist
const BUILT_IN_SECTIONS = new Set(['company-profile', 'capability-report', 'domain-matrix', 'bu-planning']);
const MAX_JSONB_SIZE = 1024 * 1024; // 1MB max

// Validate section: must be built-in or a custom tab (starts with 'custom_')
function isValidSection(section) {
  if (!section) return false;
  return BUILT_IN_SECTIONS.has(section) || section.startsWith('custom_');
}

// Middleware: Validate section parameter
router.use((req, res, next) => {
  const section = req.params.section;
  if (section && !isValidSection(section)) {
    return res.status(400).json({ error: `Invalid section: ${section}. Must be one of: ${Array.from(BUILT_IN_SECTIONS).join(', ')} or a custom tab (custom_*)` });
  }
  next();
});

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
    // Validate request body is an object
    if (typeof req.body !== 'object' || req.body === null) {
      return res.status(400).json({ error: 'Request body must be a valid JSON object' });
    }

    // Check payload size before storing
    const jsonString = JSON.stringify(req.body);
    if (jsonString.length > MAX_JSONB_SIZE) {
      return res.status(400).json({ error: `Payload exceeds maximum size of ${MAX_JSONB_SIZE} bytes` });
    }

    const { rows } = await pool.query(`
      INSERT INTO knowledge_base (section, client_id, data)
      VALUES ($1, $2, $3::jsonb)
      ON CONFLICT (client_id, section)
      DO UPDATE SET data = $3::jsonb, updated_at = NOW()
      RETURNING data
    `, [req.params.section, req.clientId, jsonString]);
    res.json(rows[0].data);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;
