export function wireButtonFeedback(root: ParentNode): void {
  root.querySelectorAll<HTMLButtonElement>("button").forEach((button) => {
    button.addEventListener("pointerdown", () => {
      if (button.disabled) return;
      button.classList.add("button-clicked");
    });
    button.addEventListener("pointerup", () => {
      window.setTimeout(() => button.classList.remove("button-clicked"), 140);
    });
    button.addEventListener("pointerleave", () => {
      button.classList.remove("button-clicked");
    });
    button.addEventListener("keydown", (event) => {
      if (button.disabled || (event.key !== "Enter" && event.key !== " ")) return;
      button.classList.add("button-clicked");
      window.setTimeout(() => button.classList.remove("button-clicked"), 160);
    });
  });
}
