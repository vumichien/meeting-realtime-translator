import { app, ipcMain, Menu, shell } from "electron";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { registerApiKeyIpc } from "./ipc-api-key.js";
import { registerOnboardingIpc } from "./ipc-onboarding.js";
import { registerShellIpc } from "./ipc-shell.js";
import { registerSurfaceStyleIpc } from "./ipc-surface-style.js";
import { registerTelemetryIpc } from "./ipc-telemetry.js";
import { getOnboardingStatePath, readOnboardingState } from "./onboarding/state.js";
import { startHostedServer, type HostedServer } from "./server-host.js";
import { createSecureStore } from "./secure-store.js";
import { getTelemetryStatePath, TelemetryService } from "./telemetry.js";
import { createMainWindow, createOnboardingWindow, getPreloadPath } from "./window.js";

let hostedServer: HostedServer | null = null;
let ipcRegistered = false;
let windowIpcRegistered = false;
let telemetry: TelemetryService | null = null;

const outDir = dirname(fileURLToPath(import.meta.url));
const isDev = !app.isPackaged;
const devClientUrl = "http://localhost:5173";
const onboardingFile = join(outDir, "onboarding", "index.html");

async function boot() {
  registerIpcOnce();
  hostedServer = await startHostedServer(app.isPackaged);
  if (isDev) await waitForUrl(devClientUrl);
  await openOnboardingIfNeeded();
  installMenu();

  const mainWin = await createMainWindow({
    clientUrl: isDev ? devClientUrl : null,
    clientFile: isDev ? null : join(process.resourcesPath, "client", "dist", "index.html"),
    isDev,
    preloadPath: getPreloadPath(outDir),
    serverUrl: hostedServer.url,
  });

  // Register window-specific IPC handlers that need a BrowserWindow reference.
  // Guard with a flag so re-running boot() on macOS `activate` doesn't call
  // ipcMain.handle() twice (which throws "IPC handler already exists").
  if (!windowIpcRegistered) {
    windowIpcRegistered = true;
    registerSurfaceStyleIpc(mainWin);
    registerShellIpc();
  }
}

function registerIpcOnce() {
  if (ipcRegistered) return;
  ipcRegistered = true;
  const userDataPath = app.getPath("userData");
  registerApiKeyIpc(createSecureStore(userDataPath));
  registerOnboardingIpc(getOnboardingStatePath(userDataPath));
  telemetry = new TelemetryService(getTelemetryStatePath(userDataPath), process.env.TELEMETRY_ENDPOINT?.trim() || undefined);
  registerTelemetryIpc(telemetry);
  void telemetry.track("app.launched", { version: app.getVersion(), os: process.platform });
  ipcMain.handle("shell:open-external", async (_event, url: unknown) => {
    if (typeof url !== "string" || !/^https?:\/\//i.test(url)) return;
    await shell.openExternal(url);
  });
}

async function openOnboardingIfNeeded() {
  const state = await readOnboardingState(getOnboardingStatePath(app.getPath("userData")));
  if (state.completedAt && state.stepsDone.length >= 5) return;
  await openOnboardingWindow();
}

async function openOnboardingWindow() {
  const win = await createOnboardingWindow({
    isDev,
    onboardingFile,
    preloadPath: getPreloadPath(outDir),
    serverUrl: hostedServer?.url ?? "",
  });
  await new Promise<void>((resolve) => {
    win.once("closed", resolve);
  });
}

function installMenu() {
  const menu = Menu.buildFromTemplate([
    {
      label: "Help",
      submenu: [
        {
          label: "Run setup wizard again",
          click: () => {
            void openOnboardingWindow();
          },
        },
      ],
    },
  ]);
  Menu.setApplicationMenu(menu);
}

app.whenReady().then(() => {
  boot().catch((err) => {
    console.error("[desktop] failed to boot", err);
    app.quit();
  });
});

app.on("activate", () => {
  if (app.isReady() && !hostedServer) {
    void boot();
  }
});

app.on("before-quit", () => {
  hostedServer?.stop();
  hostedServer = null;
});

app.on("window-all-closed", () => {
  if (process.platform !== "darwin") app.quit();
});

async function waitForUrl(url: string) {
  const deadline = Date.now() + 30_000;
  while (Date.now() < deadline) {
    try {
      const response = await fetch(url);
      if (response.ok) return;
    } catch {
      // Vite may still be starting; keep Electron quiet until the page is ready.
    }
    await new Promise((resolve) => setTimeout(resolve, 500));
  }
  throw new Error(`Timed out waiting for ${url}`);
}
