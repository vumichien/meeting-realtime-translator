// Pure helpers extracted from debug-panel.ts to keep that file under the
// 200-line per-module budget enforced by the project plan.

export type FilterKind = "source" | "target" | "state" | "error" | "other";

export function metricCell(label: string, id: string, initial: string): string {
  return `<div class="metric" id="${id}"><label>${label}</label><span class="metric-value">${initial}</span></div>`;
}

export function filterCheckbox(kind: FilterKind): string {
  return `<label><input type="checkbox" checked data-filter="${kind}" /> ${kind}</label>`;
}

export function classifyEventKind(type: string): FilterKind {
  if (type === "session.input_transcript.delta") return "source";
  if (type === "session.output_transcript.delta") return "target";
  if (type === "error") return "error";
  if (type.startsWith("session.")) return "state";
  return "other";
}

export function median(arr: number[]): number | null {
  if (arr.length === 0) return null;
  const sorted = arr.slice().sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  if (sorted.length % 2 === 0) return (sorted[mid - 1]! + sorted[mid]!) / 2;
  return sorted[mid]!;
}

export function percentile(arr: number[], p: number): number | null {
  if (arr.length === 0) return null;
  const sorted = arr.slice().sort((a, b) => a - b);
  const idx = Math.min(sorted.length - 1, Math.floor(sorted.length * p));
  return sorted[idx]!;
}

export function formatDuration(ms: number): string {
  const total = Math.floor(ms / 1000);
  const h = Math.floor(total / 3600);
  const m = Math.floor((total % 3600) / 60);
  const s = total % 60;
  return `${pad(h)}:${pad(m)}:${pad(s)}`;
}

function pad(n: number): string {
  return n.toString().padStart(2, "0");
}

export function safeStringify(value: unknown): string {
  if (value === null || value === undefined) return String(value);
  if (typeof value === "string") return value;
  try {
    return JSON.stringify(value);
  } catch {
    return "[unserializable]";
  }
}

export function truncate(s: string, n: number): string {
  return s.length <= n ? s : `${s.slice(0, n - 1)}…`;
}

export function escapeHtml(s: string): string {
  return s.replace(/[&<>"']/g, (ch) => {
    switch (ch) {
      case "&": return "&amp;";
      case "<": return "&lt;";
      case ">": return "&gt;";
      case '"': return "&quot;";
      default: return "&#39;";
    }
  });
}
