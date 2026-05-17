// settings-screen.tsx — Stacked settings sections separated by <Separator/>.
// Sections: Appearance | Captions | Guardrails | About.
// Stacked layout chosen over tabs — friendlier for non-tech users.

import React from "react";
import { Separator } from "@/components/ui/separator";
import { AppearanceSection } from "./appearance-section";
import { CaptionsSection } from "./captions-section";
import { GuardrailsSection } from "./guardrails-section";
import { AboutSection } from "./about-section";

interface SettingsSectionProps {
  title: string;
  children: React.ReactNode;
}

function SettingsSection({ title, children }: SettingsSectionProps): React.JSX.Element {
  return (
    <section>
      <h3 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground mb-4">
        {title}
      </h3>
      {children}
    </section>
  );
}

export function SettingsScreen(): React.JSX.Element {
  return (
    <div className="p-6 max-w-2xl">
      <h2 className="text-xl font-semibold text-foreground">Settings</h2>
      <p className="mt-1 mb-8 text-sm text-muted-foreground">
        Customize Babel Mic appearance, captions, and session guardrails.
      </p>

      <div className="flex flex-col gap-8" data-tour-id="settings-sections">
        <SettingsSection title="Appearance">
          <AppearanceSection />
        </SettingsSection>

        <Separator />

        <SettingsSection title="Captions">
          <CaptionsSection />
        </SettingsSection>

        <Separator />

        <SettingsSection title="Guardrails">
          <GuardrailsSection />
        </SettingsSection>

        <Separator />

        <SettingsSection title="About">
          <AboutSection />
        </SettingsSection>
      </div>
    </div>
  );
}
