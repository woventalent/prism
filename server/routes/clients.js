const router = require('express').Router();
const bcrypt = require('bcryptjs');
const pool   = require('../db');
const { authenticate, requireSuperAdmin, requireClientAccess, requireClientAdmin } = require('../middleware/auth');

router.use(authenticate);

// ── GET /api/clients ──────────────────────────────────────────
// Super admin → all clients.  Regular user → their clients.
router.get('/', async (req, res) => {
  try {
    if (req.user.is_super_admin) {
      const { rows } = await pool.query(
        `SELECT c.*,
                COUNT(cu.user_id)::int AS member_count
         FROM clients c
         LEFT JOIN client_users cu ON cu.client_id = c.id
         GROUP BY c.id ORDER BY c.name`
      );
      return res.json(rows);
    }
    const { rows } = await pool.query(
      `SELECT c.*, cu.role AS my_role
       FROM clients c
       JOIN client_users cu ON cu.client_id = c.id AND cu.user_id = $1
       ORDER BY c.name`,
      [req.user.id]
    );
    res.json(rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

// ── POST /api/clients ──────────── super admin only ───────────
router.post('/', requireSuperAdmin, async (req, res) => {
  const { name, slug, description } = req.body;
  if (!name || !slug) return res.status(400).json({ error: 'name and slug are required' });
  try {
    const { rows } = await pool.query(
      `INSERT INTO clients (name, slug, description)
       VALUES ($1, $2, $3) RETURNING *`,
      [name, slug.toLowerCase().replace(/[^a-z0-9-]/g, '-'), description || '']
    );
    res.status(201).json(rows[0]);
  } catch (err) {
    if (err.code === '23505') return res.status(409).json({ error: 'Slug already exists' });
    res.status(500).json({ error: 'Server error' });
  }
});

// ── PUT /api/clients/:id ──────────── super admin only ────────
router.put('/:id', requireSuperAdmin, async (req, res) => {
  const { name, description } = req.body;
  try {
    const { rows } = await pool.query(
      `UPDATE clients SET name = COALESCE($1,name), description = COALESCE($2,description), updated_at = NOW()
       WHERE id = $3 RETURNING *`,
      [name, description, parseInt(req.params.id)]
    );
    if (!rows[0]) return res.status(404).json({ error: 'Client not found' });
    res.json(rows[0]);
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

// ── DELETE /api/clients/:id ───────── super admin only ────────
router.delete('/:id', requireSuperAdmin, async (req, res) => {
  try {
    const { rowCount } = await pool.query('DELETE FROM clients WHERE id = $1', [parseInt(req.params.id)]);
    if (!rowCount) return res.status(404).json({ error: 'Client not found' });
    res.json({ message: 'Client deleted' });
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

// ═══════════════════════════════════════════════════════════════
//  Per-client user management
// ═══════════════════════════════════════════════════════════════

// ── GET /api/clients/:id/users ────SupAdmin or clientAdmin ────
router.get('/:id/users', async (req, res) => {
  const clientId = parseInt(req.params.id);

  // validate caller has access
  if (!req.user.is_super_admin) {
    const { rows: access } = await pool.query(
      'SELECT role FROM client_users WHERE client_id=$1 AND user_id=$2',
      [clientId, req.user.id]
    );
    if (!access.length || access[0].role !== 'admin')
      return res.status(403).json({ error: 'Access denied' });
  }

  try {
    const { rows } = await pool.query(
      `SELECT u.id, u.name, u.email, u.is_super_admin, u.created_at, cu.role AS workspace_role
       FROM client_users cu
       JOIN users u ON u.id = cu.user_id
       WHERE cu.client_id = $1
       ORDER BY u.name`,
      [clientId]
    );
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

// ── POST /api/clients/:id/users ───SupAdmin or clientAdmin ────
// Body: { name, email, password, role }
// If user with email exists → add them. If not → create then add.
router.post('/:id/users', async (req, res) => {
  const clientId = parseInt(req.params.id);

  if (!req.user.is_super_admin) {
    const { rows: access } = await pool.query(
      'SELECT role FROM client_users WHERE client_id=$1 AND user_id=$2',
      [clientId, req.user.id]
    );
    if (!access.length || access[0].role !== 'admin')
      return res.status(403).json({ error: 'Access denied' });
  }

  const { name, email, password, role = 'member' } = req.body;
  if (!email) return res.status(400).json({ error: 'email is required' });
  if (!['admin','member'].includes(role)) return res.status(400).json({ error: 'Invalid role' });

  const db = await pool.connect();
  try {
    await db.query('BEGIN');

    // Find or create the user
    let { rows: [existing] } = await db.query('SELECT id FROM users WHERE email = $1', [email.toLowerCase().trim()]);
    let userId;

    if (existing) {
      userId = existing.id;
    } else {
      if (!name || !password) return res.status(400).json({ error: 'name and password required for new users' });
      const hash = await bcrypt.hash(password, 10);
      const { rows: [created] } = await db.query(
        `INSERT INTO users (name, email, password, role) VALUES ($1,$2,$3,'viewer') RETURNING id`,
        [name, email.toLowerCase().trim(), hash]
      );
      userId = created.id;
    }

    // Add / update in client_users
    await db.query(
      `INSERT INTO client_users (client_id, user_id, role) VALUES ($1,$2,$3)
       ON CONFLICT (client_id, user_id) DO UPDATE SET role = $3`,
      [clientId, userId, role]
    );

    const { rows: [user] } = await db.query(
      `SELECT u.id, u.name, u.email, u.created_at, cu.role AS workspace_role
       FROM users u JOIN client_users cu ON cu.user_id = u.id
       WHERE u.id = $1 AND cu.client_id = $2`,
      [userId, clientId]
    );

    await db.query('COMMIT');
    res.status(201).json(user);
  } catch (err) {
    await db.query('ROLLBACK');
    if (err.code === '23505') return res.status(409).json({ error: 'Email already exists' });
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  } finally {
    db.release();
  }
});

// ── PATCH /api/clients/:id/users/:uid ── change workspace role
router.patch('/:id/users/:uid', async (req, res) => {
  const clientId = parseInt(req.params.id);
  const userId   = parseInt(req.params.uid);

  if (!req.user.is_super_admin) {
    const { rows: access } = await pool.query(
      'SELECT role FROM client_users WHERE client_id=$1 AND user_id=$2',
      [clientId, req.user.id]
    );
    if (!access.length || access[0].role !== 'admin')
      return res.status(403).json({ error: 'Access denied' });
  }

  const { role } = req.body;
  if (!['admin','member'].includes(role)) return res.status(400).json({ error: 'Invalid role' });

  try {
    const { rows } = await pool.query(
      `UPDATE client_users SET role = $1 WHERE client_id = $2 AND user_id = $3 RETURNING *`,
      [role, clientId, userId]
    );
    if (!rows.length) return res.status(404).json({ error: 'User not in this workspace' });
    res.json(rows[0]);
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

// ── DELETE /api/clients/:id/users/:uid ── remove from workspace
router.delete('/:id/users/:uid', async (req, res) => {
  const clientId = parseInt(req.params.id);
  const userId   = parseInt(req.params.uid);

  if (!req.user.is_super_admin) {
    const { rows: access } = await pool.query(
      'SELECT role FROM client_users WHERE client_id=$1 AND user_id=$2',
      [clientId, req.user.id]
    );
    if (!access.length || access[0].role !== 'admin')
      return res.status(403).json({ error: 'Access denied' });
  }

  if (userId === req.user.id)
    return res.status(400).json({ error: 'Cannot remove yourself' });

  try {
    await pool.query('DELETE FROM client_users WHERE client_id=$1 AND user_id=$2', [clientId, userId]);
    res.json({ message: 'User removed from workspace' });
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;
