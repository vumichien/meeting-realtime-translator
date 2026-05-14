import { safeStorage } from "electron";
import { mkdir, readFile, rm, writeFile } from "node:fs/promises";
import { dirname, join } from "node:path";

const KEY_FILE = "api-key.enc"; // v1: single OpenAI key string
const KEYRING_FILE = "keyring.v2.enc"; // v2: typed JSON object

export interface ProviderKeyring {
  openai?: string;
  gemini?:
    | { authMode: "ai-studio"; apiKey: string }
    | {
        authMode: "vertex";
        serviceAccountJson: string;
        project: string;
        region: string;
      };
}

export interface SecureStore {
  // Legacy single-key surface (preserved for v0.1 IPC compatibility).
  getApiKey(): Promise<string | null>;
  setApiKey(apiKey: string): Promise<void>;
  clearApiKey(): Promise<void>;
  // v2 keyring surface (phase 07).
  getKeyring(): Promise<ProviderKeyring>;
  setKeyring(keyring: ProviderKeyring): Promise<void>;
  clearKeyring(): Promise<void>;
  encryptionAvailable(): boolean;
}

export function createSecureStore(userDataPath: string): SecureStore {
  const keyPath = join(userDataPath, KEY_FILE);
  const keyringPath = join(userDataPath, KEYRING_FILE);

  async function readDecrypted(path: string): Promise<string | null> {
    try {
      const data = await readFile(path);
      if (safeStorage.isEncryptionAvailable()) {
        return safeStorage.decryptString(data).trim() || null;
      }
      return data.toString("utf8").trim() || null;
    } catch {
      return null;
    }
  }

  async function writeEncrypted(path: string, plain: string): Promise<void> {
    await mkdir(dirname(path), { recursive: true });
    if (!plain) {
      await rm(path, { force: true });
      return;
    }
    const data = safeStorage.isEncryptionAvailable()
      ? safeStorage.encryptString(plain)
      : Buffer.from(plain, "utf8");
    await writeFile(path, data, { mode: 0o600 });
  }

  async function migrateIfNeeded(): Promise<void> {
    const v2 = await readDecrypted(keyringPath);
    if (v2) return;
    const v1 = await readDecrypted(keyPath);
    if (!v1) return;
    // Write v2 first; only delete v1 after confirming v2 round-trip.
    const next: ProviderKeyring = { openai: v1 };
    try {
      await writeEncrypted(keyringPath, JSON.stringify(next));
      const check = await readDecrypted(keyringPath);
      if (check) {
        // Leave v1 in place as a fallback for one boot cycle.
      }
    } catch (err) {
      console.warn("[secure-store] v1→v2 migration failed", err);
    }
  }

  return {
    async getApiKey() {
      // Prefer v2 OpenAI key; fall back to v1 for unmigrated installs.
      const ring = await this.getKeyring();
      if (ring.openai) return ring.openai;
      return readDecrypted(keyPath);
    },
    async setApiKey(apiKey) {
      const ring = await this.getKeyring();
      const next: ProviderKeyring = { ...ring, openai: apiKey.trim() || undefined };
      await writeEncrypted(keyringPath, JSON.stringify(next));
    },
    async clearApiKey() {
      const ring = await this.getKeyring();
      delete ring.openai;
      await writeEncrypted(keyringPath, JSON.stringify(ring));
    },
    async getKeyring() {
      await migrateIfNeeded();
      const raw = await readDecrypted(keyringPath);
      if (!raw) return {};
      try {
        return JSON.parse(raw) as ProviderKeyring;
      } catch {
        return {};
      }
    },
    async setKeyring(next) {
      await writeEncrypted(keyringPath, JSON.stringify(next));
    },
    async clearKeyring() {
      await rm(keyringPath, { force: true });
      await rm(keyPath, { force: true });
    },
    encryptionAvailable() {
      return safeStorage.isEncryptionAvailable();
    },
  };
}
