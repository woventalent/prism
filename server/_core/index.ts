import "dotenv/config";
import express from "express";
import { createServer } from "http";
import net from "net";
import cors from "cors";
import { registerStorageProxy } from "./storageProxy";
import { serveStatic, setupVite } from "./vite";

// Original RCC routes (ES modules)
import authRoutes  from "../routes/authRouter.js";
import rolesRoutes from "../routes/rolesRouter.js";
import usersRoutes from "../routes/usersRouter.js";

function isPortAvailable(port: number): Promise<boolean> {
  return new Promise(resolve => {
    const server = net.createServer();
    server.listen(port, () => { server.close(() => resolve(true)); });
    server.on("error", () => resolve(false));
  });
}

async function findAvailablePort(startPort = 3000): Promise<number> {
  for (let port = startPort; port < startPort + 20; port++) {
    if (await isPortAvailable(port)) return port;
  }
  throw new Error(`No available port found starting from ${startPort}`);
}

async function startServer() {
  const app = express();
  const server = createServer(app);

  // CORS – allow the configured client origin
  app.use(cors({
    origin: process.env.CLIENT_ORIGIN || "*",
    credentials: true,
  }));

  app.use(express.json({ limit: "50mb" }));
  app.use(express.urlencoded({ limit: "50mb", extended: true }));

  // Storage proxy (Manus built-in)
  registerStorageProxy(app);

  // ── Original RCC REST API ──────────────────────────────────
  app.use("/api/auth",  authRoutes);
  app.use("/api/roles", rolesRoutes);
  app.use("/api/users", usersRoutes);

  // Health check
  app.get("/api/health", (_req, res) => res.json({ status: "ok", ts: new Date() }));

  // ── Frontend ───────────────────────────────────────────────
  if (process.env.NODE_ENV === "development") {
    await setupVite(app, server);
  } else {
    serveStatic(app);
  }

  const preferredPort = parseInt(process.env.PORT || "3000");
  const port = await findAvailablePort(preferredPort);

  if (port !== preferredPort) {
    console.log(`Port ${preferredPort} is busy, using port ${port} instead`);
  }

  server.listen(port, () => {
    console.log(`Server running on http://localhost:${port}/`);
  });
}

startServer().catch(console.error);
