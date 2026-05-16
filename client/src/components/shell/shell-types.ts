/**
 * Shared type definitions for the app shell components.
 * Kept in one place so every shell file imports from here, not from each other.
 */

export type View =
  | "translate"
  | "devices"
  | "profiles"
  | "providers"
  | "diagnostics"
  | "transcripts"
  | "settings";

export type SessionState = "idle" | "translating" | "error";
