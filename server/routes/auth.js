const router  = require('express').Router();
const jwt     = require('jsonwebtoken');
const crypto  = require('crypto');
const msal    = require('@azure/msal-node');
const pool    = require('../db');
const { authenticate } = require('../middleware/auth');

const TENANT_ID      = process.env.AZURE_TENANT_ID;
const ALLOWED_DOMAIN = process.env.AZURE_ALLOWED_DOMAIN || 'woventalent.in';
const REDIRECT_URI   = process.env.AZURE_REDIRECT_URI   || 'http://localhost:4000/api/auth/microsoft/callback';
const IS_SSO_ENABLED = !!(process.env.AZURE_CLIENT_ID && process.env.AZURE_CLIENT_SECRET && process.env.AZURE_TENANT_ID);

let cca = null;
function getConfidentialClientApp() {
  if (!cca && IS_SSO_ENABLED) {
    cca = new msal.ConfidentialClientApplication({
      auth: {
        clientId:     process.env.AZURE_CLIENT_ID,
        authority:    `https://login.microsoftonline.com/${TENANT_ID}`,
        clientSecret: process.env.AZURE_CLIENT_SECRET,
      },
      system: { loggerOptions: { logLevel: msal.LogLevel.Warning } },
    });
  }
  return cca;
}

// Short-lived state store to prevent CSRF on the OAuth redirect
const stateStore = new Map();
function pruneStates() {
  const now = Date.now();
  for (const [k, exp] of stateStore) if (exp < now) stateStore.delete(k);
}

// ── GET /api/auth/microsoft → kick off OAuth ─────────────────
router.get('/microsoft', async (req, res) => {
  const ccaInstance = getConfidentialClientApp();
  if (!ccaInstance) {
    return res.redirect(`${process.env.CLIENT_ORIGIN}/login?error=sso_not_configured`);
  }

  pruneStates();
  const state = crypto.randomBytes(20).toString('hex');
  stateStore.set(state, Date.now() + 10 * 60 * 1000); // 10 min TTL

  try {
    const url = await ccaInstance.getAuthCodeUrl({
      scopes:      ['openid', 'profile', 'email'],
      redirectUri: REDIRECT_URI,
      state,
      prompt:      'select_account',
    });
    res.redirect(url);
  } catch (err) {
    console.error('[SSO] getAuthCodeUrl error:', err.message);
    res.redirect(`${process.env.CLIENT_ORIGIN}/login?error=sso_unavailable`);
  }
});

// ── GET /api/auth/microsoft/callback ─────────────────────────
router.get('/microsoft/callback', async (req, res) => {
  const ccaInstance = getConfidentialClientApp();
  if (!ccaInstance) {
    return res.redirect(`${process.env.CLIENT_ORIGIN}/login?error=sso_not_configured`);
  }

  const { code, state, error, error_description } = req.query;
  const origin = process.env.CLIENT_ORIGIN || 'http://localhost:5173';

  if (error) {
    console.error('[SSO] Microsoft error:', error, error_description);
    return res.redirect(`${origin}/login?error=${encodeURIComponent(error_description || error)}`);
  }

  // Validate state (CSRF guard)
  if (!state || !stateStore.has(state) || stateStore.get(state) < Date.now()) {
    return res.redirect(`${origin}/login?error=invalid_state`);
  }
  stateStore.delete(state);

  try {
    const result = await ccaInstance.acquireTokenByCode({
      code,
      scopes:      ['openid', 'profile', 'email'],
      redirectUri: REDIRECT_URI,
    });

    // Enforce tenant
    const tid = result.idTokenClaims?.tid || result.tenantId;
    if (tid !== TENANT_ID) {
      return res.redirect(`${origin}/login?error=unauthorized_tenant`);
    }

    const email = (
      result.account?.username ||
      result.idTokenClaims?.preferred_username ||
      result.idTokenClaims?.email ||
      ''
    ).toLowerCase().trim();

    const name = (
      result.idTokenClaims?.name ||
      result.account?.name ||
      email.split('@')[0]
    );

    // Enforce domain
    if (!email.endsWith(`@${ALLOWED_DOMAIN}`)) {
      return res.redirect(`${origin}/login?error=unauthorized_domain`);
    }

    // Find or create user (matched by email, no password needed)
    let { rows } = await pool.query('SELECT * FROM users WHERE email = $1', [email]);
    let user = rows[0];

    if (!user) {
      const ins = await pool.query(
        `INSERT INTO users (name, email, password, role)
         VALUES ($1, $2, '', 'recruiter') RETURNING *`,
        [name, email]
      );
      user = ins.rows[0];
    } else if (user.name !== name) {
      // Sync display name from Microsoft
      const upd = await pool.query(
        'UPDATE users SET name = $1 WHERE id = $2 RETURNING *',
        [name, user.id]
      );
      user = upd.rows[0];
    }

    // Get workspaces
    const { rows: clients } = await pool.query(
      `SELECT c.id, c.name, c.slug, c.description, cu.role AS workspace_role
       FROM clients c
       JOIN client_users cu ON cu.client_id = c.id
       WHERE cu.user_id = $1
       ORDER BY c.name`,
      [user.id]
    );

    // Issue platform JWT
    const token = jwt.sign(
      {
        id: user.id, name: user.name, email: user.email,
        role: user.role, is_super_admin: !!user.is_super_admin,
      },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
    );

    // Send everything to the frontend as a single base64url blob
    const payload = Buffer.from(JSON.stringify({
      token,
      user:    { id: user.id, name: user.name, email: user.email, role: user.role, is_super_admin: !!user.is_super_admin },
      clients,
    })).toString('base64url');

    res.redirect(`${origin}/auth/callback?payload=${payload}`);
  } catch (err) {
    console.error('[SSO] acquireTokenByCode error:', err.message);
    res.redirect(`${origin}/login?error=auth_failed`);
  }
});

// ── GET /api/auth/me ─────────────────────────────────────────
router.get('/me', authenticate, async (req, res) => {
  try {
    const { rows } = await pool.query(
      'SELECT id, name, email, role, is_super_admin, created_at FROM users WHERE id = $1',
      [req.user.id]
    );
    if (!rows[0]) return res.status(404).json({ error: 'User not found' });

    const { rows: clients } = await pool.query(
      `SELECT c.id, c.name, c.slug, c.description, cu.role AS workspace_role
       FROM clients c
       JOIN client_users cu ON cu.client_id = c.id
       WHERE cu.user_id = $1
       ORDER BY c.name`,
      [req.user.id]
    );

    res.json({ ...rows[0], clients });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;
