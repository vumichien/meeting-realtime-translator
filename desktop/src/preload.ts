import { contextBridge, ipcRenderer } from "electron";

const SERVER_URL_PREFIX = "--server-url=";

const serverUrl =
  process.argv
    .find((arg) => arg.startsWith(SERVER_URL_PREFIX))
    ?.slice(SERVER_URL_PREFIX.length) ?? "";

contextBridge.exposeInMainWorld("electron", {
  serverUrl,
  apiKey: {
    get: () => ipcRenderer.invoke("apiKey:get") as Promise<string | null>,
    set: (value: string) => ipcRenderer.invoke("apiKey:set", value) as Promise<void>,
    clear: () => ipcRenderer.invoke("apiKey:clear") as Promise<void>,
  },
  onboarding: {
    getState: () => ipcRenderer.invoke("onboarding:get-state"),
    completeStep: (step: number) => ipcRenderer.invoke("onboarding:complete-step", step),
    finish: () => ipcRenderer.invoke("onboarding:finish"),
  },
  platform: process.platform,
  session: {
    testMint: async (apiKey: string) => {
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
    openExternal: (url: string) => ipcRenderer.invoke("shell:open-external", url) as Promise<void>,
  },
  telemetry: {
    getConsent: () => ipcRenderer.invoke("telemetry:get-consent") as Promise<boolean | null>,
    setConsent: (consent: boolean) => ipcRenderer.invoke("telemetry:set-consent", consent) as Promise<void>,
    deleteData: () => ipcRenderer.invoke("telemetry:delete-data") as Promise<void>,
    track: (name: string, properties?: Record<string, unknown>) =>
      ipcRenderer.invoke("telemetry:track", name, properties ?? {}) as Promise<void>,
  },
});
