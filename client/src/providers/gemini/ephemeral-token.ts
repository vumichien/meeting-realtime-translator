// Fetches a Gemini ephemeral token from the local backend. Mirrors
// `webrtc-sdp.ts mintSession` shape for parity with the OpenAI path.
import {
  makeSessionIssue,
  SessionIssueError,
  type SessionIssueCode,
} from "../../lib/session-error-messages";

export type GeminiAuthMode = "ai-studio" | "vertex";

export interface MintGeminiOptions {
  authMode: GeminiAuthMode;
  apiKey?: string; // AI Studio mode
  serviceAccountJson?: string; // Vertex mode
  project?: string;
  region?: string;
  signal?: AbortSignal;
  endpoint?: string;
}

export interface MintedGeminiToken {
  token: string;
  expires_at: number;
  wsBaseUrl: string;
  authMode: GeminiAuthMode;
  project?: string;
  region?: string;
}

export async function mintGeminiToken(
  opts: MintGeminiOptions,
): Promise<MintedGeminiToken> {
  const endpoint = opts.endpoint ?? getEndpoint();
  const headers: Record<string, string> = { "Content-Type": "application/json" };
  if (opts.authMode === "ai-studio" && opts.apiKey) {
    headers.Authorization = `Bearer ${opts.apiKey}`;
  }

  const body: Record<string, unknown> = { authMode: opts.authMode };
  if (opts.authMode === "vertex") {
    body.serviceAccountJson = opts.serviceAccountJson;
    body.project = opts.project;
    body.region = opts.region;
  }

  const response = await fetch(endpoint, {
    method: "POST",
    headers,
    body: JSON.stringify(body),
    signal: opts.signal,
  });

  const text = await response.text();
  let json: any = {};
  try {
    json = text ? JSON.parse(text) : {};
  } catch {
    throw new Error(
      `Gemini token endpoint returned non-JSON (status ${response.status}).`,
    );
  }

  if (!response.ok) {
    const code = normalize(json?.error, response.status);
    throw new SessionIssueError(
      makeSessionIssue(code, {
        message: json?.message ?? `Gemini token mint failed: status ${response.status}`,
        requestId: typeof json?.request_id === "string" ? json.request_id : undefined,
      }),
    );
  }

  if (typeof json.token !== "string" || typeof json.wsBaseUrl !== "string") {
    throw new Error("Gemini token endpoint missing token or wsBaseUrl.");
  }

  return {
    token: json.token,
    expires_at: typeof json.expires_at === "number" ? json.expires_at : Date.now() + 30 * 60_000,
    wsBaseUrl: json.wsBaseUrl,
    authMode: json.authMode === "vertex" ? "vertex" : "ai-studio",
    project: json.project,
    region: json.region,
  };
}

function normalize(value: unknown, status: number): SessionIssueCode {
  if (value === "no_api_key") return "missing_api_key";
  if (value === "invalid_api_key") return "invalid_api_key";
  if (value === "rate_limited" || status === 429) return "rate_limited";
  if (value === "upstream_unreachable") return "upstream_unreachable";
  return "unknown";
}

function getEndpoint(): string {
  const serverUrl = (window as any).electron?.serverUrl as string | undefined;
  const base = serverUrl ?? "";
  return `${base}/providers/gemini/ephemeral-token`;
}
