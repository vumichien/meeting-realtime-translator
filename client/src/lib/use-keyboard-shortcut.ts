import { useEffect } from "react";

type ModKey = "mod"; // resolves to Cmd on Mac, Ctrl on Windows/Linux

/**
 * Registers a global keydown listener for a key combo like "mod+b".
 * Silently ignores the shortcut when focus is inside INPUT or TEXTAREA
 * to avoid conflicting with text editing.
 *
 * @param combo - e.g. "mod+b" where "mod" = Cmd (Mac) / Ctrl (Win/Linux)
 * @param callback - called when the combo fires
 */
export function useKeyboardShortcut(
  combo: `${ModKey}+${string}`,
  callback: () => void,
): void {
  useEffect(() => {
    const parts = combo.split("+");
    const key = parts[parts.length - 1].toLowerCase();
    const needsMod = parts.includes("mod");

    const handler = (e: KeyboardEvent): void => {
      // Ignore shortcut when typing in input fields
      const tag = (e.target as HTMLElement | null)?.tagName ?? "";
      if (tag === "INPUT" || tag === "TEXTAREA") return;

      const modPressed = e.metaKey || e.ctrlKey;
      if (needsMod && !modPressed) return;
      if (e.key.toLowerCase() !== key) return;

      e.preventDefault();
      callback();
    };

    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, [combo, callback]);
}
