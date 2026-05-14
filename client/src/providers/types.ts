// Shared provider contract. Each translation backend (OpenAI Realtime, Gemini
// Live, hypothetical others) implements TranslationProvider so app.ts can
// resolve them by id without knowing transport details.
import type {
  ConnectionStateSnapshot,
  SessionEvent,
  SessionHandle,
} from "../types";
import type { MicEnvSetting } from "../lib/mic-env-detect";
import type { SessionIssue } from "../lib/session-error-messages";

export type ProviderId = "openai" | "gemini";

// Per-provider config carried in settings. v0.1 stays string-only for OpenAI;
// Gemini introduces a discriminated union (see phase 02/06).
export type ProviderConfig =
  | { id: "openai"; apiKey?: string }
  | { id: "gemini"; apiKey?: string; voice?: string; authMode?: "ai-studio" | "vertex" };

// CaptionEvent is the same shape as today's SessionEvent; we re-export so
// providers don't import from the legacy types file directly.
export type CaptionEvent = SessionEvent;

// Generic options surface. Each provider may ignore irrelevant fields.
export interface StartSessionOptions {
  targetLanguage: string;
  micDeviceId?: string;
  outputDeviceId?: string;
  apiKey?: string;
  transcribeSource?: boolean;
  micEnv?: MicEnvSetting;
  // Optional provider-specific config bag (e.g. Gemini voice, auth mode)
  providerConfig?: Record<string, unknown>;
  onEvent?: (event: CaptionEvent) => void;
  onRawEvent?: (raw: any, ts: number) => void;
  onStateChange?: (snapshot: ConnectionStateSnapshot) => void;
  onRecoverableIssue?: (issue: SessionIssue) => void;
  onError?: (err: Error) => void;
}

// Same shape as the legacy SessionHandle so existing call-sites keep working.
export type ProviderSession = SessionHandle;

// Capabilities flag — used by debug-panel and status banners to conditionally
// render provider-specific UI (phase 05).
export interface ProviderCapabilities {
  // True for Gemini-style transports that need a session-resume handoff.
  sessionResumeHandoff?: boolean;
  // True if the provider auto-detects the source language (Gemini).
  autoDetectsSourceLang?: boolean;
}

export interface TranslationProvider {
  readonly id: ProviderId;
  readonly capabilities: ProviderCapabilities;
  startSession(opts: StartSessionOptions): Promise<ProviderSession>;
}
