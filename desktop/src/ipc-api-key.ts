import { app, ipcMain } from "electron";
import type { ProviderKeyring, SecureStore } from "./secure-store.js";

const CHANNELS = {
  get: "apiKey:get",
  set: "apiKey:set",
  clear: "apiKey:clear",
  keyringGet: "keyring:get",
  keyringSet: "keyring:set",
  keyringClear: "keyring:clear",
} as const;

export function registerApiKeyIpc(store: SecureStore) {
  ipcMain.handle(CHANNELS.get, async () => {
    if (!app.isPackaged && process.env.OPENAI_API_KEY?.trim()) return null;
    return store.getApiKey();
  });

  ipcMain.handle(CHANNELS.set, async (_event, apiKey: unknown) => {
    if (typeof apiKey !== "string") throw new Error("API key must be a string.");
    await store.setApiKey(apiKey);
  });

  ipcMain.handle(CHANNELS.clear, async () => {
    await store.clearApiKey();
  });

  ipcMain.handle(CHANNELS.keyringGet, async () => {
    return store.getKeyring();
  });

  ipcMain.handle(CHANNELS.keyringSet, async (_event, keyring: unknown) => {
    if (!keyring || typeof keyring !== "object") {
      throw new Error("Keyring must be an object.");
    }
    await store.setKeyring(keyring as ProviderKeyring);
  });

  ipcMain.handle(CHANNELS.keyringClear, async () => {
    await store.clearKeyring();
  });
}
