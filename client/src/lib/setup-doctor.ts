import {
  applyOutputDevice,
  listDevices,
  type DeviceLists,
} from "../audio-devices";
import { getBrowserCapabilities } from "./browser-capabilities";
import { sampleMicSignal } from "./vu-meter";

export type SetupDoctorStatus = "ready" | "action" | "unknown";

export interface SetupDoctorCheck {
  id: string;
  label: string;
  status: SetupDoctorStatus;
  detail: string;
}

export interface SetupDoctorResult {
  generatedAt: string;
  overall: SetupDoctorStatus;
  checks: SetupDoctorCheck[];
  deviceSummary: {
    inputCount: number;
    outputCount: number;
    selectedOutputVirtualCable: string | null;
  };
}

export interface SetupDoctorOptions {
  micDeviceId: string;
  outputDeviceId: string;
}

export async function runSetupDoctor(
  opts: SetupDoctorOptions,
): Promise<SetupDoctorResult> {
  const checks: SetupDoctorCheck[] = [];
  const browser = getBrowserCapabilities();
  const devices = await safeListDevices(checks);

  checks.push({
    id: "browser-routing",
    label: "Browser output routing",
    status: browser.routingStatus === "supported" ? "ready" : browser.routingStatus === "unvalidated" ? "unknown" : "action",
    detail:
      browser.routingStatus === "supported"
        ? `${browser.label} can route audio outputs.`
        : browser.routingStatus === "unvalidated"
          ? `${browser.label} exposes routing APIs, but virtual cable routing is not validated.`
          : "Use Chrome or Edge for virtual cable output routing.",
  });

  const mic = devices.inputs.find((d) => d.deviceId === opts.micDeviceId);
  checks.push({
    id: "mic-selected",
    label: "Source mic selected",
    status: mic ? "ready" : "action",
    detail: mic ? "Source mic is available." : "Pick your real microphone.",
  });
  await addMicSignalCheck(checks, opts.micDeviceId);

  const output = devices.outputs.find((d) => d.deviceId === opts.outputDeviceId);
  checks.push({
    id: "output-selected",
    label: "Babel Mic output selected",
    status: output ? "ready" : "action",
    detail: output ? "Output device is available." : "Pick the virtual cable playback side.",
  });
  checks.push({
    id: "virtual-cable",
    label: "Virtual cable-like output",
    status: output?.virtualCable ? "ready" : output ? "unknown" : "action",
    detail: output?.virtualCable
      ? `Output looks like ${output.virtualCable}.`
      : output
        ? "Output is selected, but its label does not look like a known virtual cable."
        : "Install or reconnect VB-CABLE, BlackHole, PipeWire, or VoiceMeeter.",
  });
  await addOutputRoutingCheck(checks, opts.outputDeviceId);

  checks.push({
    id: "meeting-reminder",
    label: "Meeting app reminder",
    status: output ? "ready" : "unknown",
    detail: "Set Zoom or Meet microphone to the cable recording side, not your real mic.",
  });

  return {
    generatedAt: new Date().toISOString(),
    overall: summarize(checks),
    checks,
    deviceSummary: {
      inputCount: devices.inputs.length,
      outputCount: devices.outputs.length,
      selectedOutputVirtualCable: output?.virtualCable ?? null,
    },
  };
}

async function safeListDevices(checks: SetupDoctorCheck[]): Promise<DeviceLists> {
  try {
    return await listDevices();
  } catch (err) {
    checks.push({
      id: "device-enumeration",
      label: "Device list",
      status: "action",
      detail: err instanceof Error ? err.message : "Could not list audio devices.",
    });
    return { inputs: [], outputs: [] };
  }
}

async function addMicSignalCheck(checks: SetupDoctorCheck[], micDeviceId: string) {
  if (!micDeviceId) {
    checks.push({ id: "mic-signal", label: "Mic signal", status: "action", detail: "Pick a mic before checking signal." });
    return;
  }
  let stream: MediaStream | null = null;
  try {
    stream = await navigator.mediaDevices.getUserMedia({ audio: { deviceId: { exact: micDeviceId } } });
    const track = stream.getAudioTracks()[0];
    const result = track ? await sampleMicSignal(track) : null;
    checks.push({
      id: "mic-signal",
      label: "Mic signal",
      status: result?.hasSignal ? "ready" : "unknown",
      detail: result?.hasSignal ? "Mic activity detected." : "No clear mic activity detected in the short sample.",
    });
  } catch (err) {
    checks.push({
      id: "mic-signal",
      label: "Mic signal",
      status: "action",
      detail: err instanceof Error ? err.message : "Mic permission or capture failed.",
    });
  } finally {
    stream?.getTracks().forEach((track) => track.stop());
  }
}

async function addOutputRoutingCheck(checks: SetupDoctorCheck[], outputDeviceId: string) {
  if (!outputDeviceId) {
    checks.push({ id: "output-routing", label: "Selected output routing", status: "action", detail: "Pick an output before checking routing." });
    return;
  }
  const audio = document.createElement("audio");
  try {
    await applyOutputDevice(audio, outputDeviceId);
    checks.push({ id: "output-routing", label: "Selected output routing", status: "ready", detail: "Silent routing check passed." });
  } catch (err) {
    checks.push({
      id: "output-routing",
      label: "Selected output routing",
      status: "action",
      detail: err instanceof Error ? err.message : "Output routing check failed.",
    });
  }
}

function summarize(checks: SetupDoctorCheck[]): SetupDoctorStatus {
  if (checks.some((check) => check.status === "action")) return "action";
  if (checks.some((check) => check.status === "unknown")) return "unknown";
  return "ready";
}
