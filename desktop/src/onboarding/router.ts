import { detectVirtualCable } from "../cable-detect.js";
import { wireButtonFeedback } from "./button-feedback.js";

const STEPS = [1, 2, 3, 4, 5] as const;

let currentStep = 1;
let pollTimer: number | null = null;

const app = document.querySelector<HTMLElement>("#wizard-app")!;

void boot().catch((err) => {
  app.innerHTML = `
    <section class="step">
      <h1>Setup could not start</h1>
      <p>${escapeHtml(err instanceof Error ? err.message : "Unknown setup error")}</p>
    </section>
  `;
});

async function boot() {
  const state = await window.electron!.onboarding!.getState();
  currentStep = STEPS.find((step) => !state.stepsDone.includes(step)) ?? 5;
  await renderStep(currentStep);
}

async function renderStep(step: number) {
  if (pollTimer) window.clearInterval(pollTimer);
  currentStep = step;
  app.replaceChildren(getStepTemplate(step));
  wireButtonFeedback(app);
  app.querySelector("[data-back]")?.addEventListener("click", () => void renderStep(Math.max(1, step - 1)));
  const next = app.querySelector<HTMLButtonElement>("[data-next]");
  if (next) next.addEventListener("click", () => void completeStep(step));
  wireStep(step);
}

function getStepTemplate(step: number): DocumentFragment {
  const id = `step-${String(step).padStart(2, "0")}`;
  const template = document.getElementById(id);
  if (!(template instanceof HTMLTemplateElement)) {
    throw new Error(`Missing setup template: ${id}`);
  }
  return template.content.cloneNode(true) as DocumentFragment;
}

async function completeStep(step: number) {
  await window.electron!.onboarding!.completeStep(step);
  await window.electron!.telemetry?.track("onboarding.step.completed", { step });
  if (step >= 5) {
    await window.electron!.telemetry?.track("onboarding.completed", { total_duration_ms: 0 });
    await window.electron!.onboarding!.finish();
    window.close();
    return;
  }
  await renderStep(step + 1);
}

function wireStep(step: number) {
  if (step === 2) wireCableStep();
  if (step === 3) wireApiKeyStep();
  if (step === 4) wireDeviceStep();
  if (step === 5) wireZoomMeetStep();
}

function wireCableStep() {
  const status = app.querySelector<HTMLElement>("[data-cable-status]")!;
  const next = app.querySelector<HTMLButtonElement>("[data-next]")!;
  const open = app.querySelector<HTMLButtonElement>("[data-open-cable]")!;
  open.addEventListener("click", () => void window.electron!.shell!.openExternal(cableUrl()));
  const poll = async () => {
    const result = await detectVirtualCable().catch(() => ({
      detected: false,
      vendor: "none" as const,
      label: undefined,
    }));
    status.textContent = result.detected ? `Detected ${result.label ?? result.vendor}` : "Waiting for virtual cable";
    status.dataset.state = result.detected ? "ok" : "wait";
    next.disabled = !result.detected;
  };
  void poll();
  pollTimer = window.setInterval(poll, 2000);
}

function wireApiKeyStep() {
  const input = app.querySelector<HTMLInputElement>("[data-api-key]")!;
  const validate = app.querySelector<HTMLButtonElement>("[data-validate-key]")!;
  const status = app.querySelector<HTMLElement>("[data-key-status]")!;
  const next = app.querySelector<HTMLButtonElement>("[data-next]")!;
  validate.addEventListener("click", async () => {
    const key = input.value.trim();
    status.textContent = "Checking key...";
    const result = await window.electron!.session!.testMint(key);
    status.textContent = result.ok ? "Key works and was saved" : result.message;
    status.dataset.state = result.ok ? "ok" : "error";
    next.disabled = !result.ok;
    if (result.ok) await window.electron!.apiKey!.set(key);
  });
}

function wireDeviceStep() {
  const mic = app.querySelector<HTMLSelectElement>("[data-mic]")!;
  const output = app.querySelector<HTMLSelectElement>("[data-output]")!;
  const routingConfirmed = app.querySelector<HTMLInputElement>("[data-routing-confirmed]")!;
  const next = app.querySelector<HTMLButtonElement>("[data-next]")!;
  const update = () => {
    next.disabled = !(mic.value && output.value && routingConfirmed.checked);
  };
  void populateDevices(mic, output).then(update);
  mic.addEventListener("change", update);
  output.addEventListener("change", update);
  routingConfirmed.addEventListener("change", update);
}

function wireZoomMeetStep() {
  const done = app.querySelector<HTMLInputElement>("[data-configured]")!;
  const next = app.querySelector<HTMLButtonElement>("[data-next]")!;
  const update = () => {
    next.disabled = !done.checked;
  };
  done.addEventListener("change", () => {
    update();
  });
}

async function populateDevices(mic: HTMLSelectElement, output: HTMLSelectElement) {
  await navigator.mediaDevices.getUserMedia({ audio: true }).then((stream) => {
    stream.getTracks().forEach((track) => track.stop());
  });
  const devices = await navigator.mediaDevices.enumerateDevices();
  for (const device of devices) {
    if (device.kind !== "audioinput" && device.kind !== "audiooutput") continue;
    const option = new Option(device.label || device.deviceId, device.deviceId);
    if (device.kind === "audioinput") mic.add(option);
    else output.add(option);
  }
}

function cableUrl(): string {
  if (window.electron?.platform === "linux") return "https://docs.pipewire.org/";
  return "https://vb-audio.com/Cable/";
}

function escapeHtml(value: string): string {
  return value.replace(/[&<>"']/g, (char) => {
    const entities: Record<string, string> = {
      "&": "&amp;",
      "<": "&lt;",
      ">": "&gt;",
      '"': "&quot;",
      "'": "&#39;",
    };
    return entities[char]!;
  });
}
