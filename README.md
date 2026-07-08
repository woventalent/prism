# Prism — Talent Intelligence Platform

> A multi-tenant, client-scoped talent intelligence platform. Each client organisation gets an isolated workspace containing their knowledge base, SPOC contacts, domain matrix, and BU planning data.

[![Node.js](https://img.shields.io/badge/Node.js-20+-green)](https://nodejs.org)
[![React](https://img.shields.io/badge/React-18-blue)](https://react.dev)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-16-blue)](https://postgresql.org)
[![Auth](https://img.shields.io/badge/Auth-Microsoft%20SSO-blue)](https://learn.microsoft.com/en-us/azure/active-directory/)

---

## Table of Contents

1. [Tech Stack](#tech-stack)
2. [Project Structure](#project-structure)
3. [Features](#features)
4. [Multi-Tenancy & User Roles](#multi-tenancy--user-roles)
5. [Authentication — Microsoft SSO](#authentication--microsoft-sso)
6. [Environment Variables](#environment-variables)
7. [Local Development Setup](#local-development-setup)
8. [Production Deployment](#production-deployment)
9. [Database Schema & Migrations](#database-schema--migrations)
10. [API Reference](#api-reference)
11. [First-Time Production Setup](#first-time-production-setup)
12. [Updating in Production](#updating-in-production)
13. [Troubleshooting](#troubleshooting)

---

## Tech Stack

| Layer           | Technology                                          |
|-----------------|-----------------------------------------------------|
| Frontend        | React 18, Vite, React Router v6                     |
| Backend         | Node.js 20, Express 4                               |
| Database        | PostgreSQL 16                                       |
| Authentication  | Microsoft Entra ID (Azure AD) SSO via MSAL Node     |
| Session tokens  | JWT (jsonwebtoken) — issued after SSO validation    |
| Process Manager | PM2 (cluster mode)                                  |
| Reverse Proxy   | Caddy (auto HTTPS via Let's Encrypt)                |

---

## Project Structure

```
prism/
├── server/                         # Express API (port 4000)
│   ├── index.js                    # Entry point, route registration
│   ├── db.js                       # PostgreSQL connection pool
│   ├── .env                        # Environment variables (not committed)
│   ├── db/
│   │   ├── schema.sql              # Full database schema
│   │   ├── seed.js                 # Initial data seed
│   │   ├── seed-knowledge.js       # Knowledge base seed data
│   │   └── migrate-multi-tenant.js # One-time migration: adds clients + client_users
│   ├── middleware/
│   │   └── auth.js                 # JWT verify, requireClientAccess, requireSuperAdmin
│   └── routes/
│       ├── auth.js                 # Microsoft SSO + /me
│       ├── clients.js              # Workspace CRUD + user management
│       ├── knowledge.js            # Knowledge base (client-scoped)
│       └── users.js                # Platform-level user management
│
└── client/                         # React + Vite frontend
    ├── vite.config.js              # Dev proxy: /api → localhost:4000
    └── src/
        ├── App.jsx                 # Routes + auth guards + WorkspaceLayout
        ├── api/index.js            # Axios client (attaches JWT + X-Client-ID)
        ├── context/
        │   ├── AuthContext.jsx     # User, clients list, isSuperAdmin
        │   └── ClientContext.jsx   # Active workspace, canEdit
        └── pages/
            ├── LoginPage.jsx           # Microsoft SSO sign-in button
            ├── AuthCallbackPage.jsx    # Handles /auth/callback after SSO
            ├── WorkspaceSelectorPage.jsx
            ├── SuperAdminPage.jsx      # Workspace + user management
            ├── SettingsPage.jsx        # Workspace member management
            └── knowledge/
                ├── KnowledgePage.jsx       # Tab shell with URL-based routing
                ├── CompanyProfile.jsx
                ├── Locations.jsx
                ├── DomainMatrix.jsx
                └── BUPlanning.jsx
```

---

## Features

### Knowledge Base (per workspace)

Each client workspace has four knowledge modules with individual URLs:

| Tab               | URL path                        |
|-------------------|---------------------------------|
| Company Profile   | `/w/:clientSlug/company-profile`   |
| Capability Report | `/w/:clientSlug/capability-report` |
| Domain Matrix     | `/w/:clientSlug/domain-matrix`     |
| BU Planning       | `/w/:clientSlug/bu-planning`       |
| Custom Tabs*      | `/w/:clientSlug/custom_:slug`      |

*Custom tabs have auto-generated URL slugs based on their names

#### Company Profile
- Rich-text sections and subsections with inline editing
- Admins can reorder sections/subsections (▲▼), add/remove them
- **Block sizing**: each section can be set to Full, Half, or 1/3 width — sizes persist to the database
- 2-second debounced autosave

#### Capability Report
- Structured capability data per domain
- Section-based layout, editable by workspace admins

#### Domain Matrix
- Business domain landscape table with configurable columns
- Smart column defaults:
  - **Client SPOC / Woven SPOC** → pre-fills `Name: \nDesignation/ Role:`
  - **SPOC Contacts / Woven SPOC Contacts** → pre-fills `Mobile: \nEmail:`
- Add/remove rows and columns; rename column headers inline
- `white-space: pre-wrap` rendering preserves multi-line contact details

#### BU Planning
- 5-year workforce planning per Business Unit
- Per-BU: leader, domains, planning dimensions × year grid
- Add/remove BUs, dimensions, and year columns
- Year columns are center-aligned

#### Custom Tabs
- Workspace admins can create custom tabs via the "Manage Tabs" panel
- Tab names are converted to **user-friendly URL slugs** (e.g., `Sales Pipeline` → `custom_sales-pipeline`)
- Slugs are regenerated automatically when tab names change
- Special characters are removed, spaces become hyphens, max 50 chars per slug
- Custom tabs reuse the Company Profile component for flexible content storage
- Up to **10 total tabs** (built-in + custom) per workspace
- Tab order is fully customizable via drag controls in Manage Tabs
- **URL pattern:** `/w/:clientSlug/custom_:slug` (e.g., `/w/acme/custom_sales-pipeline`)

### Download
- **Download Section** — exports the active tab as a PDF
- **Download All** — exports all four sections as a combined PDF

### Super Admin Panel (`/super-admin`)
- Create, edit, and delete client workspaces (name, slug, description)
- Manage users across all workspaces
- Enter any workspace as admin

---

## Multi-Tenancy & User Roles

Prism uses a three-tier role model:

| Role               | Scope    | Capabilities                                                 |
|--------------------|----------|--------------------------------------------------------------|
| **Super Admin**    | Platform | Create/edit/delete workspaces, manage all users, enter any workspace |
| **Workspace Admin**| Client   | View + edit all knowledge base content, manage workspace members |
| **Workspace Member**| Client  | View-only access to the workspace knowledge base             |

### How it works
- Every API request includes an `X-Client-ID` header (set automatically from `localStorage`)
- Server middleware scopes all knowledge base reads/writes to `req.clientId`
- Users can belong to multiple workspaces with different roles in each
- Super Admins bypass workspace access checks and can enter any workspace

### URL structure
```
/workspaces                         → workspace selector (after login)
/super-admin                        → super admin panel
/w/:clientSlug/company-profile      → Company Profile
/w/:clientSlug/capability-report    → Capability Report
/w/:clientSlug/domain-matrix        → Domain Matrix
/w/:clientSlug/bu-planning          → BU Planning
/w/:clientSlug/custom_:slug         → Custom Tab (e.g., custom_sales-pipeline)
/w/:clientSlug/settings             → workspace settings (member management)
```

---

## Authentication — Microsoft SSO

Prism uses **Microsoft Entra ID (Azure AD)** for authentication. Username/password login is not supported.

### How the SSO flow works

```
1. User clicks "Sign in with Microsoft"
2. Browser navigates to GET /api/auth/microsoft
3. Server generates an auth URL and redirects to Microsoft
4. User authenticates with their Microsoft account (restricted to the configured tenant/domain)
5. Microsoft redirects to GET /api/auth/microsoft/callback?code=...
6. Server validates:
   - Tenant ID must match AZURE_TENANT_ID
   - Email domain must match AZURE_ALLOWED_DOMAIN
7. Server finds or creates the user in the DB (matched by email)
8. Server issues a Prism JWT, redirects to /auth/callback?payload=<base64>
9. Frontend stores the JWT, navigates to workspace selector or workspace
```

### Azure AD App Registration requirements

In Azure Portal → App registrations → your app:

1. **Redirect URI** (Web): `https://your-domain.com/api/auth/microsoft/callback`
2. **Client Secret**: create one, note the value and secret ID
3. **API Permissions**: `openid`, `profile`, `email` (Microsoft Graph — delegated)

For local development, also add: `http://localhost:4000/api/auth/microsoft/callback`

---

## Environment Variables

Create `server/.env` with the following:

```env
# Server
PORT=4000
DATABASE_URL=postgresql://rcc_user:YOUR_DB_PASSWORD@localhost:5432/rcc_db
JWT_SECRET=your_long_random_secret_here
JWT_EXPIRES_IN=7d
CLIENT_ORIGIN=https://your-domain.com

# Microsoft Entra ID SSO
AZURE_CLIENT_ID=your_azure_app_client_id
AZURE_CLIENT_SECRET=your_azure_client_secret_value
AZURE_TENANT_ID=your_azure_tenant_id
AZURE_REDIRECT_URI=https://your-domain.com/api/auth/microsoft/callback
AZURE_ALLOWED_DOMAIN=your-domain.com
```

| Variable              | Required | Description                                         |
|-----------------------|----------|-----------------------------------------------------|
| `PORT`                | No       | Express API port (default: 4000)                    |
| `DATABASE_URL`        | **Yes**  | Full PostgreSQL connection string                   |
| `JWT_SECRET`          | **Yes**  | Long random string for signing JWTs                 |
| `JWT_EXPIRES_IN`      | No       | Token lifetime (default: `7d`)                      |
| `CLIENT_ORIGIN`       | **Yes**  | Frontend origin for CORS + SSO redirect target      |
| `AZURE_CLIENT_ID`     | No*      | Azure AD app (client) ID (*required if SSO enabled) |
| `AZURE_CLIENT_SECRET` | No*      | Azure AD client secret value (*required if SSO enabled) |
| `AZURE_TENANT_ID`     | No*      | Azure AD tenant ID (*required if SSO enabled)       |
| `AZURE_REDIRECT_URI`  | No       | Must exactly match the redirect URI in Azure Portal |
| `AZURE_ALLOWED_DOMAIN`| No       | Only this email domain is permitted to sign in      |

**⚠️ Required environment variables validation:**
- Server will fail to start if `DATABASE_URL`, `JWT_SECRET`, or `CLIENT_ORIGIN` are missing
- If any Azure SSO variable is partially configured, a warning is logged but startup continues
- For production, ensure all required variables are set in your `.env` file or deployment environment

> ⚠️ Never commit `server/.env` to version control.

Generate a secure JWT secret:
```bash
node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"
```

---

## Local Development Setup

### Prerequisites
- Node.js 20+
- PostgreSQL 16 running locally (or via Docker)

### Step 1 — Clone the repo
```bash
git clone <your-repo-url>
cd prism
```

### Step 2 — Start PostgreSQL (via Docker)
```bash
docker run -d \
  --name prism_postgres \
  -e POSTGRES_DB=rcc_db \
  -e POSTGRES_USER=rcc_user \
  -e POSTGRES_PASSWORD=rcc_pass \
  -p 5432:5432 \
  postgres:16-alpine
```

### Step 3 — Create `server/.env`

```env
PORT=4000
DATABASE_URL=postgresql://rcc_user:rcc_pass@localhost:5432/rcc_db
JWT_SECRET=dev_secret_change_in_production
JWT_EXPIRES_IN=7d
CLIENT_ORIGIN=http://localhost:5173

AZURE_CLIENT_ID=your_azure_app_client_id
AZURE_CLIENT_SECRET=your_azure_client_secret
AZURE_TENANT_ID=your_azure_tenant_id
AZURE_REDIRECT_URI=http://localhost:4000/api/auth/microsoft/callback
AZURE_ALLOWED_DOMAIN=your-allowed-domain.com
```

### Step 4 — Install dependencies
```bash
cd server && npm install
cd ../client && npm install
```

### Step 5 — Initialise the database
```bash
cd server && npm run seed
node db/migrate-multi-tenant.js   # adds multi-tenant tables
```

### Step 6 — Start the servers (two terminals)
```bash
# Terminal 1 — API
cd server && npm run dev

# Terminal 2 — Frontend
cd client && npm run dev
```

Open → **http://localhost:5173**

> **Note:** SSO will redirect back to `http://localhost:4000/api/auth/microsoft/callback`. Make sure this URI is registered in Azure Portal for local testing.

---

## Production Deployment

The production server runs on a VPS with:
- **PM2** managing the Node.js API process
- **Caddy** (running in Docker) as the reverse proxy with automatic HTTPS

### Deploy steps

```bash
ssh user@YOUR_SERVER_IP

cd /path/to/prism

# Pull latest code
git pull origin master

# Install any new server dependencies
cd server && npm install

# Rebuild frontend
cd ../client && npm run build

# Restart API with updated env vars
pm2 restart rcc-api --update-env
```

### Caddy configuration

Caddy runs inside a Docker container. Example `Caddyfile`:

```caddy
your-domain.com {
    reverse_proxy 172.18.0.1:4000
}
```

After editing the Caddyfile:
```bash
docker restart <caddy-container-name>
```

### PM2 ecosystem file

Key env var in your `ecosystem.config.js`:

```js
CLIENT_ORIGIN: 'https://your-domain.com'
```

### PM2 commands
```bash
pm2 status                    # view all processes
pm2 logs rcc-api              # tail API logs
pm2 restart rcc-api           # restart
pm2 restart rcc-api --update-env  # restart + pick up .env changes
```

---

## Database Schema & Migrations

### Tables

| Table           | Purpose                                                   |
|-----------------|-----------------------------------------------------------|
| `users`         | Platform users (name, email, role, is_super_admin)        |
| `clients`       | Client workspaces (name, slug, description)               |
| `client_users`  | Workspace memberships (client_id, user_id, role)          |
| `knowledge_base`| JSONB knowledge data, scoped by (client_id, section)      |

### Running migrations

**Initial schema:**
```bash
cd server && npm run seed
```

**Multi-tenant migration** (run once — idempotent):
```bash
node server/db/migrate-multi-tenant.js
```

This migration:
1. Creates `clients` and `client_users` tables
2. Adds `is_super_admin` to `users`
3. Adds `client_id` to `knowledge_base`
4. Migrates existing data to the default workspace
5. Promotes the first admin user to Super Admin

### Backup & restore
```bash
# Backup
pg_dump $DATABASE_URL > backup_$(date +%Y%m%d).sql

# Restore
psql $DATABASE_URL < backup_20240101.sql

# Connect directly
psql $DATABASE_URL
```

---

## API Reference

All routes except `/api/auth/microsoft` and `/api/auth/microsoft/callback` require:
- `Authorization: Bearer <jwt>` header
- `X-Client-ID: <clientId>` header for workspace-scoped routes

### Auth

| Method | Endpoint                          | Auth  | Description                              |
|--------|-----------------------------------|-------|------------------------------------------|
| GET    | `/api/auth/microsoft`             | None  | Initiates Microsoft OAuth redirect       |
| GET    | `/api/auth/microsoft/callback`    | None  | OAuth callback — issues JWT, redirects to frontend |
| GET    | `/api/auth/me`                    | JWT   | Returns current user + their workspaces  |

### Clients (Workspaces)

| Method | Endpoint                      | Auth              | Description                              |
|--------|-------------------------------|-------------------|------------------------------------------|
| GET    | `/api/clients`                | JWT               | Super Admin: all clients. Others: own workspaces |
| POST   | `/api/clients`                | Super Admin       | Create a workspace                       |
| PUT    | `/api/clients/:id`            | Super Admin       | Update workspace name/slug/description   |
| DELETE | `/api/clients/:id`            | Super Admin       | Delete workspace                         |
| GET    | `/api/clients/:id/users`      | Admin / Super Admin | List workspace members                 |
| POST   | `/api/clients/:id/users`      | Admin / Super Admin | Add user to workspace (creates if new) |
| PATCH  | `/api/clients/:id/users/:uid` | Admin / Super Admin | Change workspace role                  |
| DELETE | `/api/clients/:id/users/:uid` | Admin / Super Admin | Remove user from workspace             |

### Knowledge Base

Requires `X-Client-ID` header. Reads/writes are scoped to the active workspace.

| Method | Endpoint               | Auth             | Description                  |
|--------|------------------------|------------------|------------------------------|
| GET    | `/api/knowledge/:section` | Member+       | Get section data             |
| PUT    | `/api/knowledge/:section` | Workspace Admin | Save section data (upsert)  |

Sections: `company_profile`, `capability_report`, `domain_matrix`, `bu_planning`

### Users (Platform-level)

| Method | Endpoint          | Auth        | Description              |
|--------|-------------------|-------------|--------------------------|
| GET    | `/api/users`      | Super Admin | List all platform users  |
| POST   | `/api/users`      | Super Admin | Create user              |
| PATCH  | `/api/users/:id`  | Super Admin | Update user              |
| DELETE | `/api/users/:id`  | Super Admin | Delete user              |

### Health Check

```
GET /api/health   →   { "status": "ok", "ts": "..." }
```

---

## Security & Validation

### Startup Validation
The server validates all required environment variables on startup:
- **Critical**: `DATABASE_URL`, `JWT_SECRET`, `CLIENT_ORIGIN` — server fails to start if missing
- **Optional**: Azure SSO variables — server logs a warning if partially configured but still starts

This prevents silent failures in production due to misconfiguration.

### API Validation

#### Knowledge Base Routes
- **Section Parameter**: Only valid sections are accepted (`company-profile`, `capability-report`, `domain-matrix`, `bu-planning`). Invalid sections return `400 Bad Request`.
- **PUT Endpoint**: 
  - Request body must be a valid JSON object (not null, string, or array)
  - Maximum payload size is 1MB to prevent storage and memory issues
  - Invalid payloads return `400 Bad Request` with descriptive error messages

#### CORS Configuration
- `CLIENT_ORIGIN` environment variable is required and strictly enforced
- No wildcard (`*`) CORS origin in production — prevents unsafe credential sharing across origins
- `credentials: true` allows authentication headers in cross-origin requests only for the configured origin

### Database Security
- All user input in queries is parameterized (`$1`, `$2`, etc.) to prevent SQL injection
- Knowledge base data is stored in PostgreSQL's `JSONB` type with size limits enforced at the application level
- Client access is scoped at the database middleware level — users can only access their own workspace data

---

## First-Time Production Setup

After deploying for the first time:

### 1. Run the migration
```bash
ssh user@YOUR_SERVER_IP
cd /path/to/prism && node server/db/migrate-multi-tenant.js
```

### 2. Promote a user to Super Admin

The first user to sign in via SSO can be promoted via SQL:

```bash
psql $DATABASE_URL << 'SQL'
-- Promote user to Super Admin
UPDATE users SET is_super_admin = TRUE WHERE email = 'you@your-domain.com';

-- Add to a workspace as Admin
INSERT INTO client_users (client_id, user_id, role)
SELECT c.id, u.id, 'admin'
FROM clients c, users u
WHERE c.slug = 'your-workspace-slug' AND u.email = 'you@your-domain.com'
ON CONFLICT (client_id, user_id) DO UPDATE SET role = 'admin';
SQL
```

### 3. Add more users
Once logged in as Super Admin, use the **Super Admin panel** (`/super-admin`) to:
- Create additional client workspaces
- Edit workspace names, slugs, and descriptions
- Add users to workspaces via the "Manage Users" button

---

## Updating in Production

```bash
ssh user@YOUR_SERVER_IP
cd /path/to/prism

# Pull latest
git pull origin master

# Install new server dependencies (if any)
cd server && npm install

# Rebuild frontend
cd ../client && npm run build

# Restart API (picks up new code + updated .env)
pm2 restart rcc-api --update-env
```

If the database schema changed, also run:
```bash
node /path/to/prism/server/db/migrate-multi-tenant.js
```

---

## Troubleshooting

### Microsoft SSO — "unauthorized_domain" error
- The signed-in Microsoft account's email domain doesn't match `AZURE_ALLOWED_DOMAIN`
- Check `AZURE_ALLOWED_DOMAIN` in `server/.env`

### Microsoft SSO — "unauthorized_tenant" error
- The Microsoft account belongs to a different Azure AD tenant
- Verify `AZURE_TENANT_ID` in `.env` matches your organisation's tenant

### Microsoft SSO — "invalid_state" error
- The OAuth state parameter expired (10-minute window)
- Try signing in again — this is normal if the tab was left idle

### SSO redirect URI mismatch
- Azure Portal must have the exact URI registered: `https://your-domain.com/api/auth/microsoft/callback`
- For local dev: `http://localhost:4000/api/auth/microsoft/callback`

### API returns 401 on every request
- JWT may be expired (default: 7 days)
- Sign out and sign back in via Microsoft SSO

### Knowledge base not loading / saving
- Check that `X-Client-ID` is being sent (inspect network tab — should be the client's UUID)
- Verify the user is a member of the workspace: `SELECT * FROM client_users WHERE user_id = <id>;`

### Caddy not picking up config changes
- `sed -i` changes the inode; Docker bind mount still points to the old inode
- Fix: `docker restart <caddy-container-name>`

### Blank page after frontend build
- Ensure `npm run build` completed without errors
- The Express server serves `client/dist` — PM2 restart not needed for frontend-only changes

### PM2 process keeps restarting
```bash
pm2 logs rcc-api --lines 50   # check for startup errors
# Common cause: missing or malformed server/.env
```

### Database backup
```bash
pg_dump $DATABASE_URL > prism_backup_$(date +%Y%m%d).sql
```
