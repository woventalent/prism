const jwt  = require('jsonwebtoken');
const pool = require('../db');

function authenticate(req, res, next) {
  const header = req.headers.authorization || '';
  const token  = header.startsWith('Bearer ') ? header.slice(7) : null;
  if (!token) return res.status(401).json({ error: 'No token provided' });
  try {
    req.user = jwt.verify(token, process.env.JWT_SECRET);
    next();
  } catch {
    return res.status(401).json({ error: 'Invalid or expired token' });
  }
}

/** Platform-level super admin gate. */
function requireSuperAdmin(req, res, next) {
  if (!req.user?.is_super_admin)
    return res.status(403).json({ error: 'Super admin access required' });
  next();
}

/**
 * Reads X-Client-ID header, validates the user belongs to that client,
 * and sets req.clientId + req.clientRole.
 * Super admins bypass membership check and always get role 'admin'.
 */
async function requireClientAccess(req, res, next) {
  const clientId = parseInt(req.headers['x-client-id']);
  if (!clientId) return res.status(400).json({ error: 'X-Client-ID header required' });

  if (req.user.is_super_admin) {
    req.clientId   = clientId;
    req.clientRole = 'admin';
    return next();
  }

  try {
    const { rows } = await pool.query(
      'SELECT role FROM client_users WHERE client_id = $1 AND user_id = $2',
      [clientId, req.user.id]
    );
    if (!rows.length)
      return res.status(403).json({ error: 'Access denied to this workspace' });
    req.clientId   = clientId;
    req.clientRole = rows[0].role;
    next();
  } catch {
    res.status(500).json({ error: 'Server error' });
  }
}

/** Must follow requireClientAccess. Allows only workspace admins. */
function requireClientAdmin(req, res, next) {
  if (req.clientRole !== 'admin')
    return res.status(403).json({ error: 'Workspace admin role required' });
  next();
}

/** Legacy role check (kept for routes not yet migrated). */
function authorize(...roles) {
  return (req, res, next) => {
    if (!req.user || !roles.includes(req.user.role))
      return res.status(403).json({ error: 'Insufficient permissions' });
    next();
  };
}

module.exports = { authenticate, authorize, requireSuperAdmin, requireClientAccess, requireClientAdmin };
