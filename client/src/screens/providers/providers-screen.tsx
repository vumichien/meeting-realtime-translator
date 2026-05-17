// ProvidersScreen — radio-card list of translation providers.
// Provider switch is disabled when session is not idle.

import React, { useState } from "react";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { useProviders } from "@/hooks/use-providers";
import { useSession } from "@/hooks/use-session";
import { useSettings } from "@/hooks/use-settings";
import { useApiKeyProvider } from "@/hooks/use-api-key";
import { ProviderCard, type ProviderCardMeta } from "./provider-card";
import { ProviderConfigDialog } from "./provider-config-dialog";
import { LocalComingSoon } from "./local-coming-soon";

const PROVIDER_META: ProviderCardMeta[] = [
  {
    id: "openai",
    name: "OpenAI Realtime",
    description: "GPT-4o Realtime API — low-latency speech-to-speech translation.",
    latencyHint: "~1-3s",
    costHint: "$0.06/min",
  },
  {
    id: "gemini",
    name: "Gemini Live",
    description: "Google Gemini Live API — multimodal real-time audio translation.",
    latencyHint: "~1-2s",
    costHint: "~$0.04/min",
  },
];

const LOCAL_META: ProviderCardMeta = {
  id: "local",
  name: "Local Model",
  description: "On-device translation — no API key, full privacy.",
  latencyHint: "<500ms",
  costHint: "Free",
  comingSoon: true,
};

export function ProvidersScreen(): React.JSX.Element {
  const { active, setActive } = useProviders();
  const { state: sessionState } = useSession();
  const { settings: snap } = useSettings();
  const { hasKey: openaiHasKey } = useApiKeyProvider();
  const sessionActive = sessionState !== "idle";

  // Per-provider "configured" status — OpenAI uses safeStorage path; Gemini
  // uses settings (api key for ai-studio mode, service-account JSON for vertex).
  const geminiConfigured =
    snap["mt.gemini_auth_mode"] === "vertex"
      ? !!snap["mt.gemini_service_account_json"].trim()
      : !!snap["mt.gemini_api_key"].trim();
  const configuredById: Record<"openai" | "gemini", boolean> = {
    openai: openaiHasKey === true,
    gemini: geminiConfigured,
  };

  const [dialogProvider, setDialogProvider] = useState<ProviderCardMeta | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);

  function handleSelect(id: ProviderCardMeta["id"]) {
    if (sessionActive || id === "local") return;
    setActive(id as "openai" | "gemini");
  }

  function handleConfigure(id: ProviderCardMeta["id"]) {
    const meta = PROVIDER_META.find((p) => p.id === id) ?? LOCAL_META;
    setDialogProvider(meta);
    setDialogOpen(true);
  }

  return (
    <div className="p-6">
      <h2 className="text-xl font-semibold text-foreground">Providers</h2>
      <p className="mt-1 text-sm text-muted-foreground">
        Choose the translation backend. Configure API keys per provider.
      </p>

      {sessionActive && (
        <div className="mt-3 rounded-md border border-amber-300 bg-amber-50 px-3 py-2 text-sm text-amber-800 dark:border-amber-700 dark:bg-amber-950 dark:text-amber-300">
          Stop the session to switch providers.
        </div>
      )}

      <div
        role="radiogroup"
        aria-label="Translation provider"
        data-tour-id="providers-list"
        className="mt-6 flex flex-col gap-3"
      >
        {PROVIDER_META.map((meta) => {
          const card = (
            <ProviderCard
              key={meta.id}
              meta={meta}
              isActive={active === meta.id}
              isConfigured={configuredById[meta.id as "openai" | "gemini"] ?? false}
              disabled={sessionActive}
              onSelect={handleSelect}
              onConfigure={handleConfigure}
            />
          );

          if (sessionActive) {
            return (
              <Tooltip key={meta.id}>
                <TooltipTrigger asChild>
                  <div>{card}</div>
                </TooltipTrigger>
                <TooltipContent>Stop session to change provider</TooltipContent>
              </Tooltip>
            );
          }

          return card;
        })}

        {/* Local provider — always disabled, rendered separately */}
        <LocalComingSoon />
      </div>

      <ProviderConfigDialog
        provider={dialogProvider}
        open={dialogOpen}
        onOpenChange={setDialogOpen}
      />
    </div>
  );
}
