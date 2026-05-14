import type { Settings } from "../settings";

export interface GeminiConfigHandle {
  rootEl: HTMLElement;
  refresh(): void;
  setVisible(visible: boolean): void;
}

const REGIONS = ["us-central1", "asia-northeast1", "europe-west4"];
const VOICES = ["Aoede", "Puck", "Charon", "Kore", "Fenrir"] as const;

export function createGeminiConfig(
  settings: Settings,
  onChange: () => void,
): GeminiConfigHandle {
  const root = document.createElement("div");
  root.className = "gemini-config";
  root.innerHTML = `
    <fieldset>
      <legend>Gemini Live settings</legend>
      <div class="auth-mode-tabs">
        <label><input type="radio" name="mt-gem-auth" value="ai-studio" /> AI Studio key</label>
        <label><input type="radio" name="mt-gem-auth" value="vertex" /> Vertex AI service account</label>
      </div>
      <div class="auth-pane auth-ai-studio">
        <label class="control-field grow">
          <span>Gemini API key</span>
          <input type="password" id="gem-api-key" placeholder="AIza..." autocomplete="off" spellcheck="false" />
        </label>
      </div>
      <div class="auth-pane auth-vertex" hidden>
        <label class="control-field grow">
          <span>Service account JSON</span>
          <textarea id="gem-sa-json" rows="4" spellcheck="false"></textarea>
        </label>
        <div class="vertex-row">
          <label class="control-field">
            <span>Project ID</span>
            <input type="text" id="gem-project" spellcheck="false" />
          </label>
          <label class="control-field">
            <span>Region</span>
            <select id="gem-region">
              ${REGIONS.map((r) => `<option value="${r}">${r}</option>`).join("")}
            </select>
          </label>
        </div>
      </div>
      <label class="control-field">
        <span>Voice</span>
        <select id="gem-voice">
          ${VOICES.map((v) => `<option value="${v}">${v}</option>`).join("")}
        </select>
      </label>
    </fieldset>
  `;

  const aiPane = root.querySelector(".auth-ai-studio") as HTMLElement;
  const vertexPane = root.querySelector(".auth-vertex") as HTMLElement;
  const apiKey = root.querySelector<HTMLInputElement>("#gem-api-key")!;
  const saJson = root.querySelector<HTMLTextAreaElement>("#gem-sa-json")!;
  const project = root.querySelector<HTMLInputElement>("#gem-project")!;
  const region = root.querySelector<HTMLSelectElement>("#gem-region")!;
  const voice = root.querySelector<HTMLSelectElement>("#gem-voice")!;
  const authInputs = root.querySelectorAll<HTMLInputElement>("input[name='mt-gem-auth']");

  function applyAuthMode(mode: "ai-studio" | "vertex") {
    aiPane.hidden = mode !== "ai-studio";
    vertexPane.hidden = mode !== "vertex";
    authInputs.forEach((i) => {
      i.checked = i.value === mode;
    });
  }

  function refresh() {
    applyAuthMode(settings.get("mt.gemini_auth_mode"));
    apiKey.value = settings.get("mt.gemini_api_key");
    saJson.value = settings.get("mt.gemini_service_account_json");
    project.value = settings.get("mt.gemini_project");
    region.value = settings.get("mt.gemini_region") || REGIONS[0]!;
    voice.value = settings.get("mt.gemini_voice");
  }
  refresh();

  authInputs.forEach((i) =>
    i.addEventListener("change", () => {
      if (!i.checked) return;
      const v = i.value as "ai-studio" | "vertex";
      settings.set("mt.gemini_auth_mode", v);
      applyAuthMode(v);
      onChange();
    }),
  );
  apiKey.addEventListener("change", () => {
    settings.set("mt.gemini_api_key", apiKey.value.trim());
    onChange();
  });
  saJson.addEventListener("change", () => {
    settings.set("mt.gemini_service_account_json", saJson.value.trim());
    onChange();
  });
  project.addEventListener("change", () => {
    settings.set("mt.gemini_project", project.value.trim());
    onChange();
  });
  region.addEventListener("change", () => {
    settings.set("mt.gemini_region", region.value);
    onChange();
  });
  voice.addEventListener("change", () => {
    settings.set("mt.gemini_voice", voice.value as typeof VOICES[number]);
    onChange();
  });

  return {
    rootEl: root,
    refresh,
    setVisible(visible) {
      root.hidden = !visible;
    },
  };
}

export function geminiHasValidKey(settings: Settings): boolean {
  const mode = settings.get("mt.gemini_auth_mode");
  if (mode === "ai-studio") return !!settings.get("mt.gemini_api_key");
  return (
    !!settings.get("mt.gemini_service_account_json") &&
    !!settings.get("mt.gemini_project") &&
    !!settings.get("mt.gemini_region")
  );
}
