# Recruitment Command Centre

> A full-stack, role-based recruitment lifecycle management platform for tracking headcount, interview panels, sourcing channels, approvals, and candidate pipeline stages.

[![Node.js](https://img.shields.io/badge/Node.js-20+-green)](https://nodejs.org)
[![React](https://img.shields.io/badge/React-18-blue)](https://react.dev)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-16-blue)](https://postgresql.org)
[![License](https://img.shields.io/badge/License-MIT-yellow)](LICENSE)

---

## Table of Contents

1. [Tech Stack](#tech-stack)
2. [Project Structure](#project-structure)
3. [Features](#features)
4. [User Roles](#user-roles)
5. [Prerequisites](#prerequisites)
6. [Environment Variables](#environment-variables)
7. [Local Development Setup](#local-development-setup)
8. [Production Deployment — Ubuntu VPS (No Docker)](#production-deployment--ubuntu-vps-no-docker)
9. [Production Deployment — Docker Compose](#production-deployment--docker-compose)
10. [Nginx + SSL Configuration](#nginx--ssl-configuration)
11. [Database Management](#database-management)
12. [API Reference](#api-reference)
13. [Default Credentials](#default-credentials)
14. [Troubleshooting](#troubleshooting)

---

## Tech Stack

| Layer      | Technology                              |
|------------|-----------------------------------------|
| Frontend   | React 18, Vite, React Router v6         |
| Backend    | Node.js 20, Express 4                   |
| Database   | PostgreSQL 16                           |
| Auth       | JWT (role-based: Admin / Recruiter / Viewer) |
| Process Mgr| PM2                                     |
| Web Server | Nginx (reverse proxy + SSL termination) |
| Containerisation | Docker + Docker Compose           |

---

## Project Structure

```
recruitment-command-centre/
├── server/                        # Express API
│   ├── index.js                   # Entry point
│   ├── db.js                      # PostgreSQL pool
│   ├── .env.example               # Environment variable template
│   ├── db/
│   │   ├── schema.sql             # Full database schema
│   │   └── seed.js                # Seeds schema + default data
│   ├── middleware/
│   │   └── auth.js                # JWT verify + role guard
│   └── routes/
│       ├── auth.js                # Login, /me, change-password
│       ├── roles.js               # Full CRUD for recruitment roles
│       └── users.js               # User management (admin only)
│
├── client/                        # React + Vite frontend
│   ├── index.html
│   ├── vite.config.js             # Vite config with API proxy
│   ├── nginx.conf                 # Nginx config for Docker builds
│   └── src/
│       ├── App.jsx                # Routes + auth guards
│       ├── index.css              # Global styles
│       ├── api/index.js           # Axios client + interceptors
│       ├── context/AuthContext.jsx
│       ├── pages/
│       │   ├── LoginPage.jsx
│       │   ├── DashboardPage.jsx
│       │   └── UsersPage.jsx
│       └── components/
│           ├── Layout.jsx         # Top nav + shell
│           ├── StatsBar.jsx       # Summary stats
│           ├── RolesTable.jsx     # Main dashboard table
│           ├── RoleDrawer.jsx     # Full role detail side panel
│           ├── AddRoleModal.jsx   # Create new role
│           └── Toast.jsx          # Notifications
│
├── docker-compose.yml             # Full stack via Docker
└── README.md
```

---

## Features

### Dashboard
- Stats bar — Total HC, Filled, Remaining, CTC Budget, Hard-to-Fill count, Avg TTF
- Filterable / searchable roles table
- Difficulty colour coding: 🟢 Easy · 🟡 Moderate · 🔴 Hard

### Role Detail Drawer
Each role has a slide-in panel with:
- **Lifecycle Tracker** — Sourcing → Screening → Interview → Offered → Joined (click to update counts)
- **Core Fields** — Title, Experience, HC, CTC Budget, Filled, In-Progress, Difficulty, TTF (all editable)
- **Recruitment Kit** — JD link, Questionnaire link, Assessment Form link, Interviewer Feedback Form link
- **Recruiter Pitch** — Free-text selling points for recruiters
- **Interview Panel** — Add/remove panelists with name, designation, email, phone
- **Sourcing Channels** — Tag-based (LinkedIn, Naukri, Campus, etc.) — add/remove
- **Approvals** — Add steps, toggle Pending/Approved, remove

### User Management (Admin only)
- Create / edit / delete team members
- Assign roles: Admin, Recruiter, Viewer

---

## User Roles

| Role      | Can View | Can Edit Roles | Can Delete Roles | Can Manage Users |
|-----------|----------|---------------|-----------------|-----------------|
| Admin     | ✅        | ✅             | ✅               | ✅               |
| Recruiter | ✅        | ✅             | ❌               | ❌               |
| Viewer    | ✅        | ❌             | ❌               | ❌               |

---

## Prerequisites

### Local Development
- **Node.js** v18 or higher → [nodejs.org](https://nodejs.org)
- **npm** v9 or higher (comes with Node.js)
- **PostgreSQL** v14+ running locally, OR Docker Desktop

### Production Server
- Ubuntu 22.04 / 24.04 LTS (or any Debian-based OS)
- Minimum: 1 vCPU, 1 GB RAM
- Ports 22 (SSH), 80 (HTTP), 443 (HTTPS) open in firewall
- A domain pointing to your server's IP

---

## Environment Variables

Copy `server/.env.example` to `server/.env` and fill in the values:

```bash
cp server/.env.example server/.env
```

| Variable        | Description                                       | Example                              |
|-----------------|---------------------------------------------------|--------------------------------------|
| `PORT`          | Port the Express API listens on                  | `4000`                               |
| `DATABASE_URL`  | Full PostgreSQL connection string                 | `postgresql://user:pass@host/db`     |
| `DB_SSL`        | Set to `true` for managed/cloud databases        | `false`                              |
| `JWT_SECRET`    | Long random string for signing JWTs              | `change_me_to_something_very_long`   |
| `JWT_EXPIRES_IN`| JWT token lifetime                               | `7d`                                 |
| `CLIENT_ORIGIN` | Frontend origin for CORS                         | `https://your-domain.com`            |

> ⚠️ **Never commit `server/.env` to version control.** Only `.env.example` is committed.

Generate a secure JWT secret:
```bash
node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"
```

---

## Local Development Setup

### Option A — PostgreSQL via Docker (recommended)

**Step 1 — Clone the repo**
```bash
git clone https://github.com/noblemavely/recruitment-command-centre.git
cd recruitment-command-centre
```

**Step 2 — Start PostgreSQL**
```bash
docker run -d \
  --name rcc_postgres \
  -e POSTGRES_DB=rcc_db \
  -e POSTGRES_USER=rcc_user \
  -e POSTGRES_PASSWORD=rcc_pass \
  -p 5432:5432 \
  postgres:16-alpine
```

**Step 3 — Configure environment**
```bash
cp server/.env.example server/.env
# .env is already pre-configured for the docker postgres above — no changes needed
```

**Step 4 — Install dependencies**
```bash
cd server && npm install
cd ../client && npm install
```

**Step 5 — Run the schema + seed data**
```bash
cd server && npm run seed
```
This creates all tables and inserts 11 default AEW&C Mk-II roles, an admin user, and a recruiter user.

**Step 6 — Start the servers** (two terminals)
```bash
# Terminal 1 — API (port 4000)
cd server && npm run dev

# Terminal 2 — Frontend (port 5173)
cd client && npm run dev
```

Open → **http://localhost:5173**

---

### Option B — PostgreSQL installed locally (Homebrew / apt)

```bash
# macOS
brew install postgresql@16
brew services start postgresql@16
psql postgres -c "CREATE USER rcc_user WITH PASSWORD 'rcc_pass';"
psql postgres -c "CREATE DATABASE rcc_db OWNER rcc_user;"

# Ubuntu / Debian
sudo apt install postgresql -y
sudo -u postgres psql -c "CREATE USER rcc_user WITH PASSWORD 'rcc_pass';"
sudo -u postgres psql -c "CREATE DATABASE rcc_db OWNER rcc_user;"
```

Then follow Steps 3–6 from Option A above.

---

## Production Deployment — Ubuntu VPS (No Docker)

This is the recommended approach for a DigitalOcean Droplet, Hetzner VPS, AWS EC2, etc.

### Step 1 — SSH into your server

```bash
ssh root@YOUR_SERVER_IP
```

### Step 2 — Install Node.js 20

```bash
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt-get install -y nodejs
node -v   # should print v20.x.x
```

### Step 3 — Install PostgreSQL

```bash
sudo apt update && sudo apt install -y postgresql postgresql-contrib
sudo systemctl enable postgresql
sudo systemctl start postgresql
```

Create the database and user:
```bash
sudo -u postgres psql <<EOF
CREATE USER rcc_user WITH PASSWORD 'your_strong_db_password';
CREATE DATABASE rcc_db OWNER rcc_user;
GRANT ALL PRIVILEGES ON DATABASE rcc_db TO rcc_user;
EOF
```

### Step 4 — Install Nginx

```bash
sudo apt install -y nginx
sudo systemctl enable nginx
sudo systemctl start nginx
```

### Step 5 — Install PM2 (process manager)

```bash
sudo npm install -g pm2
```

### Step 6 — Clone and configure the app

```bash
cd /var/www
sudo git clone https://github.com/noblemavely/recruitment-command-centre.git rcc
sudo chown -R $USER:$USER /var/www/rcc
cd /var/www/rcc
```

**Install dependencies:**
```bash
cd server && npm install --production
cd ../client && npm install
```

**Create the production .env:**
```bash
cat > /var/www/rcc/server/.env <<EOF
PORT=4000
DATABASE_URL=postgresql://rcc_user:your_strong_db_password@localhost:5432/rcc_db
JWT_SECRET=$(node -e "console.log(require('crypto').randomBytes(64).toString('hex'))")
JWT_EXPIRES_IN=7d
CLIENT_ORIGIN=https://your-domain.com
EOF
```

### Step 7 — Seed the database

```bash
cd /var/www/rcc/server && npm run seed
```

### Step 8 — Build the React frontend

```bash
cd /var/www/rcc/client && npm run build
# Output is in /var/www/rcc/client/dist
```

### Step 9 — Start the API with PM2

```bash
cd /var/www/rcc/server
pm2 start index.js --name rcc-api
pm2 save
pm2 startup   # follow the printed command to auto-start on reboot
```

Useful PM2 commands:
```bash
pm2 status          # see running processes
pm2 logs rcc-api    # tail logs
pm2 restart rcc-api # restart
pm2 stop rcc-api    # stop
```

### Step 10 — Configure Nginx

```bash
sudo nano /etc/nginx/sites-available/rcc
```

Paste the following (replace `your-domain.com`):

```nginx
server {
    listen 80;
    server_name your-domain.com;

    # Serve React build
    root /var/www/rcc/client/dist;
    index index.html;

    # SPA fallback
    location / {
        try_files $uri $uri/ /index.html;
    }

    # Proxy API to Express
    location /api/ {
        proxy_pass http://127.0.0.1:4000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_cache_bypass $http_upgrade;
    }
}
```

Enable and reload:
```bash
sudo ln -s /etc/nginx/sites-available/rcc /etc/nginx/sites-enabled/
sudo nginx -t          # test config
sudo systemctl reload nginx
```

---

## Nginx + SSL Configuration

Install Certbot and get a free SSL certificate from Let's Encrypt:

```bash
sudo apt install -y certbot python3-certbot-nginx
sudo certbot --nginx -d your-domain.com
```

Certbot will automatically update your Nginx config to handle HTTPS and set up auto-renewal. Verify renewal works:
```bash
sudo certbot renew --dry-run
```

Your app will now be live at `https://your-domain.com`.

---

## Production Deployment — Docker Compose

If your server has Docker installed, this is the fastest path.

### Step 1 — Install Docker

```bash
curl -fsSL https://get.docker.com | sh
sudo usermod -aG docker $USER
```

### Step 2 — Clone the repo

```bash
git clone https://github.com/noblemavely/recruitment-command-centre.git
cd recruitment-command-centre
```

### Step 3 — Update secrets in docker-compose.yml

Open `docker-compose.yml` and replace:
- `JWT_SECRET` → a long random string
- `POSTGRES_PASSWORD` → a strong password
- `CLIENT_ORIGIN` → your domain

### Step 4 — Launch

```bash
docker-compose up -d --build
```

This starts three containers:
- `rcc_postgres` — PostgreSQL database
- `rcc_server` — Express API (auto-seeds on first boot)
- `rcc_client` — React app served by Nginx

Check they're running:
```bash
docker-compose ps
docker-compose logs -f server   # watch API logs
```

### Updating the app (Docker)

```bash
git pull
docker-compose up -d --build
```

---

## Database Management

### Run schema only (no seed data)

```bash
cd server
psql $DATABASE_URL -f db/schema.sql
```

### Re-seed (resets all roles to defaults)

```bash
cd server && npm run seed
```

> Note: seed is idempotent — it skips users and roles that already exist.

### Manual backup

```bash
pg_dump $DATABASE_URL > backup_$(date +%Y%m%d).sql
```

### Restore from backup

```bash
psql $DATABASE_URL < backup_20240101.sql
```

### Connect to database directly

```bash
psql postgresql://rcc_user:rcc_pass@localhost:5432/rcc_db
```

---

## API Reference

All routes except `/api/auth/login` require a `Bearer <token>` header.

### Auth

| Method | Endpoint                    | Auth     | Description               |
|--------|-----------------------------|----------|---------------------------|
| POST   | `/api/auth/login`           | None     | Login, returns JWT token  |
| GET    | `/api/auth/me`              | Any      | Get current user info     |
| POST   | `/api/auth/change-password` | Any      | Change own password       |

### Roles

| Method | Endpoint                        | Auth              | Description                  |
|--------|---------------------------------|-------------------|------------------------------|
| GET    | `/api/roles`                    | Any               | List all roles with details  |
| POST   | `/api/roles`                    | Admin / Recruiter | Create a new role            |
| GET    | `/api/roles/:id`                | Any               | Get single role              |
| PATCH  | `/api/roles/:id`                | Admin / Recruiter | Update role fields           |
| DELETE | `/api/roles/:id`                | Admin only        | Delete a role                |
| PATCH  | `/api/roles/:id/lifecycle`      | Admin / Recruiter | Update lifecycle stage counts|

### Panelists

| Method | Endpoint                              | Auth              | Description          |
|--------|---------------------------------------|-------------------|----------------------|
| POST   | `/api/roles/:id/panelists`            | Admin / Recruiter | Add panelist         |
| PATCH  | `/api/roles/:id/panelists/:pid`       | Admin / Recruiter | Edit panelist        |
| DELETE | `/api/roles/:id/panelists/:pid`       | Admin / Recruiter | Remove panelist      |

### Sourcing Channels

| Method | Endpoint                          | Auth              | Description        |
|--------|-----------------------------------|-------------------|--------------------|
| POST   | `/api/roles/:id/channels`         | Admin / Recruiter | Add channel        |
| DELETE | `/api/roles/:id/channels/:cid`    | Admin / Recruiter | Remove channel     |

### Approvals

| Method | Endpoint                           | Auth              | Description               |
|--------|------------------------------------|-------------------|---------------------------|
| POST   | `/api/roles/:id/approvals`         | Admin / Recruiter | Add approval step         |
| PATCH  | `/api/roles/:id/approvals/:aid`    | Admin / Recruiter | Toggle pending/approved   |
| DELETE | `/api/roles/:id/approvals/:aid`    | Admin / Recruiter | Remove approval step      |

### Users (Admin only)

| Method | Endpoint          | Auth       | Description         |
|--------|-------------------|------------|---------------------|
| GET    | `/api/users`      | Admin only | List all users      |
| POST   | `/api/users`      | Admin only | Create user         |
| PATCH  | `/api/users/:id`  | Admin only | Update user         |
| DELETE | `/api/users/:id`  | Admin only | Delete user         |

### Health Check

```
GET /api/health   →   { "status": "ok", "ts": "..." }
```

---

## Default Credentials

| Role      | Email                   | Password        |
|-----------|-------------------------|-----------------|
| Admin     | admin@aewc.org          | Admin@123       |
| Recruiter | recruiter@aewc.org      | Recruiter@123   |

> ⚠️ **Change these immediately after first login in production.**

---

## Troubleshooting

### `npm run seed` fails — connection refused
- Make sure PostgreSQL is running: `sudo systemctl status postgresql`
- Check `DATABASE_URL` in `server/.env` is correct
- Verify the DB and user exist: `psql -U rcc_user -d rcc_db -c "SELECT 1"`

### API returns 401 on every request
- Your JWT token may be expired (default 7 days)
- Log out and log back in to get a fresh token

### React app shows blank page after build
- Make sure `npm run build` completed without errors
- Check Nginx `root` points to `client/dist`, not `client/`
- Verify the SPA fallback (`try_files $uri /index.html`) is in your Nginx config

### Nginx returns 502 Bad Gateway
- The Express API is not running: `pm2 status`
- Start it: `pm2 start /var/www/rcc/server/index.js --name rcc-api`
- Check API logs: `pm2 logs rcc-api`

### Port 4000 already in use
```bash
lsof -i :4000          # find what's using it
kill -9 <PID>          # kill the process
```

### SSL certificate renewal fails
```bash
sudo certbot renew --dry-run    # test renewal
sudo systemctl status certbot.timer   # check auto-renewal timer
```

### Resetting everything (local dev)
```bash
# Drop and recreate DB
psql postgres -c "DROP DATABASE rcc_db;"
psql postgres -c "CREATE DATABASE rcc_db OWNER rcc_user;"
# Re-seed
cd server && npm run seed
```

---

## Updating in Production

```bash
cd /var/www/rcc

# Pull latest code
git pull

# Install any new dependencies
cd server && npm install --production
cd ../client && npm install

# Rebuild frontend
cd client && npm run build

# Restart API
pm2 restart rcc-api

# If schema changed, run seed (safe — idempotent)
cd server && npm run seed
```

---

## Repository

**GitHub:** https://github.com/noblemavely/recruitment-command-centre
