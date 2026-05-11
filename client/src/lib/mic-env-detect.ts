// Auto-detect mic environment from a MediaDeviceInfo label.
// Used to choose browser getUserMedia constraints + server-side noise_reduction.

export const MIC_ENVS = ["headset", "laptop", "room"] as const;
export type MicEnv = (typeof MIC_ENVS)[number];

export const MIC_ENV_SETTING = ["auto", ...MIC_ENVS] as const;
export type MicEnvSetting = (typeof MIC_ENV_SETTING)[number];

// Close-talking mic indicators. Avoid prefixes that overlap with room/webcam
// devices (e.g. `poly` would match `polycom`; `logitech h` would match
// `logitech hd webcam`). Use word boundaries or unambiguous tokens only.
const HEADSET_KEYWORDS = [
  "headset",
  "headphone",
  "earbud",
  "earphone",
  "airpod",
  "buds",
  "jabra evolve",
  "jabra elite",
  "plantronics",
  "logitech zone",
  "bose qc",
  "bose 700",
  "sony wh-",
  "sony wf-",
  "anker soundcore",
  "shokz",
  "aftershokz",
];

// Far-field / room conference device indicators.
const ROOM_KEYWORDS = [
  "conference",
  "meeting owl",
  "jabra speak",
  "jabra panacast",
  "polycom",
  "yamaha yvc",
  "anker powerconf",
  "logitech meetup",
  "logitech rally",
];

export function detectMicEnv(label: string | null | undefined): MicEnv {
  if (!label) return "laptop";
  const l = label.toLowerCase();
  // ROOM first: "polycom" must not be misclassified by an accidental
  // headset-keyword substring match.
  if (ROOM_KEYWORDS.some((k) => l.includes(k))) return "room";
  if (HEADSET_KEYWORDS.some((k) => l.includes(k))) return "headset";
  return "laptop";
}

export function isMicEnvSetting(value: unknown): value is MicEnvSetting {
  return (
    typeof value === "string" &&
    (MIC_ENV_SETTING as readonly string[]).includes(value)
  );
}

// Browser getUserMedia constraints per env.
// Headset: kill browser DSP entirely; close mic + model NR handles the rest.
// Laptop / Room: keep AGC because built-in mics often have unstable gain.
// Echo cancellation off for headsets (user is on closed-back); on otherwise.
export interface MicConstraints {
  echoCancellation: boolean;
  noiseSuppression: boolean;
  autoGainControl: boolean;
}

export function micConstraintsFor(env: MicEnv): MicConstraints {
  if (env === "headset") {
    return { echoCancellation: false, noiseSuppression: false, autoGainControl: false };
  }
  return { echoCancellation: true, noiseSuppression: false, autoGainControl: true };
}
