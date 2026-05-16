import React from "react";
import type { View } from "./shell-types";
import { TranslateScreen } from "@/screens/translate/translate-screen";
import { DevicesScreen } from "@/screens/devices/devices-screen";
import { ProvidersScreen } from "@/screens/providers/providers-screen";
import { DiagnosticsScreen } from "@/screens/diagnostics/diagnostics-screen";
import { ProfilesScreen } from "@/screens/profiles/profiles-screen";
import { TranscriptsScreen } from "@/screens/transcripts/transcripts-screen";
import { SettingsScreen } from "@/screens/settings/settings-screen";

interface ScreenRouterProps {
  view: View;
}

// Human-readable title for each view — used by ScreenHeader too
export const VIEW_TITLES: Record<View, string> = {
  translate: "Translate",
  devices: "Devices",
  profiles: "Profiles",
  providers: "Providers",
  diagnostics: "Diagnostics",
  transcripts: "Transcripts",
  settings: "Settings",
};

/**
 * State-based view router (no router library).
 * Translate and Devices are fully implemented; others are placeholders
 * until Phases 5-6.
 */
export function ScreenRouter({ view }: ScreenRouterProps): React.JSX.Element {
  if (view === "translate") return <TranslateScreen />;
  if (view === "devices") return <DevicesScreen />;
  if (view === "providers") return <ProvidersScreen />;
  if (view === "diagnostics") return <DiagnosticsScreen />;
  if (view === "profiles") return <ProfilesScreen />;
  if (view === "transcripts") return <TranscriptsScreen />;
  if (view === "settings") return <SettingsScreen />;

  // Exhaustive fallback — should never be reached if View type is complete.
  return <></>;
}
