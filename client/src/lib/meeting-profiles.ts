import { ALLOWED_LANGS } from "../config/languages";
import { isMicEnvSetting, type MicEnvSetting } from "./mic-env-detect";

export interface MeetingProfile {
  id: string;
  name: string;
  targetLanguage: string;
  micEnv: MicEnvSetting;
  micDeviceId: string;
  micLabel: string;
  outputDeviceId: string;
  outputLabel: string;
  createdAt: string;
  updatedAt: string;
}

export interface ProfileDraft {
  name: string;
  targetLanguage: string;
  micEnv: MicEnvSetting;
  micDeviceId: string;
  micLabel: string;
  outputDeviceId: string;
  outputLabel: string;
}

export function createProfile(draft: ProfileDraft): MeetingProfile {
  const now = new Date().toISOString();
  return {
    ...draft,
    id: crypto.randomUUID(),
    name: normalizeName(draft.name),
    micLabel: normalizeLabel(draft.micLabel),
    outputLabel: normalizeLabel(draft.outputLabel),
    createdAt: now,
    updatedAt: now,
  };
}

export function renameProfile(profile: MeetingProfile, name: string): MeetingProfile {
  return { ...profile, name: normalizeName(name), updatedAt: new Date().toISOString() };
}

export function validateProfiles(value: unknown): MeetingProfile[] {
  if (!Array.isArray(value)) return [];
  return value
    .map(normalizeProfile)
    .filter((profile): profile is MeetingProfile => Boolean(profile));
}

export function findMissingProfileDevices(
  profile: MeetingProfile,
  devices: { inputs: { deviceId: string }[]; outputs: { deviceId: string }[] },
): string[] {
  const missing: string[] = [];
  if (profile.micDeviceId && !devices.inputs.some((d) => d.deviceId === profile.micDeviceId)) {
    missing.push(profile.micLabel || "saved source mic");
  }
  if (
    profile.outputDeviceId &&
    !devices.outputs.some((d) => d.deviceId === profile.outputDeviceId)
  ) {
    missing.push(profile.outputLabel || "saved output");
  }
  return missing;
}

function normalizeName(name: string): string {
  const clean = name.trim();
  return (clean || "Meeting profile").slice(0, 80);
}

function normalizeLabel(label: string): string {
  return label.trim().slice(0, 120);
}

function isMeetingProfile(value: unknown): value is MeetingProfile {
  if (!value || typeof value !== "object") return false;
  const item = value as Record<string, unknown>;
  return (
    typeof item.id === "string" &&
    typeof item.name === "string" &&
    typeof item.targetLanguage === "string" &&
    ALLOWED_LANGS.includes(item.targetLanguage as (typeof ALLOWED_LANGS)[number]) &&
    typeof item.micEnv === "string" &&
    isMicEnvSetting(item.micEnv) &&
    typeof item.micDeviceId === "string" &&
    typeof item.micLabel === "string" &&
    typeof item.outputDeviceId === "string" &&
    typeof item.outputLabel === "string"
  );
}

function normalizeProfile(value: unknown): MeetingProfile | null {
  if (!isMeetingProfile(value)) return null;
  return {
    ...value,
    name: normalizeName(value.name),
    micLabel: normalizeLabel(value.micLabel),
    outputLabel: normalizeLabel(value.outputLabel),
  };
}
