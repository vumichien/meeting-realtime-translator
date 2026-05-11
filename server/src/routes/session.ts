import { Router } from "express";
import { isAllowedLang, ALLOWED_LANGS } from "../config/languages.js";
import { mintTranslationClientSecret } from "../lib/openai-client.js";

export function createSessionRouter(envApiKey: string | undefined) {
  const router = Router();

  router.post("/session", async (req, res) => {
    const { targetLanguage, transcribeSource } = req.body ?? {};

    if (!isAllowedLang(targetLanguage)) {
      return res.status(400).json({
        error: "invalid_target_language",
        message: `targetLanguage must be one of: ${ALLOWED_LANGS.join(", ")}`,
      });
    }

    const userKey = parseBearer(req.headers.authorization);
    const apiKey = userKey ?? envApiKey;
    if (!apiKey) {
      return res.status(401).json({
        error: "no_api_key",
        message:
          "No OpenAI API key. Set OPENAI_API_KEY in .env or paste a key in the app.",
      });
    }

    // Default to true; require explicit `false` to disable.
    const wantTranscription =
      typeof transcribeSource === "boolean" ? transcribeSource : true;

    const result = await mintTranslationClientSecret({
      targetLanguage,
      transcribeSource: wantTranscription,
      apiKey,
    });

    if (!result.ok) {
      console.error(
        `[session] upstream failure (status=${result.status} code=${result.errorCode})`,
      );
      return res.status(result.status >= 400 ? result.status : 502).json({
        error: result.errorCode,
        message: result.message,
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
