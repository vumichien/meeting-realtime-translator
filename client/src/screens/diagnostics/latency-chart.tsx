// LatencyChart — inline SVG line chart of last 60 latency samples.
// No charting library. Threshold marker at 3000ms.
// useDebug().latency is [] in Phase 5 (DOM panel still owns data);
// the chart renders gracefully with an empty dataset.

import React, { useMemo } from "react";
import { useDebug } from "@/hooks/use-debug";

const SVG_W = 600;
const SVG_H = 200;
const PAD = { top: 16, right: 8, bottom: 24, left: 44 };
const THRESHOLD_MS = 3000;
const MAX_SAMPLES = 60;

function msToY(ms: number, maxMs: number): number {
  const inner = SVG_H - PAD.top - PAD.bottom;
  return PAD.top + inner - (ms / maxMs) * inner;
}

function idxToX(i: number, total: number): number {
  const inner = SVG_W - PAD.left - PAD.right;
  if (total <= 1) return PAD.left;
  return PAD.left + (i / (total - 1)) * inner;
}

export function LatencyChart(): React.JSX.Element {
  const { latencyState } = useDebug();
  // events[] is placeholder until Phase 8; latency numbers come from
  // latencyState for now. We expose a numeric array interface here so
  // the chart is wired correctly when Phase 8 fills it in.
  // For now we render an empty-state chart with the threshold line visible.
  const samples: number[] = [];

  const maxMs = useMemo(() => {
    const dataMax = samples.length > 0 ? Math.max(...samples) : 0;
    return Math.max(dataMax * 1.2, THRESHOLD_MS * 1.5);
  }, [samples]);

  const points = useMemo(() => {
    if (samples.length === 0) return "";
    return samples
      .slice(-MAX_SAMPLES)
      .map((ms, i, arr) => `${idxToX(i, arr.length)},${msToY(ms, maxMs)}`)
      .join(" ");
  }, [samples, maxMs]);

  const thresholdY = msToY(THRESHOLD_MS, maxMs);
  const currentMs = samples.length > 0 ? samples[samples.length - 1] : null;

  return (
    <div className="space-y-2">
      <div className="flex items-baseline justify-between">
        <span className="text-sm font-medium text-foreground">Translation latency</span>
        <span
          className={
            latencyState === "warn"
              ? "text-sm font-semibold text-destructive"
              : "text-sm font-semibold text-foreground"
          }
        >
          {currentMs !== null ? `${currentMs} ms` : "—"}
        </span>
      </div>

      <div className="overflow-hidden rounded-md border border-border bg-card">
        <svg
          viewBox={`0 0 ${SVG_W} ${SVG_H}`}
          className="w-full"
          aria-label="Latency chart"
          role="img"
        >
          {/* Grid lines */}
          {[0, 1000, 2000, 3000, 4000].map((ms) => {
            if (ms > maxMs) return null;
            const y = msToY(ms, maxMs);
            return (
              <g key={ms}>
                <line
                  x1={PAD.left}
                  y1={y}
                  x2={SVG_W - PAD.right}
                  y2={y}
                  stroke="currentColor"
                  strokeOpacity={0.1}
                  strokeWidth={1}
                />
                <text
                  x={PAD.left - 4}
                  y={y + 4}
                  textAnchor="end"
                  fontSize={10}
                  fill="currentColor"
                  opacity={0.5}
                >
                  {ms >= 1000 ? `${ms / 1000}s` : `${ms}`}
                </text>
              </g>
            );
          })}

          {/* Threshold marker at 3000ms */}
          <line
            x1={PAD.left}
            y1={thresholdY}
            x2={SVG_W - PAD.right}
            y2={thresholdY}
            stroke="#f97316"
            strokeWidth={1.5}
            strokeDasharray="4 3"
            opacity={0.8}
          />
          <text
            x={SVG_W - PAD.right - 2}
            y={thresholdY - 4}
            textAnchor="end"
            fontSize={10}
            fill="#f97316"
            opacity={0.9}
          >
            3s threshold
          </text>

          {/* Data polyline */}
          {points && (
            <polyline
              points={points}
              fill="none"
              stroke={latencyState === "warn" ? "#ef4444" : "#3b82f6"}
              strokeWidth={2}
              strokeLinejoin="round"
              strokeLinecap="round"
            />
          )}

          {/* Empty state message */}
          {samples.length === 0 && (
            <text
              x={SVG_W / 2}
              y={SVG_H / 2}
              textAnchor="middle"
              fontSize={12}
              fill="currentColor"
              opacity={0.4}
            >
              No latency data yet — start a session
            </text>
          )}
        </svg>
      </div>

      <p className="text-xs text-muted-foreground">
        Rolling window · last {MAX_SAMPLES} samples · orange dashed = 3 s threshold
      </p>
    </div>
  );
}
