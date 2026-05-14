import type {
  ConnectionStateSnapshot,
  SessionEvent,
  SessionHandle,
} from "./types";
import { exchangeSdp, mintSession } from "./webrtc-sdp";
import {
  detectMicEnv,
  micConstraintsFor,
  type MicEnv,
  type MicEnvSetting,
} from "./lib/mic-env-detect";
import {
  makeSessionIssue,
  SessionIssueError,
  type SessionIssue,
} from "./lib/session-error-messages";

export interface StartSessionOptions {
  targetLanguage: string;
  micDeviceId?: string;
  outputDeviceId?: string;
  apiKey?: string;
  transcribeSource?: boolean;
  micEnv?: MicEnvSetting;
  onEvent?: (event: SessionEvent) => void;
  onRawEvent?: (raw: any, ts: number) => void;
  onStateChange?: (snapshot: ConnectionStateSnapshot) => void;
  onRecoverableIssue?: (issue: SessionIssue) => void;
  onError?: (err: Error) => void;
}

export async function startSession(opts: StartSessionOptions): Promise<SessionHandle> {
  const transcribeSource = opts.transcribeSource !== false;
  // Resolve mic env: explicit override wins; otherwise sniff the device label.
  const resolvedMicEnv = await resolveMicEnv(opts.micEnv ?? "auto", opts.micDeviceId);
  // 1. Mint short-lived client secret via local backend.
  const minted = await mintSession({
    targetLanguage: opts.targetLanguage,
    transcribeSource,
    apiKey: opts.apiKey,
    micEnv: resolvedMicEnv,
  });
  // 2. Capture mic. Constraints per env -- avoid double-DSP with model's NR.
  const constraints = micConstraintsFor(resolvedMicEnv);
  const micStream = await navigator.mediaDevices.getUserMedia({
    audio: {
      deviceId: opts.micDeviceId ? { exact: opts.micDeviceId } : undefined,
      echoCancellation: constraints.echoCancellation,
      noiseSuppression: constraints.noiseSuppression,
      autoGainControl: constraints.autoGainControl,
    },
  });
  const micTrack = micStream.getAudioTracks()[0] ?? null;
  if (micTrack) {
    micTrack.addEventListener("ended", () =>
      opts.onRecoverableIssue?.(makeSessionIssue("mic_disconnected")),
    );
    micTrack.addEventListener("mute", () =>
      opts.onRecoverableIssue?.(makeSessionIssue("mic_disconnected", {
        message: "The active microphone stopped sending audio.",
      })),
    );
  }

  // 3. Set up peer connection.
  const pc = new RTCPeerConnection();
  if (micTrack) pc.addTrack(micTrack, micStream);

  // 4. Hidden <audio> for translated output.
  const audio = document.createElement("audio");
  audio.autoplay = true;
  (audio as any).playsInline = true;
  audio.style.display = "none";
  audio.dataset.role = "translation-output";
  document.body.appendChild(audio);

  let remoteStream: MediaStream | null = null;
  pc.ontrack = (ev) => {
    const stream = ev.streams[0] ?? new MediaStream([ev.track]);
    remoteStream = stream;
    audio.srcObject = stream;
    if (opts.outputDeviceId && typeof (audio as any).setSinkId === "function") {
      (audio as any)
        .setSinkId(opts.outputDeviceId)
        .catch((err: unknown) =>
          opts.onRecoverableIssue?.(
            makeSessionIssue("output_route_failed", {
              message: toError(err, "setSinkId failed on initial routing").message,
            }),
          ),
        );
    }
  };

  // 5. Data channel for oai-events.
  const events = pc.createDataChannel("oai-events");
  events.onmessage = ({ data }) => {
    let parsed: any;
    try {
      parsed = JSON.parse(data);
    } catch {
      return;
    }
    const ts = performance.now();
    opts.onRawEvent?.(parsed, ts);
    if (parsed && typeof parsed.type === "string") {
      opts.onEvent?.(parsed as SessionEvent);
    }
  };

  // 6. Connection state propagation.
  const emitState = () => {
    const snapshot = {
      connectionState: pc.connectionState,
      iceConnectionState: pc.iceConnectionState,
    };
    opts.onStateChange?.(snapshot);
    if (pc.connectionState === "failed") {
      opts.onRecoverableIssue?.(makeSessionIssue("webrtc_failed"));
    }
  };
  pc.onconnectionstatechange = emitState;
  pc.oniceconnectionstatechange = emitState;
  emitState();

  // 7. SDP exchange.
  let stopped = false;
  try {
    await exchangeSdp({ pc, clientSecret: minted.client_secret });
  } catch (err) {
    cleanup();
    throw err instanceof SessionIssueError
      ? err
      : new SessionIssueError(makeSessionIssue("webrtc_failed", {
          message: toError(err, "SDP exchange failed").message,
        }));
  }

  function cleanup() {
    if (stopped) return;
    stopped = true;
    try {
      events.onmessage = null;
      events.close();
    } catch {
      /* ignore */
    }
    try {
      pc.ontrack = null;
      pc.onconnectionstatechange = null;
      pc.oniceconnectionstatechange = null;
      pc.close();
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
  }

  return {
    stop: cleanup,
    audioElement: audio,
    micTrack,
    remoteStream: () => remoteStream,
  };
}

function toError(err: unknown, fallback: string): Error {
  if (err instanceof Error) return err;
  return new Error(typeof err === "string" ? err : fallback);
}

async function resolveMicEnv(
  setting: MicEnvSetting,
  deviceId: string | undefined,
): Promise<MicEnv> {
  if (setting !== "auto") return setting;
  if (!deviceId) return "laptop";
  try {
    const devices = await navigator.mediaDevices.enumerateDevices();
    const match = devices.find(
      (d) => d.kind === "audioinput" && d.deviceId === deviceId,
    );
    return detectMicEnv(match?.label);
  } catch {
    return "laptop";
  }
}
