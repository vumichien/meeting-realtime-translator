// session-store.ts — global singleton owning session lifecycle state.
//
// Lifted out of component-local useState/useRef so ALL consumers (SessionPill,
// TranslateScreen, CompactControlBar, future overlays) share one state machine.
// The interval ticker lives here, not in a component, so view switches don't
// cause leaks or double-start/stop bugs.
//
// Consumed via useSyncExternalStore in use-session.ts (thin reader hook).

import { getProvider } from "@/providers/registry";
import type { SessionHandle } from "@/types";
import type { ProviderId } from "@/providers/types";
import { classifySessionError } from "@/lib/session-error-messages";
import type { TranscriptStore } from "@/lib/transcript-store";
import type { CaptionStore } from "@/captions";
import type { Settings } from "@/settings";
import type { ApiKeyProvider } from "@/types";
import type { LatencyWarning } from "@/lib/latency-warning";
import { transcriptHistory } from "@/lib/transcript-history";

export type SessionState = "idle" | "connecting" | "connected" | "failed" | "closed";

export interface SessionCost {
  /** Placeholder — real cost tracking added when billing data is available. */
  estimatedUsd: number;
}

export interface SessionSnapshot {
  state: SessionState;
  durationMs: number;
  cost: SessionCost;
  error: string | null;
}

export interface SessionStore {
  subscribe(cb: () => void): () => void;
  snapshot(): SessionSnapshot;
  start(): Promise<void>;
  stop(reason?: "user" | "error"): void;
}

// Internal deps injected at creation time (avoids circular imports at module level).
export interface SessionStoreDeps {
  settings: Settings;
  apiKey: ApiKeyProvider;
  captions: CaptionStore;
  transcript: TranscriptStore;
  latency: LatencyWarning;
}

const TRANSCRIPT_FLUSH_IDLE_MS = 2000;
const SENTENCE_END_RE = /[.!?。？！]\s*$/;

