// useGuardrails — session duration warning + auto-stop thresholds.
// Reads warning/auto-stop minute thresholds from settings and tracks elapsed
// time against them. Designed to be driven by the durationMs from useSession.

import { useMemo } from "react";
import { useSettings } from "./use-settings";

export type GuardrailStatus = "ok" | "warning" | "stopped";

export interface GuardrailsState {
  status: GuardrailStatus;
  warningMinutes: number;
  autoStopMinutes: number;
  /** True when durationMs has crossed the warning threshold. */
  warningShouldShow: boolean;
  /** True when durationMs has crossed the auto-stop threshold (> 0). */
  shouldAutoStop: boolean;
}

export function useGuardrails(durationMs: number): GuardrailsState {
  const { settings } = useSettings();

  const warningMinutes = settings["mt.session_warning_minutes"];
  const autoStopMinutes = settings["mt.session_auto_stop_minutes"];

  return useMemo(() => {
    const elapsedMin = durationMs / 60_000;
    const warningShouldShow = warningMinutes > 0 && elapsedMin >= warningMinutes;
    const shouldAutoStop =
      autoStopMinutes > 0 && elapsedMin >= autoStopMinutes;

    let status: GuardrailStatus = "ok";
    if (shouldAutoStop) status = "stopped";
    else if (warningShouldShow) status = "warning";

    return { status, warningMinutes, autoStopMinutes, warningShouldShow, shouldAutoStop };
  }, [durationMs, warningMinutes, autoStopMinutes]);
}
