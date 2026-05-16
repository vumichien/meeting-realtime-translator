// use-profiles.ts — reactive wrapper around settings-stored meeting profiles.
// Reads from mt.meeting_profiles / mt.active_profile_id via useSettings.

import { useCallback } from "react";
import { useSettings } from "./use-settings";
import {
  createProfile,
  renameProfile,
  validateProfiles,
  type MeetingProfile,
  type ProfileDraft,
} from "@/lib/meeting-profiles";

export type { MeetingProfile, ProfileDraft };

export interface ProfilesState {
  profiles: MeetingProfile[];
  activeId: string;
  create: (draft: ProfileDraft) => void;
  update: (id: string, draft: Partial<ProfileDraft>) => void;
  remove: (id: string) => void;
  setActive: (id: string) => void;
}

export function useProfiles(): ProfilesState {
  const { settings, set, get } = useSettings();

  const profiles = validateProfiles(settings["mt.meeting_profiles"]);
  const activeId = settings["mt.active_profile_id"];

  const create = useCallback(
    (draft: ProfileDraft) => {
      const profile = createProfile(draft);
      const current = validateProfiles(get("mt.meeting_profiles"));
      set("mt.meeting_profiles", [...current, profile]);
      set("mt.active_profile_id", profile.id);
    },
    [get, set],
  );

  const update = useCallback(
    (id: string, draft: Partial<ProfileDraft>) => {
      const current = validateProfiles(get("mt.meeting_profiles"));
      const next = current.map((p) => {
        if (p.id !== id) return p;
        if (draft.name !== undefined) {
          return renameProfile({ ...p, ...draft }, draft.name);
        }
        return { ...p, ...draft, updatedAt: new Date().toISOString() };
      });
      set("mt.meeting_profiles", next);
    },
    [get, set],
  );

  const remove = useCallback(
    (id: string) => {
      const current = validateProfiles(get("mt.meeting_profiles"));
      const next = current.filter((p) => p.id !== id);
      set("mt.meeting_profiles", next);
      // Clear active if it was the removed profile
      if (get("mt.active_profile_id") === id) {
        set("mt.active_profile_id", next[0]?.id ?? "");
      }
    },
    [get, set],
  );

  const setActive = useCallback(
    (id: string) => {
      set("mt.active_profile_id", id);
    },
    [set],
  );

  return { profiles, activeId, create, update, remove, setActive };
}
