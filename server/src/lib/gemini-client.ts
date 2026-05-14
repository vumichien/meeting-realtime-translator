// Mint an ephemeral auth token for Gemini Live API (AI Studio mode).
// Reference: https://ai.google.dev/api/ephemeral-tokens
//
// AI Studio flow:
//   POST https://generativelanguage.googleapis.com/v1beta/auth/tokens
//     ?key=<server-side api key>
//   { uses: 1, expireTime: <iso-string> }
//   -> { name: "authTokens/...", token: "..." }
//
// Browser then opens WSS with `?access_token=<token>`.

const TOKENS_CREATE_URL =
  "https://generativelanguage.googleapis.com/v1beta/auth/tokens";

const AI_STUDIO_WS_BASE = "wss://generativelanguage.googleapis.com";

export interface MintGeminiOptions {
  apiKey: string;
  ttlSeconds?: number;
  requestId: string;
}

export interface MintGeminiResult {
  ok: true;
  token: string;
  expires_at: number;
  wsBaseUrl: string;
  raw: unknown;
}

export interface MintGeminiFailure {
  ok: false;
  status: number;
  errorCode: string;
  message: string;
  requestId: string;
  upstreamRequestId?: string;
}

export async function mintGeminiEphemeralToken(
  opts: MintGeminiOptions,
): Promise<MintGeminiResult | MintGeminiFailure> {
  const ttlSec = opts.ttlSeconds ?? 30 * 60; // 30 min default
  const expiresAtMs = Date.now() + ttlSec * 1000;
  const expireTime = new Date(expiresAtMs).toISOString();

  const url = `${TOKENS_CREATE_URL}?key=${encodeURIComponent(opts.apiKey)}`;

  let response: Response;
  try {
    response = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Client-Request-Id": opts.requestId,
      },
      body: JSON.stringify({
        uses: 1,
        expireTime,
        newSessionExpireTime: expireTime,
      }),
    });
  } catch (err) {
    return {
      ok: false,
      status: 502,
      errorCode: "upstream_unreachable",
      message: err instanceof Error ? err.message : "fetch failed",
      requestId: opts.requestId,
    };
  }

  const upstreamRequestId = response.headers.get("x-request-id") ?? undefined;
  const text = await response.text();
  let json: any = {};
  try {
    json = text ? JSON.parse(text) : {};
  } catch {
    return {
      ok: false,
      status: response.status,
      errorCode: "upstream_bad_json",
      message: `non-JSON body from Gemini (status ${response.status})`,
      requestId: opts.requestId,
      upstreamRequestId,
    };
  }

  if (!response.ok) {
    const message: string =
      json?.error?.message ?? `upstream status ${response.status}`;
    return {
      ok: false,
      status: response.status,
      errorCode: classifyGeminiFailure(response.status, message),
      message,
      requestId: opts.requestId,
      upstreamRequestId,
    };
  }

  const token: string | undefined = json?.token ?? json?.name;
  if (!token || typeof token !== "string") {
    return {
      ok: false,
      status: 500,
      errorCode: "missing_token",
      message: "Gemini response did not contain a token",
      requestId: opts.requestId,
      upstreamRequestId,
    };
  }

  return {
    ok: true,
    token,
    expires_at: expiresAtMs,
    wsBaseUrl: AI_STUDIO_WS_BASE,
    raw: json,
  };
}

function classifyGeminiFailure(status: number, message: string): string {
  const lower = message.toLowerCase();
  if (status === 401 || status === 403) return "invalid_api_key";
  if (status === 429) return "rate_limited";
  if (status >= 500) return "upstream_unreachable";
  if (lower.includes("api key") || lower.includes("permission")) return "invalid_api_key";
  return "upstream_failed";
}
