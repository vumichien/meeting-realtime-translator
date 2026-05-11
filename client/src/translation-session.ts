import type {
  ConnectionStateSnapshot,
  SessionEvent,
  SessionHandle,
} from "./types";
import { exchangeSdp, mintSession } from "./webrtc-sdp";

export interface StartSessionOptions {
  targetLanguage: string;
  micDeviceId?: string;
  outputDeviceId?: string;
  apiKey?: string;
  transcribeSource?: boolean;
  onEvent?: (event: SessionEvent) => void;
  onRawEvent?: (raw: any, ts: number) => void;
  onStateChange?: (snapshot: ConnectionStateSnapshot) => void;
  onError?: (err: Error) => void;
}

export async function startSession(opts: StartSessionOptions): Promise<SessionHandle> {
  const transcribeSource = opts.transcribeSource !== false;

  // 1. Mint short-lived client secret via local backend.
  const minted = await mintSession({
    targetLanguage: opts.targetLanguage,
    transcribeSource,
    apiKey: opts.apiKey,
  });

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
          opts.onError?.(toError(err, "setSinkId failed on initial routing")),
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
  const emitState = () =>
    opts.onStateChange?.({
      connectionState: pc.connectionState,
      iceConnectionState: pc.iceConnectionState,
    });
  pc.onconnectionstatechange = emitState;
  pc.oniceconnectionstatechange = emitState;
  emitState();

  // 7. SDP exchange.
  try {
    await exchangeSdp({ pc, clientSecret: minted.client_secret });
  } catch (err) {
    cleanup();
    throw err;
  }

  let stopped = false;
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
