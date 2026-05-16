// about-section.tsx — App info: version, GitHub link, developer mode, logs folder.
// Developer mode writes mt.developer_mode to localStorage (raw, not in SettingsStore)
// and dispatches a StorageEvent so diagnostics-screen reacts without reload.
// "Open logs folder" is gated behind window.electron?.shell?.openLogsFolder — IPC
// added in Phase 7; button is disabled/no-op if the method is not yet available.

import React, { useState } from "react";
import { ExternalLink, FolderOpen } from "lucide-react";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";

const DEVELOPER_MODE_KEY = "mt.developer_mode";
const GITHUB_URL = "https://github.com/vumichien/meeting-realtime-translator";

function readDeveloperMode(): boolean {
  try {
    return localStorage.getItem(DEVELOPER_MODE_KEY) === "true";
  } catch {
    return false;
  }
}

function writeDeveloperMode(enabled: boolean): void {
  try {
    const value = enabled ? "true" : "false";
    localStorage.setItem(DEVELOPER_MODE_KEY, value);
    // Dispatch StorageEvent so same-tab listeners (diagnostics-screen) react.
    window.dispatchEvent(
      new StorageEvent("storage", {
        key: DEVELOPER_MODE_KEY,
        newValue: value,
        storageArea: localStorage,
      }),
    );
  } catch (err) {
    console.warn("[about] developer mode write failed:", err);
  }
}

export function AboutSection(): React.JSX.Element {
  const [developerMode, setDeveloperModeState] = useState(readDeveloperMode);

  const appVersion = window.electron?.appVersion ?? "—";
  const hasLogsFolder = typeof window.electron?.shell?.openLogsFolder === "function";

  function handleDeveloperModeChange(checked: boolean) {
    writeDeveloperMode(checked);
    setDeveloperModeState(checked);
  }

  function handleOpenLogs() {
    if (hasLogsFolder) {
      window.electron?.shell?.openLogsFolder?.();
    }
  }

  return (
    <div className="flex flex-col gap-5">
      {/* App identity */}
      <div className="flex flex-col gap-1">
        <p className="text-sm font-semibold">Babel Mic</p>
        <p className="text-xs text-muted-foreground">
          Version {appVersion}
        </p>
        <p className="text-xs text-muted-foreground">
          Transcripts are stored locally on your machine. No data is sent to any server
          unless a translation session is active.
        </p>
      </div>

      {/* GitHub link */}
      <div>
        <a
          href={GITHUB_URL}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1.5 text-sm text-primary hover:underline"
        >
          View on GitHub
          <ExternalLink className="h-3.5 w-3.5" aria-hidden="true" />
        </a>
      </div>

      {/* Developer mode */}
      <div className="flex items-center justify-between gap-4">
        <div>
          <p className="text-sm font-medium">Developer mode</p>
          <p className="text-xs text-muted-foreground">
            Show the Developer tab in Diagnostics for advanced debugging tools.
          </p>
        </div>
        <Switch
          checked={developerMode}
          onCheckedChange={handleDeveloperModeChange}
          aria-label="Enable developer mode"
        />
      </div>

      {/* Open logs folder — Electron only; disabled until Phase 7 wires IPC */}
      <div className="flex items-center justify-between gap-4">
        <div>
          <p className="text-sm font-medium">Application logs</p>
          <p className="text-xs text-muted-foreground">
            Open the folder containing diagnostic log files.
          </p>
        </div>
        <Button
          variant="outline"
          size="sm"
          className="gap-1.5 shrink-0"
          disabled={!hasLogsFolder}
          onClick={handleOpenLogs}
          aria-label="Open logs folder"
        >
          <FolderOpen className="h-4 w-4" />
          Open logs
        </Button>
      </div>
    </div>
  );
}
