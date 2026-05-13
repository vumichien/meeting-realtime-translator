import { EventBuffer } from "./lib/event-buffer";
import { buildDebugBundle, type BufferedEvent } from "./lib/debug-bundle";
import { createVuMeter, type VuMeter } from "./lib/vu-meter";
import {
  escapeHtml,
  filterCheckbox,
  formatDuration,
  median,
  metricCell,
  safeStringify,
  truncate,
  type FilterKind,
} from "./lib/debug-helpers";
import {
  createMetricsState,
  recordEventMetrics,
  resetMetricsState,
  snapshotMetrics,
} from "./lib/debug-metrics";
import type { ConnectionStateSnapshot, SessionHandle } from "./types";
import type { Settings } from "./settings";

export interface DebugPanelOptions {
  settings: Settings;
  initiallyOpen: boolean;
  onToggle: (open: boolean) => void;
}

export interface DebugPanel {
  rootEl: HTMLElement;
  recordEvent(raw: any, ts: number): void;
  recordState(snapshot: ConnectionStateSnapshot): void;
  bindSession(handle: SessionHandle): void;
  unbindSession(): void;
  reset(): void;
}

const APP_VERSION = "0.1.0";
const EVENT_CAPACITY = 200;
const TICK_MS = 250;
const VU_BIND_RETRY_MS = 250;
const VU_BIND_TIMEOUT_MS = 10_000;

