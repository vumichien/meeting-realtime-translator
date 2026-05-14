export function askProfileName(args: {
  title: string;
  initialValue: string;
}): Promise<string | null> {
  return new Promise((resolve) => {
    const overlay = document.createElement("div");
    overlay.className = "profile-dialog-backdrop";
    overlay.innerHTML = `
      <form class="profile-dialog" role="dialog" aria-modal="true">
        <h2></h2>
        <label class="control-field">
          <span>Profile name</span>
          <input type="text" maxlength="80" />
        </label>
        <div class="profile-dialog-actions">
          <button type="submit" class="primary-btn">Save</button>
          <button type="button" class="secondary-btn profile-dialog-cancel">Cancel</button>
        </div>
      </form>
    `;
    const form = overlay.querySelector<HTMLFormElement>("form")!;
    const title = overlay.querySelector<HTMLHeadingElement>("h2")!;
    const input = overlay.querySelector<HTMLInputElement>("input")!;
    const cancel = overlay.querySelector<HTMLButtonElement>(".profile-dialog-cancel")!;
    title.textContent = args.title;
    input.value = args.initialValue;

    function onKeydown(event: KeyboardEvent) {
      if (event.key === "Escape") close(null);
    }

    function close(value: string | null) {
      window.removeEventListener("keydown", onKeydown);
      overlay.remove();
      resolve(value);
    }

    form.addEventListener("submit", (event) => {
      event.preventDefault();
      close(input.value.trim() || args.initialValue);
    });
    cancel.addEventListener("click", () => close(null));
    overlay.addEventListener("click", (event) => {
      if (event.target === overlay) close(null);
    });
    window.addEventListener("keydown", onKeydown);
    document.body.append(overlay);
    input.focus();
    input.select();
  });
}
