// Main Translate screen: shows first-run hero when idle with no transcript,
// otherwise shows live captions canvas. Compact control bar is always visible.
// Space key globally toggles start/stop when no input element is focused.

import React, { useEffect, useCallback } from "react";
import { useSession } from "@/hooks/use-session";
import { useCaptions } from "@/hooks/use-captions";
import { useDevices } from "@/hooks/use-devices";
import { useSettings } from "@/hooks/use-settings";
import { useTranscript } from "@/hooks/use-transcript";
import { useApiKeyProvider } from "@/hooks/use-api-key";
import { FirstRunHero } from "./first-run-hero";
import { CaptionsCanvas } from "./captions-canvas";
import { CompactControlBar } from "./compact-control-bar";
import { downloadTranscript, msToSrtTime, buildSegmentsFromCaptions } from "@/lib/transcript-export";
import type { CaptionEntry } from "@/captions";
import { transcriptHistory } from "@/lib/transcript-history";
import { toast } from "sonner";

const CAPTION_PUNCT = /[.!?。？！]\s*$/;

/** Build SRT from raw caption entries using their performance.now() timestamps. */
function captionEntriesToSrt(entries: CaptionEntry[]): string {
  if (entries.length === 0) return "";
  const firstTs = entries[0].ts;
  const lines: string[] = [];
  let idx = 1;
  let buf = "";
  let sentStartMs = 0;

  for (let i = 0; i < entries.length; i++) {
    const entry = entries[i];
    const relMs = Math.round(Math.max(0, entry.ts - firstTs));
    if (buf === "") sentStartMs = relMs;
    buf += entry.text;

    const isLast = i === entries.length - 1;
    if (CAPTION_PUNCT.test(buf) || isLast) {
      const nextRelMs = Math.round(Math.max(0, (entries[i + 1]?.ts ?? entry.ts + 3000) - firstTs));
      const endMs = Math.max(sentStartMs + 500, nextRelMs);
      lines.push(`${idx}`);
      lines.push(`${msToSrtTime(sentStartMs)} --> ${msToSrtTime(endMs)}`);
      lines.push(buf.trim());
      lines.push("");
      idx++;
      buf = "";
    }
  }
  return lines.join("\n");
}

/**
 * Translate screen root. Composes hero-or-canvas with a persistent control bar.
 */
