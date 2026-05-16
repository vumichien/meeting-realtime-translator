// guardrails-section.tsx — Session cost and duration limit settings.
// Inputs: warning threshold (minutes), auto-stop threshold (0 = off).
// Switch: show cost in status pill.
// All number inputs clamped to min=0 at commit time.

import React from "react";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { useSettings } from "@/hooks/use-settings";

export function GuardrailsSection(): React.JSX.Element {
  const { settings, set } = useSettings();

  const warningMinutes = settings["mt.session_warning_minutes"];
  const autoStopMinutes = settings["mt.session_auto_stop_minutes"];
  const showCostInPill = settings["mt.show_cost_in_pill"];

  function handleMinutesChange(
    key: "mt.session_warning_minutes" | "mt.session_auto_stop_minutes",
    raw: string,
  ) {
    const n = parseInt(raw, 10);
    // Clamp: NaN or negative → 0
    set(key, Number.isFinite(n) ? Math.max(0, n) : 0);
  }

  return (
    <div className="flex flex-col gap-5">
      {/* Cost warning threshold */}
      <div className="flex items-center justify-between gap-4">
        <div className="min-w-0">
          <p className="text-sm font-medium">Cost warning threshold</p>
          <p className="text-xs text-muted-foreground">
            Show a warning after this many minutes. Set to 0 to disable.
          </p>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <Input
            type="number"
            min={0}
            value={warningMinutes}
            onChange={(e) =>
              handleMinutesChange("mt.session_warning_minutes", e.target.value)
            }
            className="w-20 text-right"
            aria-label="Cost warning threshold in minutes"
          />
          <span className="text-sm text-muted-foreground whitespace-nowrap">min</span>
        </div>
      </div>

      {/* Auto-stop threshold */}
      <div className="flex items-center justify-between gap-4">
        <div className="min-w-0">
          <p className="text-sm font-medium">Auto-stop threshold</p>
          <p className="text-xs text-muted-foreground">
            Automatically stop the session after this many minutes. Set to 0 to disable.
          </p>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <Input
            type="number"
            min={0}
            value={autoStopMinutes}
            onChange={(e) =>
              handleMinutesChange("mt.session_auto_stop_minutes", e.target.value)
            }
            className="w-20 text-right"
            aria-label="Auto-stop threshold in minutes"
          />
          <span className="text-sm text-muted-foreground whitespace-nowrap">min</span>
        </div>
      </div>

      {/* Show cost in pill */}
      <div className="flex items-center justify-between gap-4">
        <div>
          <p className="text-sm font-medium">Show cost in status pill</p>
          <p className="text-xs text-muted-foreground">
            Display an estimated cost counter during active sessions.
          </p>
        </div>
        <Switch
          checked={showCostInPill}
          onCheckedChange={(checked) => set("mt.show_cost_in_pill", checked)}
          aria-label="Show cost in status pill"
        />
      </div>
    </div>
  );
}
