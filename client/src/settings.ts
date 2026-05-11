// Typed localStorage wrapper.
// Keys are namespaced with `mt.` prefix.

export interface SettingsStore {
  "mt.target_lang": string;
  "mt.mic_device_id": string;
  "mt.output_device_id": string;
  "mt.openai_key": string;
  "mt.transcribe_source": boolean;
  "mt.captions_flush_idle_ms": number;
  "mt.captions_flush_on_punctuation": boolean;
  "mt.debug_panel_open": boolean;
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
};

export interface Settings {
  get<K extends SettingsKey>(key: K): SettingsStore[K];
  set<K extends SettingsKey>(key: K, value: SettingsStore[K]): void;
  snapshot(): SettingsStore;
}

export function createSettings(storage: Storage = localStorage): Settings {
  function get<K extends SettingsKey>(key: K): SettingsStore[K] {
    const raw = storage.getItem(key);
    if (raw === null) return DEFAULT_SETTINGS[key];
    return decode(key, raw);
  }
  function set<K extends SettingsKey>(key: K, value: SettingsStore[K]): void {
    try {
      storage.setItem(key, encode(value));
    } catch (err) {
      console.warn("[settings] write failed", key, err);
    }
  }
  return {
    get,
    set,
    snapshot() {
      const out = { ...DEFAULT_SETTINGS };
      (Object.keys(DEFAULT_SETTINGS) as SettingsKey[]).forEach((k) => {
        (out as any)[k] = get(k);
      });
      return out;
    },
  };
}

function encode(value: unknown): string {
  if (typeof value === "string") return value;
  return JSON.stringify(value);
}

function decode<K extends SettingsKey>(key: K, raw: string): SettingsStore[K] {
  const def = DEFAULT_SETTINGS[key];
  if (typeof def === "string") return raw as SettingsStore[K];
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
