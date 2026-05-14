// AudioWorkletProcessor that downsamples mic audio from the AudioContext's
// native sample rate (commonly 48 kHz) to 16 kHz PCM16 mono frames and posts
// them to the main thread for forwarding to the Gemini Live WebSocket.
//
// 20ms frame at 16 kHz = 320 samples = 640 bytes.
//
// Loaded via `audioWorklet.addModule(new URL("./audio-input-worklet.ts", ...))`.

// AudioWorkletGlobalScope globals (`sampleRate`, `AudioWorkletProcessor`,
// `registerProcessor`) are declared in ./audioworklet.d.ts.

const TARGET_RATE = 16000;
const FRAME_SAMPLES = 320; // 20ms @ 16k

class GeminiMicProcessor extends AudioWorkletProcessor {
  private readonly inRate: number;
  private readonly ratio: number;
  private buf: Float32Array;
  private bufLen: number;
  private inPos: number;

  constructor() {
    super();
    this.inRate = sampleRate;
    this.ratio = this.inRate / TARGET_RATE;
    this.buf = new Float32Array(FRAME_SAMPLES);
    this.bufLen = 0;
    this.inPos = 0;
  }

  override process(inputs: Float32Array[][]): boolean {
    const channel = inputs[0]?.[0];
    if (!channel || channel.length === 0) return true;

    // Linear-interpolation downsampler. Walk source samples at fractional
    // step `ratio`; when output buffer fills, emit a 20ms PCM16 frame.
    for (let i = 0; i < channel.length; i++) {
      this.inPos += 1;
      if (this.inPos >= this.ratio) {
        this.inPos -= this.ratio;
        const idx = i;
        const frac = this.inPos / 1;
        const a = channel[idx] ?? 0;
        const b = channel[Math.min(idx + 1, channel.length - 1)] ?? a;
        const sample = a + (b - a) * frac;
        this.buf[this.bufLen++] = sample;
        if (this.bufLen >= FRAME_SAMPLES) {
          this.emitFrame();
        }
      }
    }
    return true;
  }

  private emitFrame() {
    const pcm = new Int16Array(this.bufLen);
    for (let i = 0; i < this.bufLen; i++) {
      const s = Math.max(-1, Math.min(1, this.buf[i] ?? 0));
      pcm[i] = (s * 0x7fff) | 0;
    }
    this.port.postMessage(pcm.buffer, [pcm.buffer]);
    this.bufLen = 0;
  }
}

registerProcessor("gemini-mic-processor", GeminiMicProcessor);
