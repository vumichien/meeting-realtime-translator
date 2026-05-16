import { useSyncExternalStore, useCallback } from "react";
import type { CaptionEntry } from "@/captions";
import { captions } from "./_registry";

export type { CaptionEntry };

export function useCaptions() {
  const snapshot = useSyncExternalStore(
    (cb) => captions.subscribe(cb),
    () => captions.snapshot(),
  );

  const clear = useCallback(() => captions.clear(), []);

  return {
    source: snapshot.source as CaptionEntry[],
    translation: snapshot.translation as CaptionEntry[],
    clear,
  };
}
