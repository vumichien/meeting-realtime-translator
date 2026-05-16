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
import { toast } from "sonner";

/**
 * Translate screen root. Composes hero-or-canvas with a persistent control bar.
 */
export function TranslateScreen(): React.JSX.Element {
  const session = useSession();
  const { source, translation, clear: clearCaptions } = useCaptions();
  const devices = useDevices();
  const { get: getSettings, set: setSettings } = useSettings();
  const { entries } = useTranscript();
  const { hasKey } = useApiKeyProvider();

  const targetLang = getSettings("mt.target_lang");
  const isIdle = session.state === "idle";
  const showHero = isIdle && entries.length === 0;

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

  // Export handler: triggers browser download via blob
  const handleExport = useCallback(
    (format: "json" | "txt") => {
      // Build minimal export from current captions
      const lines = [
        ...source.map((e) => `[source] ${e.text}`),
        ...translation.map((e) => `[translation] ${e.text}`),
      ];
      const content =
        format === "json"
          ? JSON.stringify({ source, translation }, null, 2)
          : lines.join("\n");
      const blob = new Blob([content], { type: "text/plain;charset=utf-8" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `transcript.${format}`;
      a.click();
      URL.revokeObjectURL(url);
      toast.success(`Transcript exported as .${format}`);
    },
    [source, translation],
  );

  const handleClear = useCallback(() => {
    clearCaptions();
    toast.info("Captions cleared");
  }, [clearCaptions]);

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
