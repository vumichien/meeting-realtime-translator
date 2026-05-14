import type {
  ProviderCapabilities,
  ProviderSession,
  StartSessionOptions,
  TranslationProvider,
} from "../types";
import type { SessionHandle } from "../../types";
import { mintGeminiToken, type GeminiAuthMode } from "./ephemeral-token";
import { buildTranslationPrompt } from "./translation-prompt";
import { startSessionWithResume } from "./session-resume";
import {
  makeSessionIssue,
  SessionIssueError,
} from "../../lib/session-error-messages";

const capabilities: ProviderCapabilities = {
  sessionResumeHandoff: true,
  autoDetectsSourceLang: true,
};

// Vite resolves these URLs at build time so AudioWorklet.addModule() gets a
// real served URL (not a TS module specifier).
const INPUT_WORKLET_URL = new URL("./audio-input-worklet.ts", import.meta.url);
const OUTPUT_WORKLET_URL = new URL("./audio-output-worklet.ts", import.meta.url);

interface GeminiProviderConfig {
  authMode?: GeminiAuthMode;
  apiKey?: string;
  serviceAccountJson?: string;
  project?: string;
  region?: string;
  voice?: string;
}

export function create(): TranslationProvider {
  return {
    id: "gemini",
    capabilities,
    async startSession(opts: StartSessionOptions): Promise<ProviderSession> {
      return startGeminiSession(opts);
    },
  };
}

async function startGeminiSession(
  opts: StartSessionOptions,
): Promise<SessionHandle> {
  const cfg = (opts.providerConfig ?? {}) as GeminiProviderConfig;
  const authMode: GeminiAuthMode = cfg.authMode ?? "ai-studio";
  const voice = cfg.voice ?? "Aoede";

  // 1. Mint ephemeral token.
  let minted;
  try {
    minted = await mintGeminiToken({
      authMode,
      apiKey: cfg.apiKey ?? opts.apiKey,
      serviceAccountJson: cfg.serviceAccountJson,
      project: cfg.project,
      region: cfg.region,
    });
  } catch (err) {
    if (err instanceof SessionIssueError) throw err;
    throw new SessionIssueError(
      makeSessionIssue("unknown", {
        message: err instanceof Error ? err.message : "Gemini token mint failed",
      }),
    );
  }

  // 2. Capture mic.
  const micStream = await navigator.mediaDevices.getUserMedia({
    audio: {
      deviceId: opts.micDeviceId ? { exact: opts.micDeviceId } : undefined,
      echoCancellation: true,
      noiseSuppression: true,
      autoGainControl: true,
    },
  });
  const micTrack = micStream.getAudioTracks()[0] ?? null;

  // 3. AudioContext + worklets.
  const audioCtx = new AudioContext();
  await audioCtx.audioWorklet.addModule(INPUT_WORKLET_URL.href);
  await audioCtx.audioWorklet.addModule(OUTPUT_WORKLET_URL.href);

  const micSource = audioCtx.createMediaStreamSource(micStream);
  const micNode = new AudioWorkletNode(audioCtx, "gemini-mic-processor");
  micSource.connect(micNode);
  // Mic node has no audible output — leave disconnected from destination.

  const speakerNode = new AudioWorkletNode(audioCtx, "gemini-speaker-processor");
  const streamDest = audioCtx.createMediaStreamDestination();
  speakerNode.connect(streamDest);
  const remoteStream = streamDest.stream;

  // 4. Hidden <audio> element for routing.
  const audio = document.createElement("audio");
  audio.autoplay = true;
  (audio as any).playsInline = true;
  audio.style.display = "none";
  audio.dataset.role = "translation-output";
  audio.srcObject = remoteStream;
  document.body.appendChild(audio);
  if (opts.outputDeviceId && typeof (audio as any).setSinkId === "function") {
    (audio as any)
      .setSinkId(opts.outputDeviceId)
      .catch((err: unknown) =>
        opts.onRecoverableIssue?.(
          makeSessionIssue("output_route_failed", {
            message: err instanceof Error ? err.message : "setSinkId failed",
          }),
        ),
      );
  }

  // 5. Open Live WebSocket with session-resume hot-handoff support.
  const systemInstruction = buildTranslationPrompt(opts.targetLanguage);
  opts.onStateChange?.({ connectionState: "connecting", iceConnectionState: "checking" });
  const resume = startSessionWithResume({
    initialOptions: {
      token: minted.token,
      wsBaseUrl: minted.wsBaseUrl,
      authMode: minted.authMode,
      project: minted.project,
      region: minted.region,
      voice,
      systemInstruction,
      onOpen: () => {
        opts.onStateChange?.({ connectionState: "connected", iceConnectionState: "connected" });
      },
      onClose: () => {
        opts.onStateChange?.({ connectionState: "closed", iceConnectionState: "closed" });
      },
      onError: () => {
        opts.onRecoverableIssue?.(
          makeSessionIssue("webrtc_failed", { message: "Gemini Live WebSocket error." }),
        );
      },
    },
    mintFreshToken: async () => {
      const refreshed = await mintGeminiToken({
        authMode,
        apiKey: cfg.apiKey ?? opts.apiKey,
        serviceAccountJson: cfg.serviceAccountJson,
        project: cfg.project,
        region: cfg.region,
      });
      return { token: refreshed.token, wsBaseUrl: refreshed.wsBaseUrl };
    },
    onAudioChunk: (chunk) => {
      speakerNode.port.postMessage(chunk.buffer, [chunk.buffer]);
    },
    onEvent: (event) => opts.onEvent?.(event),
    onRawEvent: (raw, ts) => opts.onRawEvent?.(raw, ts),
    onIssue: (issue) => opts.onRecoverableIssue?.(issue),
    onHandoffMetric: (dur) => {
      opts.onRawEvent?.({ type: "gemini.session_handoff_ms", value: dur }, performance.now());
    },
  });

  // 6. Mic → live forward.
  micNode.port.onmessage = (ev) => {
    resume.sendAudioChunk(ev.data as ArrayBuffer);
  };

  // 7. Lifecycle.
  let stopped = false;
  function cleanup() {
    if (stopped) return;
    stopped = true;
    try {
      resume.stop();
    } catch {
      /* ignore */
    }
    try {
      micNode.port.onmessage = null;
      micNode.disconnect();
      speakerNode.disconnect();
      micSource.disconnect();
    } catch {
      /* ignore */
    }
    try {
      micStream.getTracks().forEach((t) => t.stop());
    } catch {
      /* ignore */
    }
    try {
      audio.srcObject = null;
      audio.remove();
    } catch {
      /* ignore */
    }
    try {
      void audioCtx.close();
    } catch {
      /* ignore */
    }
  }

  return {
    stop: cleanup,
    audioElement: audio,
    micTrack,
    remoteStream: () => remoteStream,
  };
}
