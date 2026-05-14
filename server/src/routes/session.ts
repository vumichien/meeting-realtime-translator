import { Router } from "express";
import { randomUUID } from "node:crypto";
import rateLimit from "express-rate-limit";
import { isAllowedLang, ALLOWED_LANGS } from "../config/languages.js";
import {
  mintTranslationClientSecret,
  type NoiseReductionType,
} from "../lib/openai-client.js";

const sessionLimiter = rateLimit({
  windowMs: 60_000,
  max: 20,
  standardHeaders: true,
  legacyHeaders: false,
  handler: (_req, res) => {
    res.status(429).json({
      error: "rate_limited",
      request_id: randomUUID(),
      message: "Too many session requests — try again in a minute.",
    });
  },
});

// Closed enum of mic envs the client may send. Mapped to noise_reduction.type.
const MIC_ENV_TO_NOISE: Record<string, NoiseReductionType> = {
  headset: "near_field",
  laptop: "far_field",
  room: "far_field",
};

export function createSessionRouter(envApiKey: string | undefined) {
  const router = Router();

  router.post("/session", sessionLimiter, async (req, res) => {
    const { targetLanguage, transcribeSource, micEnv } = req.body ?? {};
    const requestId = randomUUID();

    if (!isAllowedLang(targetLanguage)) {
      return res.status(400).json({
        error: "invalid_target_language",
        request_id: requestId,
        message: `targetLanguage must be one of: ${ALLOWED_LANGS.join(", ")}`,
      });
    }

    const userKey = parseBearer(req.headers.authorization);
    const apiKey = userKey ?? envApiKey;
    if (!apiKey) {
      return res.status(401).json({
        error: "no_api_key",
        request_id: requestId,
        message:
          "No OpenAI API key. Set OPENAI_API_KEY in .env or paste a key in the app.",
      });
    }

    // Default to true; require explicit `false` to disable.
    const wantTranscription =
      typeof transcribeSource === "boolean" ? transcribeSource : true;

    // Map mic env -> noise_reduction.type. Default headset (back-compat).
    const noiseReduction: NoiseReductionType =
      (typeof micEnv === "string" && MIC_ENV_TO_NOISE[micEnv]) || "near_field";

    const result = await mintTranslationClientSecret({
      targetLanguage,
      transcribeSource: wantTranscription,
      apiKey,
      noiseReduction,
      requestId,
    });

    if (!result.ok) {
      console.error(
        `[session] upstream failure (status=${result.status} code=${result.errorCode})`,
      );
      return res.status(result.status >= 400 ? result.status : 502).json({
        error: result.errorCode,
        message: result.message,
        request_id: result.requestId,
        upstream_request_id: result.upstreamRequestId,
      });
    }

    return res.json({
      client_secret: result.client_secret,
      expires_at: result.expires_at,
    });
  });

  return router;
}

function parseBearer(header: string | undefined): string | undefined {
  if (!header) return undefined;
  const match = /^Bearer\s+(.+)$/i.exec(header.trim());
  return match?.[1]?.trim() || undefined;
}
