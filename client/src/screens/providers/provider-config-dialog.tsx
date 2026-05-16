// ProviderConfigDialog — shadcn Dialog wrapping the correct config form
// based on the selected provider id.

import React from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { OpenAIConfigForm } from "./openai-config-form";
import { GeminiConfigForm } from "./gemini-config-form";
import type { ProviderCardMeta } from "./provider-card";

interface ProviderConfigDialogProps {
  provider: ProviderCardMeta | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function ProviderConfigDialog({
  provider,
  open,
  onOpenChange,
}: ProviderConfigDialogProps): React.JSX.Element | null {
  if (!provider) return null;

  function handleSave() {
    onOpenChange(false);
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>{provider.name} — Configuration</DialogTitle>
        </DialogHeader>

        {provider.id === "openai" && <OpenAIConfigForm onSave={handleSave} />}
        {provider.id === "gemini" && <GeminiConfigForm onSave={handleSave} />}
        {provider.id === "local" && (
          <p className="text-sm text-muted-foreground">
            Local model configuration is not yet available.
          </p>
        )}
      </DialogContent>
    </Dialog>
  );
}
