/**
 * Seed script — runs schema + inserts default data
 * Usage: node db/seed.js
 */
require('dotenv').config({ path: require('path').join(__dirname, '../.env') });
const fs   = require('fs');
const path = require('path');
const pool = require('../db');
const bcrypt = require('bcryptjs');

async function seed() {
  const client = await pool.connect();
  try {
    console.log('▶ Running schema...');
    const schema = fs.readFileSync(path.join(__dirname, 'schema.sql'), 'utf8');
    await client.query(schema);

    // ── Admin user ──────────────────────────────────────────
    console.log('▶ Seeding admin user...');
    const hash = await bcrypt.hash('Admin@123', 10);
    await client.query(`
      INSERT INTO users (name, email, password, role)
      VALUES ($1,$2,$3,'admin')
      ON CONFLICT (email) DO NOTHING
    `, ['Admin', 'admin@aewc.org', hash]);

    // ── Default Recruiter ───────────────────────────────────
    const rHash = await bcrypt.hash('Recruiter@123', 10);
    await client.query(`
      INSERT INTO users (name, email, password, role)
      VALUES ($1,$2,$3,'recruiter')
      ON CONFLICT (email) DO NOTHING
    `, ['Recruiter One', 'recruiter@aewc.org', rHash]);

    // ── Roles ───────────────────────────────────────────────
    console.log('▶ Seeding recruitment roles...');
    const roles = [
      {
        title: 'BE / B.Tech – CSE / ECE / Mech / Electrical',
        experience: '9–10 Yrs', headcount: 1, ctc: 12, difficulty: 'red', ttf: 60,
        pitch: 'This is a senior leadership role for the AEW&C Mk-II programme. Candidates gain rare exposure to defence-grade aerospace systems, work with DRDO and HAL partners, and have access to classified technology development at scale.',
        channels: ['LinkedIn Premium', 'Defence Forums', 'IIT Alumni Network', 'Employee Referrals'],
        approvals: [
          { label: 'Budget Approval – Finance', status: 'approved' },
          { label: 'HR Head Sign-off', status: 'approved' },
          { label: 'Project Director Clearance', status: 'pending' }
        ],
        panelists: [
          { name: 'Dr. A. Kumar', designation: 'Technical Lead', email: 'a.kumar@aewc.org', phone: '+91-98001-00001' },
          { name: 'Col. R. Sharma (Retd.)', designation: 'Domain Expert', email: 'r.sharma@aewc.org', phone: '+91-98001-00002' }
        ]
      },
      {
        title: 'B.Tech / M.Tech (CSE)',
        experience: '5–7 Yrs', headcount: 2, ctc: 8, difficulty: 'yellow', ttf: 45,
        pitch: 'Mid-senior software engineering role within an ambitious national defence programme. Candidates will architect and build mission-critical embedded and real-time systems.',
        channels: ['LinkedIn', 'Naukri', 'Campus – NITs', 'Referrals'],
        approvals: [
          { label: 'Budget Approval – Finance', status: 'approved' },
          { label: 'HR Head Sign-off', status: 'pending' }
        ],
        panelists: [{ name: 'S. Menon', designation: 'Engineering Manager', email: 's.menon@aewc.org', phone: '+91-98001-00003' }]
      },
      {
        title: 'B.Tech / M.Tech (CSE)',
        experience: '3–5 Yrs', headcount: 11, ctc: 5, difficulty: 'yellow', ttf: 35,
        pitch: 'High-volume engineering hire for core software teams. Stable government-backed project, no-layoff culture, and a chance to work on real defence systems.',
        channels: ['LinkedIn', 'Naukri', 'HackerEarth', 'Campus Drives'],
        approvals: [
          { label: 'Budget Approval – Finance', status: 'approved' },
          { label: 'HR Head Sign-off', status: 'pending' }
        ],
        panelists: []
      },
      {
        title: 'B.Tech / M.Tech (CSE)',
        experience: '1–2 Yrs', headcount: 10, ctc: 3, difficulty: 'green', ttf: 25,
        pitch: 'Excellent entry-level opportunity for fresh engineers wanting to work in Indian defence tech. Structured onboarding, mentorship from senior DRDO engineers, and a proven path to senior roles.',
        channels: ['Campus Drives', 'LinkedIn', 'Internshala', 'Naukri Fresher'],
        approvals: [{ label: 'Budget Approval – Finance', status: 'approved' }],
        panelists: []
      },
      {
        title: 'BE / B.Tech – Electrical',
        experience: '3–5 Yrs', headcount: 3, ctc: 5, difficulty: 'yellow', ttf: 38,
        pitch: 'Core electrical engineering role within an aerospace defence system. Candidates work on power systems and avionics integration for AEW&C platforms.',
        channels: ['LinkedIn', 'Naukri', 'ISRO Alumni Network'],
        approvals: [{ label: 'Budget Approval – Finance', status: 'pending' }],
        panelists: []
      },
      {
        title: 'BE / B.Tech – ECE',
        experience: '3–5 Yrs', headcount: 8, ctc: 5, difficulty: 'yellow', ttf: 38,
        pitch: 'Electronics and communication engineers are critical to radar, signal processing, and embedded firmware. Candidates get exposure to world-class AESA radar systems.',
        channels: ['LinkedIn', 'Naukri', 'Defence Job Portals'],
        approvals: [{ label: 'Budget Approval – Finance', status: 'pending' }],
        panelists: []
      },
      {
        title: 'BE / B.Tech – Mechanical',
        experience: '3–5 Yrs', headcount: 4, ctc: 5, difficulty: 'green', ttf: 32,
        pitch: 'Mechanical engineers work on structural design, thermal management, and mechanical integration for airborne systems. Government-backed role with long-term stability.',
        channels: ['LinkedIn', 'Naukri', 'IIT / NIT Campus'],
        approvals: [],
        panelists: []
      },
      {
        title: 'BE / B.Tech – Aeronautical',
        experience: '3–5 Yrs', headcount: 4, ctc: 5, difficulty: 'red', ttf: 55,
        pitch: 'Aeronautical engineers are among the rarest profiles in this project. Role covers airframe integration and certification support. Very few engineers have the right combination of airborne systems and defence-project experience.',
        channels: ['LinkedIn Premium', 'HAL / DRDO Alumni', 'AIAA Network', 'Employee Referrals'],
        approvals: [],
        panelists: []
      },
      {
        title: 'Technician – Diploma (Mech / ECE / Electrical)',
        experience: 'Min 5 Yrs', headcount: 7, ctc: 5, difficulty: 'green', ttf: 28,
        pitch: 'Hands-on technical roles for experienced diploma holders. Work on assembly, testing, and maintenance of defence-grade equipment. Stable long-term engagement with structured skill development.',
        channels: ['ITI Boards', 'Naukri', 'Local Job Fairs', 'Referrals'],
        approvals: [],
        panelists: []
      },
      {
        title: 'Technical – QA / QT',
        experience: 'Min 5 Yrs', headcount: 6, ctc: 5, difficulty: 'yellow', ttf: 40,
        pitch: 'Quality Assurance and Testing specialists for a high-stakes defence project. Profiles with prior defence or aerospace QA experience are preferred. Certification and audit exposure a strong plus.',
        channels: ['LinkedIn', 'Naukri', 'ISRO / DRDO Networks'],
        approvals: [],
        panelists: []
      },
      {
        title: 'BE / B.Tech – Mech / ECE / Aero + B.Tech / M.Tech',
        experience: '4–5 Yrs', headcount: 4, ctc: 5, difficulty: 'yellow', ttf: 42,
        pitch: 'Multi-disciplinary engineering role combining mechanical, electronics, or aeronautical fundamentals with advanced degree depth. Ideal for candidates working at the intersection of hardware and systems engineering.',
        channels: ['LinkedIn', 'Naukri', 'Campus Drives – IITs / NITs'],
        approvals: [],
        panelists: []
      }
    ];

    for (const r of roles) {
      const { rows } = await client.query(`
        INSERT INTO recruitment_roles
          (title, experience, headcount, ctc_budget, difficulty, avg_ttf_days, recruiter_pitch)
        VALUES ($1,$2,$3,$4,$5,$6,$7)
        ON CONFLICT DO NOTHING
        RETURNING id
      `, [r.title, r.experience, r.headcount, r.ctc, r.difficulty, r.ttf, r.pitch]);

      if (!rows.length) continue;
      const rid = rows[0].id;

      // lifecycle row
      await client.query(`INSERT INTO lifecycle (role_id) VALUES ($1)`, [rid]);

      // channels
      for (const ch of r.channels) {
        await client.query(`INSERT INTO sourcing_channels (role_id, channel) VALUES ($1,$2)`, [rid, ch]);
      }

      // approvals
      for (const ap of r.approvals) {
        await client.query(`INSERT INTO approvals (role_id, label, status) VALUES ($1,$2,$3)`, [rid, ap.label, ap.status]);
      }

      // panelists
      for (const p of r.panelists) {
        await client.query(`INSERT INTO panelists (role_id, name, designation, email, phone) VALUES ($1,$2,$3,$4,$5)`, [rid, p.name, p.designation, p.email, p.phone]);
      }
    }

    console.log('✅ Seed complete.');
    console.log('');
    console.log('  Default credentials:');
    console.log('  Admin    → admin@aewc.org     / Admin@123');
    console.log('  Recruiter→ recruiter@aewc.org / Recruiter@123');
  } catch (err) {
    console.error('Seed error:', err.message);
    throw err;
  } finally {
    client.release();
    pool.end();
  }
}

seed().catch(() => process.exit(1));
