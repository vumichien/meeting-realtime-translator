import { downloadTranscript } from "../lib/transcript-export";
import type { TranscriptStore } from "../lib/transcript-store";

export interface TranscriptExportPanel {
  rootEl: HTMLElement;
  refresh(): void;
  destroy(): void;
}

export function createTranscriptExportPanel(store: TranscriptStore): TranscriptExportPanel {
  const root = document.createElement("div");
  root.className = "transcript-export";
  root.innerHTML = `
    <span class="transcript-count">No transcript yet</span>
    <button type="button" class="secondary-btn export-md" disabled>Export MD</button>
    <button type="button" class="secondary-btn export-txt" disabled>Export TXT</button>
  `;
  const count = root.querySelector<HTMLElement>(".transcript-count")!;
  const mdBtn = root.querySelector<HTMLButtonElement>(".export-md")!;
  const txtBtn = root.querySelector<HTMLButtonElement>(".export-txt")!;
  const unsubscribe = store.subscribe(refresh);

  mdBtn.addEventListener("click", () => downloadTranscript(store.snapshot(), "markdown"));
  txtBtn.addEventListener("click", () => downloadTranscript(store.snapshot(), "text"));
  refresh();

  function refresh() {
    const snapshot = store.snapshot();
    const hasContent = snapshot.segments.length > 0;
    count.textContent = hasContent
      ? `${snapshot.segments.length} transcript lines`
      : "No transcript yet";
    mdBtn.disabled = !hasContent;
    txtBtn.disabled = !hasContent;
  }

  return {
    rootEl: root,
    refresh,
    destroy: unsubscribe,
  };
}
