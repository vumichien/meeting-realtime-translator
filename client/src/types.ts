export type SessionEventType =
  | "session.input_transcript.delta"
  | "session.output_transcript.delta"
  | "session.created"
  | "session.updated"
  | "error";

export type TranscriptDeltaEvent = {
  type: "session.input_transcript.delta" | "session.output_transcript.delta";
  delta: string;
  /** Optional language code on input deltas. Populated by providers that
   *  auto-detect source language (e.g. Gemini Live). */
  detectedSourceLang?: string;
};

export type SessionErrorEvent = {
  type: "error";
  error: { message: string; code?: string };
};

export type GenericSessionEvent = {
  type: string;
  [key: string]: unknown;
};

export type SessionEvent =
  | TranscriptDeltaEvent
  | SessionErrorEvent
  | GenericSessionEvent;

export type ConnectionStateSnapshot = {
  connectionState: RTCPeerConnectionState;
  iceConnectionState: RTCIceConnectionState;
};

export type { SessionIssue, SessionIssueCode } from "./lib/session-error-messages";

export interface SessionHandle {
  /** Stop the session and release all resources. Idempotent. */
  stop(): void;
  /** The hidden audio element that plays translated audio. */
  readonly audioElement: HTMLAudioElement;
  /** The microphone stream track captured for this session. */
  readonly micTrack: MediaStreamTrack | null;
  /** The translated remote stream once it has arrived (null until ontrack). */
  remoteStream(): MediaStream | null;
}

export interface ApiKeyProvider {
  get(): Promise<string>;
  set(apiKey: string): Promise<void>;
  clear(): Promise<void>;
  migrateFromLocalStorage?(): Promise<void>;
}
