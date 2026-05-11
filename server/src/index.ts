import "dotenv/config";
import express from "express";
import cors from "cors";
import { createSessionRouter } from "./routes/session.js";

const PORT = Number(process.env.PORT ?? 8787);
const CLIENT_ORIGIN = process.env.CLIENT_ORIGIN ?? "http://localhost:5173";
const ENV_API_KEY = process.env.OPENAI_API_KEY?.trim() || undefined;

if (!ENV_API_KEY) {
  console.warn(
    "[server] OPENAI_API_KEY not set in .env. Server will only accept sessions when the client sends an Authorization header.",
  );
}

const app = express();
app.use(cors({ origin: CLIENT_ORIGIN }));
app.use(express.json({ limit: "16kb" }));

app.get("/health", (_req, res) => {
  res.json({ ok: true });
});

app.use(createSessionRouter(ENV_API_KEY));

app.listen(PORT, () => {
  console.log(`[server] listening on http://localhost:${PORT}`);
  console.log(`[server] CORS origin: ${CLIENT_ORIGIN}`);
  console.log(`[server] env API key: ${ENV_API_KEY ? "present" : "missing"}`);
});
