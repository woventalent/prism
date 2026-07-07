require('dotenv').config();
const express = require('express');
const cors    = require('cors');
const path    = require('path');

const authRoutes      = require('./routes/auth');
const usersRoutes     = require('./routes/users');
const knowledgeRoutes = require('./routes/knowledge');
const clientsRoutes   = require('./routes/clients');

// ── Environment Variable Validation ────────────────────────────
const coreRequiredVars = ['DATABASE_URL', 'JWT_SECRET', 'CLIENT_ORIGIN'];
const azureVars = ['AZURE_CLIENT_ID', 'AZURE_CLIENT_SECRET', 'AZURE_TENANT_ID'];

const missingCoreVars = coreRequiredVars.filter(v => !process.env[v]);
if (missingCoreVars.length > 0) {
  console.error(`❌ Missing required environment variables: ${missingCoreVars.join(', ')}`);
  process.exit(1);
}

// If any Azure variable is set, all must be set (SSO all-or-nothing)
const setAzureVars = azureVars.filter(v => process.env[v]);
if (setAzureVars.length > 0 && setAzureVars.length < azureVars.length) {
  const missingAzureVars = azureVars.filter(v => !process.env[v]);
  console.warn(`⚠️  Azure SSO partially configured. Missing: ${missingAzureVars.join(', ')}. SSO will not work.`);
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
