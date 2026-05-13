# Recruitment Command Centre — AEW&C Mk-II

Full-stack recruitment lifecycle management app built with **Node.js + Express + PostgreSQL + React**.

---

## Tech Stack

| Layer    | Technology                        |
|----------|-----------------------------------|
| Frontend | React 18 + Vite + React Router    |
| Backend  | Node.js + Express                 |
| Database | PostgreSQL 16                     |
| Auth     | JWT (role-based: Admin / Recruiter / Viewer) |
| Deploy   | Docker Compose (any VPS / cloud)  |

---

## Quick Start (Local Dev)

### Prerequisites
- Node.js 18+
- PostgreSQL running locally (or use Docker)

### 1. Start PostgreSQL (Docker)
```bash
docker run -d \
  --name rcc_postgres \
  -e POSTGRES_DB=rcc_db \
  -e POSTGRES_USER=rcc_user \
  -e POSTGRES_PASSWORD=rcc_pass \
  -p 5432:5432 \
  postgres:16-alpine
```

### 2. Install & Seed
```bash
# Install server deps
cd server && npm install

# Seed the database (creates schema + default users + all 11 roles)
npm run seed

# Install client deps
cd ../client && npm install
```

### 3. Run (two terminals)
```bash
# Terminal 1 — API server (port 4000)
cd server && npm run dev

# Terminal 2 — React dev server (port 5173)
cd client && npm run dev
```

Open → http://localhost:5173

---

## Default Credentials

| Role      | Email                  | Password       |
|-----------|------------------------|----------------|
| Admin     | admin@aewc.org         | Admin@123      |
| Recruiter | recruiter@aewc.org     | Recruiter@123  |

---

## Deploy with Docker Compose

```bash
# From project root
docker-compose up -d --build
```

App available at → http://localhost:5173  
API available at → http://localhost:4000/api/health

> **Before deploying to production**, update `JWT_SECRET` in `docker-compose.yml` to a long random string.

---

## Feature Highlights

- **Dashboard** — stats bar (total HC, filled, budget, hard-to-fill, avg TTF) + sortable/filterable roles table
- **Role Detail Drawer** — slides in from the right with full details:
  - Lifecycle tracker (Sourcing → Screening → Interview → Offered → Joined)
  - Editable core fields (title, exp, HC, CTC, difficulty, TTF)
  - Recruitment Kit (JD link, Questionnaire, Assessment Form, Feedback Form)
  - Recruiter Pitch
  - Interview Panel (name, designation, email, phone — add/remove)
  - Sourcing Channels (tag-based, add/remove)
  - Approvals (add steps, toggle pending/approved, remove)
- **Difficulty colour coding** — 🟢 Easy / 🟡 Moderate / 🔴 Hard
- **Role-based access** — Admins can delete roles & manage users; Recruiters can edit; Viewers read-only
- **User Management** — Admin-only page to add / edit / delete team members
- **All data persisted in PostgreSQL**

---

## API Reference

```
POST   /api/auth/login
GET    /api/auth/me
POST   /api/auth/change-password

GET    /api/roles
POST   /api/roles
GET    /api/roles/:id
PATCH  /api/roles/:id
DELETE /api/roles/:id          (admin only)
PATCH  /api/roles/:id/lifecycle

POST   /api/roles/:id/panelists
PATCH  /api/roles/:id/panelists/:pid
DELETE /api/roles/:id/panelists/:pid

POST   /api/roles/:id/channels
DELETE /api/roles/:id/channels/:cid

POST   /api/roles/:id/approvals
PATCH  /api/roles/:id/approvals/:aid
DELETE /api/roles/:id/approvals/:aid

GET    /api/users               (admin only)
POST   /api/users               (admin only)
PATCH  /api/users/:id           (admin only)
DELETE /api/users/:id           (admin only)
```

---

## Hosting Options (when ready)

| Option                | Steps |
|-----------------------|-------|
| **DigitalOcean / Hetzner VPS** | `git clone` → `docker-compose up -d` |
| **AWS EC2**           | Same as VPS; use RDS for managed Postgres |
| **Render.com**        | Deploy server as Web Service, use Render Postgres |
| **Railway.app**       | One-click Node + Postgres deploy |
| **Supabase + Netlify**| Supabase for DB, Netlify for frontend, server on Render |
