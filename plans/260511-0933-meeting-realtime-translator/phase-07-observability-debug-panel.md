---
phase: 7
title: "Observability Debug Panel"
status: completed
priority: P2
effort: "3h"
dependencies: [6]
---

# Phase 07: Observability Debug Panel

## Overview
User-facing debug panel so the operator can see what's actually happening behind the scenes — connection states, event flow, latency, errors. Local-only; no external analytics. Helps diagnose problems without opening DevTools and builds trust by exposing model behavior (silent stretches, mixed-language gaps, terminology slips).

## Why this matters

The user explicitly wants telemetry so they can "track what really happens behind." This is **observability for the user themselves**, not metrics shipped to a vendor. Three reasons it ships in v1:

1. **Translation is opaque.** Without instrumentation, a 3-second silent stretch could be: network lag, model still thinking, mixed-language gap, mic muted, virtual cable disconnected. Panel surfaces the cause.
2. **Captions show output, panel shows process.** Captions = what was said. Panel = how the session is doing.
3. **Public repo trust.** Users running this on live calls need confidence. Visible internals beats hidden magic.

## Requirements

**Functional**
- Toggle button "Show debug panel" (collapsed by default; remembers state)
- Live readouts:
  - WebRTC connection state (new / connecting / connected / disconnected / failed)
  - ICE connection state
  - Time since session start
  - Time since last source delta
  - Time since last target delta
  - End-to-end latency estimate: rolling median of `(target_delta_t - matched_source_delta_t)`
  - Audio levels: input mic VU meter + translated output VU meter
  - Event counts: source deltas, target deltas, errors
- Scrollable event log (last 200 events):
  - Timestamp + event type + truncated payload (max 120 chars)
  - Filterable by event type (checkboxes)
  - Color-coded: source=blue, target=green, error=red, state=gray
- "Copy debug bundle" button → copies JSON to clipboard with: app version, browser UA, OS, last 50 events, current state, current settings (key redacted). For pasting into bug reports.
- "Clear log" button

**Non-functional**
- Panel module <250 lines (split if larger)
- No performance impact when collapsed (event log buffer still runs but DOM hidden)
- No external dependencies (no analytics SDK, no remote calls)
- Privacy: API keys, client_secrets, raw audio NEVER logged
- Mobile/narrow viewport: panel collapses to bottom drawer

## Architecture

```
debug-panel.ts
  ├─ createDebugPanel({ session, captions }): { rootEl, push(event), setState(s) }
  ├─ EventBuffer (ring buffer, size 200)
  ├─ MetricsCalculator (latency, timings, counts)
  ├─ VuMeter (Web Audio AnalyserNode, RMS → bar)
  └─ DOM: header + metrics grid + event log + actions

translation-session.ts (extension)
  ├─ Expose: onConnectionStateChange, onIceStateChange, raw event stream
  └─ Expose: input MediaStreamTrack + output MediaStreamTrack (for VU meters)

main.ts wiring:
  ├─ const panel = createDebugPanel({ session, captions })
  ├─ session.onEvent → captions.push(e) + panel.push(e)
  ├─ session.onStateChange → panel.setState({ pc, ice })
  └─ panel.rootEl mounted in footer area
```

Latency calculation (best-effort, "estimate" not "truth"):
- On each `session.output_transcript.delta`, look backwards for nearest `session.input_transcript.delta`. Diff timestamps. Push into a 20-sample sliding window. Display median + p90.
- This is heuristic — model batches and reorders — but the median is stable enough to be useful for "is this drifting?" awareness.

## Related Code Files

**Create**
- `client/src/debug-panel.ts` — main module (state, DOM, metrics)
- `client/src/lib/event-buffer.ts` — ring buffer helper
- `client/src/lib/vu-meter.ts` — Web Audio analyser → RMS DOM bar
- `client/src/lib/debug-bundle.ts` — assemble + redact + serialize debug JSON

**Modify**
- `client/src/translation-session.ts` — emit raw events + state changes; expose input/output MediaStreamTracks for VU metering
- `client/src/types.ts` — extend `SessionEvent` union if needed for state-change events
- `client/src/main.ts` — instantiate panel, wire dual delivery (captions + panel)
- `client/src/styles.css` — panel styles, collapsed/expanded, VU bars, log table
- `client/src/settings.ts` — add `mt.debug_panel_open: boolean`

## Implementation Steps

1. Extend `translation-session.ts`:
   - Add `onRawEvent?: (raw: any, ts: number) => void` callback — fires for every parsed `oai-events` message, before filtering
   - Add `onStateChange` (already in phase 03) — ensure it covers both `connectionState` and `iceConnectionState`
   - Expose the input `MediaStreamTrack` and the output remote stream on the handle for VU metering
2. Implement `lib/event-buffer.ts`:
   ```ts
   export class EventBuffer<T> {
     constructor(public capacity: number) {}
     push(item: T): void {}     // drop oldest when full
     toArray(): T[] {}
     clear(): void {}
   }
   ```
