// Web Audio VU meter. Computes RMS level (0..1) from a MediaStreamTrack.
// Caller decides refresh rate (typically the debug panel does ~30fps via RAF).

export interface VuMeter {
  start(): void;
  stop(): void;
  level(): number;
}

let sharedContext: AudioContext | null = null;
function getContext(): AudioContext {
  if (!sharedContext) {
    sharedContext = new AudioContext();
  }
  return sharedContext;
}

export function createVuMeter(track: MediaStreamTrack): VuMeter {
  let analyser: AnalyserNode | null = null;
  let source: MediaStreamAudioSourceNode | null = null;
  let buffer: Uint8Array<ArrayBuffer> | null = null;
  let active = false;
  let cachedLevel = 0;

  function ensureNodes() {
    if (analyser) return;
    const ctx = getContext();
    if (ctx.state === "suspended") void ctx.resume();
    const stream = new MediaStream([track]);
    source = ctx.createMediaStreamSource(stream);
    analyser = ctx.createAnalyser();
    analyser.fftSize = 1024;
    buffer = new Uint8Array(new ArrayBuffer(analyser.fftSize));
    source.connect(analyser);
  }

  return {
    start() {
      if (active) return;
      ensureNodes();
      active = true;
    },
    stop() {
      active = false;
      try {
        source?.disconnect();
      } catch {
        /* ignore */
      }
      try {
        analyser?.disconnect();
      } catch {
        /* ignore */
      }
      source = null;
      analyser = null;
      buffer = null;
      cachedLevel = 0;
    },
    level() {
      if (!active || !analyser || !buffer) return cachedLevel;
      analyser.getByteTimeDomainData(buffer);
      let sumSquares = 0;
      for (let i = 0; i < buffer.length; i += 1) {
        const normalized = (buffer[i]! - 128) / 128;
        sumSquares += normalized * normalized;
      }
      const rms = Math.sqrt(sumSquares / buffer.length);
      cachedLevel = Math.min(1, rms * 1.6);
      return cachedLevel;
    },
  };
}
