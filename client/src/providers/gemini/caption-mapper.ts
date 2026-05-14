// Translates Gemini Live event payloads into the existing CaptionEvent shape
// (the OpenAI-style `session.input_transcript.delta` / `.output_transcript.delta`).
// Captions UI in `captions.ts` consumes this shape unchanged.
import type { SessionEvent } from "../../types";

export interface GeminiServerMessage {
  serverContent?: {
    inputTranscription?: { text?: string; languageCode?: string };
    outputTranscription?: { text?: string };
    modelTurn?: { parts?: Array<{ inlineData?: { data?: string; mimeType?: string } }> };
    turnComplete?: boolean;
    interrupted?: boolean;
  };
  sessionResumptionUpdate?: { newHandle?: string; resumable?: boolean };
  goAway?: { timeLeft?: string };
  setupComplete?: object;
  toolCall?: unknown;
}

export interface MappedCaption {
  event: SessionEvent;
  detectedSourceLang?: string;
}

export function mapGeminiToCaption(msg: GeminiServerMessage): MappedCaption[] {
  const out: MappedCaption[] = [];
  const sc = msg.serverContent;
  if (!sc) return out;

  const input = sc.inputTranscription;
  if (input?.text) {
    out.push({
      event: {
        type: "session.input_transcript.delta",
        delta: input.text,
        detectedSourceLang: input.languageCode,
      },
      detectedSourceLang: input.languageCode,
    });
  }

  const output = sc.outputTranscription;
  if (output?.text) {
    out.push({
      event: {
        type: "session.output_transcript.delta",
        delta: output.text,
      },
    });
  }

  return out;
}

export function extractAudioChunks(msg: GeminiServerMessage): Uint8Array[] {
  const parts = msg.serverContent?.modelTurn?.parts;
  if (!parts) return [];
  const out: Uint8Array[] = [];
  for (const p of parts) {
    const data = p.inlineData?.data;
    const mime = p.inlineData?.mimeType ?? "";
    if (data && mime.startsWith("audio/")) {
      out.push(base64ToBytes(data));
    }
  }
  return out;
}

function base64ToBytes(b64: string): Uint8Array {
  const bin = atob(b64);
  const out = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) out[i] = bin.charCodeAt(i);
  return out;
}
