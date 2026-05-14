import { Router } from "express";
import pool from "../pgpool.js";
import { authenticate, authorize } from "../middleware/auth.js";
import type { PoolClient } from "pg";

const router = Router();

// All routes require authentication
router.use(authenticate);

// ─── Helper: fetch a full role by id ─────────────────────────
async function fetchRole(client: PoolClient, id: number) {
  const { rows: role } = await client.query(
    `SELECT r.*,
            row_to_json(l.*) AS lifecycle
     FROM recruitment_roles r
     LEFT JOIN lifecycle l ON l.role_id = r.id
     WHERE r.id = $1`,
    [id]
  );
  if (!role[0]) return null;
  const { rows: panelists }  = await client.query("SELECT * FROM panelists WHERE role_id = $1 ORDER BY id", [id]);
  const { rows: channels }   = await client.query("SELECT * FROM sourcing_channels WHERE role_id = $1 ORDER BY id", [id]);
  const { rows: approvals }  = await client.query("SELECT * FROM approvals WHERE role_id = $1 ORDER BY id", [id]);
  return { ...role[0], panelists, sourcing_channels: channels, approvals };
}

// ── GET /api/roles ────────────────────────────────────────────
router.get("/", async (_req, res) => {
  try {
    const { rows } = await pool.query(`
      SELECT r.*,
             COALESCE(json_agg(DISTINCT p.*) FILTER (WHERE p.id IS NOT NULL), '[]') AS panelists,
             COALESCE(json_agg(DISTINCT sc.*) FILTER (WHERE sc.id IS NOT NULL), '[]') AS sourcing_channels,
             COALESCE(json_agg(DISTINCT ap.*) FILTER (WHERE ap.id IS NOT NULL), '[]') AS approvals,
             row_to_json(l.*) AS lifecycle
      FROM recruitment_roles r
      LEFT JOIN panelists        p  ON p.role_id  = r.id
      LEFT JOIN sourcing_channels sc ON sc.role_id = r.id
      LEFT JOIN approvals         ap ON ap.role_id  = r.id
      LEFT JOIN lifecycle         l  ON l.role_id   = r.id
      GROUP BY r.id, l.id
      ORDER BY r.id
    `);
    res.json(rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Server error" });
  }
});

// ── GET /api/roles/:id ────────────────────────────────────────
router.get("/:id", async (req, res) => {
  const client = await pool.connect();
  try {
    const role = await fetchRole(client, parseInt(req.params.id));
    if (!role) return res.status(404).json({ error: "Role not found" });
    res.json(role);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Server error" });
  } finally {
    client.release();
  }
});

// ── POST /api/roles ─────── admin + recruiter ─────────────────
router.post("/", authorize("admin", "recruiter"), async (req, res) => {
  const {
    title, experience, headcount, ctc_budget, difficulty,
    avg_ttf_days, jd_link, questionnaire_link, assessment_link,
    feedback_form_link, recruiter_pitch,
  } = req.body;
  if (!title) return res.status(400).json({ error: "Title is required" });

  const client = await pool.connect();
  try {
    await client.query("BEGIN");
    const { rows } = await client.query(
      `INSERT INTO recruitment_roles
         (title, experience, headcount, ctc_budget, difficulty, avg_ttf_days,
          jd_link, questionnaire_link, assessment_link, feedback_form_link, recruiter_pitch)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11)
       RETURNING *`,
      [
        title, experience || "", headcount || 1, ctc_budget || 5,
        difficulty || "yellow", avg_ttf_days || null,
        jd_link || "", questionnaire_link || "", assessment_link || "",
        feedback_form_link || "", recruiter_pitch || "",
      ]
    );
    const roleId = rows[0].id;
    await client.query("INSERT INTO lifecycle (role_id) VALUES ($1)", [roleId]);
    await client.query("COMMIT");
    const full = await fetchRole(client, roleId);
    res.status(201).json(full);
  } catch (err) {
    await client.query("ROLLBACK");
    console.error(err);
    res.status(500).json({ error: "Server error" });
  } finally {
    client.release();
  }
});

// ── PATCH /api/roles/:id ─── admin + recruiter ────────────────
router.patch("/:id", authorize("admin", "recruiter"), async (req, res) => {
  const id = parseInt(req.params.id);
  const fields = [
    "title", "experience", "headcount", "ctc_budget", "filled", "in_progress",
    "difficulty", "avg_ttf_days", "jd_link", "questionnaire_link",
    "assessment_link", "feedback_form_link", "recruiter_pitch",
  ];
  const updates: string[] = [];
  const values: unknown[] = [];
  let idx = 1;

  for (const f of fields) {
    if (req.body[f] !== undefined) {
      updates.push(`${f} = $${idx++}`);
      values.push(req.body[f]);
    }
  }
  if (!updates.length) return res.status(400).json({ error: "Nothing to update" });
  values.push(id);

  const client = await pool.connect();
  try {
    const { rows } = await client.query(
      `UPDATE recruitment_roles SET ${updates.join(", ")} WHERE id = $${idx} RETURNING *`,
      values
    );
    if (!rows[0]) return res.status(404).json({ error: "Role not found" });
    const full = await fetchRole(client, id);
    res.json(full);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Server error" });
  } finally {
    client.release();
  }
});

// ── DELETE /api/roles/:id ─── admin only ──────────────────────
router.delete("/:id", authorize("admin"), async (req, res) => {
  try {
    const { rowCount } = await pool.query(
      "DELETE FROM recruitment_roles WHERE id = $1",
      [parseInt(req.params.id)]
    );
    if (!rowCount) return res.status(404).json({ error: "Role not found" });
    res.json({ message: "Role deleted" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Server error" });
  }
});

// ── PATCH /api/roles/:id/lifecycle ───────────────────────────
router.patch("/:id/lifecycle", authorize("admin", "recruiter"), async (req, res) => {
  const id = parseInt(req.params.id);
  const { sourcing, screening, interview, offered, joined } = req.body;
  try {
    const { rows } = await pool.query(
      `UPDATE lifecycle SET
         sourcing  = COALESCE($1, sourcing),
         screening = COALESCE($2, screening),
         interview = COALESCE($3, interview),
         offered   = COALESCE($4, offered),
         joined    = COALESCE($5, joined)
       WHERE role_id = $6
       RETURNING *`,
      [sourcing, screening, interview, offered, joined, id]
    );
    if (!rows[0]) return res.status(404).json({ error: "Role not found" });
    res.json(rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Server error" });
  }
});

// ══════════════════════════════════════════════════════════════
//  PANELISTS
// ══════════════════════════════════════════════════════════════
router.post("/:id/panelists", authorize("admin", "recruiter"), async (req, res) => {
  const { name, designation, email, phone } = req.body;
  if (!name) return res.status(400).json({ error: "Name required" });
  try {
    const { rows } = await pool.query(
      `INSERT INTO panelists (role_id, name, designation, email, phone)
       VALUES ($1,$2,$3,$4,$5) RETURNING *`,
      [parseInt(req.params.id), name, designation || "", email || "", phone || ""]
    );
    res.status(201).json(rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Server error" });
  }
});

router.patch("/:id/panelists/:pid", authorize("admin", "recruiter"), async (req, res) => {
  const { name, designation, email, phone } = req.body;
  try {
    const { rows } = await pool.query(
      `UPDATE panelists SET
         name        = COALESCE($1, name),
         designation = COALESCE($2, designation),
         email       = COALESCE($3, email),
         phone       = COALESCE($4, phone)
       WHERE id = $5 AND role_id = $6 RETURNING *`,
      [name, designation, email, phone, parseInt(req.params.pid), parseInt(req.params.id)]
    );
    if (!rows[0]) return res.status(404).json({ error: "Panelist not found" });
    res.json(rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Server error" });
  }
});

router.delete("/:id/panelists/:pid", authorize("admin", "recruiter"), async (req, res) => {
  try {
    await pool.query("DELETE FROM panelists WHERE id = $1 AND role_id = $2", [
      parseInt(req.params.pid),
      parseInt(req.params.id),
    ]);
    res.json({ message: "Panelist removed" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Server error" });
  }
});

// ══════════════════════════════════════════════════════════════
//  SOURCING CHANNELS
// ══════════════════════════════════════════════════════════════
router.post("/:id/channels", authorize("admin", "recruiter"), async (req, res) => {
  const { channel } = req.body;
  if (!channel) return res.status(400).json({ error: "Channel name required" });
  try {
    const { rows } = await pool.query(
      "INSERT INTO sourcing_channels (role_id, channel) VALUES ($1,$2) RETURNING *",
      [parseInt(req.params.id), channel]
    );
    res.status(201).json(rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Server error" });
  }
});

router.delete("/:id/channels/:cid", authorize("admin", "recruiter"), async (req, res) => {
  try {
    await pool.query("DELETE FROM sourcing_channels WHERE id = $1 AND role_id = $2", [
      parseInt(req.params.cid),
      parseInt(req.params.id),
    ]);
    res.json({ message: "Channel removed" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Server error" });
  }
});

// ══════════════════════════════════════════════════════════════
//  APPROVALS
// ══════════════════════════════════════════════════════════════
router.post("/:id/approvals", authorize("admin", "recruiter"), async (req, res) => {
  const { label, status } = req.body;
  if (!label) return res.status(400).json({ error: "Label required" });
  try {
    const { rows } = await pool.query(
      `INSERT INTO approvals (role_id, label, status)
       VALUES ($1,$2,$3) RETURNING *`,
      [parseInt(req.params.id), label, status || "pending"]
    );
    res.status(201).json(rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Server error" });
  }
});

router.patch("/:id/approvals/:aid", authorize("admin", "recruiter"), async (req, res) => {
  const { status } = req.body;
  try {
    const { rows } = await pool.query(
      "UPDATE approvals SET status = $1 WHERE id = $2 AND role_id = $3 RETURNING *",
      [status, parseInt(req.params.aid), parseInt(req.params.id)]
    );
    if (!rows[0]) return res.status(404).json({ error: "Approval not found" });
    res.json(rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Server error" });
  }
});

router.delete("/:id/approvals/:aid", authorize("admin", "recruiter"), async (req, res) => {
  try {
    await pool.query("DELETE FROM approvals WHERE id = $1 AND role_id = $2", [
      parseInt(req.params.aid),
      parseInt(req.params.id),
    ]);
    res.json({ message: "Approval removed" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Server error" });
  }
});

export default router;
