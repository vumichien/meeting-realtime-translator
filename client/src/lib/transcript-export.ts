import { ALLOWED_LANGS, LANGUAGE_LABELS } from "../config/languages";
import type { TranscriptSnapshot, TranscriptSegmentKind } from "./transcript-store";

export type TranscriptExportFormat = "markdown" | "text" | "srt";

export function serializeTranscript(
  snapshot: TranscriptSnapshot,
  format: TranscriptExportFormat,
): string {
  if (format === "markdown") return toMarkdown(snapshot);
  if (format === "srt") return toSrt(snapshot);
  return toText(snapshot);
}

export function transcriptFilename(format: TranscriptExportFormat, now = new Date()): string {
  const stamp = now.toISOString().replace(/[:.]/g, "-").slice(0, 19);
  const ext = format === "markdown" ? "md" : format === "srt" ? "srt" : "txt";
  return `babel-mic-transcript-${stamp}.${ext}`;
}

export function downloadTranscript(
  snapshot: TranscriptSnapshot,
  format: TranscriptExportFormat,
) {
  const mimeType =
    format === "markdown" ? "text/markdown;charset=utf-8" : "text/plain;charset=utf-8";
  const blob = new Blob([serializeTranscript(snapshot, format)], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = transcriptFilename(format);
  link.click();
  window.setTimeout(() => URL.revokeObjectURL(url), 500);
}

function toMarkdown(snapshot: TranscriptSnapshot): string {
  const lang = languageLabel(snapshot.targetLanguage);
  const lines = [
    "# Babel Mic Transcript",
    "",
    "Local export. Contains meeting speech text only because you clicked export.",
    "",
    `- Target language: ${lang}`,
    `- Session started: ${snapshot.sessionStartedAt ?? "unknown"}`,
    `- Session ended: ${snapshot.sessionEndedAt ?? "not recorded"}`,
    "",
    "| Time | Side | Text |",
    "|---|---|---|",
  ];
  for (const segment of snapshot.segments) {
    lines.push(`| ${segment.finalizedAt} | ${side(segment.kind)} | ${escapeTable(segment.text)} |`);
  }
  return `${lines.join("\n")}\n`;
}

function toText(snapshot: TranscriptSnapshot): string {
  const lines = [
    "Babel Mic Transcript",
    `Target language: ${languageLabel(snapshot.targetLanguage)}`,
    `Session started: ${snapshot.sessionStartedAt ?? "unknown"}`,
    `Session ended: ${snapshot.sessionEndedAt ?? "not recorded"}`,
    "",
  ];
  for (const segment of snapshot.segments) {
    lines.push(`[${segment.finalizedAt}] ${side(segment.kind)}: ${segment.text}`);
  }
  return `${lines.join("\n")}\n`;
}

function languageLabel(code: string): string {
  if (ALLOWED_LANGS.includes(code as (typeof ALLOWED_LANGS)[number])) {
    const lang = code as (typeof ALLOWED_LANGS)[number];
    return `${LANGUAGE_LABELS[lang]} (${lang})`;
  }
  return code || "unknown";
}

function side(kind: TranscriptSegmentKind): string {
  return kind === "source" ? "Source" : "Translation";
}

function escapeTable(value: string): string {
  return value.replace(/\|/g, "\\|").replace(/\n/g, " ");
}

function toSrt(snapshot: TranscriptSnapshot): string {
  const sessionStart = snapshot.sessionStartedAt
    ? new Date(snapshot.sessionStartedAt).getTime()
    : 0;
  // SRT contains translation segments only (subtitle-ready output)
  const segs = snapshot.segments.filter((s) => s.kind === "target");
  if (segs.length === 0) return "";

  const lines: string[] = [];
  segs.forEach((seg, i) => {
    const startMs = Math.max(0, new Date(seg.finalizedAt).getTime() - sessionStart);
    const endMs =
      i < segs.length - 1
        ? Math.max(0, new Date(segs[i + 1].finalizedAt).getTime() - sessionStart)
        : startMs + 3000;
    lines.push(`${i + 1}`);
    lines.push(`${msToSrtTime(startMs)} --> ${msToSrtTime(endMs)}`);
    lines.push(seg.text);
    lines.push("");
  });
  return lines.join("\n");
}

function msToSrtTime(ms: number): string {
  const h = Math.floor(ms / 3_600_000);
  const m = Math.floor((ms % 3_600_000) / 60_000);
  const s = Math.floor((ms % 60_000) / 1_000);
  const ms3 = ms % 1_000;
  return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")},${String(ms3).padStart(3, "0")}`;
}
