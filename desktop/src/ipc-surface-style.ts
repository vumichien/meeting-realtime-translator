// ipc-surface-style.ts — IPC handler for native window vibrancy / Mica toggling.
// macOS: win.setVibrancy('sidebar' | null)
// Windows 11 22H2+: win.setBackgroundMaterial('mica' | 'none')
// Linux: no-op (CSS handles translucency via backdrop-filter)

import { ipcMain, BrowserWindow } from "electron";

/**
 * Register the 'set-surface-style' IPC handler.
 * Must be called after the BrowserWindow is created and passed as `win`.
 */
export function registerSurfaceStyleIpc(win: BrowserWindow): void {
  ipcMain.handle(
    "set-surface-style",
    (_e, style: "solid" | "translucent"): { ok: boolean; platform: string } => {
      if (process.platform === "darwin") {
        win.setVibrancy(style === "translucent" ? "sidebar" : null);
      } else if (process.platform === "win32") {
        win.setBackgroundMaterial(style === "translucent" ? "mica" : "none");
      }
      // Linux: no-op — CSS-only translucency via compositor
      return { ok: true, platform: process.platform };
    },
  );
}
