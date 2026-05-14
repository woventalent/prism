import { describe, it, expect } from "vitest";
import pg from "pg";

const { Pool } = pg;

describe("Online PostgreSQL connection", () => {
  it("connects to the online DB using PG_DATABASE_URL", async () => {
    const url = process.env.PG_DATABASE_URL;
    expect(url, "PG_DATABASE_URL must be set").toBeTruthy();

    const pool = new Pool({
      connectionString: url,
      ssl: { rejectUnauthorized: false },
    });

    const client = await pool.connect();
    const result = await client.query("SELECT 1 AS ok");
    client.release();
    await pool.end();

    expect(result.rows[0].ok).toBe(1);
  }, 15000);
});
