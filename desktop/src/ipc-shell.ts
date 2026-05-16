// ipc-shell.ts — IPC handlers for shell operations (file system, OS integration).
// Note: shell:open-external is registered inline in main.ts (already present).
// This module only registers channels not covered there.

import { app, ipcMain, shell } from "electron";

/**
 * Register shell IPC handlers that are not covered by main.ts inline handlers.
 * Currently: shell:open-logs-folder
 */
export function registerShellIpc(): void {
  // Opens the Electron log directory in the OS file manager.
  ipcMain.handle("shell:open-logs-folder", () =>
    shell.openPath(app.getPath("logs")),
  );
}
