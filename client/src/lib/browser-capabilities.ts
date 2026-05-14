import { isSetSinkIdSupported } from "../audio-devices";

export type BrowserFamily = "chrome" | "edge" | "firefox" | "safari" | "unknown";

export interface BrowserCapabilitySummary {
  family: BrowserFamily;
  label: string;
  setSinkId: boolean;
  routingStatus: "supported" | "unvalidated" | "unavailable";
}

export function getBrowserCapabilities(userAgent = navigator.userAgent): BrowserCapabilitySummary {
  const family = detectBrowserFamily(userAgent);
  const setSinkId = isSetSinkIdSupported();
  const routingStatus =
    family === "chrome" || family === "edge"
      ? setSinkId ? "supported" : "unavailable"
      : setSinkId ? "unvalidated" : "unavailable";
  return {
    family,
    label: browserLabel(family),
    setSinkId,
    routingStatus,
  };
}

function detectBrowserFamily(ua: string): BrowserFamily {
  if (/Edg\//.test(ua)) return "edge";
  if (/Chrome\//.test(ua) && !/Chromium\//.test(ua)) return "chrome";
  if (/Firefox\//.test(ua)) return "firefox";
  if (/Safari\//.test(ua) && !/Chrome\//.test(ua)) return "safari";
  return "unknown";
}

function browserLabel(family: BrowserFamily): string {
  if (family === "chrome") return "Chrome";
  if (family === "edge") return "Edge";
  if (family === "firefox") return "Firefox";
  if (family === "safari") return "Safari";
  return "Unknown browser";
}