export function createSessionStore(deps: SessionStoreDeps): SessionStore {
  const { settings, apiKey, captions, transcript, latency } = deps;

  // ─── State ────────────────────────────────────────────────────────────────
  let state: SessionState = "idle";
  let durationMs = 0;
  let error: string | null = null;
  const cost: SessionCost = { estimatedUsd: 0 };

  // ─── Transcript accumulation ──────────────────────────────────────────────
  let srcBuffer = "";
  let tgtBuffer = "";
  let srcFlushTimer: number | undefined;
  let tgtFlushTimer: number | undefined;

  function flushTranscript(kind: "source" | "target"): void {
    if (kind === "source") {
      const trimmed = srcBuffer.trim();
      if (trimmed) transcript.append("source", trimmed);
      srcBuffer = "";
      if (srcFlushTimer !== undefined) { clearTimeout(srcFlushTimer); srcFlushTimer = undefined; }
    } else {
      const trimmed = tgtBuffer.trim();
      if (trimmed) transcript.append("target", trimmed);
      tgtBuffer = "";
      if (tgtFlushTimer !== undefined) { clearTimeout(tgtFlushTimer); tgtFlushTimer = undefined; }
    }
  }

  function scheduleTranscriptFlush(kind: "source" | "target", delta: string): void {
    // Ignore deltas that arrive after session stop (provider may emit events during shutdown).
    if (state === "idle" || state === "closed") return;
    if (kind === "source") {
      srcBuffer += delta;
      if (srcFlushTimer !== undefined) clearTimeout(srcFlushTimer);
      if (SENTENCE_END_RE.test(srcBuffer)) {
        flushTranscript("source");
      } else {
        srcFlushTimer = window.setTimeout(() => { if (srcBuffer) flushTranscript("source"); }, TRANSCRIPT_FLUSH_IDLE_MS);
      }
    } else {
      tgtBuffer += delta;
      if (tgtFlushTimer !== undefined) clearTimeout(tgtFlushTimer);
      if (SENTENCE_END_RE.test(tgtBuffer)) {
        flushTranscript("target");
      } else {
        tgtFlushTimer = window.setTimeout(() => { if (tgtBuffer) flushTranscript("target"); }, TRANSCRIPT_FLUSH_IDLE_MS);
      }
    }
  }

  let handle: SessionHandle | null = null;
  let startedAt = 0;
  let tickId: number | undefined = undefined;

  const listeners = new Set<() => void>();

  // ─── Snapshot caching ────────────────────────────────────────────────────
  // Stable object identity between renders for useSyncExternalStore.
  let cachedSnapshot: SessionSnapshot = { state, durationMs, cost, error };

  function notify(): void {
    cachedSnapshot = { state, durationMs, cost, error };
    listeners.forEach((cb) => cb());
  }

  // ─── Tick management ─────────────────────────────────────────────────────
  function startTick(): void {
    if (tickId !== undefined) return;
    tickId = window.setInterval(() => {
      if (startedAt) {
        durationMs = Date.now() - startedAt;
        notify();
      }
    }, 1000);
  }

  function stopTick(): void {
    if (tickId !== undefined) {
      window.clearInterval(tickId);
      tickId = undefined;
    }
  }

  // ─── Stop ─────────────────────────────────────────────────────────────────
  function stop(reason: "user" | "error" = "user"): void {
    if (state === "idle") return; // guard against double-stop
    handle?.stop();
    handle = null;

    if (startedAt) {
      void window.electron?.telemetry?.track("session.ended", {
        duration_ms: Date.now() - startedAt,
        end_reason: reason,
      });
    }

    // Flush remaining buffered text before snapshotting for history.
    flushTranscript("source");
    flushTranscript("target");

    // Persist completed session to transcript history before clearing state.
    const snap = transcript.snapshot();
    if (snap.sessionStartedAt && snap.segments.length > 0) {
      const endedAt = snap.sessionEndedAt ?? new Date().toISOString();
      const startMs = new Date(snap.sessionStartedAt).getTime();
      const endMs = new Date(endedAt).getTime();
      try {
        transcriptHistory.save({
          id: snap.sessionStartedAt,
          startedAt: snap.sessionStartedAt,
          endedAt,
          durationMs: Math.max(0, endMs - startMs),
          targetLang: snap.targetLanguage,
          segments: snap.segments,
        });
      } catch (err) {
        console.warn("[session-store] history save failed:", err);
      }
    }

    startedAt = 0;
    stopTick();
    durationMs = 0;
    transcript.endSession();
    latency.reset();
    state = "idle";
    notify();
  }

  // ─── Start ────────────────────────────────────────────────────────────────
  async function start(): Promise<void> {
    if (handle) return; // already running

    error = null;
    srcBuffer = "";
    tgtBuffer = "";
    captions.clear();
    transcript.beginSession(settings.get("mt.target_lang"));
    state = "connecting";
    notify();

    try {
      const providerId = settings.get("mt.active_provider") as ProviderId;
      const provider = await getProvider(providerId);
      const resolvedApiKey = (await apiKey.get()) || undefined;

      const sessionHandle = await provider.startSession({
        targetLanguage: settings.get("mt.target_lang"),
        micDeviceId: settings.get("mt.mic_device_id") || undefined,
        outputDeviceId: settings.get("mt.output_device_id") || undefined,
        apiKey: resolvedApiKey,
        transcribeSource: settings.get("mt.transcribe_source"),
        micEnv: settings.get("mt.mic_env"),
        onEvent: (ev) => {
          if (ev.type === "session.input_transcript.delta") {
            const delta = (ev as { delta: string }).delta;
            if (delta) {
              const ts = performance.now();
              captions.appendSource({ id: `src-${ts}`, text: delta, final: false, ts });
              scheduleTranscriptFlush("source", delta);
            }
          } else if (ev.type === "session.output_transcript.delta") {
            const delta = (ev as { delta: string }).delta;
            if (delta) {
              const ts = performance.now();
              captions.appendTranslation({ id: `tgt-${ts}`, text: delta, final: false, ts });
              scheduleTranscriptFlush("target", delta);
            }
          }
        },
        onStateChange: (snapshot) => {
          if (snapshot.connectionState === "connected") state = "connected";
          else if (snapshot.connectionState === "failed") {
            state = "failed";
            stop("error");
            return;
          } else if (snapshot.connectionState === "closed") {
            state = "closed";
          } else if (snapshot.connectionState === "connecting") {
            state = "connecting";
          }
          notify();
        },
        onError: (err) => {
          error = err.message;
          state = "failed";
          notify();
          stop("error");
        },
      });

      handle = sessionHandle;
      startedAt = Date.now();

      void window.electron?.telemetry?.track("session.started", {
        target_lang: settings.get("mt.target_lang"),
      });

      startTick();
      state = "connected";
      notify();
    } catch (err) {
      const issue = classifySessionError(err);
      error = issue.message;
      state = "failed";
      notify();
      void window.electron?.telemetry?.track("error.session", {
        error_class: err instanceof Error ? err.name : "UnknownError",
      });
    }
  }

  // ─── Public API ───────────────────────────────────────────────────────────
  return {
    subscribe(cb) {
      listeners.add(cb);
      return () => listeners.delete(cb);
    },
    snapshot() {
      return cachedSnapshot;
    },
    start,
    stop,
  };
}
