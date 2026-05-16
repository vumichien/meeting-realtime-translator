import { useState, useCallback } from "react";
import { runSetupDoctor, type SetupDoctorResult } from "@/lib/setup-doctor";
import { settings } from "./_registry";

export type { SetupDoctorResult };

export function useSetupDoctor() {
  const [latest, setLatest] = useState<SetupDoctorResult | null>(null);
  const [running, setRunning] = useState(false);

  const run = useCallback(async () => {
    if (running) return;
    setRunning(true);
    try {
      const result = await runSetupDoctor({
        micDeviceId: settings.get("mt.mic_device_id"),
        outputDeviceId: settings.get("mt.output_device_id"),
      });
      setLatest(result);
    } catch (err) {
      console.warn("[use-setup-doctor] run failed", err);
    } finally {
      setRunning(false);
    }
  }, [running]);

  return { latest, running, run };
}
