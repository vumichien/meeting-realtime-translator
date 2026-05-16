// Enumerate audio devices, classify virtual cables, and route translated audio
// to the chosen output device via setSinkId().

export type VirtualCableKind =
  | "vb-cable"
  | "voicemeeter"
  | "blackhole"
  | "pipewire"
  | null;

export interface DeviceInfo {
  deviceId: string;
  label: string;
  groupId: string;
  virtualCable: VirtualCableKind;
}

export interface DeviceLists {
  inputs: DeviceInfo[];
  outputs: DeviceInfo[];
}

const VIRTUAL_PATTERNS: { kind: NonNullable<VirtualCableKind>; needles: string[] }[] = [
  { kind: "vb-cable", needles: ["cable input", "cable output", "vb-audio"] },
  { kind: "voicemeeter", needles: ["voicemeeter input", "voicemeeter aux input"] },
  { kind: "blackhole", needles: ["blackhole"] },
  { kind: "pipewire", needles: ["meeting-translator", "monitor of meeting-translator"] },
];

export function classifyVirtualCable(label: string): VirtualCableKind {
  const lower = label.toLowerCase();
  for (const { kind, needles } of VIRTUAL_PATTERNS) {
    if (needles.some((n) => lower.includes(n))) return kind;
  }
  return null;
}

function toDeviceInfo(d: MediaDeviceInfo): DeviceInfo {
  return {
    deviceId: d.deviceId,
    label: d.label,
    groupId: d.groupId,
    virtualCable: classifyVirtualCable(d.label),
  };
}

export async function listDevices(): Promise<DeviceLists> {
  const all = await navigator.mediaDevices.enumerateDevices();
  // Drop placeholder entries Chromium emits before mic permission (empty deviceId).
  // They would render as <SelectItem value=""/> which Radix Select rejects.
  const real = all.filter((d) => d.deviceId !== "");
  return {
    inputs: real.filter((d) => d.kind === "audioinput").map(toDeviceInfo),
    outputs: real.filter((d) => d.kind === "audiooutput").map(toDeviceInfo),
  };
}

/**
 * Ask the user for mic permission once so device labels become readable.
 * Stops the temporary track immediately.
 */
export async function ensureMicPermission(): Promise<void> {
  const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
  stream.getTracks().forEach((t) => t.stop());
}

export function subscribeDeviceChanges(
  cb: (devices: DeviceLists) => void,
  debounceMs = 150,
): () => void {
  let timer: number | undefined;
  const handler = () => {
    if (timer) window.clearTimeout(timer);
    timer = window.setTimeout(async () => {
      try {
        cb(await listDevices());
      } catch (err) {
        console.warn("[audio-devices] enumerate failed", err);
      }
    }, debounceMs);
  };
  navigator.mediaDevices.addEventListener("devicechange", handler);
  return () => {
    if (timer) window.clearTimeout(timer);
    navigator.mediaDevices.removeEventListener("devicechange", handler);
  };
}

export function isSetSinkIdSupported(): boolean {
  const proto = (HTMLAudioElement?.prototype ?? {}) as any;
  return typeof proto.setSinkId === "function";
}

export async function applyOutputDevice(
  audioEl: HTMLAudioElement,
  deviceId: string,
): Promise<void> {
  const fn = (audioEl as any).setSinkId;
  if (typeof fn !== "function") {
    throw new Error("setSinkId unsupported in this browser. Use Chrome or Edge.");
  }
  await (audioEl as any).setSinkId(deviceId);
}
