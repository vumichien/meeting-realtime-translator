import { randomUUID } from "node:crypto";
import { readFile, writeFile, mkdir } from "node:fs/promises";
import { dirname, join } from "node:path";
import { platform } from "node:os";

export type TelemetryEventName =
  | "app.launched"
  | "onboarding.step.completed"
  | "onboarding.completed"
  | "session.started"
  | "session.ended"
  | "error.session";

export interface TelemetryEvent {
  name: TelemetryEventName;
  properties: Record<string, string | number | boolean>;
  ts: string;
}

interface TelemetryState {
  consent: boolean | null;
  installId: string;
  queue: TelemetryEvent[];
}

const MAX_QUEUE = 100;
const FLUSH_SIZE = 10;

export class TelemetryService {
  private state: TelemetryState | null = null;
  private flushTimer: NodeJS.Timeout | null = null;

  constructor(
    private readonly statePath: string,
    private readonly endpoint: string | undefined,
  ) {}

  async getConsent() {
    return (await this.load()).consent;
  }

  async setConsent(consent: boolean) {
    const state = await this.load();
    state.consent = consent;
    if (!consent) state.queue = [];
    await this.save(state);
  }

  async deleteLocalData() {
    const state = await this.load();
    state.consent = false;
    state.installId = randomUUID();
    state.queue = [];
    await this.save(state);
  }

  async track(name: TelemetryEventName, properties: Record<string, unknown> = {}) {
    if (!isAllowedEvent(name, properties)) return;
    const state = await this.load();
    if (state.consent !== true) return;
    state.queue.push({ name, properties: sanitize(properties), ts: new Date().toISOString() });
    state.queue = state.queue.slice(-MAX_QUEUE);
    await this.save(state);
    if (state.queue.length >= FLUSH_SIZE) await this.flush();
    else this.scheduleFlush();
  }

  async flush() {
    if (!this.endpoint) return;
    const state = await this.load();
    if (state.consent !== true || state.queue.length === 0) return;
    const events = state.queue.splice(0, FLUSH_SIZE);
    await this.save(state);
    try {
      await fetch(this.endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          installId: state.installId,
          os: platform(),
          events,
        }),
      });
    } catch {
      state.queue = [...events, ...state.queue].slice(0, MAX_QUEUE);
      await this.save(state);
    }
  }

  private scheduleFlush() {
    if (this.flushTimer) return;
    this.flushTimer = setTimeout(() => {
      this.flushTimer = null;
      void this.flush();
    }, 30_000);
  }

  private async load(): Promise<TelemetryState> {
    if (this.state) return this.state;
    try {
      const parsed = JSON.parse(await readFile(this.statePath, "utf8")) as Partial<TelemetryState>;
      this.state = {
        consent: typeof parsed.consent === "boolean" ? parsed.consent : null,
        installId: typeof parsed.installId === "string" ? parsed.installId : randomUUID(),
        queue: Array.isArray(parsed.queue) ? parsed.queue.filter(isTelemetryEvent).slice(-MAX_QUEUE) : [],
      };
    } catch {
      this.state = { consent: null, installId: randomUUID(), queue: [] };
    }
    return this.state;
  }

  private async save(state: TelemetryState) {
    await mkdir(dirname(this.statePath), { recursive: true });
    await writeFile(this.statePath, `${JSON.stringify(state, null, 2)}\n`, "utf8");
  }
}

export function getTelemetryStatePath(userDataPath: string): string {
  return join(userDataPath, "telemetry.json");
}

function isAllowedEvent(name: TelemetryEventName, properties: Record<string, unknown>): boolean {
  const keys = Object.keys(properties);
  const allowed: Record<TelemetryEventName, string[]> = {
    "app.launched": ["version", "os"],
    "onboarding.step.completed": ["step"],
    "onboarding.completed": ["total_duration_ms"],
    "session.started": ["target_lang"],
    "session.ended": ["duration_ms", "end_reason"],
    "error.session": ["error_class"],
  };
  return keys.every((key) => allowed[name].includes(key));
}

function sanitize(input: Record<string, unknown>): Record<string, string | number | boolean> {
  const out: Record<string, string | number | boolean> = {};
  for (const [key, value] of Object.entries(input)) {
    if (typeof value === "string" || typeof value === "number" || typeof value === "boolean") out[key] = value;
  }
  return out;
}

function isTelemetryEvent(value: unknown): value is TelemetryEvent {
  const event = value as Partial<TelemetryEvent>;
  return typeof event.name === "string" && typeof event.ts === "string" && typeof event.properties === "object";
}
