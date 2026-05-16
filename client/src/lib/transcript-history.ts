// transcript-history.ts — localStorage-backed session history store.
// FIFO cap: MAX_SESSIONS (30). Keeps storage under ~5MB even for long meetings.
// Key: mt.transcripts.history

import type { TranscriptSegment } from "./transcript-store";

const STORAGE_KEY = "mt.transcripts.history";
const MAX_SESSIONS = 30;

export interface StoredSession {
  id: string;
  startedAt: string;
  endedAt: string | null;
  durationMs: number;
  targetLang: string;
  segments: TranscriptSegment[];
}

type HistoryListener = () => void;

const listeners = new Set<HistoryListener>();

function readFromStorage(): StoredSession[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed as StoredSession[];
  } catch {
    return [];
  }
}

function write(sessions: StoredSession[]): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(sessions));
  } catch (err) {
    console.warn("[transcript-history] write failed:", err);
  }
}

// Cached list snapshot — rebuilt only after mutations to keep stable array
// identity for useSyncExternalStore (avoids React tearing warnings).
let cachedList: StoredSession[] = readFromStorage();

function notify(): void {
  cachedList = readFromStorage();
  listeners.forEach((cb) => cb());
}

export const transcriptHistory = {
  /** Return all stored sessions, newest first. Stable reference between mutations. */
  list(): StoredSession[] {
    return cachedList;
  },

  /** Return a single session by ID, or undefined. */
  get(id: string): StoredSession | undefined {
    return cachedList.find((s) => s.id === id);
  },

  /** Persist a session, pruning oldest to maintain cap of 30. */
  save(session: StoredSession): void {
    const current = cachedList.filter((s) => s.id !== session.id);
    // Prepend newest, trim to cap
    const next = [session, ...current].slice(0, MAX_SESSIONS);
    write(next);
    notify();
  },

  /** Remove a session by ID. */
  delete(id: string): void {
    const next = cachedList.filter((s) => s.id !== id);
    write(next);
    notify();
  },

  /** Subscribe to any history change. Returns unsubscribe fn. */
  subscribe(cb: HistoryListener): () => void {
    listeners.add(cb);
    return () => listeners.delete(cb);
  },
};
