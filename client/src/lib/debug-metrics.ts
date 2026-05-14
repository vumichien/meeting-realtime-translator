// State + counters + latency-window tracker for the debug panel.
// Pulled out so debug-panel.ts stays close to its <250 LOC target.

import type { ConnectionStateSnapshot } from "../types";
import type { FilterKind } from "./debug-helpers";
import { classifyEventKind, median, percentile } from "./debug-helpers";

export interface MetricsState {
  counts: { source: number; target: number; errors: number };
  lastSourceTs: number | null;
  lastTargetTs: number | null;
  sessionStartTs: number | null;
  pendingSourceTs: number | null;
  latencySamples: number[];
  lastState: ConnectionStateSnapshot;
}

export const LATENCY_WINDOW = 20;

export function createMetricsState(): MetricsState {
  return {
    counts: { source: 0, target: 0, errors: 0 },
    lastSourceTs: null,
    lastTargetTs: null,
    sessionStartTs: null,
    pendingSourceTs: null,
    latencySamples: [],
    lastState: { connectionState: "new", iceConnectionState: "new" },
  };
}

export function resetMetricsState(s: MetricsState): void {
  s.counts = { source: 0, target: 0, errors: 0 };
  s.lastSourceTs = null;
  s.lastTargetTs = null;
  s.pendingSourceTs = null;
  s.latencySamples.length = 0;
}

export function recordEventMetrics(
  s: MetricsState,
  type: string,
  ts: number,
  onLatencySample?: (ms: number) => void,
): FilterKind {
  const kind = classifyEventKind(type);
  if (kind === "source") {
    s.counts.source += 1;
    s.lastSourceTs = ts;
    s.pendingSourceTs = ts;
  } else if (kind === "target") {
    s.counts.target += 1;
    s.lastTargetTs = ts;
    if (s.pendingSourceTs !== null) {
      const sample = ts - s.pendingSourceTs;
      if (sample >= 0 && sample < 30_000) {
        s.latencySamples.push(sample);
        if (s.latencySamples.length > LATENCY_WINDOW) s.latencySamples.shift();
        onLatencySample?.(sample);
      }
      s.pendingSourceTs = null;
    }
  } else if (kind === "error") {
    s.counts.errors += 1;
  }
  return kind;
}

export function snapshotMetrics(s: MetricsState) {
  return {
    counts: s.counts,
    latencyP50: median(s.latencySamples),
    latencyP90: percentile(s.latencySamples, 0.9),
    lastSourceAgoMs: s.lastSourceTs ? performance.now() - s.lastSourceTs : null,
    lastTargetAgoMs: s.lastTargetTs ? performance.now() - s.lastTargetTs : null,
    sessionMs: s.sessionStartTs ? performance.now() - s.sessionStartTs : null,
  };
}
