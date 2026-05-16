const { contextBridge, ipcRenderer } = require("electron");

const SERVER_URL_PREFIX = "--server-url=";

const serverUrl =
  process.argv
    .find((arg) => arg.startsWith(SERVER_URL_PREFIX))
    ?.slice(SERVER_URL_PREFIX.length) ?? "";

contextBridge.exposeInMainWorld("electron", {
  serverUrl,
  appVersion: process.env.npm_package_version ?? "",
  apiKey: {
    get: () => ipcRenderer.invoke("apiKey:get"),
    set: (value) => ipcRenderer.invoke("apiKey:set", value),
    clear: () => ipcRenderer.invoke("apiKey:clear"),
  },
  keyring: {
    get: () => ipcRenderer.invoke("keyring:get"),
    set: (keyring) => ipcRenderer.invoke("keyring:set", keyring),
    clear: () => ipcRenderer.invoke("keyring:clear"),
  },
  onboarding: {
    getState: () => ipcRenderer.invoke("onboarding:get-state"),
    completeStep: (step) => ipcRenderer.invoke("onboarding:complete-step", step),
    finish: () => ipcRenderer.invoke("onboarding:finish"),
  },
  platform: process.platform,
  setSurfaceStyle: (style) => ipcRenderer.invoke("set-surface-style", style),
  session: {
    testMint: async (apiKey) => {
      try {
        const response = await fetch(`${serverUrl}/session`, {
          method: "POST",
          headers: {
            Authorization: `Bearer ${apiKey}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ targetLanguage: "ja", transcribeSource: false }),
        });
        if (response.ok) return { ok: true, message: "ok" };
        const body = await response.json().catch(() => ({}));
        return { ok: false, message: body.message ?? body.error ?? `HTTP ${response.status}` };
      } catch (err) {
        return { ok: false, message: err instanceof Error ? err.message : "Validation failed" };
      }
    },
  },
  shell: {
    openExternal: (url) => ipcRenderer.invoke("shell:open-external", url),
    openLogsFolder: () => ipcRenderer.invoke("shell:open-logs-folder"),
  },
  telemetry: {
    getConsent: () => ipcRenderer.invoke("telemetry:get-consent"),
    setConsent: (consent) => ipcRenderer.invoke("telemetry:set-consent", consent),
    deleteData: () => ipcRenderer.invoke("telemetry:delete-data"),
    track: (name, properties) => ipcRenderer.invoke("telemetry:track", name, properties ?? {}),
  },
});