export function TranslateScreen(): React.JSX.Element {
  const session = useSession();
  const { source, translation, clear: clearCaptions } = useCaptions();
  const devices = useDevices();
  const { get: getSettings, set: setSettings } = useSettings();
  const { entries, snapshot, clear: clearTranscript } = useTranscript();
  const { hasKey } = useApiKeyProvider();

  const targetLang = getSettings("mt.target_lang");
  const isIdle = session.state === "idle";
  // Keep captions visible after stop as long as any content exists (caption or transcript).
  // Only show hero when truly empty — i.e. never started or explicitly cleared.
  const hasContent = entries.length > 0 || source.length > 0 || translation.length > 0;
  const showHero = isIdle && !hasContent;

  // "Selected" requires the persisted ID to still exist in the enumerated list —
  // a stale localStorage ID alone is not enough (e.g. mic permission not yet granted,
  // or device unplugged since last session).
  const micDone = devices.mics.some((m) => m.deviceId === devices.micId);
  const outputDone = devices.outputs.some((o) => o.deviceId === devices.outputId);

  // Provider is "configured" when the ACTIVE provider has its required key set.
  // OpenAI uses the safeStorage-backed apiKey (hasKey from useApiKeyProvider).
  // Gemini uses settings.mt.gemini_api_key (ai-studio mode) or service account
  // JSON (vertex mode). Either-or — user only needs to configure the provider
  // they actually selected.
  const activeProvider = getSettings("mt.active_provider");
  const geminiKey = getSettings("mt.gemini_api_key");
  const geminiAuthMode = getSettings("mt.gemini_auth_mode");
  const geminiServiceAccount = getSettings("mt.gemini_service_account_json");
  const geminiConfigured =
    geminiAuthMode === "vertex"
      ? !!geminiServiceAccount.trim()
      : !!geminiKey.trim();
  const providerDone =
    activeProvider === "gemini" ? geminiConfigured : hasKey === true;

  // Auto-request mic permission once when devices list is empty so labels populate.
  // Browsers return placeholder entries with empty deviceId pre-permission;
  // those are filtered out in listDevices, leaving an empty array until granted.
  useEffect(() => {
    if (devices.mics.length === 0 && devices.outputs.length === 0) {
      void devices.requestPermission();
    }
    // Intentionally only re-run on list length change.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [devices.mics.length, devices.outputs.length]);

  const handleExport = useCallback(
    (format: "txt" | "srt" | "json") => {
      if (format === "srt") {
        // Prefer transcript store (sentence-level, absolute timestamps).
        // Fall back to caption-entry SRT when transcript store wasn't populated.
        const hasTranscriptTarget = snapshot.segments.some((s) => s.kind === "target");
        if (hasTranscriptTarget) {
          downloadTranscript(snapshot, "srt");
          toast.success("Transcript exported as .srt");
          return;
        }
        if (translation.length === 0) {
          toast.warning("No translation to export yet.");
          return;
        }
        const srtContent = captionEntriesToSrt(translation);
        const blob = new Blob([srtContent], { type: "text/plain;charset=utf-8" });
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = "transcript.srt";
        a.click();
        window.setTimeout(() => URL.revokeObjectURL(url), 500);
        toast.success("Transcript exported as .srt");
        return;
      }

      if (format === "txt") {
        // Prefer transcript store — sentence-level paragraphs, accumulates across stop/start.
        // Fall back to caption store when transcript store wasn't populated (HMR case).
        if (snapshot.segments.length > 0) {
          downloadTranscript(snapshot, "text");
          toast.success("Transcript exported as .txt");
          return;
        }
        const srcText = source.map((e) => e.text).join("").trim();
        const tgtText = translation.map((e) => e.text).join("").trim();
        const parts: string[] = [];
        if (srcText) parts.push(`Source:\n${srcText}`);
        if (tgtText) parts.push(`Translation:\n${tgtText}`);
        const content = parts.join("\n\n") || "(no transcript)";
        const blob = new Blob([content], { type: "text/plain;charset=utf-8" });
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = "transcript.txt";
        a.click();
        window.setTimeout(() => URL.revokeObjectURL(url), 500);
        toast.success("Transcript exported as .txt");
        return;
      }

      // JSON — raw caption store entries
      const content = JSON.stringify({ source, translation }, null, 2);
      const blob = new Blob([content], { type: "application/json;charset=utf-8" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = "transcript.json";
      a.click();
      window.setTimeout(() => URL.revokeObjectURL(url), 500);
      toast.success("Transcript exported as .json");
    },
    [source, translation, snapshot],
  );

  const handleClear = useCallback(() => {
    // Save current session to history before wiping stores.
    // Prefer transcript store segments (sentence-level); fall back to building
    // from caption deltas when transcript store was never populated (HMR case).
    const hasTranscriptContent = snapshot.segments.length > 0;
    const hasCaptionContent = source.length > 0 || translation.length > 0;
    if (hasTranscriptContent || hasCaptionContent) {
      const segments = hasTranscriptContent
        ? snapshot.segments
        : buildSegmentsFromCaptions(source, translation, snapshot.targetLanguage || targetLang);
      const sessionStartedAt =
        snapshot.sessionStartedAt ??
        new Date(
          performance.timeOrigin +
            Math.round((source[0]?.ts ?? translation[0]?.ts ?? performance.now())),
        ).toISOString();
      transcriptHistory.save({
        id: sessionStartedAt,
        startedAt: sessionStartedAt,
        endedAt: new Date().toISOString(),
        durationMs: Date.now() - new Date(sessionStartedAt).getTime(),
        targetLang: snapshot.targetLanguage || targetLang,
        segments,
      });
    }
    clearCaptions();
    clearTranscript();
    toast.info("Captions cleared");
  }, [clearCaptions, clearTranscript, snapshot, source, translation, targetLang]);

  const handleToggle = useCallback(() => {
    if (session.state === "idle" || session.state === "failed" || session.state === "closed") {
      session.start().catch((err: unknown) => {
        console.error("[translate-screen] start failed", err);
      });
    } else {
      session.stop();
    }
  }, [session]);

  // Space key toggles start/stop when no input is focused
  useEffect(() => {
    const handler = (e: KeyboardEvent): void => {
      if (e.code !== "Space" && e.key !== " ") return;
      const tag = (e.target as HTMLElement | null)?.tagName ?? "";
      if (tag === "INPUT" || tag === "TEXTAREA" || tag === "SELECT") return;
      e.preventDefault();
      handleToggle();
    };
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, [handleToggle]);

  return (
    <div className="flex h-full flex-col">
      {/* Main area: hero or captions */}
      <div className="flex min-h-0 flex-1 flex-col">
        {showHero ? (
          <FirstRunHero
            micDone={micDone}
            outputDone={outputDone}
            providerDone={providerDone}
            onStart={() => {
              session.start().catch((err: unknown) => {
                console.error("[translate-screen] start failed", err);
              });
            }}
          />
        ) : (
          <CaptionsCanvas source={source} translation={translation} />
        )}
      </div>

      {/* Persistent bottom control bar */}
      <CompactControlBar
        mics={devices.mics}
        outputs={devices.outputs}
        micId={devices.micId}
        outputId={devices.outputId}
        targetLang={targetLang}
        sessionState={session.state}
        onMicChange={devices.setMicId}
        onOutputChange={devices.setOutputId}
        onLangChange={(lang) => setSettings("mt.target_lang", lang)}
        onStart={() => {
          session.start().catch((err: unknown) => {
            console.error("[translate-screen] start failed", err);
          });
        }}
        onStop={() => session.stop()}
        onClear={handleClear}
        onExport={handleExport}
      />
    </div>
  );
}
