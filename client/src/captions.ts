// React-friendly caption store. Replaces the legacy DOM-bound createCaptionsView
// (removed in Phase 3; old consumers in app.ts are excluded from typecheck in Phase 3
// and will be deleted entirely in Phase 8).
//
// The store is intentionally free of DOM/React imports so it can be unit-tested
// in isolation. React hooks in src/hooks/use-captions.ts read it via
// useSyncExternalStore.

export interface CaptionEntry {
  id: string;
  text: string;
  final: boolean;
  ts: number;
}

export interface CaptionSnapshot {
  source: CaptionEntry[];
  translation: CaptionEntry[];
}

export interface CaptionStore {
  subscribe(cb: () => void): () => void;
  snapshot(): CaptionSnapshot;
  appendSource(entry: CaptionEntry): void;
  appendTranslation(entry: CaptionEntry): void;
  updateSource(id: string, patch: Partial<CaptionEntry>): void;
  updateTranslation(id: string, patch: Partial<CaptionEntry>): void;
  clear(): void;
}

const MAX_ENTRIES = 200;

export function createCaptionStore(): CaptionStore {
  let source: CaptionEntry[] = [];
  let translation: CaptionEntry[] = [];
  const listeners = new Set<() => void>();

  function pruned(arr: CaptionEntry[]): CaptionEntry[] {
    return arr.length > MAX_ENTRIES ? arr.slice(-MAX_ENTRIES) : arr;
  }

  // Cached snapshot — rebuilt only after mutations to keep stable object
  // identity for useSyncExternalStore (avoids React tearing warnings).
  let cachedSnapshot: CaptionSnapshot = { source: [], translation: [] };

  function notify() {
    cachedSnapshot = { source: [...source], translation: [...translation] };
    listeners.forEach((cb) => cb());
  }

  return {
    subscribe(cb) {
      listeners.add(cb);
      return () => listeners.delete(cb);
    },

    snapshot(): CaptionSnapshot {
      return cachedSnapshot;
    },

    appendSource(entry) {
      source = pruned([...source, entry]);
      notify();
    },

    appendTranslation(entry) {
      translation = pruned([...translation, entry]);
      notify();
    },

    updateSource(id, patch) {
      source = source.map((e) => (e.id === id ? { ...e, ...patch } : e));
      notify();
    },

    updateTranslation(id, patch) {
      translation = translation.map((e) => (e.id === id ? { ...e, ...patch } : e));
      notify();
    },

    clear() {
      source = [];
      translation = [];
      notify();
    },
  };
}
