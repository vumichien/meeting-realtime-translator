// SetupDoctorPanel — runs setup checks and renders pass/fail rows with hints.

import React from "react";
import { CheckCircle2, XCircle, AlertCircle, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useSetupDoctor } from "@/hooks/use-setup-doctor";
import type { SetupDoctorCheck } from "@/lib/setup-doctor";
import { cn } from "@/lib/utils";

function StatusIcon({ status }: { status: SetupDoctorCheck["status"] }): React.JSX.Element {
  if (status === "ready") return <CheckCircle2 className="h-4 w-4 text-green-500" />;
  if (status === "action") return <XCircle className="h-4 w-4 text-destructive" />;
  return <AlertCircle className="h-4 w-4 text-amber-500" />;
}

function CheckRow({ check }: { check: SetupDoctorCheck }): React.JSX.Element {
  const [expanded, setExpanded] = React.useState(false);

  return (
    <div className="border-b border-border py-2 last:border-0">
      <button
        type="button"
        onClick={() => setExpanded((e) => !e)}
        className="flex w-full items-center gap-3 text-left"
      >
        <StatusIcon status={check.status} />
        <span
          className={cn(
            "flex-1 text-sm font-medium",
            check.status === "action" && "text-destructive",
            check.status === "unknown" && "text-amber-600 dark:text-amber-400",
            check.status === "ready" && "text-foreground",
          )}
        >
          {check.label}
        </span>
        <span className="text-xs text-muted-foreground">{expanded ? "▲" : "▼"}</span>
      </button>

      {expanded && (
        <p className="mt-1.5 pl-7 text-xs text-muted-foreground">{check.detail}</p>
      )}
    </div>
  );
}

export function SetupDoctorPanel(): React.JSX.Element {
  const { latest, running, run } = useSetupDoctor();

  return (
    <div className="space-y-4" data-tour-id="setup-doctor">
      <div className="flex items-center gap-3">
        <Button onClick={run} disabled={running} size="sm">
          {running && <Loader2 className="mr-2 h-3.5 w-3.5 animate-spin" />}
          {running ? "Running…" : "Run checks"}
        </Button>

        {latest && (
          <span className="text-xs text-muted-foreground">
            Last run:{" "}
            {new Date(latest.generatedAt).toLocaleTimeString([], {
              hour: "2-digit",
              minute: "2-digit",
            })}
          </span>
        )}
      </div>

      {!latest && !running && (
        <p className="text-sm text-muted-foreground">
          Click &quot;Run checks&quot; to diagnose your audio setup.
        </p>
      )}

      {latest && (
        <div className="rounded-md border border-border bg-card">
          {/* Overall status banner */}
          <div
            className={cn(
              "flex items-center gap-2 rounded-t-md px-3 py-2 text-sm font-medium",
              latest.overall === "ready" && "bg-green-50 text-green-700 dark:bg-green-950 dark:text-green-300",
              latest.overall === "action" && "bg-red-50 text-destructive dark:bg-red-950",
              latest.overall === "unknown" && "bg-amber-50 text-amber-700 dark:bg-amber-950 dark:text-amber-300",
            )}
          >
            <StatusIcon status={latest.overall} />
            {latest.overall === "ready" && "All checks passed"}
            {latest.overall === "action" && "Action required"}
            {latest.overall === "unknown" && "Some checks inconclusive"}
          </div>

          {/* Check rows */}
          <div className="px-3">
            {latest.checks.map((check) => (
              <CheckRow key={check.id} check={check} />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
