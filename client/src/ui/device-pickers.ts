import {
  type DeviceInfo,
  type DeviceLists,
  listDevices,
  subscribeDeviceChanges,
} from "../audio-devices";

export interface DevicePickerOptions {
  initialMicId?: string;
  initialOutputId?: string;
  onMicChange: (deviceId: string) => void;
  onOutputChange: (deviceId: string) => void;
}

export interface DevicePickerHandle {
  rootEl: HTMLElement;
  refresh(): Promise<void>;
  destroy(): void;
}

export function createDevicePickers(opts: DevicePickerOptions): DevicePickerHandle {
  const root = document.createElement("div");
  root.className = "device-pickers";

  const micField = makeField("Source mic (your real microphone)", "device-mic");
  const outField = makeField("Babel Mic output (virtual cable playback side)", "device-output");

  micField.select.addEventListener("change", () => opts.onMicChange(micField.select.value));
  outField.select.addEventListener("change", () => opts.onOutputChange(outField.select.value));

  root.append(micField.wrapper, outField.wrapper);

  let currentMicId = opts.initialMicId ?? "";
  let currentOutId = opts.initialOutputId ?? "";

  async function refresh() {
    let devices: DeviceLists;
    try {
      devices = await listDevices();
    } catch (err) {
      console.warn("[device-pickers] enumerate failed", err);
      return;
    }
    populate(micField.select, devices.inputs, currentMicId);
    populate(outField.select, devices.outputs, currentOutId);
    if (micField.select.value && micField.select.value !== currentMicId) {
      currentMicId = micField.select.value;
      opts.onMicChange(currentMicId);
    }
    if (outField.select.value && outField.select.value !== currentOutId) {
      currentOutId = outField.select.value;
      opts.onOutputChange(currentOutId);
    }
  }

  const unsubscribe = subscribeDeviceChanges(() => {
    void refresh();
  });

  return {
    rootEl: root,
    refresh,
    destroy: () => unsubscribe(),
  };
}

function makeField(labelText: string, id: string) {
  const wrapper = document.createElement("label");
  wrapper.className = "device-picker-field";
  wrapper.htmlFor = id;
  const span = document.createElement("span");
  span.textContent = labelText;
  const select = document.createElement("select");
  select.id = id;
  wrapper.append(span, select);
  return { wrapper, select };
}

function populate(select: HTMLSelectElement, items: DeviceInfo[], preferredId: string) {
  const previousValue = select.value || preferredId;
  select.innerHTML = "";
  if (items.length === 0) {
    const opt = document.createElement("option");
    opt.value = "";
    opt.textContent = "No devices detected — grant mic permission";
    select.append(opt);
    select.disabled = true;
    return;
  }
  select.disabled = false;
  for (const item of items) {
    const opt = document.createElement("option");
    opt.value = item.deviceId;
    opt.textContent = item.virtualCable
      ? `★ ${item.label || "(unnamed device)"}`
      : item.label || "(unnamed device)";
    if (item.virtualCable) opt.dataset.virtualCable = item.virtualCable;
    select.append(opt);
  }
  const candidate = items.find((d) => d.deviceId === previousValue);
  select.value = candidate ? candidate.deviceId : items[0]!.deviceId;
}
