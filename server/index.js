require('dotenv').config();
const express = require('express');
const cors    = require('cors');
const path    = require('path');

const authRoutes      = require('./routes/auth');
const usersRoutes     = require('./routes/users');
const knowledgeRoutes = require('./routes/knowledge');
const clientsRoutes   = require('./routes/clients');

// ── Environment Variable Validation ────────────────────────────
const requiredVars = {
  DATABASE_URL:        { required: true,  description: 'PostgreSQL database connection URL' },
  JWT_SECRET:          { required: true,  description: 'Secret key for JWT signing' },
  CLIENT_ORIGIN:       { required: true,  description: 'Frontend origin for CORS' },
  AZURE_CLIENT_ID:     { required: false, description: 'Azure AD application ID (for SSO)' },
  AZURE_CLIENT_SECRET: { required: false, description: 'Azure AD application secret (for SSO)' },
  AZURE_TENANT_ID:     { required: false, description: 'Azure AD tenant ID (for SSO)' },
};

const missingRequired = Object.entries(requiredVars)
  .filter(([key, { required }]) => required && !process.env[key])
  .map(([key]) => key);

if (missingRequired.length > 0) {
  console.error(`❌ Missing required environment variables: ${missingRequired.join(', ')}`);
  console.error('Set these in your .env file or as environment variables.');
  process.exit(1);
}

// Check optional Azure SSO variables
const azureVarsToCheck = ['AZURE_CLIENT_ID', 'AZURE_CLIENT_SECRET', 'AZURE_TENANT_ID'];
const setAzureVars = azureVarsToCheck.filter(v => process.env[v]);
if (setAzureVars.length > 0 && setAzureVars.length < azureVarsToCheck.length) {
  const missingAzure = azureVarsToCheck.filter(v => !process.env[v]);
  console.warn(`⚠️  Azure SSO partially configured (${setAzureVars.length}/${azureVarsToCheck.length}). Missing: ${missingAzure.join(', ')}. SSO will not be available.`);
}

const app  = express();
const PORT = process.env.PORT || 4000;

// ── Middleware ─────────────────────────────────────────────────
app.use(cors({ origin: process.env.CLIENT_ORIGIN, credentials: true }));
app.use(express.json());

// Request logger (dev)
app.use((req, _res, next) => {
  console.log(`${req.method} ${req.path}`);
  next();
});

// ── API Routes ─────────────────────────────────────────────────
app.use('/api/auth',      authRoutes);
app.use('/api/clients',   clientsRoutes);
app.use('/api/users',     usersRoutes);
app.use('/api/knowledge', knowledgeRoutes);

// Health check
app.get('/api/health', (_req, res) => res.json({ status: 'ok', ts: new Date() }));

// ── Serve React static build ───────────────────────────────────
const clientDist = path.join(__dirname, '..', 'client', 'dist');
app.use(express.static(clientDist));

// SPA fallback — serve index.html for all non-API routes
app.get('*', (_req, res) => {
  res.sendFile(path.join(clientDist, 'index.html'));
});

// ── Error handler ──────────────────────────────────────────────
app.use((err, _req, res, _next) => {
  console.error(err);
  res.status(500).json({ error: 'Internal server error' });
});

app.listen(PORT, () => {
  console.log(`✅  RCC API running → http://localhost:${PORT}`);
});
