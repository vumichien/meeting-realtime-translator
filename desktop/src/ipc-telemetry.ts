import { ipcMain } from "electron";
import type { TelemetryEventName, TelemetryService } from "./telemetry.js";

export function registerTelemetryIpc(telemetry: TelemetryService) {
  ipcMain.handle("telemetry:get-consent", () => telemetry.getConsent());
  ipcMain.handle("telemetry:set-consent", (_event, consent: unknown) => {
    if (typeof consent !== "boolean") throw new Error("Consent must be boolean.");
    return telemetry.setConsent(consent);
  });
  ipcMain.handle("telemetry:delete-data", () => telemetry.deleteLocalData());
  ipcMain.handle("telemetry:track", (_event, name: unknown, properties: unknown) => {
    if (typeof name !== "string") return;
    return telemetry.track(name as TelemetryEventName, isRecord(properties) ? properties : {});
  });
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}
