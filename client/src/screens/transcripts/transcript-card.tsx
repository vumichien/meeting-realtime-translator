// transcript-card.tsx — Clickable card showing a past session summary.
// Date / duration / target lang / source snippet. Full click opens detail dialog.

import React from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { LANGUAGE_LABELS } from "@/config/languages";
import type { AllowedLang } from "@/config/languages";
import type { StoredSession } from "@/hooks/use-transcript-history";

interface TranscriptCardProps {
  session: StoredSession;
  onClick: (session: StoredSession) => void;
}

function formatDate(iso: string): string {
  try {
    return new Intl.DateTimeFormat(undefined, {
      dateStyle: "medium",
      timeStyle: "short",
    }).format(new Date(iso));
  } catch {
    return iso;
  }
}

function formatDuration(ms: number): string {
  const totalSec = Math.round(ms / 1000);
  const min = Math.floor(totalSec / 60);
  const sec = totalSec % 60;
  if (min === 0) return `${sec}s`;
  return `${min}m ${sec}s`;
}

function sourceSnippet(session: StoredSession, maxChars = 80): string {
  const sourceSegments = session.segments.filter((s) => s.kind === "source");
  const text = sourceSegments.map((s) => s.text).join(" ").trim();
  if (!text) return "No source transcription";
  return text.length > maxChars ? `${text.slice(0, maxChars)}…` : text;
}

export function TranscriptCard({
  session,
  onClick,
}: TranscriptCardProps): React.JSX.Element {
  const langLabel =
    LANGUAGE_LABELS[session.targetLang as AllowedLang] ?? session.targetLang;

  return (
    <Card
      role="button"
      tabIndex={0}
      className="cursor-pointer transition-colors hover:bg-accent/50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
      onClick={() => onClick(session)}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          onClick(session);
        }
      }}
    >
      <CardContent className="py-3 px-4">
        <div className="flex items-start justify-between gap-3">
          <div className="flex flex-col gap-1 min-w-0">
            <span className="text-sm font-medium text-foreground">
              {formatDate(session.startedAt)}
            </span>
            <p className="text-xs text-muted-foreground line-clamp-2">
              {sourceSnippet(session)}
            </p>
          </div>
          <div className="flex flex-col items-end gap-1 shrink-0">
            <Badge variant="secondary" className="text-xs font-normal whitespace-nowrap">
              {langLabel}
            </Badge>
            <span className="text-xs text-muted-foreground whitespace-nowrap">
              {formatDuration(session.durationMs)}
            </span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
