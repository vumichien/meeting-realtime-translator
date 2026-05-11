import { createSettings } from "./settings";
import {
  applyOutputDevice,
  ensureMicPermission,
  isSetSinkIdSupported,
} from "./audio-devices";
import { createDevicePickers } from "./ui/device-pickers";
import { createControls } from "./ui/controls";
import { createStatusBar } from "./ui/status";
import { createCaptionsView } from "./captions";
import { createDebugPanel } from "./debug-panel";
import { startSession } from "./translation-session";
import type { SessionHandle } from "./types";

export function mountApp(root: HTMLElement) {
  const settings = createSettings();

  root.innerHTML = `
    <header class="app-header">
      <h1>Meeting Realtime Translator</h1>
      <p class="subtitle">Speak Vietnamese — your meeting hears your target language. Local-only, BYO OpenAI key.</p>
    </header>
    <main class="app-main">
      <section class="panel" id="slot-controls"></section>
      <section class="panel" id="slot-devices"></section>
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
  });
  root.querySelector("#slot-captions")!.append(captions.rootEl);

  const debug = createDebugPanel({
    settings,
    initiallyOpen: settings.get("mt.debug_panel_open"),
    onToggle: (open) => settings.set("mt.debug_panel_open", open),
  });
  root.querySelector("#slot-debug")!.append(debug.rootEl);

  let currentHandle: SessionHandle | null = null;
  let currentOutputDeviceId = settings.get("mt.output_device_id");
  let currentMicDeviceId = settings.get("mt.mic_device_id");

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
      if (currentHandle) {
        applyOutputDevice(currentHandle.audioElement, id).catch((err) =>
          status.showError(`Output device switch failed: ${err.message}`),
        );
      }
    },
  });
  root.querySelector("#slot-devices")!.append(pickers.rootEl);

  const controls = createControls(settings, {
    onStartClick: () => void start(),
    onStopClick: () => stop(),
    onClearCaptions: () => captions.clear(),
    onSettingsChanged: () => {
      captions.setOptions({
        flush: {
          idleMs: settings.get("mt.captions_flush_idle_ms"),
          onPunctuation: settings.get("mt.captions_flush_on_punctuation"),
        },
        transcribeSource: settings.get("mt.transcribe_source"),
      });
    },
  });
  root.querySelector("#slot-controls")!.append(controls.rootEl);

  // Request mic permission upfront so device labels populate.
  ensureMicPermission()
    .then(() => pickers.refresh())
    .catch((err) =>
      status.showError(
        `Microphone permission denied: ${err.message}. Device labels will be hidden.`,
        { sticky: true },
      ),
    );

  async function start() {
    if (currentHandle) return;
    status.clearError();
    captions.clear();
    debug.reset();
    controls.setBusy(true);
    status.setStatus("connecting");

    try {
      const handle = await startSession({
        targetLanguage: settings.get("mt.target_lang"),
        micDeviceId: currentMicDeviceId || undefined,
        outputDeviceId: currentOutputDeviceId || undefined,
        apiKey: settings.get("mt.openai_key") || undefined,
        transcribeSource: settings.get("mt.transcribe_source"),
        onEvent: (e) => captions.push(e),
        onRawEvent: (raw, ts) => debug.recordEvent(raw, ts),
        onStateChange: (snapshot) => {
          debug.recordState(snapshot);
          if (snapshot.connectionState === "connected") status.setStatus("connected");
          else if (snapshot.connectionState === "failed") {
            status.setStatus("failed");
            status.showError("WebRTC connection failed. Click Start to retry.");
            stop();
          } else if (snapshot.connectionState === "closed") status.setStatus("closed");
          else if (snapshot.connectionState === "connecting") status.setStatus("connecting");
        },
        onError: (err) => status.showError(err.message),
      });
      currentHandle = handle;
      debug.bindSession(handle);
      controls.setRunning(true);
      controls.setBusy(false);
    } catch (err) {
      controls.setBusy(false);
      controls.setRunning(false);
      const message = err instanceof Error ? err.message : "Failed to start session";
      status.setStatus("failed");
      status.showError(message, { sticky: true });
    }
  }

  function stop() {
    currentHandle?.stop();
    currentHandle = null;
    debug.unbindSession();
    controls.setRunning(false);
    status.setStatus("idle");
  }

  window.addEventListener("beforeunload", () => stop());
}
