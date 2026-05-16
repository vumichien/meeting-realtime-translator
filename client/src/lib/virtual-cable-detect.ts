// Pure function for detecting virtual cable audio devices.
// Extracted from audio-devices.ts classifyVirtualCable logic.
// Platform-aware: Windows uses VB-Cable/Voicemeeter, macOS uses BlackHole,
// Linux uses PipeWire virtual sinks.

const PATTERNS_BY_PLATFORM: Record<string, string[]> = {
  // Windows
  Win32: ["cable input", "cable output", "vb-audio", "voicemeeter input", "voicemeeter aux input"],
  // macOS
  MacIntel: ["blackhole"],
  MacArm: ["blackhole"],
  // Linux / all others
  Linux: ["meeting-translator", "monitor of meeting-translator"],
};

/** Needles that match on every platform */
const UNIVERSAL_NEEDLES = [
  "cable input",
  "cable output",
  "vb-audio",
  "voicemeeter",
  "blackhole",
  "meeting-translator",
  "monitor of meeting-translator",
];

/**
 * Returns true when the device label matches a known virtual-cable pattern.
 * `platform` should be `window.electron?.platform` (from Electron preload)
 * or `navigator.platform` as fallback.
 */
export function isVirtualCable(label: string, platform: string): boolean {
  const lower = label.toLowerCase();
  // Use platform-specific needles when available, otherwise universal set.
  const isWin = platform.startsWith("Win");
  const isMac = platform.startsWith("Mac") || platform === "darwin";
  const isLinux = platform === "Linux" || platform.toLowerCase().includes("linux");

  if (isWin) {
    return PATTERNS_BY_PLATFORM["Win32"].some((n) => lower.includes(n));
  }
  if (isMac) {
    return PATTERNS_BY_PLATFORM["MacIntel"].some((n) => lower.includes(n));
  }
  if (isLinux) {
    return PATTERNS_BY_PLATFORM["Linux"].some((n) => lower.includes(n));
  }
  // Unknown platform: fall back to universal set
  return UNIVERSAL_NEEDLES.some((n) => lower.includes(n));
}
