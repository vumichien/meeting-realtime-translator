import type { SessionEvent, TranscriptDeltaEvent } from "./types";
import type { TranscriptSegmentKind } from "./lib/transcript-store";

export interface CaptionsFlushOptions {
  idleMs: number;
  onPunctuation: boolean;
}

export interface CaptionsViewOptions {
  flush: CaptionsFlushOptions;
  /** When false, source pane shows a disabled placeholder. */
  transcribeSource: boolean;
  maxLines?: number;
  onFinalize?: (kind: TranscriptSegmentKind, text: string) => void;
}

export interface CaptionsView {
  rootEl: HTMLElement;
  push(event: SessionEvent): void;
  clear(): void;
  setOptions(opts: Partial<CaptionsViewOptions>): void;
  destroy(): void;
}

const PUNCT = /[.?!。？！]/;
const DEFAULT_MAX_LINES = 30;

export function createCaptionsView(options: CaptionsViewOptions): CaptionsView {
  let opts: CaptionsViewOptions = { ...options };
  const maxLines = options.maxLines ?? DEFAULT_MAX_LINES;

  const root = document.createElement("section");
  root.className = "captions";
  root.innerHTML = `
    <div class="caption-pane source">
      <header>
        <span>Source</span>
        <small>what you said</small>
        <span class="caption-lang-chip" hidden></span>
      </header>
      <ol class="caption-lines"></ol>
    </div>
    <div class="caption-pane target">
      <header><span>Translation</span><small>what listeners hear</small></header>
      <ol class="caption-lines"></ol>
    </div>
  `;
  const sourceLangChip = root.querySelector(".caption-lang-chip") as HTMLElement;

  const sourcePane = createPane(
    root.querySelector(".caption-pane.source ol.caption-lines") as HTMLOListElement,
  );
  const targetPane = createPane(
    root.querySelector(".caption-pane.target ol.caption-lines") as HTMLOListElement,
  );

  applyTranscribeSourcePlaceholder();

  function applyTranscribeSourcePlaceholder() {
    if (!opts.transcribeSource) {
      sourcePane.list.innerHTML =
        '<li class="caption-placeholder">(source captions disabled — toggle in Settings)</li>';
    } else if (sourcePane.list.querySelector(".caption-placeholder")) {
      sourcePane.list.innerHTML = "";
    }
  }

  return {
    rootEl: root,
    push(event) {
      if (event.type === "session.input_transcript.delta") {
        if (!opts.transcribeSource) return;
        const detected = (event as TranscriptDeltaEvent).detectedSourceLang;
        if (detected) {
          sourceLangChip.textContent = `Detected: ${detected}`;
          sourceLangChip.hidden = false;
        }
        appendDelta(sourcePane, "source", (event as { delta: string }).delta, maxLines, opts);
      } else if (event.type === "session.output_transcript.delta") {
        appendDelta(targetPane, "target", (event as { delta: string }).delta, maxLines, opts);
      }
    },
    clear() {
      sourcePane.reset();
      targetPane.reset();
      sourceLangChip.textContent = "";
      sourceLangChip.hidden = true;
      applyTranscribeSourcePlaceholder();
    },
    setOptions(partial) {
      opts = { ...opts, ...partial, flush: { ...opts.flush, ...partial.flush } };
      applyTranscribeSourcePlaceholder();
    },
    destroy() {
      sourcePane.destroy();
      targetPane.destroy();
      root.remove();
    },
  };
}

interface Pane {
  list: HTMLOListElement;
  reset(): void;
  destroy(): void;
}

function createPane(list: HTMLOListElement): Pane & {
  current: HTMLLIElement | null;
  flushTimer: number | undefined;
} {
  return {
    list,
    current: null,
    flushTimer: undefined,
    reset() {
      list.innerHTML = "";
      this.current = null;
      if (this.flushTimer) {
        window.clearTimeout(this.flushTimer);
        this.flushTimer = undefined;
      }
    },
    destroy() {
      if (this.flushTimer) window.clearTimeout(this.flushTimer);
      this.flushTimer = undefined;
    },
  };
}

function appendDelta(
  pane: ReturnType<typeof createPane>,
  kind: TranscriptSegmentKind,
  delta: string,
  maxLines: number,
  opts: CaptionsViewOptions,
) {
  if (!delta) return;
  // Drop any placeholder from a disabled state.
  const placeholder = pane.list.querySelector(".caption-placeholder");
  if (placeholder) placeholder.remove();

  if (!pane.current) {
    pane.current = document.createElement("li");
    pane.list.append(pane.current);
  }
  pane.current.textContent = (pane.current.textContent ?? "") + delta;

  pruneLines(pane.list, maxLines);
  scrollToBottom(pane.list);

  if (pane.flushTimer) window.clearTimeout(pane.flushTimer);
  if (opts.flush.onPunctuation && PUNCT.test(delta)) {
    finalizeLine(pane, kind, opts.onFinalize);
  } else {
    pane.flushTimer = window.setTimeout(
      () => finalizeLine(pane, kind, opts.onFinalize),
      opts.flush.idleMs,
    );
  }
}

function finalizeLine(
  pane: ReturnType<typeof createPane>,
  kind: TranscriptSegmentKind,
  onFinalize: CaptionsViewOptions["onFinalize"],
) {
  if (pane.flushTimer) {
    window.clearTimeout(pane.flushTimer);
    pane.flushTimer = undefined;
  }
  if (pane.current && pane.current.textContent?.trim()) {
    pane.current.classList.add("caption-final");
    onFinalize?.(kind, pane.current.textContent);
  }
  pane.current = null;
}

function pruneLines(list: HTMLOListElement, max: number) {
  while (list.children.length > max) {
    list.firstElementChild?.remove();
  }
}

function scrollToBottom(list: HTMLOListElement) {
  list.scrollTop = list.scrollHeight;
}
