// Rolling-median latency tracker. Emits `warn` when the 30s median exceeds
// 5s; emits `clear` when it falls back below 3s (hysteresis).
// Designed to be fed by debug-metrics latency samples or anything that emits
// a number-per-translation-pair.

const WINDOW_MS = 30_000;
const WARN_THRESHOLD_MS = 5_000;
const CLEAR_THRESHOLD_MS = 3_000;

export interface LatencySample {
  ms: number;
  ts: number; // performance.now()
}

export interface LatencyWarning {
  push(sample: number): void;
  reset(): void;
  state(): "ok" | "warn";
  onChange(cb: (state: "ok" | "warn") => void): void;
}

export function createLatencyWarning(): LatencyWarning {
  const samples: LatencySample[] = [];
  let current: "ok" | "warn" = "ok";
  const listeners: Array<(state: "ok" | "warn") => void> = [];

  function trim(now: number) {
    const cutoff = now - WINDOW_MS;
    while (samples.length && (samples[0]?.ts ?? 0) < cutoff) samples.shift();
  }

  function median(): number {
    if (samples.length === 0) return 0;
    const sorted = samples.map((s) => s.ms).sort((a, b) => a - b);
    const mid = Math.floor(sorted.length / 2);
    if (sorted.length % 2 === 0) {
      return ((sorted[mid - 1] ?? 0) + (sorted[mid] ?? 0)) / 2;
    }
    return sorted[mid] ?? 0;
  }

  function evaluate() {
    const m = median();
    let next: "ok" | "warn" = current;
    if (current === "ok" && m > WARN_THRESHOLD_MS) next = "warn";
    else if (current === "warn" && m < CLEAR_THRESHOLD_MS) next = "ok";
    if (next !== current) {
      current = next;
      for (const cb of listeners) cb(current);
    }
  }

  return {
    push(sample) {
      const ts = performance.now();
      samples.push({ ms: sample, ts });
      trim(ts);
      evaluate();
    },
    reset() {
      samples.length = 0;
      if (current !== "ok") {
        current = "ok";
        for (const cb of listeners) cb(current);
      }
    },
    state: () => current,
    onChange(cb) {
      listeners.push(cb);
    },
  };
}
