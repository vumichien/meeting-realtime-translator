import type { MeetingProfile } from "../lib/meeting-profiles";

export interface MeetingProfilesPanel {
  rootEl: HTMLElement;
  setProfiles(profiles: MeetingProfile[], activeId: string): void;
}

export interface MeetingProfilesCallbacks {
  onApply(id: string): void;
  onSave(): void;
  onRename(id: string): void;
  onDelete(id: string): void;
}

export function createMeetingProfilesPanel(
  profiles: MeetingProfile[],
  activeId: string,
  cb: MeetingProfilesCallbacks,
): MeetingProfilesPanel {
  const root = document.createElement("section");
  root.className = "meeting-profiles";
  root.innerHTML = `
    <div class="profile-row">
      <label class="control-field profile-field">
        <span>Saved setup</span>
        <select class="profile-select"></select>
      </label>
      <button type="button" class="secondary-btn profile-apply">Apply</button>
      <button type="button" class="secondary-btn profile-save">Save current</button>
      <details class="profile-manage">
        <summary>Manage</summary>
        <div>
          <button type="button" class="link-btn profile-rename">Rename</button>
          <button type="button" class="link-btn profile-delete">Delete</button>
        </div>
      </details>
    </div>
  `;
  const select = root.querySelector<HTMLSelectElement>(".profile-select")!;
  const applyBtn = root.querySelector<HTMLButtonElement>(".profile-apply")!;
  const renameBtn = root.querySelector<HTMLButtonElement>(".profile-rename")!;
  const deleteBtn = root.querySelector<HTMLButtonElement>(".profile-delete")!;
  applyBtn.addEventListener("click", () => {
    if (select.value) cb.onApply(select.value);
  });
  root.querySelector<HTMLButtonElement>(".profile-save")!.addEventListener("click", cb.onSave);
  renameBtn.addEventListener("click", () => {
    if (select.value) cb.onRename(select.value);
  });
  deleteBtn.addEventListener("click", () => {
    if (select.value) cb.onDelete(select.value);
  });

  function setProfiles(nextProfiles: MeetingProfile[], nextActiveId: string) {
    select.innerHTML = "";
    if (nextProfiles.length === 0) {
      const opt = document.createElement("option");
      opt.value = "";
      opt.textContent = "No saved profiles";
      select.append(opt);
      select.disabled = true;
      applyBtn.disabled = true;
      renameBtn.disabled = true;
      deleteBtn.disabled = true;
      return;
    }
    select.disabled = false;
    applyBtn.disabled = false;
    renameBtn.disabled = false;
    deleteBtn.disabled = false;
    for (const profile of nextProfiles) {
      const opt = document.createElement("option");
      opt.value = profile.id;
      opt.textContent = profile.name;
      select.append(opt);
    }
    select.value = nextProfiles.some((p) => p.id === nextActiveId)
      ? nextActiveId
      : nextProfiles[0]!.id;
  }

  setProfiles(profiles, activeId);
  return { rootEl: root, setProfiles };
}
