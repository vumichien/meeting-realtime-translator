import { applyOutputDevice } from "../audio-devices";
import type { createCaptionsView } from "../captions";
import type { createDebugPanel } from "../debug-panel";
import type { createTranscriptStore } from "./transcript-store";
import type { createSessionGuardrails } from "../ui/session-guardrails";
import type { createControls } from "../ui/controls";
import type { createStatusBar } from "../ui/status";
import { getProvider } from "../providers/registry";
import type { ProviderId } from "../providers/types";
import type { ApiKeyProvider, SessionHandle, SessionIssue } from "../types";
import type { Settings } from "../settings";
import { classifySessionError, makeSessionIssue } from "./session-error-messages";

type Captions = ReturnType<typeof createCaptionsView>;
type DebugPanel = ReturnType<typeof createDebugPanel>;
type Transcript = ReturnType<typeof createTranscriptStore>;
type Guardrails = ReturnType<typeof createSessionGuardrails>;
type Controls = ReturnType<typeof createControls>;
type Status = ReturnType<typeof createStatusBar>;

export interface SessionController {
  start(): Promise<void>;
  stop(endReason?: "user" | "error"): void;
  applyOutputDevice(deviceId: string): void;
  durationMs(): number;
}

export function createSessionController(args: {
  settings: Settings;
  apiKeyProvider: ApiKeyProvider;
  captions: Captions;
  transcript: Transcript;
  debug: DebugPanel;
  controls: Controls;
  status: Status;
  guardrails: Guardrails;
  setupDoctorRun: () => Promise<void>;
  getDeviceIds: () => { micDeviceId: string; outputDeviceId: string };
}): SessionController {
  let currentHandle: SessionHandle | null = null;
  let sessionStartedAt = 0;

  async function start() {
    if (currentHandle) return;
    args.status.clearError();
    args.captions.clear();
    args.transcript.beginSession(args.settings.get("mt.target_lang"));
    args.debug.reset();
    args.controls.setBusy(true);
    args.status.setStatus("connecting");
    try {
      const ids = args.getDeviceIds();
      const providerId = (args.settings.get("mt.active_provider") as ProviderId | undefined) ?? "openai";
      const provider = await getProvider(providerId);
      const providerConfig = buildProviderConfig(providerId, args.settings);
      const handle = await provider.startSession({
        targetLanguage: args.settings.get("mt.target_lang"),
        micDeviceId: ids.micDeviceId || undefined,
        outputDeviceId: ids.outputDeviceId || undefined,
        apiKey: (await args.apiKeyProvider.get()) || undefined,
        transcribeSource: args.settings.get("mt.transcribe_source"),
        micEnv: args.settings.get("mt.mic_env"),
        providerConfig,
        onEvent: (e) => args.captions.push(e),
        onRawEvent: (raw, ts) => args.debug.recordEvent(raw, ts),
        onStateChange: (snapshot) => {
          args.debug.recordState(snapshot);
          if (snapshot.connectionState === "connected") args.status.setStatus("connected");
          else if (snapshot.connectionState === "failed") {
            args.status.setStatus("failed");
            reportIssue(makeSessionIssue("webrtc_failed"));
            stop("error");
          } else if (snapshot.connectionState === "closed") args.status.setStatus("closed");
          else if (snapshot.connectionState === "connecting") args.status.setStatus("connecting");
        },
        onRecoverableIssue: reportIssue,
        onError: (err) => args.status.showError(err.message),
      });
      currentHandle = handle;
      sessionStartedAt = Date.now();
      void window.electron?.telemetry?.track("session.started", {
        target_lang: args.settings.get("mt.target_lang"),
      });
      args.debug.bindSession(handle);
      args.guardrails.start({
        startedAt: sessionStartedAt,
        sourceCaptionsEnabled: args.settings.get("mt.transcribe_source"),
        onWarning: (message) => args.status.showError(message),
        onAutoStop: () => {
          args.status.showError("Auto-stop guardrail reached. Session stopped.", { sticky: true });
          stop("user");
        },
      });
      args.controls.setRunning(true);
      args.controls.setBusy(false);
    } catch (err) {
      args.controls.setBusy(false);
      args.controls.setRunning(false);
      args.status.setStatus("failed");
      reportIssue(classifySessionError(err));
      void window.electron?.telemetry?.track("error.session", {
        error_class: err instanceof Error ? err.name : "UnknownError",
      });
    }
  }

  function reportIssue(issue: SessionIssue) {
    args.debug.recordIssue(issue);
    args.status.showIssue(issue, {
      onRetry: () => void start(),
      onSetup: () => void args.setupDoctorRun(),
    });
  }

  function stop(endReason: "user" | "error" = "user") {
    currentHandle?.stop();
    if (currentHandle && sessionStartedAt) {
      void window.electron?.telemetry?.track("session.ended", {
        duration_ms: Date.now() - sessionStartedAt,
        end_reason: endReason,
      });
    }
    currentHandle = null;
    sessionStartedAt = 0;
    args.transcript.endSession();
    args.guardrails.stop();
    args.debug.unbindSession();
    args.controls.setRunning(false);
    args.status.setStatus("idle");
  }

  return {
    start,
    stop,
    applyOutputDevice(deviceId) {
      if (!currentHandle) return;
      applyOutputDevice(currentHandle.audioElement, deviceId).catch((err) =>
        reportIssue(classifySessionError(err)),
      );
    },
    durationMs: () => sessionStartedAt ? Date.now() - sessionStartedAt : 0,
  };
}

function buildProviderConfig(
  id: ProviderId,
  settings: Settings,
): Record<string, unknown> | undefined {
  if (id !== "gemini") return undefined;
  const authMode = settings.get("mt.gemini_auth_mode");
  return {
    authMode,
    voice: settings.get("mt.gemini_voice"),
    apiKey: settings.get("mt.gemini_api_key") || undefined,
    serviceAccountJson:
      authMode === "vertex"
        ? settings.get("mt.gemini_service_account_json") || undefined
        : undefined,
    project: settings.get("mt.gemini_project") || undefined,
    region: settings.get("mt.gemini_region") || undefined,
  };
}
