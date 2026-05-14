export type SessionIssueCode =
  | "missing_api_key"
  | "invalid_api_key"
  | "rate_limited"
  | "mic_permission_denied"
  | "mic_disconnected"
  | "output_device_missing"
  | "output_route_failed"
  | "webrtc_failed"
  | "upstream_unreachable"
  | "unknown";

export interface SessionIssue {
  code: SessionIssueCode;
  title: string;
  message: string;
  fix: string;
  retryable: boolean;
  requestId?: string;
  upstreamRequestId?: string;
}

const ISSUE_COPY: Record<SessionIssueCode, Omit<SessionIssue, "code">> = {
  missing_api_key: {
    title: "OpenAI key missing",
    message: "Babel Mic needs an API key from the app field or local .env.",
    fix: "Paste a key or set OPENAI_API_KEY, then start again.",
    retryable: true,
  },
  invalid_api_key: {
    title: "OpenAI key rejected",
    message: "OpenAI rejected the key or this project cannot use Realtime translation.",
    fix: "Check the key, billing, and project access before retrying.",
    retryable: true,
  },
  rate_limited: {
    title: "OpenAI rate limit",
    message: "Too many session requests or audio minutes are being used right now.",
    fix: "Wait a minute, then retry.",
    retryable: true,
  },
  mic_permission_denied: {
    title: "Microphone blocked",
    message: "The browser could not capture your microphone.",
    fix: "Allow microphone access and reselect your source mic.",
    retryable: true,
  },
  mic_disconnected: {
    title: "Microphone disconnected",
    message: "The active mic track ended during the session.",
    fix: "Reconnect or choose another mic, then start again.",
    retryable: true,
  },
  output_device_missing: {
    title: "Output device missing",
    message: "The selected virtual cable output is no longer available.",
    fix: "Reconnect the cable device or choose another Babel Mic output.",
    retryable: true,
  },
  output_route_failed: {
    title: "Output routing failed",
    message: "Translated audio could not be routed to the selected output device.",
    fix: "Pick the virtual cable playback side and rerun Setup Doctor.",
    retryable: true,
  },
  webrtc_failed: {
    title: "Realtime connection failed",
    message: "The WebRTC translation session stopped unexpectedly.",
    fix: "Stop, check network connectivity, then start again.",
    retryable: true,
  },
  upstream_unreachable: {
    title: "OpenAI unreachable",
    message: "The local backend could not reach OpenAI.",
    fix: "Check your network and retry.",
    retryable: true,
  },
  unknown: {
    title: "Session failed",
    message: "Babel Mic hit an unexpected session error.",
    fix: "Copy a debug bundle if this keeps happening, then retry.",
    retryable: true,
  },
};

export class SessionIssueError extends Error {
  constructor(
    readonly issue: SessionIssue,
    message = issue.message,
  ) {
    super(message);
    this.name = "SessionIssueError";
  }
}

export function makeSessionIssue(
  code: SessionIssueCode,
  extra?: Partial<Pick<SessionIssue, "message" | "requestId" | "upstreamRequestId">>,
): SessionIssue {
  return { code, ...ISSUE_COPY[code], ...extra };
}

export function classifySessionError(err: unknown): SessionIssue {
  if (err instanceof SessionIssueError) return err.issue;
  const message = err instanceof Error ? err.message : String(err || "");
  const lower = message.toLowerCase();
  if (lower.includes("no openai api key") || lower.includes("no_api_key")) {
    return makeSessionIssue("missing_api_key", { message });
  }
  if (lower.includes("invalid_api_key") || lower.includes("401") || lower.includes("403")) {
    return makeSessionIssue("invalid_api_key", { message });
  }
  if (lower.includes("rate_limited") || lower.includes("429")) {
    return makeSessionIssue("rate_limited", { message });
  }
  if (lower.includes("permission") || lower.includes("notallowederror")) {
    return makeSessionIssue("mic_permission_denied", { message });
  }
  if (lower.includes("setSinkId".toLowerCase()) || lower.includes("sink")) {
    return makeSessionIssue("output_route_failed", { message });
  }
  if (lower.includes("fetch failed") || lower.includes("network")) {
    return makeSessionIssue("upstream_unreachable", { message });
  }
  return makeSessionIssue("unknown", { message: message || ISSUE_COPY.unknown.message });
}