export function createDebugPanel(opts: DebugPanelOptions): DebugPanel {
  const buffer = new EventBuffer<BufferedEvent>(EVENT_CAPACITY);
  const metrics = createMetricsState();
  const filters: Record<FilterKind, boolean> = {
    source: true, target: true, state: true, error: true, other: true,
  };

  let micMeter: VuMeter | null = null;
  let outMeter: VuMeter | null = null;
  let outMeterRetryHandle: number | undefined;
  let outMeterRetryTimeout: number | undefined;

  const root = document.createElement("section");
  root.className = "debug-panel";
  root.dataset.collapsed = opts.initiallyOpen ? "false" : "true";
  root.innerHTML = renderShell(opts.initiallyOpen);

  const toggleBtn = root.querySelector<HTMLButtonElement>(".debug-toggle")!;
  const caret = root.querySelector<HTMLElement>(".caret")!;
  const logList = root.querySelector<HTMLOListElement>(".log-lines")!;
  const copyToast = root.querySelector<HTMLElement>(".copy-toast")!;
  const inputBar = root.querySelector<HTMLElement>('.vu[data-channel="input"] .vu-bar > span')!;
  const outputBar = root.querySelector<HTMLElement>('.vu[data-channel="output"] .vu-bar > span')!;

  toggleBtn.addEventListener("click", () => {
    const collapsed = root.dataset.collapsed !== "true";
    root.dataset.collapsed = collapsed ? "true" : "false";
    toggleBtn.setAttribute("aria-expanded", String(!collapsed));
    caret.textContent = collapsed ? "▸" : "▾";
    opts.onToggle(!collapsed);
  });

  root.querySelectorAll<HTMLInputElement>("input[data-filter]").forEach((cb) => {
    cb.addEventListener("change", () => {
      filters[cb.dataset.filter as FilterKind] = cb.checked;
      logList.querySelectorAll<HTMLLIElement>("li").forEach((li) => {
        li.hidden = !filters[(li.dataset.kind as FilterKind) ?? "other"];
      });
    });
  });

  root.querySelector<HTMLButtonElement>(".copy-bundle")!.addEventListener("click", async () => {
    const bundle = buildDebugBundle({
      events: buffer.toArray(),
      settings: opts.settings.snapshot(),
      state: { ...metrics.lastState },
      metrics: snapshotMetrics(metrics),
      app: { version: APP_VERSION, userAgent: navigator.userAgent },
    });
    try {
      await navigator.clipboard.writeText(bundle);
      copyToast.hidden = false;
      window.setTimeout(() => { copyToast.hidden = true; }, 1800);
    } catch (err) {
      console.warn("[debug-panel] clipboard write failed", err);
    }
  });

  root.querySelector<HTMLButtonElement>(".clear-log")!.addEventListener("click", () => {
    buffer.clear();
    logList.innerHTML = "";
  });

  window.setInterval(updateMetricsTick, TICK_MS);
  startVuRaf();

  function startVuRaf() {
    const loop = () => {
      inputBar.style.width = `${Math.round((micMeter?.level() ?? 0) * 100)}%`;
      outputBar.style.width = `${Math.round((outMeter?.level() ?? 0) * 100)}%`;
      window.requestAnimationFrame(loop);
    };
    window.requestAnimationFrame(loop);
  }

  function setText(id: string, value: string) {
    const el = root.querySelector<HTMLElement>(`#${id} .metric-value`);
    if (el) el.textContent = value;
  }

  function appendLogRow(ev: BufferedEvent, kind: FilterKind) {
    const li = document.createElement("li");
    li.dataset.kind = kind;
    li.hidden = !filters[kind];
    const ts = (ev.ts / 1000).toFixed(2);
    const payload = truncate(safeStringify(ev.payload), 120);
    li.innerHTML = `<span class="log-ts">${ts}s</span><span class="log-type">${escapeHtml(ev.type)}</span><span class="log-payload">${escapeHtml(payload)}</span>`;
    logList.append(li);
    while (logList.children.length > EVENT_CAPACITY) logList.firstElementChild?.remove();
    logList.scrollTop = logList.scrollHeight;
  }

  function updateMetricsTick() {
    const now = performance.now();
    setText("m-pc", metrics.lastState.connectionState);
    setText("m-ice", metrics.lastState.iceConnectionState);
    setText("m-session", metrics.sessionStartTs ? formatDuration(now - metrics.sessionStartTs) : "—");
    setText("m-last-src", metrics.lastSourceTs ? `${((now - metrics.lastSourceTs) / 1000).toFixed(1)}s ago` : "—");
    setText("m-last-tgt", metrics.lastTargetTs ? `${((now - metrics.lastTargetTs) / 1000).toFixed(1)}s ago` : "—");
    const p50 = median(metrics.latencySamples);
    setText("m-lat-p50", p50 === null ? "—" : `${(p50 / 1000).toFixed(2)}s`);
    setText("m-cnt-src", String(metrics.counts.source));
    setText("m-cnt-tgt", String(metrics.counts.target));
    setText("m-cnt-err", String(metrics.counts.errors));
  }

  function clearOutMeterRetry() {
    if (outMeterRetryHandle !== undefined) window.clearInterval(outMeterRetryHandle);
    if (outMeterRetryTimeout !== undefined) window.clearTimeout(outMeterRetryTimeout);
    outMeterRetryHandle = undefined;
    outMeterRetryTimeout = undefined;
  }

  function stopMeters() {
    micMeter?.stop();
    outMeter?.stop();
    micMeter = null;
    outMeter = null;
    clearOutMeterRetry();
  }

  return {
    rootEl: root,
    recordEvent(raw, ts) {
      const type = typeof raw?.type === "string" ? raw.type : "unknown";
      const ev: BufferedEvent = { ts, type, payload: raw };
      buffer.push(ev);
      const kind = recordEventMetrics(metrics, type, ts);
      appendLogRow(ev, kind);
    },
    recordState(snapshot) {
      metrics.lastState = snapshot;
      const ev: BufferedEvent = {
        ts: performance.now(),
        type: `state.${snapshot.connectionState}`,
        payload: snapshot,
      };
      buffer.push(ev);
      appendLogRow(ev, "state");
    },
    bindSession(handle) {
      metrics.sessionStartTs = performance.now();
      stopMeters();
      if (handle.micTrack) {
        micMeter = createVuMeter(handle.micTrack);
        micMeter.start();
      }
      const tryAttachOutput = () => {
        const t = handle.remoteStream()?.getAudioTracks()[0];
        if (!t) return false;
        outMeter = createVuMeter(t);
        outMeter.start();
        return true;
      };
      if (tryAttachOutput()) return;
      outMeterRetryHandle = window.setInterval(() => {
        if (tryAttachOutput()) clearOutMeterRetry();
      }, VU_BIND_RETRY_MS);
      outMeterRetryTimeout = window.setTimeout(clearOutMeterRetry, VU_BIND_TIMEOUT_MS);
    },
    unbindSession() {
      stopMeters();
      metrics.sessionStartTs = null;
      metrics.pendingSourceTs = null;
    },
    reset() {
      buffer.clear();
      resetMetricsState(metrics);
      logList.innerHTML = "";
    },
  };
}

function renderShell(open: boolean): string {
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
