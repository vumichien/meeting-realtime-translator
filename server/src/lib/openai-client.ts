// Thin fetch wrapper around the OpenAI Realtime Translations client-secret endpoint.
// Cookbook reference: openai.md §"Create the translation client secret".

const TRANSLATION_CLIENT_SECRET_URL =
  "https://api.openai.com/v1/realtime/translations/client_secrets";

const REALTIME_TRANSLATE_MODEL = "gpt-realtime-translate";
const SOURCE_TRANSCRIPTION_MODEL = "gpt-realtime-whisper";

// Server-side noise reduction mode the API accepts.
// near_field = close-talking mic (headset). far_field = laptop / room mic.
export type NoiseReductionType = "near_field" | "far_field";

export interface MintOptions {
  targetLanguage: string;
  transcribeSource: boolean;
  apiKey: string;
  noiseReduction?: NoiseReductionType;
}

export interface MintResult {
  ok: true;
  client_secret: string;
  expires_at: number | null;
  raw: unknown;
}

export interface MintFailure {
  ok: false;
  status: number;
  errorCode: string;
  message: string;
}

export async function mintTranslationClientSecret(
  opts: MintOptions,
): Promise<MintResult | MintFailure> {
  const noiseType: NoiseReductionType = opts.noiseReduction ?? "near_field";

  // Note: `turn_detection` is NOT supported on translate sessions (probed
  // 2026-05-11: API returns 400 unknown_parameter). The model handles chunking
  // internally. Only `noise_reduction` and `transcription` are configurable.
  const sessionConfig: Record<string, unknown> = {
    model: REALTIME_TRANSLATE_MODEL,
    audio: {
      input: {
        noise_reduction: { type: noiseType },
        ...(opts.transcribeSource
          ? { transcription: { model: SOURCE_TRANSCRIPTION_MODEL } }
          : {}),
      },
      output: { language: opts.targetLanguage },
    },
  };

  let response: Response;
  try {
    response = await fetch(TRANSLATION_CLIENT_SECRET_URL, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${opts.apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ session: sessionConfig }),
    });
  } catch (err) {
    return {
      ok: false,
      status: 502,
      errorCode: "upstream_unreachable",
      message: err instanceof Error ? err.message : "fetch failed",
    };
  }

  const text = await response.text();
  let json: unknown;
  try {
    json = text ? JSON.parse(text) : {};
  } catch {
    return {
      ok: false,
      status: response.status,
      errorCode: "upstream_bad_json",
      message: `non-JSON body from upstream (status ${response.status})`,
    };
  }

  if (!response.ok) {
    const message =
      (typeof json === "object" && json && "error" in json
        ? (json as { error?: { message?: string } }).error?.message
        : undefined) ?? `upstream status ${response.status}`;
    return {
      ok: false,
      status: response.status,
      errorCode: "upstream_failed",
      message,
    };
  }

  const secretValue = extractClientSecret(json);
  if (!secretValue) {
    return {
      ok: false,
      status: 500,
      errorCode: "missing_client_secret",
      message: "Upstream response did not contain a client_secret",
    };
  }

  return {
    ok: true,
    client_secret: secretValue.value,
    expires_at: secretValue.expires_at,
    raw: json,
  };
}

interface ExtractedSecret {
  value: string;
  expires_at: number | null;
}

function extractClientSecret(json: unknown): ExtractedSecret | null {
  if (!json || typeof json !== "object") return null;
  const obj = json as Record<string, unknown>;

  // Current API shape (verified 2026-05): { value: "ek_...", expires_at, session }
  const topValue = obj.value;
  if (typeof topValue === "string") {
    const expires = typeof obj.expires_at === "number" ? obj.expires_at : null;
    return { value: topValue, expires_at: expires };
  }

  // Legacy / cookbook shape: { client_secret: "..." } or { client_secret: { value, expires_at } }
  const direct = obj.client_secret;
  if (typeof direct === "string") {
    const expires = typeof obj.expires_at === "number" ? obj.expires_at : null;
    return { value: direct, expires_at: expires };
  }
  if (direct && typeof direct === "object") {
    const nested = direct as Record<string, unknown>;
    const value = typeof nested.value === "string" ? nested.value : null;
    if (value) {
      const expires =
        typeof nested.expires_at === "number"
          ? nested.expires_at
          : typeof obj.expires_at === "number"
            ? obj.expires_at
            : null;
      return { value, expires_at: expires };
    }
  }
  return null;
}
