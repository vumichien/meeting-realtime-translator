import { useSyncExternalStore } from "react";
import type { SettingsKey, SettingsStore } from "@/settings";
import { settings } from "./_registry";

export function useSettings() {
  const snapshot = useSyncExternalStore(
    (cb) => settings.subscribe(cb),
    () => settings.snapshot(),
  );

  return {
    settings: snapshot,
    get<K extends SettingsKey>(key: K): SettingsStore[K] {
      return settings.get(key);
    },
    set<K extends SettingsKey>(key: K, value: SettingsStore[K]): void {
      settings.set(key, value);
    },
  };
}
