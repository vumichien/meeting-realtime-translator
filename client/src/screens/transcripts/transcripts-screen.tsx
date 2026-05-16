// transcripts-screen.tsx — Session history list with detail-on-click.
// Reactively subscribes to transcriptHistory via useTranscriptHistory().

import React, { useState } from "react";
import { useTranscriptHistory, type StoredSession } from "@/hooks/use-transcript-history";
import { TranscriptCard } from "./transcript-card";
import { TranscriptDetailDialog } from "./transcript-detail-dialog";

export function TranscriptsScreen(): React.JSX.Element {
  const { sessions, remove } = useTranscriptHistory();
  const [selected, setSelected] = useState<StoredSession | null>(null);
  const [detailOpen, setDetailOpen] = useState(false);

  function handleOpen(session: StoredSession) {
    setSelected(session);
    setDetailOpen(true);
  }

  function handleDetailClose(open: boolean) {
    setDetailOpen(open);
    if (!open) setSelected(null);
  }

  return (
    <div className="p-6">
      <div>
        <h2 className="text-xl font-semibold text-foreground">Transcripts</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Past session transcriptions — stored locally on your machine. Up to 30 sessions kept.
        </p>
      </div>

      {sessions.length === 0 ? (
        <div className="mt-10 flex flex-col items-center gap-2 text-center">
          <p className="text-sm text-muted-foreground">
            No transcripts yet. Completed translation sessions will appear here.
          </p>
        </div>
      ) : (
        <div className="mt-6 flex flex-col gap-2">
          {sessions.map((session) => (
            <TranscriptCard
              key={session.id}
              session={session}
              onClick={handleOpen}
            />
          ))}
        </div>
      )}

      <TranscriptDetailDialog
        session={selected}
        open={detailOpen}
        onOpenChange={handleDetailClose}
        onDelete={remove}
      />
    </div>
  );
}
