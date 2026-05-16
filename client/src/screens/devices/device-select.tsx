// Reusable audio device selector using shadcn Select.
// Prefixes virtual-cable device labels with "★ " and shows a tooltip
// on the output select explaining recommended virtual cable usage per OS.

import React from "react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { Info } from "lucide-react";
import type { DeviceInfo } from "@/hooks/use-devices";
import { isVirtualCable } from "@/lib/virtual-cable-detect";

// Resolve platform once at module level — avoids per-render access.
const PLATFORM: string =
  (window as Window & typeof globalThis).electron?.platform ?? navigator.platform;

const OUTPUT_TOOLTIP =
  PLATFORM.startsWith("Win")
    ? "Choose CABLE Input (VB-Audio) or Voicemeeter to route audio into Zoom/Meet."
    : PLATFORM.startsWith("Mac") || PLATFORM === "darwin"
    ? "Choose BlackHole 2ch to route translated audio into Zoom/Meet."
    : "Choose the meeting-translator PipeWire sink to route audio into your meeting app.";

function deviceOptionLabel(device: DeviceInfo): string {
  const prefix = isVirtualCable(device.label, PLATFORM) ? "★ " : "";
  return prefix + (device.label || `Device ${device.deviceId.slice(0, 8)}`);
}

interface DeviceSelectProps {
  /** "mic" renders a microphone input picker; "output" renders an output picker with tooltip. */
  kind: "mic" | "output";
  devices: DeviceInfo[];
  value: string;
  onChange: (id: string) => void;
  placeholder?: string;
  disabled?: boolean;
}

/**
 * Single-device select with virtual-cable star prefix.
 * Output variant includes an info icon tooltip explaining which device to pick.
 */
export function DeviceSelect({
  kind,
  devices,
  value,
  onChange,
  placeholder,
  disabled = false,
}: DeviceSelectProps): React.JSX.Element {
  const defaultPlaceholder =
    kind === "mic" ? "Select microphone…" : "Select output device…";

  const select = (
    <Select value={value || undefined} onValueChange={onChange} disabled={disabled}>
      <SelectTrigger
        className="w-full"
        aria-label={kind === "mic" ? "Source microphone" : "Output device"}
      >
        <SelectValue placeholder={placeholder ?? defaultPlaceholder} />
      </SelectTrigger>
      <SelectContent>
        {devices.length === 0 ? (
          <SelectItem value="__none__" disabled>
            No devices found
          </SelectItem>
        ) : (
          devices.map((d) => (
            <SelectItem key={d.deviceId} value={d.deviceId}>
              {deviceOptionLabel(d)}
            </SelectItem>
          ))
        )}
      </SelectContent>
    </Select>
  );

  if (kind !== "output") return select;

  // Output variant: wrap in a flex row with an info-icon tooltip.
  return (
    <div className="flex items-center gap-2">
      <div className="flex-1">{select}</div>
      <Tooltip>
        <TooltipTrigger asChild>
          <Info
            className="h-4 w-4 shrink-0 cursor-help text-muted-foreground"
            aria-label="Output device guidance"
          />
        </TooltipTrigger>
        <TooltipContent side="right" className="max-w-xs">
          {OUTPUT_TOOLTIP}
          {" "}Devices marked with ★ are recommended virtual cables.
        </TooltipContent>
      </Tooltip>
    </div>
  );
}
