import type { Settings } from "../settings";
import {
  estimateSessionCost,
  formatDuration,
  formatUsd,
} from "../lib/session-cost-estimate";

export interface SessionGuardrails {
  rootEl: HTMLElement;
  start(opts: {
    startedAt: number;
    sourceCaptionsEnabled: boolean;
    onWarning: (message: string) => void;
    onAutoStop: () => void;
  }): void;
  stop(): void;
  durationMs(): number;
}

export function createSessionGuardrails(settings: Settings): SessionGuardrails {
  const root = document.createElement("section");
  root.className = "session-guardrails";
  root.innerHTML = `
    <div class="guardrail-metrics">
      <span><b class="guard-time">0:00</b><small>session</small></span>
      <span><b class="guard-cost">$0.00</b><small>estimate only</small></span>
    </div>
    <div class="guardrail-settings">
      <label class="control-field">
        <span>Warn after minutes</span>
        <input type="number" class="guard-warn" min="1" max="240" step="1" />
      </label>
      <label class="control-field">
        <span>Auto-stop minutes (0 off)</span>
        <input type="number" class="guard-stop" min="0" max="240" step="1" />
      </label>
    </div>
  `;
  const timeEl = root.querySelector<HTMLElement>(".guard-time")!;
  const costEl = root.querySelector<HTMLElement>(".guard-cost")!;
  const warnInput = root.querySelector<HTMLInputElement>(".guard-warn")!;
  const stopInput = root.querySelector<HTMLInputElement>(".guard-stop")!;
  warnInput.value = String(settings.get("mt.session_warning_minutes"));
  stopInput.value = String(settings.get("mt.session_auto_stop_minutes"));
  warnInput.addEventListener("change", () => setNumber("mt.session_warning_minutes", warnInput));
  stopInput.addEventListener("change", () => setNumber("mt.session_auto_stop_minutes", stopInput));

  let startedAt = 0;
  let timer: number | undefined;
  let warned = false;
  let sourceCaptionsEnabled = true;
  let callbacks: Pick<Parameters<SessionGuardrails["start"]>[0], "onWarning" | "onAutoStop"> | null = null;

  function setNumber(key: "mt.session_warning_minutes" | "mt.session_auto_stop_minutes", input: HTMLInputElement) {
    const n = Number(input.value);
    if (Number.isFinite(n) && n >= 0) settings.set(key, Math.floor(n));
    input.value = String(settings.get(key));
  }

  function tick() {
    const elapsed = durationMs();
    const estimate = estimateSessionCost(elapsed, sourceCaptionsEnabled);
    timeEl.textContent = formatDuration(elapsed);
    costEl.textContent = formatUsd(estimate.totalUsd);
    const warnAt = settings.get("mt.session_warning_minutes") * 60_000;
    const stopAt = settings.get("mt.session_auto_stop_minutes") * 60_000;
    if (!warned && warnAt > 0 && elapsed >= warnAt) {
      warned = true;
      callbacks?.onWarning(`Session passed ${settings.get("mt.session_warning_minutes")} minutes. Cost estimate is ${formatUsd(estimate.totalUsd)}.`);
    }
    if (stopAt > 0 && elapsed >= stopAt) callbacks?.onAutoStop();
  }

  function durationMs() {
    return startedAt ? Date.now() - startedAt : 0;
  }

  return {
    rootEl: root,
    start(opts) {
      startedAt = opts.startedAt;
      warned = false;
      sourceCaptionsEnabled = opts.sourceCaptionsEnabled;
      callbacks = opts;
      if (timer) window.clearInterval(timer);
      tick();
      timer = window.setInterval(tick, 1000);
    },
    stop() {
      if (timer) window.clearInterval(timer);
      timer = undefined;
      callbacks = null;
      startedAt = 0;
      tick();
    },
    durationMs,
  };
}
