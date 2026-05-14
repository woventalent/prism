import pg from "pg";
import "dotenv/config";

const { Pool } = pg;

// Use PG_DATABASE_URL (custom secret pointing to the online PostgreSQL DB)
const connStr = process.env.PG_DATABASE_URL || process.env.DATABASE_URL;

if (!connStr) {
  console.error("[pgpool] FATAL: No database connection string found. Set PG_DATABASE_URL.");
}

console.log(`[pgpool] NODE_ENV=${process.env.NODE_ENV}, connecting to external PostgreSQL...`);

// SSL disabled — the hosted PostgreSQL server does not require SSL
const pool = new Pool({
  connectionString: connStr,
  ssl: false,
  connectionTimeoutMillis: 10000,
});

pool.on("error", (err: Error) => {
  console.error("[pgpool] Unexpected PG pool error:", err.message);
});

// Log connection status on startup
pool.connect().then(client => {
  console.log("[pgpool] Connected to PostgreSQL database successfully");
  client.release();
}).catch(err => {
  console.error("[pgpool] Failed to connect to PostgreSQL:", err.message);
});

export default pool;
