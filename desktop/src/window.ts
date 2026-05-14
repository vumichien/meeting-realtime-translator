import { BrowserWindow, session } from "electron";
import { join } from "node:path";

export interface MainWindowOptions {
  readonly clientUrl: string | null;
  readonly clientFile: string | null;
  readonly isDev: boolean;
  readonly preloadPath: string;
  readonly serverUrl: string;
}

export async function createMainWindow(options: MainWindowOptions): Promise<BrowserWindow> {
  session.defaultSession.setPermissionRequestHandler((_webContents, permission, callback) => {
    callback(permission === "media");
  });

  applyContentSecurityPolicy(options.serverUrl);

  const win = new BrowserWindow({
    width: 1180,
    height: 820,
    minWidth: 920,
    minHeight: 680,
    title: "Babel Mic",
    webPreferences: {
      additionalArguments: [`--server-url=${options.serverUrl}`],
      contextIsolation: true,
      nodeIntegration: false,
      preload: options.preloadPath,
    },
  });

  if (options.clientUrl) {
    await win.loadURL(options.clientUrl);
  } else if (options.clientFile) {
    await win.loadFile(options.clientFile);
  } else {
    throw new Error("No client target configured for Electron window.");
  }

  if (options.isDev) {
    win.webContents.openDevTools({ mode: "detach" });
  }

  return win;
}

export async function createOnboardingWindow(options: {
  readonly isDev: boolean;
  readonly preloadPath: string;
  readonly serverUrl: string;
  readonly onboardingFile: string;
}): Promise<BrowserWindow> {
  const win = new BrowserWindow({
    width: 860,
    height: 720,
    resizable: true,
    title: "Babel Mic Setup",
    webPreferences: {
      additionalArguments: [`--server-url=${options.serverUrl}`],
      contextIsolation: true,
      nodeIntegration: false,
      preload: options.preloadPath,
    },
  });
  win.setMenuBarVisibility(false);
  await win.loadFile(options.onboardingFile);
  if (options.isDev) win.webContents.openDevTools({ mode: "detach" });
  return win;
}

export function getPreloadPath(outDir: string): string {
  return join(outDir, "preload.cjs");
}

let cspApplied = false;
function applyContentSecurityPolicy(serverUrl: string): void {
  if (cspApplied) return;
  cspApplied = true;
  const connectSrc = [
    "'self'",
    serverUrl,
    "https://api.openai.com",
    "wss://api.openai.com",
    "https://generativelanguage.googleapis.com",
    "wss://generativelanguage.googleapis.com",
    "https://*.aiplatform.googleapis.com",
    "wss://*.aiplatform.googleapis.com",
  ]
    .filter(Boolean)
    .join(" ");
  const directives = [
    "default-src 'self'",
    "script-src 'self'",
    "style-src 'self' 'unsafe-inline'",
    "img-src 'self' data: blob:",
    "media-src 'self' blob: mediastream:",
    `connect-src ${connectSrc}`,
    "font-src 'self' data:",
  ].join("; ");
  session.defaultSession.webRequest.onHeadersReceived((details, callback) => {
    const headers = { ...details.responseHeaders };
    headers["Content-Security-Policy"] = [directives];
    callback({ responseHeaders: headers });
  });
}
