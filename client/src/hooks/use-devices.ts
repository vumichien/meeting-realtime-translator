import { useState, useEffect, useCallback } from "react";
import {
  listDevices,
  ensureMicPermission,
  subscribeDeviceChanges,
  type DeviceInfo,
} from "@/audio-devices";
import { settings } from "./_registry";

export type { DeviceInfo };

export interface DevicesState {
  mics: DeviceInfo[];
  outputs: DeviceInfo[];
  micId: string;
  outputId: string;
}

export function useDevices() {
  const [state, setState] = useState<DevicesState>({
    mics: [],
    outputs: [],
    micId: settings.get("mt.mic_device_id"),
    outputId: settings.get("mt.output_device_id"),
  });

  // Initial load + subscribe to hardware changes.
  useEffect(() => {
    let cancelled = false;

    listDevices()
      .then((devices) => {
        if (!cancelled) {
          setState((prev) => ({
            ...prev,
            mics: devices.inputs,
            outputs: devices.outputs,
          }));
        }
      })
      .catch((err) => console.warn("[use-devices] initial list failed", err));

    const unsub = subscribeDeviceChanges((devices) => {
      if (!cancelled) {
        setState((prev) => ({
          ...prev,
          mics: devices.inputs,
          outputs: devices.outputs,
        }));
      }
    });

    return () => {
      cancelled = true;
      unsub();
    };
  }, []);

  const setMicId = useCallback((id: string) => {
    settings.set("mt.mic_device_id", id);
    setState((prev) => ({ ...prev, micId: id }));
  }, []);

  const setOutputId = useCallback((id: string) => {
    settings.set("mt.output_device_id", id);
    setState((prev) => ({ ...prev, outputId: id }));
  }, []);

  const refresh = useCallback(() => {
    listDevices()
      .then((devices) => {
        setState((prev) => ({
          ...prev,
          mics: devices.inputs,
          outputs: devices.outputs,
        }));
      })
      .catch((err) => console.warn("[use-devices] refresh failed", err));
  }, []);

  /**
   * Requests microphone permission via getUserMedia so device labels become
   * readable. Automatically refreshes device list after permission is granted.
   */
  const requestPermission = useCallback(async (): Promise<void> => {
    try {
      await ensureMicPermission();
      refresh();
    } catch (err) {
      console.warn("[use-devices] mic permission request failed", err);
    }
  }, [refresh]);

  return { ...state, setMicId, setOutputId, refresh, requestPermission };
}
