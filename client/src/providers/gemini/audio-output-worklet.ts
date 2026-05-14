// AudioWorkletProcessor that buffers PCM16 @ 24 kHz audio frames received
// from the Gemini Live WebSocket, upsamples to the AudioContext's native
// rate, and feeds them out as a continuous signal. The host wires the node
// into a MediaStreamAudioDestinationNode so the result is a regular
// MediaStream consumable by an <audio> element + setSinkId().

// AudioWorkletGlobalScope globals declared in ./audioworklet.d.ts.

const SOURCE_RATE = 24000;

class GeminiSpeakerProcessor extends AudioWorkletProcessor {
  private queue: Float32Array[] = [];
  private current: Float32Array | null = null;
  private pos = 0;
  private readonly ratio: number;
  private srcCursor = 0;

  constructor() {
    super();
    this.ratio = SOURCE_RATE / sampleRate;
    this.port.onmessage = (ev) => {
      if (ev.data === "reset") {
        this.queue = [];
        this.current = null;
        this.pos = 0;
        this.srcCursor = 0;
        return;
      }
      const buf = ev.data as ArrayBuffer;
      const pcm = new Int16Array(buf);
      const f32 = new Float32Array(pcm.length);
      for (let i = 0; i < pcm.length; i++) f32[i] = (pcm[i] ?? 0) / 0x7fff;
      this.queue.push(f32);
    };
  }

  private nextSample(): number {
    while (
      !this.current ||
      Math.floor(this.srcCursor) >= this.current.length
    ) {
      const next = this.queue.shift();
      if (!next) return 0;
      this.current = next;
      this.srcCursor = 0;
    }
    const idx = Math.floor(this.srcCursor);
    const frac = this.srcCursor - idx;
    const a = this.current[idx] ?? 0;
    const b = this.current[Math.min(idx + 1, this.current.length - 1)] ?? a;
    this.srcCursor += this.ratio;
    return a + (b - a) * frac;
  }

  override process(_inputs: Float32Array[][], outputs: Float32Array[][]): boolean {
    const out = outputs[0]?.[0];
    if (!out) return true;
    for (let i = 0; i < out.length; i++) {
      out[i] = this.nextSample();
    }
    return true;
  }
}

registerProcessor("gemini-speaker-processor", GeminiSpeakerProcessor);
