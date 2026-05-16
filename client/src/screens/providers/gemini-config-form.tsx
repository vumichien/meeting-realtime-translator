// Gemini provider config form — API key + auth mode + voice + region.
// Sources voice/region lists from settings schema constants.

import React, { useState, useEffect } from "react";
import { Eye, EyeOff } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { settings } from "@/hooks/_registry";
import { useSettings } from "@/hooks/use-settings";

const VOICES = ["Aoede", "Puck", "Charon", "Kore", "Fenrir"] as const;
const REGIONS = ["us-central1", "asia-northeast1", "europe-west4"] as const;
type GeminiVoice = (typeof VOICES)[number];
type GeminiRegion = (typeof REGIONS)[number];

interface GeminiConfigFormProps {
  onSave?: () => void;
}

export function GeminiConfigForm({ onSave }: GeminiConfigFormProps): React.JSX.Element {
  const { settings: snap } = useSettings();
  const [revealed, setRevealed] = useState(false);
  const [apiKey, setApiKey] = useState(snap["mt.gemini_api_key"] ?? "");
  const [authMode, setAuthMode] = useState<"ai-studio" | "vertex">(
    snap["mt.gemini_auth_mode"] ?? "ai-studio",
  );
  const [voice, setVoice] = useState<GeminiVoice>(snap["mt.gemini_voice"] ?? "Aoede");
  const [region, setRegion] = useState<GeminiRegion>(
    (snap["mt.gemini_region"] as GeminiRegion) ?? "us-central1",
  );
  const [status, setStatus] = useState<"idle" | "saving" | "saved" | "error">("idle");

  // Keep local state in sync when settings change externally (e.g. HMR)
  useEffect(() => {
    setApiKey(snap["mt.gemini_api_key"] ?? "");
    setAuthMode(snap["mt.gemini_auth_mode"] ?? "ai-studio");
    setVoice(snap["mt.gemini_voice"] ?? "Aoede");
    setRegion((snap["mt.gemini_region"] as GeminiRegion) ?? "us-central1");
  }, []); // intentionally run once on mount

  function handleSave() {
    if (authMode === "ai-studio" && apiKey.trim().length < 10) {
      setStatus("error");
      return;
    }
    setStatus("saving");
    try {
      // TODO(security): Gemini API key is currently persisted in plaintext via
      // localStorage (settings store). A secure path via the Electron keyring
      // IPC (preload.cjs exposes window.electron.keyring) does not yet have
      // main-process ipcMain.handle("keyring:*") handlers registered, so it
      // cannot be used here without new backend work. Track as follow-up to
      // mirror the OpenAI safeStorage path.
      settings.set("mt.gemini_api_key", apiKey.trim());
      settings.set("mt.gemini_auth_mode", authMode);
      settings.set("mt.gemini_voice", voice);
      settings.set("mt.gemini_region", region);
      setStatus("saved");
      onSave?.();
      setTimeout(() => setStatus("idle"), 2000);
    } catch {
      setStatus("error");
    }
  }

  return (
    <div className="space-y-4">
      {/* Auth mode toggle */}
      <div>
        <label className="mb-1.5 block text-sm font-medium text-foreground">
          Authentication mode
        </label>
        <div className="flex gap-4 text-sm">
          {(["ai-studio", "vertex"] as const).map((mode) => (
            <label key={mode} className="flex cursor-pointer items-center gap-1.5">
              <input
                type="radio"
                name="gemini-auth-mode"
                value={mode}
                checked={authMode === mode}
                onChange={() => setAuthMode(mode)}
                className="accent-primary"
              />
              {mode === "ai-studio" ? "AI Studio key" : "Vertex AI"}
            </label>
          ))}
        </div>
      </div>

      {/* API key — only shown for ai-studio mode */}
      {authMode === "ai-studio" && (
        <div>
          <label className="mb-1.5 block text-sm font-medium text-foreground">
            Gemini API key
          </label>
          <div className="relative">
            <Input
              type={revealed ? "text" : "password"}
              value={apiKey}
              onChange={(e) => {
                setApiKey(e.target.value);
                setStatus("idle");
              }}
              placeholder="AIza…"
              autoComplete="off"
              spellCheck={false}
              className="pr-10"
            />
            <button
              type="button"
              aria-label={revealed ? "Hide API key" : "Show API key"}
              onClick={() => setRevealed((r) => !r)}
              className="absolute inset-y-0 right-0 flex items-center px-3 text-muted-foreground hover:text-foreground"
            >
              {revealed ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </button>
          </div>
          {status === "error" && (
            <p className="mt-1 text-xs text-destructive">
              Enter a valid Gemini API key.
            </p>
          )}
        </div>
      )}

      {/* Vertex notice */}
      {authMode === "vertex" && (
        <p className="rounded-md bg-muted px-3 py-2 text-xs text-muted-foreground">
          Vertex AI service account config is managed via the legacy settings panel.
          This will be migrated in a future release.
        </p>
      )}

      {/* Voice */}
      <div>
        <label className="mb-1.5 block text-sm font-medium text-foreground">Voice</label>
        <Select value={voice} onValueChange={(v) => setVoice(v as GeminiVoice)}>
          <SelectTrigger className="w-40">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {VOICES.map((v) => (
              <SelectItem key={v} value={v}>
                {v}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Region */}
      <div>
        <label className="mb-1.5 block text-sm font-medium text-foreground">Region</label>
        <Select value={region} onValueChange={(v) => setRegion(v as GeminiRegion)}>
          <SelectTrigger className="w-52">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {REGIONS.map((r) => (
              <SelectItem key={r} value={r}>
                {r}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <Button onClick={handleSave} disabled={status === "saving"}>
        {status === "saving" ? "Saving…" : status === "saved" ? "Saved!" : "Save"}
      </Button>
    </div>
  );
}
