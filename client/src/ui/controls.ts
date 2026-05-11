import { ALLOWED_LANGS, LANGUAGE_LABELS } from "../config/languages";
import type { Settings } from "../settings";

export interface ControlsCallbacks {
  onStartClick: () => void;
  onStopClick: () => void;
  onClearCaptions: () => void;
  onSettingsChanged: () => void;
}

export interface ControlsHandle {
  rootEl: HTMLElement;
  setRunning(running: boolean): void;
  setBusy(busy: boolean): void;
}

export function createControls(
  settings: Settings,
  cb: ControlsCallbacks,
): ControlsHandle {
  const root = document.createElement("section");
  root.className = "controls";
  root.innerHTML = `
    <div class="controls-row primary">
      <label class="control-field">
        <span>Target language</span>
        <select id="ctrl-lang"></select>
      </label>
      <button type="button" id="ctrl-start" class="primary-btn">Start translating</button>
      <button type="button" id="ctrl-stop" class="secondary-btn" disabled>Stop</button>
      <button type="button" id="ctrl-clear" class="link-btn">Clear captions</button>
    </div>
    <div class="controls-row keyrow">
      <label class="control-field grow">
        <span>OpenAI API key (optional — overrides server .env)</span>
        <input type="password" id="ctrl-key" placeholder="sk-..." autocomplete="off" spellcheck="false" />
      </label>
      <label class="control-toggle">
        <input type="checkbox" id="ctrl-transcribe" />
        <span>Show source captions (extra cost)</span>
      </label>
    </div>
    <details class="controls-advanced">
      <summary>Advanced</summary>
      <div class="controls-row">
        <label class="control-field">
          <span>Caption flush idle (ms)</span>
          <input type="number" id="ctrl-flush-idle" min="200" max="10000" step="100" />
        </label>
        <label class="control-toggle">
          <input type="checkbox" id="ctrl-flush-punct" />
          <span>Flush captions on punctuation</span>
        </label>
      </div>
    </details>
  `;

  const langSelect = root.querySelector<HTMLSelectElement>("#ctrl-lang")!;
  for (const code of ALLOWED_LANGS) {
    const opt = document.createElement("option");
    opt.value = code;
    opt.textContent = `${LANGUAGE_LABELS[code]} (${code})`;
    langSelect.append(opt);
  }
  langSelect.value = settings.get("mt.target_lang");

  const startBtn = root.querySelector<HTMLButtonElement>("#ctrl-start")!;
  const stopBtn = root.querySelector<HTMLButtonElement>("#ctrl-stop")!;
  const clearBtn = root.querySelector<HTMLButtonElement>("#ctrl-clear")!;

  const keyInput = root.querySelector<HTMLInputElement>("#ctrl-key")!;
  keyInput.value = settings.get("mt.openai_key");

  const transcribeBox = root.querySelector<HTMLInputElement>("#ctrl-transcribe")!;
  transcribeBox.checked = settings.get("mt.transcribe_source");

  const flushIdle = root.querySelector<HTMLInputElement>("#ctrl-flush-idle")!;
  flushIdle.value = String(settings.get("mt.captions_flush_idle_ms"));

  const flushPunct = root.querySelector<HTMLInputElement>("#ctrl-flush-punct")!;
  flushPunct.checked = settings.get("mt.captions_flush_on_punctuation");

  langSelect.addEventListener("change", () => {
    settings.set("mt.target_lang", langSelect.value);
    cb.onSettingsChanged();
  });
  keyInput.addEventListener("change", () => {
    settings.set("mt.openai_key", keyInput.value.trim());
    cb.onSettingsChanged();
  });
  transcribeBox.addEventListener("change", () => {
    settings.set("mt.transcribe_source", transcribeBox.checked);
    cb.onSettingsChanged();
  });
  flushIdle.addEventListener("change", () => {
    const n = Number(flushIdle.value);
    if (Number.isFinite(n) && n > 0) {
      settings.set("mt.captions_flush_idle_ms", n);
      cb.onSettingsChanged();
    }
  });
  flushPunct.addEventListener("change", () => {
    settings.set("mt.captions_flush_on_punctuation", flushPunct.checked);
    cb.onSettingsChanged();
  });

  startBtn.addEventListener("click", () => cb.onStartClick());
  stopBtn.addEventListener("click", () => cb.onStopClick());
  clearBtn.addEventListener("click", () => cb.onClearCaptions());

  return {
    rootEl: root,
    setRunning(running) {
      startBtn.disabled = running;
      stopBtn.disabled = !running;
      langSelect.disabled = running;
      transcribeBox.disabled = running;
      keyInput.disabled = running;
    },
    setBusy(busy) {
      startBtn.disabled = busy || !stopBtn.disabled;
      if (busy) startBtn.textContent = "Connecting…";
      else startBtn.textContent = "Start translating";
    },
  };
}
