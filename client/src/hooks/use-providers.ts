import { useCallback } from "react";
import { getProvider, listProviders } from "@/providers/registry";
import type { ProviderId } from "@/providers/types";
import { settings } from "./_registry";
import { useSettings } from "./use-settings";

export type { ProviderId };

export function useProviders() {
  // Re-render when active_provider changes in settings.
  const { settings: snap } = useSettings();
  const active = snap["mt.active_provider"] as ProviderId;
  const list = listProviders();

  const setActive = useCallback((id: ProviderId) => {
    settings.set("mt.active_provider", id);
  }, []);

  const configure = useCallback(
    async (id: ProviderId) => getProvider(id),
    [],
  );

  return { active, list, setActive, configure };
}
