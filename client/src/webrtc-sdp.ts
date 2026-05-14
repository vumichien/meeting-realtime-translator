// SDP exchange with the OpenAI Realtime Translations call endpoint.
// Cookbook reference: openai.md §"Open the WebRTC translation session".
import {
  makeSessionIssue,
  SessionIssueError,
  type SessionIssueCode,
} from "./lib/session-error-messages";

const TRANSLATION_CALL_URL =
  "https://api.openai.com/v1/realtime/translations/calls";

export async function exchangeSdp(args: {
  pc: RTCPeerConnection;
  clientSecret: string;
  signal?: AbortSignal;
}): Promise<void> {
  const { pc, clientSecret, signal } = args;

  const offer = await pc.createOffer();
  await pc.setLocalDescription(offer);

  const response = await fetch(TRANSLATION_CALL_URL, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${clientSecret}`,
      "Content-Type": "application/sdp",
    },
    body: offer.sdp ?? "",
    signal,
  });

  if (!response.ok) {
    const body = await response.text().catch(() => "");
    throw new SessionIssueError(
      makeSessionIssue(response.status === 429 ? "rate_limited" : "webrtc_failed", {
        message: `SDP exchange failed: ${response.status} ${response.statusText}${body ? ` — ${body.slice(0, 200)}` : ""}`,
      }),
    );
  }

  const answerSdp = await response.text();
  await pc.setRemoteDescription({ type: "answer", sdp: answerSdp });
}

export interface MintedSession {
  client_secret: string;
  expires_at: number | null;
}

import type { MicEnv } from "./lib/mic-env-detect";

export async function mintSession(args: {
  targetLanguage: string;
  transcribeSource: boolean;
  apiKey?: string;
  endpoint?: string;
  signal?: AbortSignal;
  micEnv?: MicEnv;
}): Promise<MintedSession> {
  const endpoint = args.endpoint ?? getSessionEndpoint();
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
  };
  if (args.apiKey) headers.Authorization = `Bearer ${args.apiKey}`;

  const response = await fetch(endpoint, {
    method: "POST",
    headers,
    body: JSON.stringify({
      targetLanguage: args.targetLanguage,
      transcribeSource: args.transcribeSource,
      micEnv: args.micEnv,
    }),
    signal: args.signal,
  });

  const text = await response.text();
  let json: any = {};
  try {
    json = text ? JSON.parse(text) : {};
  } catch {
    throw new Error(`Session endpoint returned non-JSON (status ${response.status}).`);
  }

  if (!response.ok) {
    const code = normalizeIssueCode(json?.error, response.status);
    throw new SessionIssueError(makeSessionIssue(code, {
      message: json?.message ?? `Session mint failed: status ${response.status}`,
      requestId: typeof json?.request_id === "string" ? json.request_id : undefined,
      upstreamRequestId:
        typeof json?.upstream_request_id === "string" ? json.upstream_request_id : undefined,
    }));
  }

  if (!json.client_secret || typeof json.client_secret !== "string") {
    throw new Error("Session mint succeeded but missing client_secret.");
  }

  return {
    client_secret: json.client_secret,
    expires_at: typeof json.expires_at === "number" ? json.expires_at : null,
  };
}

function normalizeIssueCode(value: unknown, status: number): SessionIssueCode {
  if (value === "no_api_key") return "missing_api_key";
  if (value === "invalid_api_key") return "invalid_api_key";
  if (value === "rate_limited" || status === 429) return "rate_limited";
  if (value === "upstream_unreachable") return "upstream_unreachable";
  return "unknown";
}

function getSessionEndpoint(): string {
  const serverUrl = window.electron?.serverUrl;
  return serverUrl ? `${serverUrl}/session` : "/session";
}
