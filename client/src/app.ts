import { createSettings } from "./settings";
import {
  ensureMicPermission,
  isSetSinkIdSupported,
} from "./audio-devices";
import { createDevicePickers } from "./ui/device-pickers";
import { createControls } from "./ui/controls";
import { createStatusBar } from "./ui/status";
import { createCaptionsView } from "./captions";
import { createDebugPanel } from "./debug-panel";
import { createApiKeyProvider } from "./lib/api-key-provider";
import { createSetupDoctorPanel } from "./ui/setup-doctor-panel";
import { createTranscriptStore } from "./lib/transcript-store";
import { createTranscriptExportPanel } from "./ui/transcript-export-panel";
import { createSessionGuardrails } from "./ui/session-guardrails";
import { createMeetingProfileController } from "./lib/meeting-profile-controller";
import { createSessionController } from "./lib/session-controller";

export function mountApp(root: HTMLElement) {
  const settings = createSettings();
  const apiKeyProvider = createApiKeyProvider();
  const transcript = createTranscriptStore();
  void apiKeyProvider.migrateFromLocalStorage?.();

  root.innerHTML = `
    <header class="app-header">
      <h1>Meeting Realtime Translator</h1>
      <p class="subtitle">Speak your language — your meeting hears theirs. Auto-detects 70+ source languages. Local-only, BYO OpenAI key.</p>
    </header>
    <main class="app-main">
      <section class="panel" id="slot-controls"></section>
      <section class="panel" id="slot-devices"></section>
      <section class="panel" id="slot-support"></section>
      <section class="panel" id="slot-captions"></section>
      <section class="panel" id="slot-debug"></section>
    </main>
    <div id="slot-status"></div>
  `;

  const status = createStatusBar();
  root.querySelector("#slot-status")!.append(status.rootEl);

  if (!isSetSinkIdSupported()) {
    status.showError(
      "This browser doesn't support setSinkId — translated audio cannot be routed to a virtual cable. Use Chrome or Edge.",
      { sticky: true },
    );
  }

  const captions = createCaptionsView({
    flush: {
      idleMs: settings.get("mt.captions_flush_idle_ms"),
      onPunctuation: settings.get("mt.captions_flush_on_punctuation"),
    },
    transcribeSource: settings.get("mt.transcribe_source"),
    onFinalize: (kind, text) => transcript.append(kind, text),
  });
  root.querySelector("#slot-captions")!.append(captions.rootEl);
  root.querySelector("#slot-captions")!.append(createTranscriptExportPanel(transcript).rootEl);

  const guardrails = createSessionGuardrails(settings);

  let currentOutputDeviceId = settings.get("mt.output_device_id");
  let currentMicDeviceId = settings.get("mt.mic_device_id");
  let profileController: ReturnType<typeof createMeetingProfileController> | null = null;
  let sessionController: ReturnType<typeof createSessionController> | null = null;

  const pickers = createDevicePickers({
    initialMicId: currentMicDeviceId,
    initialOutputId: currentOutputDeviceId,
    onMicChange: (id) => {
      currentMicDeviceId = id;
      settings.set("mt.mic_device_id", id);
    },
    onOutputChange: (id) => {
      currentOutputDeviceId = id;
      settings.set("mt.output_device_id", id);
      sessionController?.applyOutputDevice(id);
    },
    onDevicesChanged: (devices) => {
      profileController?.setDevices(devices);
    },
  });
  root.querySelector("#slot-devices")!.append(pickers.rootEl);

  const setupDoctor = createSetupDoctorPanel(
    () => ({ micDeviceId: currentMicDeviceId, outputDeviceId: currentOutputDeviceId }),
  );

  const controls = createControls(settings, {
    onStartClick: () => void sessionController?.start(),
    onStopClick: () => sessionController?.stop(),
    onClearCaptions: () => {
      captions.clear();
      transcript.clear();
    },
    onSettingsChanged: () => {
      captions.setOptions({
        flush: {
          idleMs: settings.get("mt.captions_flush_idle_ms"),
          onPunctuation: settings.get("mt.captions_flush_on_punctuation"),
        },
        transcribeSource: settings.get("mt.transcribe_source"),
      });
    },
  }, apiKeyProvider);
  root.querySelector("#slot-controls")!.append(controls.rootEl);
  controls.settingsEl.append(guardrails.rootEl);

  profileController = createMeetingProfileController({
    settings,
    controls,
    pickers,
    status,
    getCurrentDeviceIds: () => ({
      micDeviceId: currentMicDeviceId,
      outputDeviceId: currentOutputDeviceId,
    }),
    setCurrentDeviceIds: (ids) => {
      currentMicDeviceId = ids.micDeviceId;
      currentOutputDeviceId = ids.outputDeviceId;
    },
  });
  root.querySelector("#slot-support")!.append(profileController.rootEl);
  root.querySelector("#slot-support")!.append(setupDoctor.rootEl);

  const debug = createDebugPanel({
    settings,
    initiallyOpen: settings.get("mt.debug_panel_open"),
    onToggle: (open) => settings.set("mt.debug_panel_open", open),
    getSetupDoctorResult: () => setupDoctor.latest(),
    getSessionDurationMs: () => guardrails.durationMs(),
  });
  root.querySelector("#slot-debug")!.append(debug.rootEl);

  sessionController = createSessionController({
    settings,
    apiKeyProvider,
    captions,
    transcript,
    debug,
    controls,
    status,
    guardrails,
    setupDoctorRun: () => setupDoctor.run(),
    getDeviceIds: () => ({
      micDeviceId: currentMicDeviceId,
      outputDeviceId: currentOutputDeviceId,
    }),
  });

  // Request mic permission upfront so device labels populate.
  ensureMicPermission()
    .then(() => pickers.refresh())
    .catch((err) =>
      status.showError(
        `Microphone permission denied: ${err.message}. Device labels will be hidden.`,
        { sticky: true },
      ),
    );

  window.addEventListener("beforeunload", () => sessionController?.stop());
}
