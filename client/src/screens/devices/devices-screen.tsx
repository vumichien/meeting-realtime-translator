// Devices screen: mic + output pickers, environment select, permissions banner,
// and test-output button. Reads/writes state via useDevices + useSettings hooks.

import React, { useMemo } from "react";
import { useDevices } from "@/hooks/use-devices";
import { useSettings } from "@/hooks/use-settings";
import { PermissionsBanner } from "./permissions-banner";
import { DeviceSelect } from "./device-select";
import { TestOutputButton } from "./test-output-button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

// Mic environment options
const MIC_ENV_OPTIONS = [
  { value: "auto", label: "Auto (detect from device)" },
  { value: "headset", label: "Headset / earphones" },
  { value: "laptop", label: "Laptop built-in mic" },
  { value: "room", label: "Conference room / far-field" },
] as const;

type MicEnv = "auto" | "headset" | "laptop" | "room";

/**
 * Devices screen: select source mic, output device, mic environment.
 * Shows a permissions banner when device labels are blank (mic perm denied).
 */
export function DevicesScreen(): React.JSX.Element {
  const devices = useDevices();
  const { get: getSetting, set: setSetting } = useSettings();
  const micEnv = getSetting("mt.mic_env");

  // Permissions denied = device list non-empty but all labels blank.
  // Also show if the list is non-empty and every label is an empty string.
  const permsDenied = useMemo(() => {
    const all = [...devices.mics, ...devices.outputs];
    return all.length > 0 && all.every((d) => !d.label);
  }, [devices.mics, devices.outputs]);

  return (
    <div className="mx-auto max-w-xl space-y-6 p-6">
      <PermissionsBanner
        visible={permsDenied}
        onRequestPermission={devices.requestPermission}
      />

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Audio devices</CardTitle>
        </CardHeader>
        <CardContent className="space-y-5">
          {/* Source microphone */}
          <div className="space-y-1.5">
            <label className="text-sm font-medium" htmlFor="mic-select">
              Source microphone
            </label>
            <DeviceSelect
              kind="mic"
              devices={devices.mics}
              value={devices.micId}
              onChange={devices.setMicId}
            />
          </div>

          {/* Output device */}
          <div className="space-y-1.5">
            <label className="text-sm font-medium" htmlFor="output-select">
              Output device{" "}
              <span className="font-normal text-muted-foreground">(virtual cable)</span>
            </label>
            <DeviceSelect
              kind="output"
              devices={devices.outputs}
              value={devices.outputId}
              onChange={devices.setOutputId}
            />
          </div>

          {/* Mic environment */}
          <div className="space-y-1.5">
            <label className="text-sm font-medium" htmlFor="mic-env-select">
              Mic environment
            </label>
            <select
              id="mic-env-select"
              value={micEnv}
              onChange={(e) => setSetting("mt.mic_env", e.target.value as MicEnv)}
              className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
              aria-label="Mic environment"
            >
              {MIC_ENV_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
          </div>

          {/* Test output */}
          <div className="flex items-center justify-between border-t border-border pt-4">
            <div>
              <p className="text-sm font-medium">Test output</p>
              <p className="text-xs text-muted-foreground">
                Plays a 1-second 440 Hz tone through the selected output device.
              </p>
            </div>
            <TestOutputButton outputId={devices.outputId} />
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
