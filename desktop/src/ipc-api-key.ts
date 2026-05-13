import { app, ipcMain } from "electron";
import type { SecureStore } from "./secure-store.js";

const CHANNELS = {
  get: "apiKey:get",
  set: "apiKey:set",
  clear: "apiKey:clear",
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
}
