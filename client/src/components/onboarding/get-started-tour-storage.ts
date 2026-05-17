import type { SettingsStore } from "@/settings";

export const GET_STARTED_TOUR_VERSION = 1;

type SetSetting = <K extends keyof SettingsStore>(
  key: K,
  value: SettingsStore[K],
) => void;

export function isGetStartedTourComplete(settings: SettingsStore): boolean {
  const completedAt = settings["mt.get_started_tour_completed_at"];
  const completedVersion = settings["mt.get_started_tour_version"];

  return Boolean(completedAt) && completedVersion >= GET_STARTED_TOUR_VERSION;
}

export function markGetStartedTourComplete(setSetting: SetSetting): void {
  setSetting("mt.get_started_tour_completed_at", new Date().toISOString());
  setSetting("mt.get_started_tour_version", GET_STARTED_TOUR_VERSION);
}
