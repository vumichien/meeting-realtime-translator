import { config as loadDotenv } from "dotenv";
import { existsSync } from "node:fs";
import { resolve } from "node:path";
import express from "express";
import cors from "cors";
import { createSessionRouter } from "./routes/session.js";

// Load .env from server cwd first, then walk up to the monorepo root.
// The repo ships a single root-level .env (see .env.example) but server/.env
// is also accepted if present.
for (const candidate of [
  resolve(process.cwd(), ".env"),
  resolve(process.cwd(), "..", ".env"),
]) {
  if (existsSync(candidate)) {
    loadDotenv({ path: candidate });
    break;
  }
}

const PORT = Number(process.env.PORT ?? 8787);
const HOST = process.env.HOST ?? "127.0.0.1";
const IS_PROD = process.env.NODE_ENV === "production";
const CLIENT_ORIGIN = process.env.CLIENT_ORIGIN ?? (IS_PROD ? null : "http://localhost:5173");

if (!CLIENT_ORIGIN) {
  console.error("[server] CLIENT_ORIGIN must be set in production. Exiting.");
  process.exit(1);
}

const ENV_API_KEY = process.env.OPENAI_API_KEY?.trim() || undefined;

if (!ENV_API_KEY) {
  console.warn(
    "[server] OPENAI_API_KEY not set in .env. Server will only accept sessions when the client sends an Authorization header.",
  );
}

const app = express();
app.use(cors({ origin: isAllowedOrigin }));
app.use(express.json({ limit: "16kb" }));

app.get("/health", (_req, res) => {
  res.json({ ok: true });
});

app.use(createSessionRouter(ENV_API_KEY));

const server = app.listen(PORT, HOST, () => {
  const address = server.address();
  const actualPort = typeof address === "object" && address ? address.port : PORT;
  console.log(`[server] listening on http://${HOST}:${actualPort}`);
  console.log(`[server] CORS origin: ${CLIENT_ORIGIN}`);
  console.log(`[server] env API key: ${ENV_API_KEY ? "present" : "missing"}`);
  process.send?.({ type: "ready", port: actualPort });
});

server.on("error", (err: NodeJS.ErrnoException) => {
  process.send?.({ type: "error", code: err.code, message: err.message });
  console.error(`[server] listen failed: ${err.message}`);
});

function isAllowedOrigin(origin: string | undefined, callback: (err: Error | null, allow?: boolean) => void) {
  if (!origin) return callback(null, true);
  if (origin === CLIENT_ORIGIN) return callback(null, true);
  if (origin === "file://" || origin.startsWith("app://")) return callback(null, true);
  if (!IS_PROD && origin === "http://127.0.0.1:5173") return callback(null, true);
  return callback(null, false);
}
