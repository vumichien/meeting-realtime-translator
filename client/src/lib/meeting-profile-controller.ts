import type { Settings } from "../settings";
import type { DeviceLists } from "../audio-devices";
import type { ControlsHandle } from "../ui/controls";
import type { DevicePickerHandle } from "../ui/device-pickers";
import type { StatusBar } from "../ui/status";
import { askProfileName } from "../ui/profile-name-dialog";
import { createMeetingProfilesPanel } from "../ui/meeting-profiles";
import {
  createProfile,
  findMissingProfileDevices,
  renameProfile,
  validateProfiles,
} from "./meeting-profiles";

export interface MeetingProfileController {
  rootEl: HTMLElement;
  setDevices(devices: DeviceLists): void;
}

export function createMeetingProfileController(args: {
  settings: Settings;
  controls: ControlsHandle;
  pickers: DevicePickerHandle;
  status: StatusBar;
  getCurrentDeviceIds: () => { micDeviceId: string; outputDeviceId: string };
  setCurrentDeviceIds: (ids: { micDeviceId: string; outputDeviceId: string }) => void;
}): MeetingProfileController {
  let devices: DeviceLists = { inputs: [], outputs: [] };
  let profiles = validateProfiles(args.settings.get("mt.meeting_profiles"));
  const panel = createMeetingProfilesPanel(
    profiles,
    args.settings.get("mt.active_profile_id"),
    {
      onApply: (id) => void apply(id),
      onSave: () => void save(),
      onRename: (id) => void rename(id),
      onDelete: remove,
    },
  );

  function persist(activeId = args.settings.get("mt.active_profile_id")) {
    args.settings.set("mt.meeting_profiles", profiles);
    args.settings.set("mt.active_profile_id", activeId);
    panel.setProfiles(profiles, activeId);
  }

  async function save() {
    const name = await askProfileName({
      title: "Save meeting profile",
      initialValue: "My meeting setup",
    });
    if (name === null) return;
    const ids = args.getCurrentDeviceIds();
    const mic = devices.inputs.find((d) => d.deviceId === ids.micDeviceId);
    const out = devices.outputs.find((d) => d.deviceId === ids.outputDeviceId);
    const profile = createProfile({
      name,
      targetLanguage: args.settings.get("mt.target_lang"),
      micEnv: args.settings.get("mt.mic_env"),
      micDeviceId: ids.micDeviceId,
      micLabel: mic?.label ?? "",
      outputDeviceId: ids.outputDeviceId,
      outputLabel: out?.label ?? "",
    });
    profiles = [...profiles, profile];
    persist(profile.id);
  }

  async function apply(id: string) {
    const profile = profiles.find((item) => item.id === id);
    if (!profile) return;
    const missing = findMissingProfileDevices(profile, devices);
    args.settings.set("mt.target_lang", profile.targetLanguage);
    args.settings.set("mt.mic_env", profile.micEnv);
    args.setCurrentDeviceIds({
      micDeviceId: profile.micDeviceId,
      outputDeviceId: profile.outputDeviceId,
    });
    args.settings.set("mt.mic_device_id", profile.micDeviceId);
    args.settings.set("mt.output_device_id", profile.outputDeviceId);
    args.controls.syncFromSettings();
    await args.pickers.setSelections(profile.micDeviceId, profile.outputDeviceId);
    persist(profile.id);
    if (missing.length) {
      args.status.showError(`Profile applied, but reselect missing device: ${missing.join(", ")}`, {
        sticky: true,
      });
    }
  }

  async function rename(id: string) {
    const profile = profiles.find((item) => item.id === id);
    if (!profile) return;
    const name = await askProfileName({
      title: "Rename meeting profile",
      initialValue: profile.name,
    });
    if (name === null) return;
    profiles = profiles.map((item) => (item.id === id ? renameProfile(item, name) : item));
    persist(id);
  }

  function remove(id: string) {
    profiles = profiles.filter((item) => item.id !== id);
    persist(profiles[0]?.id ?? "");
  }

  return {
    rootEl: panel.rootEl,
    setDevices(nextDevices) {
      devices = nextDevices;
    },
  };
}
