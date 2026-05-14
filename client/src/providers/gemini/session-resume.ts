// Manages the 13-min session-resume handoff for Gemini Live.
// Gemini caps each session at 15 minutes; we open a second WebSocket at T+13
// using the latest resumption handle, wait for the new WS to produce its first
// audio frame, then swap output and close the old WS. Listener never hears a gap.
import { openLiveClient, type LiveClient, type LiveClientOptions } from "./live-client";
import { extractAudioChunks, mapGeminiToCaption } from "./caption-mapper";
import type { SessionEvent } from "../../types";
import {
  makeSessionIssue,
  type SessionIssue,
} from "../../lib/session-error-messages";

const HANDOFF_AFTER_MS = 13 * 60 * 1000;
const FIRST_AUDIO_GRACE_MS = 5_000;

export interface HandoffDeps {
  initialOptions: Omit<LiveClientOptions, "onMessage" | "onResumptionHandle" | "onFirstAudio">;
  mintFreshToken: () => Promise<{ token: string; wsBaseUrl: string }>;
  onAudioChunk: (chunk: Uint8Array) => void;
  onEvent: (event: SessionEvent) => void;
  onRawEvent: (raw: any, ts: number) => void;
  onIssue: (issue: SessionIssue) => void;
  onHandoffMetric?: (durationMs: number) => void;
}

export interface SessionResumeController {
  readonly activeClient: LiveClient;
  sendAudioChunk: (pcm16: ArrayBuffer) => void;
  stop: () => void;
}

export function startSessionWithResume(deps: HandoffDeps): SessionResumeController {
  let latestHandle: string | null = null;
  let stopped = false;
  let handoffTimer: ReturnType<typeof setTimeout> | null = null;

  const live = wireClient(deps.initialOptions);
  let active: LiveClient = live;

  scheduleHandoff();

  function wireClient(
    base: Omit<LiveClientOptions, "onMessage" | "onResumptionHandle" | "onFirstAudio">,
  ): LiveClient {
    return openLiveClient({
      ...base,
      onMessage: (msg) => {
        const ts = performance.now();
        deps.onRawEvent(msg, ts);
        for (const chunk of extractAudioChunks(msg)) deps.onAudioChunk(chunk);
        for (const c of mapGeminiToCaption(msg)) deps.onEvent(c.event);
      },
      onResumptionHandle: (h) => {
        latestHandle = h;
      },
    });
  }

  function scheduleHandoff() {
    if (stopped) return;
    handoffTimer = setTimeout(runHandoff, HANDOFF_AFTER_MS);
  }

  async function runHandoff() {
    if (stopped) return;
    const t0 = performance.now();
    if (!latestHandle) {
      // No handle yet — Gemini will time out the session shortly. Surface and stop.
      deps.onIssue(
        makeSessionIssue("unknown", {
          message: "Gemini session has no resumption handle; cannot hot-handoff.",
        }),
      );
      return;
    }

    let fresh;
    try {
      fresh = await deps.mintFreshToken();
    } catch (err) {
      deps.onIssue(
        makeSessionIssue("unknown", {
          message:
            err instanceof Error
              ? `handoff token mint failed: ${err.message}`
              : "handoff token mint failed",
        }),
      );
      return;
    }

    const newClient = openLiveClient({
      ...deps.initialOptions,
      token: fresh.token,
      wsBaseUrl: fresh.wsBaseUrl,
      resumeHandle: latestHandle,
      onMessage: (msg) => {
        const ts = performance.now();
        deps.onRawEvent(msg, ts);
        for (const chunk of extractAudioChunks(msg)) deps.onAudioChunk(chunk);
        for (const c of mapGeminiToCaption(msg)) deps.onEvent(c.event);
      },
      onResumptionHandle: (h) => {
        latestHandle = h;
      },
      onFirstAudio: () => {
        // Swap: close old client, promote new to active.
        try {
          active.close();
        } catch {
          /* ignore */
        }
        active = newClient;
        const dur = performance.now() - t0;
        deps.onHandoffMetric?.(dur);
        scheduleHandoff();
      },
      onError: () => {
        deps.onIssue(makeSessionIssue("webrtc_failed", { message: "Gemini handoff WS error" }));
      },
    });

    // Grace timeout: if WS #2 never sends audio, give up.
    setTimeout(() => {
      if (active === newClient) return; // already swapped
      if (stopped) return;
      try {
        newClient.close();
      } catch {
        /* ignore */
      }
      deps.onIssue(
        makeSessionIssue("unknown", {
          message: "Gemini handoff timed out waiting for first audio frame.",
        }),
      );
    }, FIRST_AUDIO_GRACE_MS);
  }

  function stop() {
    if (stopped) return;
    stopped = true;
    if (handoffTimer) clearTimeout(handoffTimer);
    try {
      active.close();
    } catch {
      /* ignore */
    }
  }

  return {
    get activeClient() {
      return active;
    },
    sendAudioChunk(pcm16) {
      active.sendAudioChunk(pcm16);
    },
    stop,
  };
}
