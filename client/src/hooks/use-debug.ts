// useDebug — reactive view of debug panel state.
//
// The DOM-bound DebugPanel instance lives in legacy app.ts (excluded from
// typecheck, deleted in Phase 8). This hook exposes a lightweight reactive
// snapshot: open toggle, event count, and latency P50 — sourced from
// latencyWarning (registry) for the React UI, and from settings for the
// open-state preference. The full DOM panel remains in the legacy #app tree
// until Phase 8.
//
// When Phase 8 removes the DOM panel, this hook can be wired to a new
// React-native debug drawer without changing its API surface.

import { useSyncExternalStore, useCallback } from "react";
import { settings, latency } from "./_registry";

type LatencyState = "ok" | "warn";

interface DebugSnapshot {
  open: boolean;
  latencyState: LatencyState;
}

// Wrap latencyWarning.onChange/offChange in subscribe-style interface for
// useSyncExternalStore compatibility.
function subscribeLatency(cb: () => void): () => void {
  latency.onChange(cb);
  return () => latency.offChange(cb);
}

function latencySnapshot(): LatencyState {
  return latency.state();
}

export function useDebug() {
  const latencyState = useSyncExternalStore(subscribeLatency, latencySnapshot);

  const open = useSyncExternalStore(
    (cb) => settings.subscribe(cb),
    () => settings.get("mt.debug_panel_open"),
  );

  const toggle = useCallback(() => {
    settings.set("mt.debug_panel_open", !settings.get("mt.debug_panel_open"));
  }, []);

  return {
    open,
    toggle,
    latencyState,
    // events list is owned by the DOM panel; exposed as empty until Phase 8
    // replaces the DOM panel with a React drawer.
    events: [] as unknown[],
  };
}
