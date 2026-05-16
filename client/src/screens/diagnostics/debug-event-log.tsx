// DebugEventLog — filterable event log + "Copy redacted bundle" button.
// events[] is [] placeholder until Phase 8; component renders gracefully.
// buildDebugBundle handles redaction; settings snapshot passed from registry.

import React, { useState, useMemo } from "react";
import { Copy, Check } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useDebug } from "@/hooks/use-debug";
import { buildDebugBundle, type BufferedEvent } from "@/lib/debug-bundle";
import { settings } from "@/hooks/_registry";

// Cap display at 500 entries; useDebug already caps store at 1000 (FIFO).
const DISPLAY_CAP = 500;

export function DebugEventLog(): React.JSX.Element {
  const { events } = useDebug();
  const [filter, setFilter] = useState("");
  const [copied, setCopied] = useState(false);

  // Treat events as BufferedEvent[] — hook types as unknown[] until Phase 8.
  const typedEvents = events as BufferedEvent[];

  const filtered = useMemo(() => {
    const lower = filter.toLowerCase();
    const all = lower
      ? typedEvents.filter(
          (e) =>
            e.type.toLowerCase().includes(lower) ||
            JSON.stringify(e.payload).toLowerCase().includes(lower),
        )
      : typedEvents;
    return all.slice(-DISPLAY_CAP);
  }, [typedEvents, filter]);

  async function handleCopyBundle() {
    try {
      const bundle = buildDebugBundle({
        events: typedEvents,
        settings: settings.snapshot(),
        state: {},
        metrics: {},
        app: {
          version: (window as unknown as Record<string, unknown>)["__MT_VERSION__"] as string ?? "unknown",
          userAgent: navigator.userAgent,
          platform: navigator.platform,
        },
        support: {
          setSinkId: typeof HTMLMediaElement.prototype.setSinkId === "function",
          setupDoctor: null,
          lastIssue: null,
          sessionDurationMs: 0,
        },
      });
      await navigator.clipboard.writeText(bundle);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Clipboard may be blocked in some Electron configurations
      console.warn("[debug-event-log] clipboard write failed");
    }
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2">
        <Input
          placeholder="Filter events…"
          value={filter}
          onChange={(e) => setFilter(e.target.value)}
          className="h-8 max-w-xs text-sm"
        />
        <Button
          size="sm"
          variant="outline"
          onClick={handleCopyBundle}
          className="ml-auto shrink-0"
        >
          {copied ? (
            <>
              <Check className="mr-1.5 h-3.5 w-3.5 text-green-500" />
              Copied!
            </>
          ) : (
            <>
              <Copy className="mr-1.5 h-3.5 w-3.5" />
              Copy redacted bundle
            </>
          )}
        </Button>
      </div>

      {filtered.length === 0 ? (
        <p className="text-sm text-muted-foreground">
          {typedEvents.length === 0
            ? "No events yet — start a session to capture debug data."
            : "No events match the filter."}
        </p>
      ) : (
        <div className="max-h-96 overflow-y-auto rounded-md border border-border font-mono text-xs">
          <table className="w-full table-fixed">
            <thead className="sticky top-0 bg-muted/80 backdrop-blur">
              <tr>
                <th className="w-24 px-2 py-1 text-left font-medium text-muted-foreground">
                  Time
                </th>
                <th className="w-48 px-2 py-1 text-left font-medium text-muted-foreground">
                  Type
                </th>
                <th className="px-2 py-1 text-left font-medium text-muted-foreground">
                  Payload
                </th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((ev, idx) => (
                <tr
                  // eslint-disable-next-line react/no-array-index-key
                  key={`${ev.ts}-${idx}`}
                  className="border-t border-border hover:bg-muted/50"
                >
                  <td className="px-2 py-0.5 text-muted-foreground">
                    {new Date(ev.ts).toISOString().slice(11, 23)}
                  </td>
                  <td className="truncate px-2 py-0.5 text-foreground">{ev.type}</td>
                  <td className="truncate px-2 py-0.5 text-muted-foreground">
                    {typeof ev.payload === "string"
                      ? ev.payload
                      : JSON.stringify(ev.payload)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {typedEvents.length > DISPLAY_CAP && (
        <p className="text-xs text-muted-foreground">
          Showing last {DISPLAY_CAP} of {typedEvents.length} events.
        </p>
      )}
    </div>
  );
}
