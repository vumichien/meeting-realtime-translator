import type { SettingsStore } from "../settings";

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
  app: { version: string; userAgent: string };
}

// Anything whose key (case-insensitive) matches this pattern is replaced wholesale.
const SECRET_KEY_RE = /^(authorization|api[-_]?key|.*secret.*|.*token.*|bearer|password)$/i;
// Settings keys that look secret get redacted regardless of where they appear.
const SECRET_SETTINGS_KEY_RE = /(key|secret|token|auth|password)/i;
// Heuristic: any string with a known credential prefix is redacted in scalar position.
const SECRET_VALUE_PREFIX_RE = /\b(sk-|cs_|ek_|rk_|sk_live|sk_test)[A-Za-z0-9_\-]{6,}/g;

const REDACTED = "REDACTED";

export function buildDebugBundle(input: DebugBundleInput): string {
  const safeSettings: Record<string, unknown> = {};
  for (const [k, v] of Object.entries(input.settings)) {
    safeSettings[k] = SECRET_SETTINGS_KEY_RE.test(k) && v ? REDACTED : v;
  }

  const events = input.events.map((ev) => ({
    ts: ev.ts,
    type: ev.type,
    payload: redactPayload(ev.payload),
  }));

  const bundle = {
    generatedAt: new Date().toISOString(),
    app: input.app,
    state: input.state,
    metrics: input.metrics,
    settings: safeSettings,
    events,
  };

  return JSON.stringify(bundle, null, 2);
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
  return value;
}
