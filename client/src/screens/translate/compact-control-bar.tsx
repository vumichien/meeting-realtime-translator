import React, { useCallback } from "react";
import { Download, Languages, Mic, Play, Square, Trash2, Volume2, type LucideIcon } from "lucide-react";
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
  onExport: (format: "txt" | "srt" | "json") => void;
}

function deviceLabel(device: DeviceInfo): string {
  const star = isVirtualCable(device.label, PLATFORM) ? "★ " : "";
  return star + (device.label || device.deviceId);
}

interface ControlFieldProps {
  icon: LucideIcon;
  label: string;
  children: React.ReactNode;
}

function ControlField({
  icon: Icon,
  label,
  children,
}: ControlFieldProps): React.JSX.Element {
  return (
    <div className="flex min-w-0 flex-col gap-1">
      <div className="flex items-center gap-1.5 px-1 text-[0.68rem] font-medium uppercase leading-none tracking-wide text-muted-foreground">
        <Icon className="h-3.5 w-3.5" />
        <span>{label}</span>
      </div>
      {children}
    </div>
  );
}

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

  const handleExportTxt = useCallback(() => onExport("txt"), [onExport]);
  const handleExportSrt = useCallback(() => onExport("srt"), [onExport]);
  const handleExportJson = useCallback(() => onExport("json"), [onExport]);

  return (
    <div className="shrink-0 border-t border-border bg-background/95 px-3 py-2.5 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="flex flex-wrap items-end gap-2.5">
        <ControlField icon={Mic} label="Source mic">
          <Select value={micId || undefined} onValueChange={onMicChange}>
            <SelectTrigger className="h-9 w-56 text-xs" aria-label="Source microphone">
              <SelectValue placeholder="Choose your real microphone" />
            </SelectTrigger>
            <SelectContent>
              {mics.map((d) => (
                <SelectItem key={d.deviceId} value={d.deviceId} className="text-xs">
                  {deviceLabel(d)}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </ControlField>

        <ControlField icon={Volume2} label="Output to meeting">
          <Select value={outputId || undefined} onValueChange={onOutputChange}>
            <SelectTrigger className="h-9 w-56 text-xs" aria-label="Output device">
              <SelectValue placeholder="Choose virtual cable output" />
            </SelectTrigger>
            <SelectContent>
              {outputs.map((d) => (
                <SelectItem key={d.deviceId} value={d.deviceId} className="text-xs">
                  {deviceLabel(d)}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </ControlField>

        <ControlField icon={Languages} label="Translate to">
          <Select value={targetLang} onValueChange={onLangChange}>
            <SelectTrigger className="h-9 w-40 text-xs" aria-label="Target language">
              <SelectValue placeholder="Target language" />
            </SelectTrigger>
            <SelectContent>
              {ALLOWED_LANGS.map((code) => (
                <SelectItem key={code} value={code} className="text-xs">
                  {LANGUAGE_LABELS[code]}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </ControlField>

        <div className="flex-1" />

        {isRunning ? (
          <Button
            size="sm"
            variant="destructive"
            onClick={onStop}
            disabled={isConnecting}
            className="h-9 gap-1.5 text-xs"
            aria-label="Stop translation"
          >
            <Square className="h-3 w-3" />
            Stop
          </Button>
        ) : (
          <Button
            size="sm"
            onClick={onStart}
            className="h-9 gap-1.5 text-xs"
            aria-label="Start translation"
          >
            <Play className="h-3 w-3" />
            Start
          </Button>
        )}

        <Button
          size="sm"
          variant="outline"
          onClick={onClear}
          className="h-9 gap-1.5 text-xs"
          aria-label="Clear captions"
          title="Clear captions"
        >
          <Trash2 className="h-3 w-3" />
          Clear
        </Button>

        <Button
          size="sm"
          variant="ghost"
          onClick={handleExportTxt}
          className="h-9 gap-1.5 text-xs"
          aria-label="Export as text"
          title="Export transcript as .txt (paragraphs)"
        >
          <Download className="h-3 w-3" />
          TXT
        </Button>
        <Button
          size="sm"
          variant="ghost"
          onClick={handleExportSrt}
          className="h-9 gap-1.5 text-xs"
          aria-label="Export as subtitles"
          title="Export translation as .srt subtitle file"
        >
          <Download className="h-3 w-3" />
          SRT
        </Button>
        <Button
          size="sm"
          variant="ghost"
          onClick={handleExportJson}
          className="h-9 gap-1.5 text-xs"
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
