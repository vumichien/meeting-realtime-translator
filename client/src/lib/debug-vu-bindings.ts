import { createVuMeter, type VuMeter } from "./vu-meter";
import type { SessionHandle } from "../types";

const VU_BIND_RETRY_MS = 250;
const VU_BIND_TIMEOUT_MS = 10_000;

export interface DebugVuBindings {
  bind(handle: SessionHandle): void;
  unbind(): void;
}

export function createDebugVuBindings(
  inputBar: HTMLElement,
  outputBar: HTMLElement,
): DebugVuBindings {
  let micMeter: VuMeter | null = null;
  let outMeter: VuMeter | null = null;
  let retryHandle: number | undefined;
  let retryTimeout: number | undefined;

  const loop = () => {
    inputBar.style.width = `${Math.round((micMeter?.level() ?? 0) * 100)}%`;
    outputBar.style.width = `${Math.round((outMeter?.level() ?? 0) * 100)}%`;
    window.requestAnimationFrame(loop);
  };
  window.requestAnimationFrame(loop);

  function clearRetry() {
    if (retryHandle !== undefined) window.clearInterval(retryHandle);
    if (retryTimeout !== undefined) window.clearTimeout(retryTimeout);
    retryHandle = undefined;
    retryTimeout = undefined;
  }

  function unbind() {
    micMeter?.stop();
    outMeter?.stop();
    micMeter = null;
    outMeter = null;
    clearRetry();
  }

  function attachOutput(handle: SessionHandle) {
    const track = handle.remoteStream()?.getAudioTracks()[0];
    if (!track) return false;
    outMeter = createVuMeter(track);
    outMeter.start();
    return true;
  }

  return {
    bind(handle) {
      unbind();
      if (handle.micTrack) {
        micMeter = createVuMeter(handle.micTrack);
        micMeter.start();
      }
      if (attachOutput(handle)) return;
      retryHandle = window.setInterval(() => {
        if (attachOutput(handle)) clearRetry();
      }, VU_BIND_RETRY_MS);
      retryTimeout = window.setTimeout(clearRetry, VU_BIND_TIMEOUT_MS);
    },
    unbind,
  };
}
