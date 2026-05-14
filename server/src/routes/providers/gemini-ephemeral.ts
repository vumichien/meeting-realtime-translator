import { Router } from "express";
import { randomUUID } from "node:crypto";
import rateLimit from "express-rate-limit";
import { mintGeminiEphemeralToken } from "../../lib/gemini-client.js";
import { mintGeminiVertexToken } from "../../lib/gemini-auth.js";

const limiter = rateLimit({
  windowMs: 60_000,
  max: 20,
  standardHeaders: true,
  legacyHeaders: false,
  handler: (_req, res) => {
    res.status(429).json({
      error: "rate_limited",
      request_id: randomUUID(),
      message: "Too many Gemini token requests — try again in a minute.",
    });
  },
});

export function createGeminiEphemeralRouter(envGeminiApiKey: string | undefined) {
  const router = Router();

  router.post("/providers/gemini/ephemeral-token", limiter, async (req, res) => {
    const requestId = randomUUID();
    const body = req.body ?? {};
    const authMode: "ai-studio" | "vertex" =
      body.authMode === "vertex" ? "vertex" : "ai-studio";

    if (authMode === "ai-studio") {
      const userKey = parseBearer(req.headers.authorization);
      const apiKey = userKey ?? envGeminiApiKey;
      if (!apiKey) {
        return res.status(401).json({
          error: "no_api_key",
          request_id: requestId,
          message:
            "No Gemini API key. Paste your AI Studio key in the app or set GEMINI_API_KEY in .env.",
        });
      }
      const result = await mintGeminiEphemeralToken({ apiKey, requestId });
      if (!result.ok) {
        console.error(
          `[gemini-ephemeral] AI Studio mint failed status=${result.status} code=${result.errorCode}`,
        );
        return res.status(result.status >= 400 ? result.status : 502).json({
          error: result.errorCode,
          message: result.message,
          request_id: result.requestId,
          upstream_request_id: result.upstreamRequestId,
        });
      }
      return res.json({
        token: result.token,
        expires_at: result.expires_at,
        wsBaseUrl: result.wsBaseUrl,
        authMode,
      });
    }

    // Vertex AI mode.
    const project: string | undefined = body.project;
    const region: string | undefined = body.region;
    const serviceAccountJson: string | undefined = body.serviceAccountJson;
    if (!project || !region || !serviceAccountJson) {
      return res.status(400).json({
        error: "missing_vertex_config",
        request_id: requestId,
        message:
          "Vertex mode requires project, region, and serviceAccountJson in the request body.",
      });
    }
    const result = await mintGeminiVertexToken({
      serviceAccountJson,
      project,
      region,
      requestId,
    });
    if (!result.ok) {
      console.error(
        `[gemini-ephemeral] Vertex mint failed status=${result.status} code=${result.errorCode}`,
      );
      return res.status(result.status >= 400 ? result.status : 502).json({
        error: result.errorCode,
        message: result.message,
        request_id: result.requestId,
      });
    }
    return res.json({
      token: result.accessToken,
      expires_at: result.expires_at,
      wsBaseUrl: result.wsBaseUrl,
      authMode,
      project,
      region,
    });
  });

  return router;
}

function parseBearer(header: string | undefined): string | undefined {
  if (!header) return undefined;
  const match = /^Bearer\s+(.+)$/i.exec(header.trim());
  return match?.[1]?.trim() || undefined;
}
