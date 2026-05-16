import { useSyncExternalStore, useCallback } from "react";
import type { TranscriptSnapshot } from "@/lib/transcript-store";
import { transcript } from "./_registry";

export function useTranscript() {
  const snapshot: TranscriptSnapshot = useSyncExternalStore(
    (cb) => transcript.subscribe(cb),
    () => transcript.snapshot(),
  );

  const append = useCallback(
    (kind: "source" | "target", text: string) => transcript.append(kind, text),
    [],
  );

  const clear = useCallback(() => transcript.clear(), []);

  const exportAs = useCallback(
    (format: "json" | "txt"): string => {
      const snap = transcript.snapshot();
      if (format === "json") return JSON.stringify(snap, null, 2);
      return snap.segments
        .map((s) => `[${s.kind}] ${s.text}`)
        .join("\n");
    },
    [],
  );

  return { entries: snapshot.segments, snapshot, append, clear, exportAs };
}
