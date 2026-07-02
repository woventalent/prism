/**
 * Multi-tenant migration — run ONCE on the server.
 * Usage: node db/migrate-multi-tenant.js
 *
 * What it does:
 *  1. Creates `clients` table
 *  2. Creates `client_users` table
 *  3. Adds `is_super_admin` to users
 *  4. Adds `client_id` to recruitment_roles and knowledge_base
 *  5. Seeds "Adani Defence & Aerospace" client
 *  6. Migrates existing data into that client
 *  7. Promotes the first admin user to super_admin
 */
require('dotenv').config({ path: require('path').join(__dirname, '../.env') });
const pool = require('../db');

async function migrate() {
  const db = await pool.connect();
  try {
    await db.query('BEGIN');

    // ── 1. clients ────────────────────────────────────────────────
    await db.query(`
      CREATE TABLE IF NOT EXISTS clients (
        id          SERIAL PRIMARY KEY,
        name        TEXT NOT NULL,
        slug        TEXT UNIQUE NOT NULL,
        description TEXT DEFAULT '',
        created_at  TIMESTAMPTZ DEFAULT NOW(),
        updated_at  TIMESTAMPTZ DEFAULT NOW()
      )
    `);

    // ── 2. is_super_admin on users ────────────────────────────────
    await db.query(`
      ALTER TABLE users ADD COLUMN IF NOT EXISTS is_super_admin BOOLEAN NOT NULL DEFAULT FALSE
    `);

    // ── 3. client_users ───────────────────────────────────────────
    await db.query(`
      CREATE TABLE IF NOT EXISTS client_users (
        id         SERIAL PRIMARY KEY,
        client_id  INTEGER NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
        user_id    INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        role       TEXT NOT NULL DEFAULT 'member'
                     CHECK (role IN ('admin','member')),
        created_at TIMESTAMPTZ DEFAULT NOW(),
        UNIQUE(client_id, user_id)
      )
    `);

    // ── 4. client_id on recruitment_roles ─────────────────────────
    await db.query(`
      ALTER TABLE recruitment_roles
        ADD COLUMN IF NOT EXISTS client_id INTEGER REFERENCES clients(id) ON DELETE CASCADE
    `);

    // ── 5. client_id on knowledge_base ────────────────────────────
    await db.query(`
      ALTER TABLE knowledge_base
        ADD COLUMN IF NOT EXISTS client_id INTEGER REFERENCES clients(id) ON DELETE CASCADE
    `);
    // Drop old single-column unique constraint and replace with composite
    await db.query(`ALTER TABLE knowledge_base DROP CONSTRAINT IF EXISTS knowledge_base_section_key`);
    await db.query(`
      CREATE UNIQUE INDEX IF NOT EXISTS knowledge_base_client_section_idx
        ON knowledge_base(client_id, section)
    `);

    // ── 6. Seed Adani client ──────────────────────────────────────
    const { rows: [adani] } = await db.query(`
      INSERT INTO clients (name, slug, description)
      VALUES ('Adani Defence & Aerospace', 'adani-da', 'AEW&C Mk-II Programme — Talent Intelligence')
      ON CONFLICT (slug) DO UPDATE SET name = EXCLUDED.name
      RETURNING id
    `);
    const cid = adani.id;

    // ── 7. Add all existing users to Adani client ─────────────────
    await db.query(`
      INSERT INTO client_users (client_id, user_id, role)
      SELECT $1, id,
        CASE WHEN role IN ('admin','recruiter') THEN 'admin' ELSE 'member' END
      FROM users
      ON CONFLICT (client_id, user_id) DO NOTHING
    `, [cid]);

    // ── 8. Promote first admin user to super_admin ────────────────
    await db.query(`
      UPDATE users SET is_super_admin = TRUE
      WHERE id = (SELECT id FROM users WHERE role = 'admin' ORDER BY id LIMIT 1)
        AND is_super_admin = FALSE
    `);

    // ── 9. Migrate existing recruitment_roles to Adani ────────────
    await db.query(`UPDATE recruitment_roles SET client_id = $1 WHERE client_id IS NULL`, [cid]);

    // ── 10. Migrate existing knowledge_base to Adani ──────────────
    await db.query(`UPDATE knowledge_base SET client_id = $1 WHERE client_id IS NULL`, [cid]);

    await db.query('COMMIT');
    console.log('✅  Multi-tenant migration complete.');
    console.log(`    Adani client id = ${cid}`);
    console.log('    First admin user is now super_admin.');
  } catch (err) {
    await db.query('ROLLBACK');
    console.error('❌  Migration failed:', err.message);
    process.exit(1);
  } finally {
    db.release();
    await pool.end();
  }
}

migrate();
