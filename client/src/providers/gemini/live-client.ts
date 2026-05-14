// Thin WebSocket wrapper around the Gemini Live BidiGenerateContent protocol.
// Avoids the @google/genai SDK to stay zero-deps for OpenAI-only users — the
// wire format is small enough to hand-roll.
//
// Connect URL (AI Studio):
//   wss://generativelanguage.googleapis.com/ws/google.ai.generativelanguage
//     .v1beta.GenerativeService.BidiGenerateContent?access_token=<token>
//
// Connect URL (Vertex):
//   wss://{region}-aiplatform.googleapis.com/ws/google.cloud.aiplatform
//     .v1beta1.LlmBidiService/BidiGenerateContent?access_token=<token>

import type { GeminiServerMessage } from "./caption-mapper";

const LIVE_MODEL_AI_STUDIO = "models/gemini-2.5-flash-preview-native-audio-dialog";
const LIVE_MODEL_VERTEX = "gemini-2.5-flash-preview-native-audio-dialog";

const AI_STUDIO_PATH =
  "/ws/google.ai.generativelanguage.v1beta.GenerativeService.BidiGenerateContent";
const VERTEX_PATH =
  "/ws/google.cloud.aiplatform.v1beta1.LlmBidiService/BidiGenerateContent";

export interface LiveClientOptions {
  token: string;
  wsBaseUrl: string;
  authMode: "ai-studio" | "vertex";
  project?: string;
  region?: string;
  voice: string;
  systemInstruction: string;
  resumeHandle?: string;
  onMessage: (msg: GeminiServerMessage) => void;
  onResumptionHandle?: (handle: string) => void;
  onFirstAudio?: () => void;
  onOpen?: () => void;
  onClose?: (ev: CloseEvent) => void;
  onError?: (err: Event) => void;
}

export interface LiveClient {
  sendAudioChunk(pcm16: ArrayBuffer): void;
  close(): void;
  readonly readyState: number;
}

export function openLiveClient(opts: LiveClientOptions): LiveClient {
  const path = opts.authMode === "vertex" ? VERTEX_PATH : AI_STUDIO_PATH;
  const url = `${opts.wsBaseUrl}${path}?access_token=${encodeURIComponent(opts.token)}`;
  const ws = new WebSocket(url);
  ws.binaryType = "arraybuffer";

  let setupSent = false;
  ws.addEventListener("open", () => {
    sendSetup();
    setupSent = true;
    opts.onOpen?.();
  });

  let firstAudioSeen = false;
  ws.addEventListener("message", (ev) => {
    try {
      const text = typeof ev.data === "string" ? ev.data : new TextDecoder().decode(ev.data as ArrayBuffer);
      const msg = JSON.parse(text) as GeminiServerMessage;
      const handle = msg.sessionResumptionUpdate?.newHandle;
      if (handle && opts.onResumptionHandle) opts.onResumptionHandle(handle);
      if (!firstAudioSeen) {
        const parts = msg.serverContent?.modelTurn?.parts ?? [];
        for (const p of parts) {
          if (p.inlineData?.data && (p.inlineData.mimeType ?? "").startsWith("audio/")) {
            firstAudioSeen = true;
            opts.onFirstAudio?.();
            break;
          }
        }
      }
      opts.onMessage(msg);
    } catch {
      /* ignore non-JSON */
    }
  });

  ws.addEventListener("close", (ev) => opts.onClose?.(ev));
  ws.addEventListener("error", (ev) => opts.onError?.(ev));

  function sendSetup() {
    const model =
      opts.authMode === "vertex"
        ? `projects/${opts.project}/locations/${opts.region}/publishers/google/models/${LIVE_MODEL_VERTEX}`
        : LIVE_MODEL_AI_STUDIO;
    const setup: any = {
      setup: {
        model,
        generationConfig: {
          responseModalities: ["AUDIO"],
          speechConfig: {
            voiceConfig: { prebuiltVoiceConfig: { voiceName: opts.voice } },
          },
        },
        systemInstruction: {
          parts: [{ text: opts.systemInstruction }],
        },
        inputAudioTranscription: {},
        outputAudioTranscription: {},
        sessionResumption: opts.resumeHandle
          ? { handle: opts.resumeHandle }
          : {},
      },
    };
    ws.send(JSON.stringify(setup));
  }

  function sendAudioChunk(pcm16: ArrayBuffer) {
    if (ws.readyState !== WebSocket.OPEN || !setupSent) return;
    const b64 = bytesToBase64(new Uint8Array(pcm16));
    const realtimeInput = {
      realtimeInput: {
        mediaChunks: [
          { mimeType: "audio/pcm;rate=16000", data: b64 },
        ],
      },
    };
    ws.send(JSON.stringify(realtimeInput));
  }

  function close() {
    try {
      ws.close();
    } catch {
      /* ignore */
    }
  }

  return {
    sendAudioChunk,
    close,
    get readyState() {
      return ws.readyState;
    },
  };
}

function bytesToBase64(bytes: Uint8Array): string {
  let bin = "";
  const chunk = 0x8000;
  for (let i = 0; i < bytes.length; i += chunk) {
    bin += String.fromCharCode.apply(
      null,
      Array.from(bytes.subarray(i, i + chunk)),
    );
  }
  return btoa(bin);
}
