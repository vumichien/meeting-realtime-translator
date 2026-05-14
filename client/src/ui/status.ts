import type { SessionIssue } from "../lib/session-error-messages";

export type StatusKind = "idle" | "connecting" | "connected" | "failed" | "closed";

export interface StatusBar {
  rootEl: HTMLElement;
  setStatus(kind: StatusKind, label?: string): void;
  showError(message: string, opts?: { sticky?: boolean }): void;
  showIssue(issue: SessionIssue, opts?: { onRetry?: () => void; onSetup?: () => void }): void;
  clearError(): void;
}

const LABELS: Record<StatusKind, string> = {
  idle: "Idle",
  connecting: "Connecting…",
  connected: "Connected",
  failed: "Failed",
  closed: "Closed",
};

export function createStatusBar(): StatusBar {
  const root = document.createElement("footer");
  root.className = "status-bar";
  root.innerHTML = `
    <div class="status-pill" data-state="idle">
      <span class="status-dot"></span>
      <span class="status-text">Idle</span>
    </div>
    <div class="status-banner" hidden></div>
  `;
  const pill = root.querySelector<HTMLElement>(".status-pill")!;
  const text = root.querySelector<HTMLElement>(".status-text")!;
  const banner = root.querySelector<HTMLElement>(".status-banner")!;
  let dismissTimer: number | undefined;

  function clearError() {
    if (dismissTimer) {
      window.clearTimeout(dismissTimer);
      dismissTimer = undefined;
    }
    banner.hidden = true;
    banner.textContent = "";
    banner.dataset.sticky = "";
  }

  return {
    rootEl: root,
    setStatus(kind, label) {
      pill.dataset.state = kind;
      text.textContent = label ?? LABELS[kind];
    },
    showError(message, opts) {
      banner.hidden = false;
      banner.textContent = message;
      banner.dataset.sticky = opts?.sticky ? "true" : "";
      if (dismissTimer) window.clearTimeout(dismissTimer);
      if (!opts?.sticky) {
        dismissTimer = window.setTimeout(() => clearError(), 8000);
      }
    },
    showIssue(issue, opts) {
      banner.hidden = false;
      banner.textContent = "";
      banner.dataset.sticky = "true";
      if (dismissTimer) window.clearTimeout(dismissTimer);
      const title = document.createElement("strong");
      title.textContent = issue.title;
      const copy = document.createElement("span");
      const suffix = issue.requestId ? ` Request ${issue.requestId}.` : "";
      copy.textContent = ` ${issue.message} ${issue.fix}${suffix}`;
      banner.append(title, copy);
      if (issue.retryable && opts?.onRetry) banner.append(actionButton("Retry", opts.onRetry));
      if (opts?.onSetup) banner.append(actionButton("Run Setup Doctor", opts.onSetup));
    },
    clearError,
  };
}

function actionButton(label: string, onClick: () => void): HTMLButtonElement {
  const button = document.createElement("button");
  button.type = "button";
  button.className = "status-action";
  button.textContent = label;
  button.addEventListener("click", onClick);
  return button;
}
