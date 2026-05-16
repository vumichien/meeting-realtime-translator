// Typed localStorage wrapper.
// Keys are namespaced with `mt.` prefix.
import type { MeetingProfile } from "./lib/meeting-profiles";

export interface SettingsStore {
  "mt.target_lang": string;
  "mt.mic_device_id": string;
  "mt.output_device_id": string;
  "mt.openai_key": string;
  "mt.transcribe_source": boolean;
  "mt.captions_flush_idle_ms": number;
  "mt.captions_flush_on_punctuation": boolean;
  "mt.debug_panel_open": boolean;
  // "auto" resolves at session start from device label; else explicit env.
  "mt.mic_env": "auto" | "headset" | "laptop" | "room";
  "mt.meeting_profiles": MeetingProfile[];
  "mt.active_profile_id": string;
  "mt.session_warning_minutes": number;
  "mt.session_auto_stop_minutes": number;
  "mt.show_cost_in_pill": boolean;
  // Multi-provider: 'openai' (default) or 'gemini' (phase 02+).
  "mt.active_provider": "openai" | "gemini";
  // Gemini-specific config (used only when active provider = gemini).
  "mt.gemini_auth_mode": "ai-studio" | "vertex";
  "mt.gemini_voice": "Aoede" | "Puck" | "Charon" | "Kore" | "Fenrir";
  "mt.gemini_api_key": string;
  "mt.gemini_service_account_json": string;
  "mt.gemini_project": string;
  "mt.gemini_region": string;
}

export type SettingsKey = keyof SettingsStore;

export const DEFAULT_SETTINGS: SettingsStore = {
  "mt.target_lang": "ja",
  "mt.mic_device_id": "",
  "mt.output_device_id": "",
  "mt.openai_key": "",
  "mt.transcribe_source": true,
  "mt.captions_flush_idle_ms": 1500,
  "mt.captions_flush_on_punctuation": true,
  "mt.debug_panel_open": false,
  "mt.mic_env": "auto",
  "mt.meeting_profiles": [],
  "mt.active_profile_id": "",
  "mt.session_warning_minutes": 30,
  "mt.session_auto_stop_minutes": 0,
  "mt.show_cost_in_pill": true,
  "mt.active_provider": "openai",
  "mt.gemini_auth_mode": "ai-studio",
  "mt.gemini_voice": "Aoede",
  "mt.gemini_api_key": "",
  "mt.gemini_service_account_json": "",
  "mt.gemini_project": "",
  "mt.gemini_region": "us-central1",
};

export interface Settings {
  get<K extends SettingsKey>(key: K): SettingsStore[K];
  set<K extends SettingsKey>(key: K, value: SettingsStore[K]): void;
  snapshot(): SettingsStore;
  /** Subscribe to any settings change. Returns an unsubscribe function. */
  subscribe(cb: () => void): () => void;
}

export function createSettings(storage: Storage = localStorage): Settings {
  const listeners = new Set<() => void>();

  function get<K extends SettingsKey>(key: K): SettingsStore[K] {
    const raw = storage.getItem(key);
    if (raw === null) return DEFAULT_SETTINGS[key];
    return decode(key, raw);
  }

  function computeSnapshot(): SettingsStore {
    const out = { ...DEFAULT_SETTINGS };
    (Object.keys(DEFAULT_SETTINGS) as SettingsKey[]).forEach((k) => {
      (out as any)[k] = get(k);
    });
    return out;
  }

  // Cache the snapshot so useSyncExternalStore sees stable object identity
  // between renders. Rebuilt only inside notify() after a real mutation.
  let cachedSnapshot: SettingsStore = computeSnapshot();

  function notify() {
    cachedSnapshot = computeSnapshot();
    listeners.forEach((cb) => cb());
  }

  function set<K extends SettingsKey>(key: K, value: SettingsStore[K]): void {
    try {
      storage.setItem(key, encode(value));
      notify();
    } catch (err) {
      console.warn("[settings] write failed", key, err);
    }
  }
  return {
    get,
    set,
    snapshot() {
      return cachedSnapshot;
    },
    subscribe(cb) {
      listeners.add(cb);
      return () => listeners.delete(cb);
    },
  };
}

function encode(value: unknown): string {
  if (typeof value === "string") return value;
  return JSON.stringify(value);
}

// Closed-union string settings: storage values are validated against the
// allowed set; anything else falls back to the default.
const STRING_UNIONS: Partial<Record<SettingsKey, readonly string[]>> = {
  "mt.mic_env": ["auto", "headset", "laptop", "room"],
  "mt.active_provider": ["openai", "gemini"],
  "mt.gemini_auth_mode": ["ai-studio", "vertex"],
  "mt.gemini_voice": ["Aoede", "Puck", "Charon", "Kore", "Fenrir"],
};

function decode<K extends SettingsKey>(key: K, raw: string): SettingsStore[K] {
  const def = DEFAULT_SETTINGS[key];
  if (typeof def === "string") {
    const allowed = STRING_UNIONS[key];
    if (allowed && !allowed.includes(raw)) return def as SettingsStore[K];
    return raw as SettingsStore[K];
  }
  if (typeof def === "boolean") {
    if (raw === "true") return true as SettingsStore[K];
    if (raw === "false") return false as SettingsStore[K];
    try {
      return Boolean(JSON.parse(raw)) as SettingsStore[K];
    } catch {
      return def;
    }
  }
  if (typeof def === "number") {
    const n = Number(raw);
    return (Number.isFinite(n) ? n : def) as SettingsStore[K];
  }
  try {
    return JSON.parse(raw) as SettingsStore[K];
  } catch {
    return def;
  }
}
