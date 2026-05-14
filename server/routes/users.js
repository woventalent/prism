const router  = require('express').Router();
const bcrypt  = require('bcryptjs');
const pool    = require('../db');
const { authenticate, authorize } = require('../middleware/auth');

// All routes require auth
router.use(authenticate);

// ── GET /api/users ───────────────── admin only ───────────────
router.get('/', authorize('admin'), async (req, res) => {
  try {
    const { rows } = await pool.query(
      'SELECT id, name, email, role, created_at FROM users ORDER BY id'
    );
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

// ── POST /api/users ──────────────── admin only ───────────────
router.post('/', authorize('admin'), async (req, res) => {
  const { name, email, password, role } = req.body;
  if (!name || !email || !password || !role)
    return res.status(400).json({ error: 'All fields required' });
  if (!['admin','recruiter','viewer'].includes(role))
    return res.status(400).json({ error: 'Invalid role' });

  try {
    const hash = await bcrypt.hash(password, 10);
    const { rows } = await pool.query(
      `INSERT INTO users (name, email, password, role)
       VALUES ($1,$2,$3,$4)
       RETURNING id, name, email, role, created_at`,
      [name, email.toLowerCase().trim(), hash, role]
    );
    res.status(201).json(rows[0]);
  } catch (err) {
    if (err.code === '23505') return res.status(409).json({ error: 'Email already exists' });
    res.status(500).json({ error: 'Server error' });
  }
});

// ── PATCH /api/users/:id ─────────── admin only ───────────────
router.patch('/:id', authorize('admin'), async (req, res) => {
  const { name, email, role, password } = req.body;
  const id = parseInt(req.params.id);

  try {
    if (password) {
      const hash = await bcrypt.hash(password, 10);
      await pool.query('UPDATE users SET password = $1 WHERE id = $2', [hash, id]);
    }
    const { rows } = await pool.query(
      `UPDATE users SET
         name  = COALESCE($1, name),
         email = COALESCE($2, email),
         role  = COALESCE($3, role)
       WHERE id = $4
       RETURNING id, name, email, role, created_at`,
      [name, email?.toLowerCase().trim(), role, id]
    );
    if (!rows[0]) return res.status(404).json({ error: 'User not found' });
    res.json(rows[0]);
  } catch (err) {
    if (err.code === '23505') return res.status(409).json({ error: 'Email already exists' });
    res.status(500).json({ error: 'Server error' });
  }
});

// ── DELETE /api/users/:id ────────── admin only ───────────────
router.delete('/:id', authorize('admin'), async (req, res) => {
  const id = parseInt(req.params.id);
  if (id === req.user.id)
    return res.status(400).json({ error: 'Cannot delete yourself' });
  try {
    const { rowCount } = await pool.query('DELETE FROM users WHERE id = $1', [id]);
    if (!rowCount) return res.status(404).json({ error: 'User not found' });
    res.json({ message: 'User deleted' });
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;
