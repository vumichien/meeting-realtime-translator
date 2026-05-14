import {
  runSetupDoctor,
  type SetupDoctorOptions,
  type SetupDoctorResult,
  type SetupDoctorStatus,
} from "../lib/setup-doctor";

export interface SetupDoctorPanel {
  rootEl: HTMLElement;
  run(): Promise<void>;
  latest(): SetupDoctorResult | null;
}

export function createSetupDoctorPanel(
  getOptions: () => SetupDoctorOptions,
  onResult?: (result: SetupDoctorResult) => void,
): SetupDoctorPanel {
  const root = document.createElement("section");
  root.className = "setup-doctor";
  root.dataset.collapsed = "true";
  root.innerHTML = `
    <header class="setup-doctor-header">
      <button type="button" class="setup-doctor-toggle" aria-expanded="false">
        <span class="caret">▸</span>
        <span>Setup Doctor</span>
        <small class="setup-summary">Not checked</small>
      </button>
      <button type="button" class="secondary-btn setup-run">Run check</button>
    </header>
    <div class="setup-doctor-body">
      <ol class="setup-checks"></ol>
    </div>
  `;
  const toggleBtn = root.querySelector<HTMLButtonElement>(".setup-doctor-toggle")!;
  const caret = root.querySelector<HTMLElement>(".caret")!;
  const runBtn = root.querySelector<HTMLButtonElement>(".setup-run")!;
  const summary = root.querySelector<HTMLElement>(".setup-summary")!;
  const list = root.querySelector<HTMLOListElement>(".setup-checks")!;
  let last: SetupDoctorResult | null = null;

  toggleBtn.addEventListener("click", toggle);
  runBtn.addEventListener("click", () => void run());
  renderWaiting();

  async function run() {
    runBtn.disabled = true;
    runBtn.textContent = "Checking...";
    list.innerHTML = `<li class="setup-check unknown"><span>Running checks</span><small>Please speak briefly if asked for mic access.</small></li>`;
    try {
      last = await runSetupDoctor(getOptions());
      onResult?.(last);
      summary.textContent = summaryFor(last);
      summary.dataset.state = last.overall;
      renderResult(last);
      setCollapsed(last.overall === "ready");
    } finally {
      runBtn.disabled = false;
      runBtn.textContent = "Run check";
    }
  }

  function renderWaiting() {
    list.innerHTML = `<li class="setup-check unknown"><span>Not checked yet</span><small>Run before joining a meeting.</small></li>`;
  }

  function renderResult(result: SetupDoctorResult) {
    list.innerHTML = "";
    for (const check of result.checks) {
      const li = document.createElement("li");
      li.className = `setup-check ${check.status}`;
      const badge = document.createElement("b");
      badge.textContent = labelFor(check.status);
      const text = document.createElement("span");
      text.textContent = check.label;
      const detail = document.createElement("small");
      detail.textContent = check.detail;
      li.append(badge, text, detail);
      list.append(li);
    }
  }

  function toggle() {
    setCollapsed(root.dataset.collapsed !== "true");
  }

  function setCollapsed(collapsed: boolean) {
    root.dataset.collapsed = String(collapsed);
    toggleBtn.setAttribute("aria-expanded", String(!collapsed));
    caret.textContent = collapsed ? "▸" : "▾";
  }

  return {
    rootEl: root,
    run,
    latest: () => last,
  };
}

function summaryFor(result: SetupDoctorResult): string {
  const ready = result.checks.filter((check) => check.status === "ready").length;
  const action = result.checks.filter((check) => check.status === "action").length;
  if (action > 0) return `${action} need action`;
  if (result.overall === "unknown") return `${ready}/${result.checks.length} ready`;
  return "Ready";
}

function labelFor(status: SetupDoctorStatus): string {
  if (status === "ready") return "Ready";
  if (status === "action") return "Needs action";
  return "Unknown";
}
