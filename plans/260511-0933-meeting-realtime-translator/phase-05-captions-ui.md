---
phase: 5
title: "Captions UI"
status: completed
priority: P1
effort: "2h"
dependencies: [3]
---

# Phase 05: Captions UI

## Overview
Render source (Vietnamese) and target (translated) caption streams side-by-side from `oai-events` data channel deltas. Auto-scroll, ~30-line buffer, clearable.

## Requirements

**Functional**
- Two scrolling panes: left = source (faded), right = target (bold)
- Append `session.input_transcript.delta` to source; `session.output_transcript.delta` to target
- Auto-scroll to bottom on each delta
- Buffer last ~30 lines per pane (DOM nodes pruned beyond that)
- "Clear captions" button resets both panes
- Captions cleared on session restart

**Non-functional**
- Module <150 lines
- No DOM re-render thrash; append text nodes, don't recreate elements
- Visible at all viewport widths ≥1024px; stack vertically below

## Architecture

```
captions.ts
  ├─ createCaptionsView(): { rootEl, push(event), clear() }
  │     • internal state: { sourceLines: string[], targetLines: string[] }
  │     • on push: append delta to current "in-progress" line, flush on newline or pause
  │     • flush: push line to array, render, prune to 30
  └─ markup: <div class=captions> <pane source><pane target> </div>
```

Note: OpenAI deltas are not pre-segmented into lines. Flush rules are now driven by user settings (defaults preserve current behavior):
- If `captionsFlushOnPunctuation` (default `true`) and delta contains `.`, `?`, `!`, `。`, `？`, `！` → split at last sentence punctuation, finalize current line, start new.
- If `captionsFlushIdleMs` (default `1500`) elapsed without a new delta → finalize current line (debounced flush timer).

When `transcribeSource` is off (phase 06 setting), no `session.input_transcript.delta` events arrive — render a static placeholder in the source pane (`"(source captions disabled — toggle in Settings)"`) and skip flush state for that pane.

<!-- Updated: Validation Session 1 - flush timing from settings; handle disabled-transcription pane -->

## Related Code Files

**Create**
- `client/src/captions.ts` — captions logic + DOM
- `client/src/ui/captions-view.css` (or scoped block in main `styles.css`)

**Modify**
- `client/src/main.ts` — instantiate captions view, hand `push` to `translation-session.onEvent`
- `client/src/styles.css` — caption pane styles (faded source / bold target)

## Implementation Steps

1. `createCaptionsView()` returns:
   ```ts
   {
     rootEl: HTMLElement,
     push(event: SessionEvent): void,
     clear(): void,
   }
   ```
2. DOM:
   ```html
   <section class="captions">
     <div class="caption-pane source">
       <header>Source</header>
       <ol class="caption-lines"></ol>
     </div>
     <div class="caption-pane target">
       <header>Translation</header>
       <ol class="caption-lines"></ol>
     </div>
   </section>
   ```
3. State machine per pane:
   - `currentLine: string` — accumulating delta
   - `lines: string[]` — last 30 finalized lines (rendered as `<li>` children)
   - On `push(delta)`: append to `currentLine`. If terminal punctuation hit OR 1500ms idle → push to `lines`, prune to 30, re-render last `<li>` and append new.
4. Optimization: update DOM by direct `lastChild.textContent =` mutations, not innerHTML rewrites.
5. Auto-scroll: after each update, `pane.scrollTop = pane.scrollHeight`.
6. Wire `main.ts`:
   ```ts
   const captions = createCaptionsView();
   document.querySelector("#captions-slot")!.append(captions.rootEl);
   const handle = await startSession({
     ...,
     onEvent: (e) => captions.push(e),
   });
   ```
7. Style: two-column flex; source 40% width / 0.6 opacity; target 60% width / weight 600; both 12rem tall, scrollable.
8. Clear button: bind to `captions.clear()`. Also call clear at session start.

## Success Criteria

- [x] Speaking VI: source pane fills with VI text; target pane fills with translated text
- [x] Latency between source delta and target delta is visible (sub-second drift typical)
- [x] After 50+ utterances, pane only shows last 30 lines (older pruned, no DOM bloat)
- [x] Clear button empties both panes immediately
- [x] On narrow viewport, panes stack vertically

## Risk Assessment

- **Delta with no punctuation** — flush timer handles this. Without it, the line would grow forever.
- **Right-to-left scripts** in 13-language matrix? — none of the 13 output langs are RTL (Hebrew/Arabic not on the list). Skip RTL handling.
- **CJK no-space text** — flush rule uses `。？！` for those. Safe.
- **Captions are illustrative, not authoritative** — surface a small "(model output, may be wrong)" subtitle once; don't repeat per line.
