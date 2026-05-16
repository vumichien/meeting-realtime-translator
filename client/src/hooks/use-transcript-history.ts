// use-transcript-history.ts — reactive hook for localStorage-backed session history.
// Subscribes to transcriptHistory store and re-renders on any change.

import { useSyncExternalStore, useCallback } from "react";
import { transcriptHistory, type StoredSession } from "@/lib/transcript-history";

export type { StoredSession };

export interface TranscriptHistoryState {
  sessions: StoredSession[];
  remove: (id: string) => void;
  get: (id: string) => StoredSession | undefined;
}

export function useTranscriptHistory(): TranscriptHistoryState {
  const sessions = useSyncExternalStore(
    (cb) => transcriptHistory.subscribe(cb),
    () => transcriptHistory.list(),
  );

  const remove = useCallback((id: string) => {
    transcriptHistory.delete(id);
  }, []);

  const get = useCallback((id: string) => {
    return transcriptHistory.get(id);
  }, []);

  return { sessions, remove, get };
}
