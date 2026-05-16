// Bottom control bar for the Translate screen.
// Contains: Mic select, Output select, Target lang select, Start/Stop, Clear, Export.
// Stacks vertically on narrow viewports (< 800px) via Tailwind responsive classes.

import React, { useCallback } from "react";
import { Play, Square, Trash2, Download } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import type { DeviceInfo } from "@/hooks/use-devices";
import type { SessionState } from "@/hooks/use-session";
import { LANGUAGE_LABELS, ALLOWED_LANGS } from "@/config/languages";
import { isVirtualCable } from "@/lib/virtual-cable-detect";

// Detect current platform once (module-level, not per-render).
const PLATFORM: string =
  (window as Window & typeof globalThis).electron?.platform ?? navigator.platform;

interface CompactControlBarProps {
  mics: DeviceInfo[];
  outputs: DeviceInfo[];
  micId: string;
  outputId: string;
  targetLang: string;
  sessionState: SessionState;
  onMicChange: (id: string) => void;
  onOutputChange: (id: string) => void;
  onLangChange: (lang: string) => void;
  onStart: () => void;
  onStop: () => void;
  onClear: () => void;
  onExport: (format: "json" | "txt") => void;
}

function deviceLabel(device: DeviceInfo): string {
  const star = isVirtualCable(device.label, PLATFORM) ? "★ " : "";
  return star + (device.label || device.deviceId);
}

/**
 * Horizontal control strip at the bottom of the Translate screen.
 * Wraps to two rows on narrow viewports.
 */
export function CompactControlBar({
  mics,
  outputs,
  micId,
  outputId,
  targetLang,
  sessionState,
  onMicChange,
  onOutputChange,
  onLangChange,
  onStart,
  onStop,
  onClear,
  onExport,
}: CompactControlBarProps): React.JSX.Element {
  const isRunning = sessionState === "connected" || sessionState === "connecting";
  const isConnecting = sessionState === "connecting";

  const handleExportJson = useCallback(() => onExport("json"), [onExport]);
  const handleExportTxt = useCallback(() => onExport("txt"), [onExport]);

  return (
    <div className="shrink-0 border-t border-border bg-background/95 px-3 py-2 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="flex flex-wrap items-center gap-2">
        {/* Microphone selector */}
        <Select value={micId || undefined} onValueChange={onMicChange}>
          <SelectTrigger className="h-8 w-44 text-xs" aria-label="Source microphone">
            <SelectValue placeholder="Select mic…" />
          </SelectTrigger>
          <SelectContent>
            {mics.map((d) => (
              <SelectItem key={d.deviceId} value={d.deviceId} className="text-xs">
                {deviceLabel(d)}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        {/* Output device selector */}
        <Select value={outputId || undefined} onValueChange={onOutputChange}>
          <SelectTrigger className="h-8 w-44 text-xs" aria-label="Output device">
            <SelectValue placeholder="Select output…" />
          </SelectTrigger>
          <SelectContent>
            {outputs.map((d) => (
              <SelectItem key={d.deviceId} value={d.deviceId} className="text-xs">
                {deviceLabel(d)}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        {/* Target language selector */}
        <Select value={targetLang} onValueChange={onLangChange}>
          <SelectTrigger className="h-8 w-36 text-xs" aria-label="Target language">
            <SelectValue placeholder="Language…" />
          </SelectTrigger>
          <SelectContent>
            {ALLOWED_LANGS.map((code) => (
              <SelectItem key={code} value={code} className="text-xs">
                {LANGUAGE_LABELS[code]}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        {/* Spacer pushes action buttons to the right */}
        <div className="flex-1" />

        {/* Start / Stop */}
        {isRunning ? (
          <Button
            size="sm"
            variant="destructive"
            onClick={onStop}
            disabled={isConnecting}
            className="h-8 gap-1.5 text-xs"
            aria-label="Stop translation"
          >
            <Square className="h-3 w-3" />
            Stop
          </Button>
        ) : (
          <Button
            size="sm"
            onClick={onStart}
            className="h-8 gap-1.5 text-xs"
            aria-label="Start translation"
          >
            <Play className="h-3 w-3" />
            Start
          </Button>
        )}

        {/* Clear captions */}
        <Button
          size="sm"
          variant="outline"
          onClick={onClear}
          className="h-8 gap-1.5 text-xs"
          aria-label="Clear captions"
          title="Clear captions"
        >
          <Trash2 className="h-3 w-3" />
          Clear
        </Button>

        {/* Export menu (two simple buttons for compactness) */}
        <Button
          size="sm"
          variant="ghost"
          onClick={handleExportTxt}
          className="h-8 gap-1.5 text-xs"
          aria-label="Export as text"
          title="Export transcript as .txt"
        >
          <Download className="h-3 w-3" />
          TXT
        </Button>
        <Button
          size="sm"
          variant="ghost"
          onClick={handleExportJson}
          className="h-8 gap-1.5 text-xs"
          aria-label="Export as JSON"
          title="Export transcript as .json"
        >
          <Download className="h-3 w-3" />
          JSON
        </Button>
      </div>
    </div>
  );
}
