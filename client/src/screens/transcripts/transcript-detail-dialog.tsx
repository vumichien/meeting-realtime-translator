// transcript-detail-dialog.tsx — Full session view with source+translation columns,
// multi-format export dropdown, and delete with AlertDialog confirmation.

import React, { useState } from "react";
import { Download, Trash2 } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { downloadTranscript, serializeTranscript } from "@/lib/transcript-export";
import type { TranscriptSnapshot } from "@/lib/transcript-store";
import type { StoredSession } from "@/hooks/use-transcript-history";
import { LANGUAGE_LABELS } from "@/config/languages";
import type { AllowedLang } from "@/config/languages";

interface TranscriptDetailDialogProps {
  session: StoredSession | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onDelete: (id: string) => void;
}

function formatDate(iso: string): string {
  try {
    return new Intl.DateTimeFormat(undefined, {
      dateStyle: "long",
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

/** Build a TranscriptSnapshot-compatible object from a StoredSession. */
function toSnapshot(session: StoredSession): TranscriptSnapshot {
  return {
    sessionStartedAt: session.startedAt,
    sessionEndedAt: session.endedAt,
    targetLanguage: session.targetLang,
    segments: session.segments,
  };
}

function downloadJson(session: StoredSession): void {
  const snap = toSnapshot(session);
  const blob = new Blob([JSON.stringify(snap, null, 2)], {
    type: "application/json;charset=utf-8",
  });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = `babel-mic-transcript-${session.startedAt.replace(/[:.]/g, "-").slice(0, 19)}.json`;
  link.click();
  window.setTimeout(() => URL.revokeObjectURL(url), 500);
}

export function TranscriptDetailDialog({
  session,
  open,
  onOpenChange,
  onDelete,
}: TranscriptDetailDialogProps): React.JSX.Element {
  const [deleteOpen, setDeleteOpen] = useState(false);

  if (!session) return <></>;

  const snap = toSnapshot(session);
  const sourceSegments = session.segments.filter((s) => s.kind === "source");
  const translationSegments = session.segments.filter((s) => s.kind === "target");
  const langLabel =
    LANGUAGE_LABELS[session.targetLang as AllowedLang] ?? session.targetLang;

  function handleDelete() {
    onDelete(session!.id);
    setDeleteOpen(false);
    onOpenChange(false);
  }

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-3xl h-[80vh] flex flex-col">
          <DialogHeader className="shrink-0">
            <div className="flex items-start justify-between gap-3 pr-8">
              <div>
                <DialogTitle>{formatDate(session.startedAt)}</DialogTitle>
                <div className="mt-1.5 flex items-center gap-2">
                  <Badge variant="secondary" className="text-xs font-normal">
                    {langLabel}
                  </Badge>
                  <span className="text-xs text-muted-foreground">
                    {formatDuration(session.durationMs)}
                  </span>
                  <span className="text-xs text-muted-foreground">
                    {session.segments.length} segment{session.segments.length !== 1 ? "s" : ""}
                  </span>
                </div>
              </div>

              <div className="flex items-center gap-2 shrink-0">
                {/* Export dropdown */}
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="outline" size="sm" className="gap-1.5">
                      <Download className="h-3.5 w-3.5" />
                      Export
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem
                      onClick={() => downloadTranscript(snap, "text")}
                    >
                      Plain text (.txt)
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      onClick={() => downloadTranscript(snap, "srt")}
                    >
                      Subtitles (.srt)
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => downloadJson(session)}>
                      JSON (.json)
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      onClick={() => downloadTranscript(snap, "markdown")}
                    >
                      Markdown (.md)
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>

                {/* Delete button */}
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 text-destructive hover:text-destructive"
                  aria-label="Delete session"
                  onClick={() => setDeleteOpen(true)}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </DialogHeader>

          {/* Transcript body — source | translation columns */}
          <div className="flex-1 overflow-hidden mt-4 grid grid-cols-2 gap-4 min-h-0">
            {/* Source column */}
            <div className="flex flex-col min-h-0">
              <h3 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-2 shrink-0">
                Source
              </h3>
              <div className="flex-1 overflow-y-auto rounded-md border bg-muted/30 p-3">
                {sourceSegments.length === 0 ? (
                  <p className="text-xs text-muted-foreground">No source transcription.</p>
                ) : (
                  <ul className="flex flex-col gap-2">
                    {sourceSegments.map((seg) => (
                      <li key={seg.id} className="text-sm">
                        {seg.text}
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </div>

            {/* Translation column */}
            <div className="flex flex-col min-h-0">
              <h3 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-2 shrink-0">
                Translation ({langLabel})
              </h3>
              <div className="flex-1 overflow-y-auto rounded-md border bg-muted/30 p-3">
                {translationSegments.length === 0 ? (
                  <p className="text-xs text-muted-foreground">No translation available.</p>
                ) : (
                  <ul className="flex flex-col gap-2">
                    {translationSegments.map((seg) => (
                      <li key={seg.id} className="text-sm">
                        {seg.text}
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Delete confirmation */}
      <AlertDialog open={deleteOpen} onOpenChange={setDeleteOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete transcript?</AlertDialogTitle>
            <AlertDialogDescription>
              The session from {formatDate(session.startedAt)} will be permanently deleted.
              This cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={handleDelete}
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
