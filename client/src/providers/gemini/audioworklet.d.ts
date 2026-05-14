// Ambient declarations for the AudioWorkletGlobalScope environment in which
// our audio-*-worklet.ts files actually execute. lib.dom does not include
// these globals; they exist only inside an AudioWorklet, not the main thread.
//
// We only need these visible to the worklet sources, so we keep the symbols
// minimal and avoid colliding with any window-side `sampleRate` global.

declare class AudioWorkletProcessor {
  readonly port: MessagePort;
  constructor(options?: AudioWorkletNodeOptions);
  process(
    inputs: Float32Array[][],
    outputs: Float32Array[][],
    parameters: Record<string, Float32Array>,
  ): boolean;
}

declare function registerProcessor(
  name: string,
  ctor: new (options?: AudioWorkletNodeOptions) => AudioWorkletProcessor,
): void;

declare const sampleRate: number;
