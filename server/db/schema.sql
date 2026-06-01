-- ============================================================
--  Recruitment Command Centre — PostgreSQL Schema
-- ============================================================

-- Extensions
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ─── Users ───────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS users (
  id          SERIAL PRIMARY KEY,
  name        TEXT NOT NULL,
  email       TEXT NOT NULL UNIQUE,
  password    TEXT NOT NULL,
  role        TEXT NOT NULL DEFAULT 'viewer'  -- admin | recruiter | viewer
                CHECK (role IN ('admin','recruiter','viewer')),
  created_at  TIMESTAMPTZ DEFAULT NOW()
);

-- ─── Recruitment Roles ───────────────────────────────────────
CREATE TABLE IF NOT EXISTS recruitment_roles (
  id                  SERIAL PRIMARY KEY,
  title               TEXT NOT NULL,
  experience          TEXT NOT NULL DEFAULT '',
  headcount           INTEGER NOT NULL DEFAULT 1,
  ctc_budget          NUMERIC(10,2) NOT NULL DEFAULT 5,
  filled              INTEGER NOT NULL DEFAULT 0,
  in_progress         INTEGER NOT NULL DEFAULT 0,
  difficulty          TEXT NOT NULL DEFAULT 'yellow'
                        CHECK (difficulty IN ('green','yellow','red')),
  avg_ttf_days        INTEGER DEFAULT NULL,
  jd_link             TEXT DEFAULT '',
  questionnaire_link  TEXT DEFAULT '',
  assessment_link     TEXT DEFAULT '',
  feedback_form_link  TEXT DEFAULT '',
  recruiter_pitch     TEXT DEFAULT '',
  created_at          TIMESTAMPTZ DEFAULT NOW(),
  updated_at          TIMESTAMPTZ DEFAULT NOW()
);

-- ─── Lifecycle Tracker ───────────────────────────────────────
CREATE TABLE IF NOT EXISTS lifecycle (
  id          SERIAL PRIMARY KEY,
  role_id     INTEGER NOT NULL REFERENCES recruitment_roles(id) ON DELETE CASCADE,
  sourcing    INTEGER NOT NULL DEFAULT 0,
  screening   INTEGER NOT NULL DEFAULT 0,
  interview   INTEGER NOT NULL DEFAULT 0,
  offered     INTEGER NOT NULL DEFAULT 0,
  joined      INTEGER NOT NULL DEFAULT 0
);

-- ─── Interview Panelists ─────────────────────────────────────
CREATE TABLE IF NOT EXISTS panelists (
  id           SERIAL PRIMARY KEY,
  role_id      INTEGER NOT NULL REFERENCES recruitment_roles(id) ON DELETE CASCADE,
  name         TEXT NOT NULL,
  designation  TEXT DEFAULT '',
  email        TEXT DEFAULT '',
  phone        TEXT DEFAULT '',
  created_at   TIMESTAMPTZ DEFAULT NOW()
);

-- ─── Sourcing Channels ───────────────────────────────────────
CREATE TABLE IF NOT EXISTS sourcing_channels (
  id        SERIAL PRIMARY KEY,
  role_id   INTEGER NOT NULL REFERENCES recruitment_roles(id) ON DELETE CASCADE,
  channel   TEXT NOT NULL
);

-- ─── Approvals ───────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS approvals (
  id        SERIAL PRIMARY KEY,
  role_id   INTEGER NOT NULL REFERENCES recruitment_roles(id) ON DELETE CASCADE,
  label     TEXT NOT NULL,
  status    TEXT NOT NULL DEFAULT 'pending'
              CHECK (status IN ('pending','approved'))
);

-- ─── Knowledge Base ─────────────────────────────────────────
CREATE TABLE IF NOT EXISTS knowledge_base (
  id         SERIAL PRIMARY KEY,
  section    VARCHAR(100) UNIQUE NOT NULL,
  data       JSONB NOT NULL DEFAULT '{}',
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ─── Auto-update updated_at ──────────────────────────────────
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS set_updated_at ON recruitment_roles;
CREATE TRIGGER set_updated_at
  BEFORE UPDATE ON recruitment_roles
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();
