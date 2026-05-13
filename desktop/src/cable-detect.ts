export type CableVendor = "vb-cable" | "blackhole" | "pipewire" | "none";

export interface CableDetectionResult {
  detected: boolean;
  vendor: CableVendor;
  deviceId?: string;
  label?: string;
}

const VENDOR_PATTERNS: { vendor: Exclude<CableVendor, "none">; patterns: RegExp[] }[] = [
  { vendor: "vb-cable", patterns: [/cable input/i, /cable output/i, /vb-audio/i] },
  { vendor: "blackhole", patterns: [/blackhole/i] },
  { vendor: "pipewire", patterns: [/pipewire/i, /null-?sink/i, /virtual.*cable/i] },
];

export async function detectVirtualCable(): Promise<CableDetectionResult> {
  const devices = await navigator.mediaDevices.enumerateDevices();
  for (const device of devices) {
    if (device.kind !== "audiooutput" && device.kind !== "audioinput") continue;
    const label = device.label || "";
    const match = VENDOR_PATTERNS.find(({ patterns }) => patterns.some((pattern) => pattern.test(label)));
    if (match) {
      return {
        detected: true,
        vendor: match.vendor,
        deviceId: device.deviceId,
        label,
      };
    }
  }
  return { detected: false, vendor: "none" };
}
