import { ALLOWED_LANGS, LANGUAGE_LABELS } from "../config/languages";
import type { TranscriptSnapshot, TranscriptSegmentKind } from "./transcript-store";

export type TranscriptExportFormat = "markdown" | "text";

export function serializeTranscript(
  snapshot: TranscriptSnapshot,
  format: TranscriptExportFormat,
): string {
  return format === "markdown" ? toMarkdown(snapshot) : toText(snapshot);
}

export function transcriptFilename(format: TranscriptExportFormat, now = new Date()): string {
  const stamp = now.toISOString().replace(/[:.]/g, "-").slice(0, 19);
  return `babel-mic-transcript-${stamp}.${format === "markdown" ? "md" : "txt"}`;
}

export function downloadTranscript(
  snapshot: TranscriptSnapshot,
  format: TranscriptExportFormat,
) {
  const blob = new Blob([serializeTranscript(snapshot, format)], {
    type: format === "markdown" ? "text/markdown;charset=utf-8" : "text/plain;charset=utf-8",
  });
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
