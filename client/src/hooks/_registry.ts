// Singleton registry for all logic modules.
// Uses globalThis so instances survive Vite HMR Fast Refresh — each module
// reload re-runs this file but the `??=` assignment is a no-op when the key
// already exists on globalThis.

import { createSettings } from "@/settings";
import { createApiKeyProvider } from "@/lib/api-key-provider";
import { createTranscriptStore } from "@/lib/transcript-store";
import { createCaptionStore } from "@/captions";
import { createLatencyWarning } from "@/lib/latency-warning";
import { createSessionStore } from "@/lib/session-store";

// Cast to any once so individual properties stay typed at their call-sites.
const g = globalThis as any;

export const settings: ReturnType<typeof createSettings> =
  (g.__mt_settings ??= createSettings());

export const apiKey: ReturnType<typeof createApiKeyProvider> =
  (g.__mt_apiKey ??= createApiKeyProvider());

export const transcript: ReturnType<typeof createTranscriptStore> =
  (g.__mt_transcript ??= createTranscriptStore());

export const captions: ReturnType<typeof createCaptionStore> =
  (g.__mt_captions ??= createCaptionStore());

export const latency: ReturnType<typeof createLatencyWarning> =
  (g.__mt_latency ??= createLatencyWarning());

// Session store is a singleton so SessionPill, TranslateScreen, and any other
// consumers share one state machine and one interval ticker.
export const sessionStore: ReturnType<typeof createSessionStore> =
  (g.__mt_sessionStore ??= createSessionStore({ settings, apiKey, captions, transcript, latency }));
