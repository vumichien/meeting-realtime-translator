export type TranscriptSegmentKind = "source" | "target";

export interface TranscriptSegment {
  id: string;
  kind: TranscriptSegmentKind;
  text: string;
  createdAt: string;
  finalizedAt: string;
  targetLanguage: string;
}

export interface TranscriptSnapshot {
  sessionStartedAt: string | null;
  sessionEndedAt: string | null;
  targetLanguage: string;
  segments: TranscriptSegment[];
}

export interface TranscriptStore {
  beginSession(targetLanguage: string): void;
  endSession(): void;
  append(kind: TranscriptSegmentKind, text: string): void;
  clear(): void;
  snapshot(): TranscriptSnapshot;
  hasContent(): boolean;
  subscribe(listener: () => void): () => void;
}

const MAX_SEGMENTS = 2_000;

export function createTranscriptStore(): TranscriptStore {
  let sessionStartedAt: string | null = null;
  let sessionEndedAt: string | null = null;
  let targetLanguage = "";
  let segments: TranscriptSegment[] = [];
  const listeners = new Set<() => void>();

  function notify() {
    listeners.forEach((listener) => listener());
  }

  return {
    beginSession(nextTargetLanguage) {
      sessionStartedAt = new Date().toISOString();
      sessionEndedAt = null;
      targetLanguage = nextTargetLanguage;
      segments = [];
      notify();
    },
    endSession() {
      if (sessionStartedAt && !sessionEndedAt) sessionEndedAt = new Date().toISOString();
      notify();
    },
    append(kind, text) {
      const clean = text.trim();
      if (!clean) return;
      const now = new Date().toISOString();
      segments.push({
        id: `${now}-${segments.length}`,
        kind,
        text: clean,
        createdAt: now,
        finalizedAt: now,
        targetLanguage,
      });
      if (segments.length > MAX_SEGMENTS) segments = segments.slice(-MAX_SEGMENTS);
      notify();
    },
    clear() {
      sessionStartedAt = null;
      sessionEndedAt = null;
      segments = [];
      notify();
    },
    snapshot() {
      return {
        sessionStartedAt,
        sessionEndedAt,
        targetLanguage,
        segments: [...segments],
      };
    },
    hasContent: () => segments.length > 0,
    subscribe(listener) {
      listeners.add(listener);
      return () => listeners.delete(listener);
    },
  };
}
