// use-session.ts — thin React hook over the global session singleton.
//
// ALL session state (running/idle, duration, error) lives in sessionStore
// (lib/session-store.ts), registered as a globalThis singleton in _registry.ts.
// This hook is a pure useSyncExternalStore reader + stable start/stop refs.
// Multiple consumers (SessionPill, TranslateScreen, CompactControlBar) all
// read the same store and therefore always show consistent state.

import { useSyncExternalStore, useCallback } from "react";
import { sessionStore } from "./_registry";

// Re-export SessionState so existing import sites don't break.
export type { SessionState, SessionCost } from "@/lib/session-store";

export function useSession() {
  const snap = useSyncExternalStore(
    (cb) => sessionStore.subscribe(cb),
    () => sessionStore.snapshot(),
  );

  // Stable callbacks — sessionStore methods never change identity.
  const start = useCallback(() => sessionStore.start(), []);
  const stop = useCallback((reason?: "user" | "error") => sessionStore.stop(reason), []);

  return {
    state: snap.state,
    durationMs: snap.durationMs,
    cost: snap.cost,
    error: snap.error,
    start,
    stop,
  };
}
