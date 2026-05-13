import type { ApiKeyProvider } from "../types";

const API_KEY_STORAGE_KEY = "mt.openai_key";

export function createApiKeyProvider(storage: Storage = localStorage): ApiKeyProvider {
  if (window.electron?.apiKey) {
    return createElectronApiKeyProvider(storage);
  }
  return createBrowserApiKeyProvider(storage);
}

function createBrowserApiKeyProvider(storage: Storage): ApiKeyProvider {
  return {
    async get() {
      return storage.getItem(API_KEY_STORAGE_KEY)?.trim() ?? "";
    },
    async set(apiKey) {
      storage.setItem(API_KEY_STORAGE_KEY, apiKey.trim());
    },
    async clear() {
      storage.removeItem(API_KEY_STORAGE_KEY);
    },
  };
}

function createElectronApiKeyProvider(storage: Storage): ApiKeyProvider {
  const apiKey = window.electron!.apiKey!;
  return {
    async get() {
      return (await apiKey.get()) ?? "";
    },
    async set(value) {
      const trimmed = value.trim();
      if (trimmed) await apiKey.set(trimmed);
      else await apiKey.clear();
    },
    async clear() {
      await apiKey.clear();
    },
    async migrateFromLocalStorage() {
      const legacy = storage.getItem(API_KEY_STORAGE_KEY)?.trim();
      if (!legacy) return;
      await apiKey.set(legacy);
      storage.removeItem(API_KEY_STORAGE_KEY);
    },
  };
}
