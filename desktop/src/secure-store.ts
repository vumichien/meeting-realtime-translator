import { safeStorage } from "electron";
import { mkdir, readFile, rm, writeFile } from "node:fs/promises";
import { dirname, join } from "node:path";

const KEY_FILE = "api-key.enc";

export interface SecureStore {
  getApiKey(): Promise<string | null>;
  setApiKey(apiKey: string): Promise<void>;
  clearApiKey(): Promise<void>;
  encryptionAvailable(): boolean;
}

export function createSecureStore(userDataPath: string): SecureStore {
  const keyPath = join(userDataPath, KEY_FILE);

  return {
    async getApiKey() {
      try {
        const data = await readFile(keyPath);
        if (safeStorage.isEncryptionAvailable()) {
          return safeStorage.decryptString(data).trim() || null;
        }
        return data.toString("utf8").trim() || null;
      } catch {
        return null;
      }
    },
    async setApiKey(apiKey) {
      const trimmed = apiKey.trim();
      await mkdir(dirname(keyPath), { recursive: true });
      if (!trimmed) {
        await this.clearApiKey();
        return;
      }
      const data = safeStorage.isEncryptionAvailable()
        ? safeStorage.encryptString(trimmed)
        : Buffer.from(trimmed, "utf8");
      await writeFile(keyPath, data, { mode: 0o600 });
    },
    async clearApiKey() {
      await rm(keyPath, { force: true });
    },
    encryptionAvailable() {
      return safeStorage.isEncryptionAvailable();
    },
  };
}
