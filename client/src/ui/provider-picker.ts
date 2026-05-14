import type { Settings } from "../settings";
import type { ProviderId } from "../providers/types";
import { listProviders } from "../providers/registry";

export interface ProviderPickerHandle {
  rootEl: HTMLElement;
  current(): ProviderId;
  refresh(): void;
}

const LABELS: Record<ProviderId, string> = {
  openai: "OpenAI Realtime",
  gemini: "Gemini Live (preview)",
};

export function createProviderPicker(
  settings: Settings,
  onChange: (id: ProviderId) => void,
): ProviderPickerHandle {
  const root = document.createElement("div");
  root.className = "provider-picker";
  root.innerHTML = `
    <fieldset>
      <legend>Translator engine</legend>
      <div class="provider-radio-row"></div>
    </fieldset>
  `;
  const row = root.querySelector(".provider-radio-row") as HTMLElement;

  for (const id of listProviders()) {
    const label = document.createElement("label");
    label.className = "provider-radio";
    label.innerHTML = `
      <input type="radio" name="mt-provider" value="${id}" />
      <span>${LABELS[id] ?? id}</span>
    `;
    row.append(label);
  }
  const inputs = root.querySelectorAll<HTMLInputElement>("input[name='mt-provider']");

  function refresh() {
    const active = settings.get("mt.active_provider");
    inputs.forEach((i) => {
      i.checked = i.value === active;
    });
  }

  inputs.forEach((i) =>
    i.addEventListener("change", () => {
      if (!i.checked) return;
      const value = i.value as ProviderId;
      settings.set("mt.active_provider", value);
      onChange(value);
    }),
  );

  refresh();

  return {
    rootEl: root,
    current() {
      return settings.get("mt.active_provider") as ProviderId;
    },
    refresh,
  };
}