3. Implement `lib/vu-meter.ts`:
   ```ts
   export function createVuMeter(track: MediaStreamTrack): {
     start(): void;
     stop(): void;
     readonly level: () => number;  // 0..1
   };
   ```
   Use `AudioContext` + `MediaStreamAudioSourceNode` + `AnalyserNode.getByteTimeDomainData` → RMS. RAF loop. Stop cleanly.
4. Implement `lib/debug-bundle.ts`:
   ```ts
   export function buildDebugBundle(input: {
     events: BufferedEvent[];
     settings: Settings;
     state: { pc?: string; ice?: string };
     app: { version: string };
   }): string;
   ```
   Redact: `mt.openai_key` → `"REDACTED"`. Never include client_secret. Never include audio.
5. Implement `debug-panel.ts`:
   - DOM layout (see below)
   - On every `onRawEvent`: push to EventBuffer, update metrics, append `<tr>` to event log if expanded
   - On state change: update state pills
   - 4Hz refresh tick (setInterval) for time-since-* counters
   - VU meters start when session opens, stop on close
   - "Copy debug bundle" wires to `navigator.clipboard.writeText(buildDebugBundle(...))` then shows a 2s "Copied ✓" toast
6. DOM layout:
   ```html
   <section class="debug-panel" data-collapsed="true">
     <header>
       <h3>Debug</h3>
       <button class="toggle">▾</button>
     </header>
     <div class="debug-body">
       <div class="metrics-grid">
         <div><label>WebRTC</label><span class="pill" data-state="connected">connected</span></div>
         <div><label>ICE</label><span class="pill">connected</span></div>
         <div><label>Session</label><span>00:01:23</span></div>
         <div><label>Last source</label><span>0.4s ago</span></div>
         <div><label>Last target</label><span>0.7s ago</span></div>
         <div><label>Latency p50</label><span>1.2s</span></div>
         <div><label>Source deltas</label><span>142</span></div>
         <div><label>Target deltas</label><span>118</span></div>
         <div><label>Errors</label><span>0</span></div>
       </div>
       <div class="vu-meters">
         <div class="vu" data-channel="input"><label>Mic</label><div class="bar"></div></div>
         <div class="vu" data-channel="output"><label>Translated</label><div class="bar"></div></div>
       </div>
       <div class="event-log">
         <div class="log-filters">
           <label><input type="checkbox" checked data-filter="source"> source</label>
           <label><input type="checkbox" checked data-filter="target"> target</label>
           <label><input type="checkbox" checked data-filter="state"> state</label>
           <label><input type="checkbox" checked data-filter="error"> error</label>
         </div>
         <ol class="log-lines"></ol>
       </div>
       <div class="actions">
         <button class="copy-bundle">Copy debug bundle</button>
         <button class="clear-log">Clear log</button>
       </div>
     </div>
   </section>
   ```
7. Style: monospace font for log + metrics. Compact. Dark-mode-friendly colors. Fixed width 360px when expanded on desktop; full-width drawer on narrow viewport.
8. Persist open/closed state to `settings.set("mt.debug_panel_open", ...)`.
9. Manual verification:
   - Open panel, start session → state pill goes new → connecting → connected
   - Speak VI → mic VU bar moves; source deltas counter increments; target deltas follow shortly after; output VU bar moves
   - Stop session → state pill goes back to "—"; VU bars go quiet
   - Mute mic → input VU drops to 0; "last source" counter climbs; latency stops updating
   - Force an error (invalid key) → error row appears red; error counter increments
   - Click "Copy debug bundle" → paste into editor; verify `mt.openai_key` is `REDACTED` and no `client_secret` anywhere

## Success Criteria

- [x] Panel toggles open/closed; state persists across reload
- [x] All 9 metric cells update in real time
- [x] Mic + translated VU bars respond visibly to audio
- [x] Event log shows entries within 50ms of arrival, scrolls cleanly past 200
- [x] Filter checkboxes hide/show rows by type without losing buffer
- [x] Copy debug bundle produces valid JSON with secrets redacted
- [x] Panel collapsed → CPU usage near-zero (no DOM mutations)
- [x] Module <250 lines (or split per file ownership)

## Risk Assessment

- **VU meter perf cost** — AudioContext + AnalyserNode at RAF can be heavy on weak machines. Mitigation: 30fps cap, single context shared between input and output, stop both when panel collapsed.
- **Log overflow during long meetings** — capped at 200 entries by ring buffer. Document that earlier entries roll off.
- **Latency metric misleads** — model batches; correlation between input and output deltas isn't 1:1. Label clearly as "rough estimate (p50)" and document the heuristic in tooltip.
- **Accidental secret leak in debug bundle** — write a small unit test (or manual checklist) verifying `REDACTED` substitution and that the bundle never contains characters matching `sk-` or `cs_`.
- **Panel competes with captions for screen real estate** — collapsed by default; drawer on mobile.
- **Misread as analytics shipped to a vendor** — README + panel header text must say "local only, nothing is sent anywhere".
