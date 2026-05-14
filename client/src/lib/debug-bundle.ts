import type { SettingsStore } from "../settings";
import type { SetupDoctorResult } from "./setup-doctor";
import type { SessionIssue } from "./session-error-messages";

export interface BufferedEvent {
  ts: number;
  type: string;
  payload: unknown;
}

export interface DebugBundleInput {
  events: BufferedEvent[];
  settings: SettingsStore;
  state: { connectionState?: string; iceConnectionState?: string };
  metrics: Record<string, unknown>;
  app: { version: string; userAgent: string; platform: string };
  support: {
    setSinkId: boolean;
    setupDoctor: SetupDoctorResult | null;
    lastIssue: SessionIssue | null;
    sessionDurationMs: number;
  };
}

// Anything whose key (case-insensitive) matches this pattern is replaced wholesale.
const SECRET_KEY_RE = /^(authorization|api[-_]?key|.*secret.*|.*token.*|bearer|password)$/i;
// Settings keys that look secret get redacted regardless of where they appear.
const SECRET_SETTINGS_KEY_RE = /(key|secret|token|auth|password)/i;
const PRIVATE_SETTINGS_KEY_RE = /(device_id|meeting_profiles|active_profile_id)/i;
// Heuristic: any string with a known credential prefix is redacted in scalar position.
const SECRET_VALUE_PREFIX_RE = /\b(sk-|cs_|ek_|rk_|sk_live|sk_test)[A-Za-z0-9_\-]{6,}/g;
const OPAQUE_VALUE_RE = /^[A-Za-z0-9_\-]{24,}$/;
const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

const REDACTED = "REDACTED";

export function buildDebugBundle(input: DebugBundleInput): string {
  const safeSettings: Record<string, unknown> = {};
  for (const [k, v] of Object.entries(input.settings)) {
    safeSettings[k] =
      (SECRET_SETTINGS_KEY_RE.test(k) || PRIVATE_SETTINGS_KEY_RE.test(k)) && v
        ? REDACTED
        : v;
  }

  const events = input.events.map((ev) => ({
    ts: ev.ts,
    type: ev.type,
    payload: summarizeEventPayload(ev),
  }));

  const bundle = {
    generatedAt: new Date().toISOString(),
    app: input.app,
    state: input.state,
    metrics: input.metrics,
    support: redactPayload(input.support),
    settings: safeSettings,
    events,
  };

  return JSON.stringify(bundle, null, 2);
}

function summarizeEventPayload(ev: BufferedEvent): unknown {
  if (
    ev.type === "session.input_transcript.delta" ||
    ev.type === "session.output_transcript.delta"
  ) {
    const delta =
      typeof ev.payload === "object" && ev.payload && "delta" in ev.payload
        ? (ev.payload as { delta?: unknown }).delta
        : "";
    return {
      redacted: "transcript_text",
      deltaLength: typeof delta === "string" ? delta.length : 0,
    };
  }
  return redactPayload(ev.payload);
}

function redactPayload(value: unknown): unknown {
  if (value === null || typeof value !== "object") {
    return redactScalar(value);
  }
  if (Array.isArray(value)) {
    return value.map(redactPayload);
  }
  const out: Record<string, unknown> = {};
  for (const [k, v] of Object.entries(value)) {
    if (SECRET_KEY_RE.test(k)) {
      out[k] = REDACTED;
    } else {
      out[k] = redactPayload(v);
    }
  }
  return out;
}

function redactScalar(value: unknown): unknown {
  if (typeof value !== "string") return value;
  if (SECRET_VALUE_PREFIX_RE.test(value)) {
    SECRET_VALUE_PREFIX_RE.lastIndex = 0;
    return value.replace(SECRET_VALUE_PREFIX_RE, REDACTED);
  }
  if (OPAQUE_VALUE_RE.test(value) && !UUID_RE.test(value)) return REDACTED;
  return value;
}
