import React from "react";
import { cn } from "@/lib/utils";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { useSession } from "@/hooks/use-session";
import type { SessionState as RealSessionState } from "@/hooks/use-session";

interface SessionPillProps {
  /** Whether the sidebar is collapsed (shows dot + tooltip only) */
  collapsed: boolean;
}

/** Maps real session states to display metadata */
const STATE_META: Record<
  RealSessionState,
  { dot: string; label: string; isActive: boolean }
> = {
  idle:       { dot: "bg-muted-foreground/50", label: "Idle",        isActive: false },
  connecting: { dot: "bg-amber-400 animate-pulse", label: "Connecting…", isActive: true },
  connected:  { dot: "bg-emerald-500",          label: "Translating", isActive: true },
  failed:     { dot: "bg-rose-500",             label: "Error",       isActive: false },
  closed:     { dot: "bg-muted-foreground/50",  label: "Stopped",     isActive: false },
};

function formatDuration(ms: number): string {
  const totalSec = Math.floor(ms / 1000);
  const m = Math.floor(totalSec / 60);
  const s = totalSec % 60;
  return `${m}:${String(s).padStart(2, "0")}`;
}

/**
 * Sticky session status pill rendered in the sidebar footer.
 * Reads live state from useSession() — no props needed for state.
 * In collapsed mode: shows colored dot with a tooltip.
 * In expanded mode: shows dot + status label + elapsed time when active.
 *
 * Uses aria-live="polite" so screen readers announce state changes.
 */
export function SessionPill({ collapsed }: SessionPillProps): React.JSX.Element {
  const { state, durationMs } = useSession();
  const { dot, label, isActive } = STATE_META[state];

  const dotEl = (
    <span
      className={cn("h-2 w-2 shrink-0 rounded-full", dot)}
      aria-hidden="true"
    />
  );

  if (collapsed) {
    return (
      <Tooltip>
        <TooltipTrigger asChild>
          <div
            className="flex items-center justify-center py-3"
            aria-live="polite"
            aria-label={`Session: ${label}`}
          >
            {dotEl}
          </div>
        </TooltipTrigger>
        <TooltipContent side="right">Session: {label}</TooltipContent>
      </Tooltip>
    );
  }

  return (
    <div
      className="flex items-center gap-2 px-3 py-3 text-xs text-muted-foreground"
      aria-live="polite"
    >
      {dotEl}
      <span className="flex-1 truncate font-medium">{label}</span>
      {isActive && durationMs > 0 && (
        <span className="tabular-nums">{formatDuration(durationMs)}</span>
      )}
    </div>
  );
}
