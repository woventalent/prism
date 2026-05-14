/**
 * RCC API Integration Tests
 * Tests the original Express routes mounted in the Manus entry point.
 * Requires PG_DATABASE_URL to be set in the environment.
 */
import { describe, it, expect, beforeAll } from "vitest";
import express from "express";
import request from "supertest";
import authRoutes  from "./routes/authRouter.js";
import rolesRoutes from "./routes/rolesRouter.js";
import usersRoutes from "./routes/usersRouter.js";

// Build a minimal test app
function buildApp() {
  const app = express();
  app.use(express.json());
  app.use("/api/auth",  authRoutes);
  app.use("/api/roles", rolesRoutes);
  app.use("/api/users", usersRoutes);
  app.get("/api/health", (_req, res) => res.json({ status: "ok" }));
  return app;
}

let app: ReturnType<typeof buildApp>;
let adminToken: string;
let recruiterToken: string;

beforeAll(async () => {
  app = buildApp();
});

describe("Health", () => {
  it("GET /api/health returns ok", async () => {
    const res = await request(app).get("/api/health");
    expect(res.status).toBe(200);
    expect(res.body.status).toBe("ok");
  });
});

describe("Auth", () => {
  it("POST /api/auth/login with valid admin credentials returns token", async () => {
    const res = await request(app)
      .post("/api/auth/login")
      .send({ email: "admin@aewc.org", password: "Admin@123" });
    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty("token");
    expect(res.body.user.role).toBe("admin");
    adminToken = res.body.token;
  });

  it("POST /api/auth/login with valid recruiter credentials returns token", async () => {
    const res = await request(app)
      .post("/api/auth/login")
      .send({ email: "recruiter@aewc.org", password: "Recruiter@123" });
    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty("token");
    expect(res.body.user.role).toBe("recruiter");
    recruiterToken = res.body.token;
  });

  it("POST /api/auth/login with wrong password returns 401", async () => {
    const res = await request(app)
      .post("/api/auth/login")
      .send({ email: "admin@aewc.org", password: "wrongpassword" });
    expect(res.status).toBe(401);
  });

  it("GET /api/auth/me with valid token returns user", async () => {
    const res = await request(app)
      .get("/api/auth/me")
      .set("Authorization", `Bearer ${adminToken}`);
    expect(res.status).toBe(200);
    expect(res.body.email).toBe("admin@aewc.org");
  });

  it("GET /api/auth/me without token returns 401", async () => {
    const res = await request(app).get("/api/auth/me");
    expect(res.status).toBe(401);
  });
});

describe("Roles", () => {
  it("GET /api/roles returns array of roles", async () => {
    const res = await request(app)
      .get("/api/roles")
      .set("Authorization", `Bearer ${adminToken}`);
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
    expect(res.body.length).toBeGreaterThan(0);
  });

  it("GET /api/roles/:id returns role with lifecycle, approvals, panelists, channels", async () => {
    const listRes = await request(app)
      .get("/api/roles")
      .set("Authorization", `Bearer ${adminToken}`);
    const firstId = listRes.body[0].id;

    const res = await request(app)
      .get(`/api/roles/${firstId}`)
      .set("Authorization", `Bearer ${adminToken}`);
    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty("id");
    expect(res.body).toHaveProperty("lifecycle");
    expect(res.body).toHaveProperty("approvals");
    expect(res.body).toHaveProperty("panelists");
    expect(res.body).toHaveProperty("sourcing_channels");
  });

  it("GET /api/roles without token returns 401", async () => {
    const res = await request(app).get("/api/roles");
    expect(res.status).toBe(401);
  });
});

describe("Roles CRUD write operations", () => {
  let createdRoleId: number;

  it("POST /api/roles creates a new role (admin)", async () => {
    const res = await request(app)
      .post("/api/roles")
      .set("Authorization", `Bearer ${adminToken}`)
      .send({
        title: "Test Role – Vitest",
        experience: "2–3 Yrs",
        headcount: 1,
        ctc_budget: 5,
        difficulty: "green",
        avg_ttf_days: 30,
        recruiter_pitch: "Test pitch",
      });
    expect(res.status).toBe(201);
    expect(res.body).toHaveProperty("id");
    createdRoleId = res.body.id;
  });

  it("PATCH /api/roles/:id updates the role", async () => {
    const res = await request(app)
      .patch(`/api/roles/${createdRoleId}`)
      .set("Authorization", `Bearer ${adminToken}`)
      .send({ difficulty: "yellow" });
    expect(res.status).toBe(200);
  });

  it("PATCH /api/roles/:id/lifecycle updates lifecycle counts", async () => {
    const res = await request(app)
      .patch(`/api/roles/${createdRoleId}/lifecycle`)
      .set("Authorization", `Bearer ${adminToken}`)
      .send({ sourcing: 3, screening: 2, interview: 1, offered: 0, joined: 0 });
    expect(res.status).toBe(200);
  });

  it("POST /api/roles/:id/approvals adds an approval", async () => {
    const res = await request(app)
      .post(`/api/roles/${createdRoleId}/approvals`)
      .set("Authorization", `Bearer ${adminToken}`)
      .send({ label: "Finance Approval" });
    expect(res.status).toBe(201);
    expect(res.body).toHaveProperty("id");
  });

  it("POST /api/roles/:id/panelists adds a panelist", async () => {
    const res = await request(app)
      .post(`/api/roles/${createdRoleId}/panelists`)
      .set("Authorization", `Bearer ${adminToken}`)
      .send({ name: "Test Panelist", designation: "Engineer", email: "test@aewc.org", phone: "+91-99999-00000" });
    expect(res.status).toBe(201);
    expect(res.body).toHaveProperty("id");
  });

  it("POST /api/roles/:id/channels adds a sourcing channel", async () => {
    const res = await request(app)
      .post(`/api/roles/${createdRoleId}/channels`)
      .set("Authorization", `Bearer ${adminToken}`)
      .send({ channel: "LinkedIn" });
    expect(res.status).toBe(201);
  });

  it("DELETE /api/roles/:id deletes the role", async () => {
    const res = await request(app)
      .delete(`/api/roles/${createdRoleId}`)
      .set("Authorization", `Bearer ${adminToken}`);
    expect(res.status).toBe(200);
  });
});

describe("Users (admin only)", () => {
  it("GET /api/users with admin token returns user list", async () => {
    const res = await request(app)
      .get("/api/users")
      .set("Authorization", `Bearer ${adminToken}`);
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
    const emails = res.body.map((u: { email: string }) => u.email);
    expect(emails).toContain("admin@aewc.org");
  });

  it("GET /api/users with recruiter token returns 403", async () => {
    const res = await request(app)
      .get("/api/users")
      .set("Authorization", `Bearer ${recruiterToken}`);
    expect(res.status).toBe(403);
  });

  it("GET /api/users without token returns 401", async () => {
    const res = await request(app).get("/api/users");
    expect(res.status).toBe(401);
  });
});
