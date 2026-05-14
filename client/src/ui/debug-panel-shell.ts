import { filterCheckbox, metricCell } from "../lib/debug-helpers";

export function renderDebugPanelShell(open: boolean): string {
  return `
    <header class="debug-header">
      <button type="button" class="debug-toggle" aria-expanded="${open}">
        <span class="caret">${open ? "▾" : "▸"}</span>
        <span>Debug</span>
        <small>local-only — nothing is sent anywhere</small>
      </button>
    </header>
    <div class="debug-body">
      <div class="metrics-grid">
        ${metricCell("WebRTC", "m-pc", "—")}
        ${metricCell("ICE", "m-ice", "—")}
        ${metricCell("Session", "m-session", "—")}
        ${metricCell("Last source", "m-last-src", "—")}
        ${metricCell("Last target", "m-last-tgt", "—")}
        ${metricCell("Latency p50", "m-lat-p50", "—")}
        ${metricCell("Source deltas", "m-cnt-src", "0")}
        ${metricCell("Target deltas", "m-cnt-tgt", "0")}
        ${metricCell("Errors", "m-cnt-err", "0")}
      </div>
      <div class="vu-meters">
        <div class="vu" data-channel="input"><label>Mic</label><div class="vu-bar"><span></span></div></div>
        <div class="vu" data-channel="output"><label>Translated</label><div class="vu-bar"><span></span></div></div>
      </div>
      <div class="event-log">
        <div class="log-filters">
          ${filterCheckbox("source")}
          ${filterCheckbox("target")}
          ${filterCheckbox("state")}
          ${filterCheckbox("error")}
          ${filterCheckbox("other")}
        </div>
        <ol class="log-lines"></ol>
      </div>
      <div class="actions">
        <button type="button" class="copy-bundle">Copy debug bundle</button>
        <button type="button" class="clear-log">Clear log</button>
        <span class="copy-toast" hidden>Copied ✓</span>
      </div>
    </div>
  `;
}
