// Live captions display split-pane: source (top/left) + translation (bottom/right).
// Responsive: stacked by default, side-by-side at lg breakpoint (≥1024px).
// Implements sticky-autoscroll: auto-scrolls to bottom unless user has scrolled up.

import React, { useRef, useEffect, useCallback } from "react";
import type { CaptionEntry } from "@/captions";
import { cn } from "@/lib/utils";

interface CaptionPanelProps {
  label: string;
  entries: CaptionEntry[];
  /** Additional class names for the panel wrapper */
  className?: string;
  /** "translation" applies per-entry colored backgrounds; "source" uses subtle gray for non-final only */
  variant?: "source" | "translation";
}

function CaptionPanel({ label, entries, className, variant = "source" }: CaptionPanelProps): React.JSX.Element {
  const scrollRef = useRef<HTMLDivElement>(null);
  const isPinnedRef = useRef(true);

  // Throttled scroll-position check: pin only on user-initiated scroll events
  const handleScroll = useCallback(() => {
    const el = scrollRef.current;
    if (!el) return;
    const distanceFromBottom = el.scrollHeight - el.scrollTop - el.clientHeight;
    // Re-pin when user scrolls within 40px of the bottom
    isPinnedRef.current = distanceFromBottom < 40;
  }, []);

  // Auto-scroll to bottom when new entries arrive, only when pinned
  useEffect(() => {
    if (!isPinnedRef.current) return;
    const el = scrollRef.current;
    if (el) {
      el.scrollTop = el.scrollHeight;
    }
  }, [entries]);

  return (
    <div className={cn("flex min-h-0 flex-1 flex-col", className)}>
      <div className="shrink-0 border-b border-border px-4 py-1.5">
        <span className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
          {label}
        </span>
      </div>
      <div
        ref={scrollRef}
        onScroll={handleScroll}
        className="flex-1 overflow-y-auto px-4 py-3"
        aria-label={`${label} captions`}
        aria-live="polite"
        aria-atomic="false"
      >
        {entries.length === 0 ? (
          <p className="text-sm text-muted-foreground/50 italic">Waiting for audio…</p>
        ) : (
          <p className="text-sm leading-relaxed">
            {entries.map((entry, i) => (
              <React.Fragment key={entry.id}>
                {i > 0 && " "}
                <span
                  className={cn(
                    "transition-colors rounded px-0.5",
                    variant === "translation"
                      ? entry.final
                        ? "bg-sky-100/80 dark:bg-sky-900/40"
                        : "bg-amber-100 dark:bg-amber-900/50 font-medium"
                      : !entry.final && "bg-primary/5 font-medium",
                  )}
                >
                  {entry.text}
                </span>
              </React.Fragment>
            ))}
          </p>
        )}
      </div>
    </div>
  );
}

interface CaptionsCanvasProps {
  source: CaptionEntry[];
  translation: CaptionEntry[];
}

/**
 * Two-pane captions view.
 * Layout: flex-col (stacked) by default, flex-row at lg breakpoint.
 */
export function CaptionsCanvas({ source, translation }: CaptionsCanvasProps): React.JSX.Element {
  return (
    <div className="flex min-h-0 flex-1 flex-col lg:flex-row">
      <CaptionPanel
        label="Source"
        entries={source}
        className="lg:border-r lg:border-border"
      />
      <CaptionPanel
        label="Translation"
        entries={translation}
        variant="translation"
      />
    </div>
  );
}
