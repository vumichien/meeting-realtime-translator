import { EventBuffer } from "./lib/event-buffer";
import { buildDebugBundle, type BufferedEvent } from "./lib/debug-bundle";
import {
  escapeHtml,
  formatDuration,
  median,
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
import type { ConnectionStateSnapshot, SessionHandle, SessionIssue } from "./types";
import type { Settings } from "./settings";
import { isSetSinkIdSupported } from "./audio-devices";
import type { SetupDoctorResult } from "./lib/setup-doctor";
import { renderDebugPanelShell } from "./ui/debug-panel-shell";
import { createDebugVuBindings } from "./lib/debug-vu-bindings";

export interface DebugPanelOptions {
  settings: Settings;
  initiallyOpen: boolean;
  onToggle: (open: boolean) => void;
  getSetupDoctorResult?: () => SetupDoctorResult | null;
  getSessionDurationMs?: () => number;
}

export interface DebugPanel {
  rootEl: HTMLElement;
  recordEvent(raw: any, ts: number): void;
  recordState(snapshot: ConnectionStateSnapshot): void;
  recordIssue(issue: SessionIssue): void;
  bindSession(handle: SessionHandle): void;
  unbindSession(): void;
  reset(): void;
}

const APP_VERSION = "0.1.0";
const EVENT_CAPACITY = 200;
const TICK_MS = 250;

export function createDebugPanel(opts: DebugPanelOptions): DebugPanel {
  const buffer = new EventBuffer<BufferedEvent>(EVENT_CAPACITY);
  const metrics = createMetricsState();
  const filters: Record<FilterKind, boolean> = {
    source: true, target: true, state: true, error: true, other: true,
  };

  let lastIssue: SessionIssue | null = null;

  const root = document.createElement("section");
  root.className = "debug-panel";
  root.dataset.collapsed = opts.initiallyOpen ? "false" : "true";
  root.innerHTML = renderDebugPanelShell(opts.initiallyOpen);

  const toggleBtn = root.querySelector<HTMLButtonElement>(".debug-toggle")!;
  const caret = root.querySelector<HTMLElement>(".caret")!;
  const logList = root.querySelector<HTMLOListElement>(".log-lines")!;
  const copyToast = root.querySelector<HTMLElement>(".copy-toast")!;
  const inputBar = root.querySelector<HTMLElement>('.vu[data-channel="input"] .vu-bar > span')!;
  const outputBar = root.querySelector<HTMLElement>('.vu[data-channel="output"] .vu-bar > span')!;
  const vu = createDebugVuBindings(inputBar, outputBar);

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
      app: {
        version: window.electron?.appVersion ?? APP_VERSION,
        userAgent: navigator.userAgent,
        platform: window.electron?.platform ?? navigator.platform,
      },
      support: {
        setSinkId: isSetSinkIdSupported(),
        setupDoctor: opts.getSetupDoctorResult?.() ?? null,
        lastIssue,
        sessionDurationMs: opts.getSessionDurationMs?.() ?? 0,
      },
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
    recordIssue(issue) {
      lastIssue = issue;
      const ev: BufferedEvent = {
        ts: performance.now(),
        type: `issue.${issue.code}`,
        payload: issue,
      };
      buffer.push(ev);
      appendLogRow(ev, "error");
    },
    bindSession(handle) {
      metrics.sessionStartTs = performance.now();
      vu.bind(handle);
    },
    unbindSession() {
      vu.unbind();
      metrics.sessionStartTs = null;
      metrics.pendingSourceTs = null;
    },
    reset() {
      buffer.clear();
      lastIssue = null;
      resetMetricsState(metrics);
      logList.innerHTML = "";
    },
  };
}
