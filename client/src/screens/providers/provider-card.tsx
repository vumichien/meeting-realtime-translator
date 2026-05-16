// ProviderCard — radio-style selectable card for a translation provider.
// Active state: ring-2 ring-primary + check icon.
// Disabled (comingSoon): no click, badge shown.

import React from "react";
import { CheckCircle2 } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export interface ProviderCardMeta {
  id: "openai" | "gemini" | "local";
  name: string;
  description: string;
  latencyHint: string;
  costHint: string;
  comingSoon?: boolean;
}

interface ProviderCardProps {
  meta: ProviderCardMeta;
  isActive: boolean;
  /** Whether this provider has its required key/credentials set. */
  isConfigured?: boolean;
  disabled?: boolean;
  onSelect: (id: ProviderCardMeta["id"]) => void;
  onConfigure: (id: ProviderCardMeta["id"]) => void;
}

export function ProviderCard({
  meta,
  isActive,
  isConfigured = false,
  disabled = false,
  onSelect,
  onConfigure,
}: ProviderCardProps): React.JSX.Element {
  const isDisabled = disabled || !!meta.comingSoon;

  function handleSelect() {
    if (isDisabled) return;
    onSelect(meta.id);
  }

  return (
    <Card
      role="radio"
      aria-checked={isActive}
      aria-disabled={isDisabled}
      data-state={isActive ? "checked" : "unchecked"}
      onClick={handleSelect}
      className={cn(
        "relative cursor-pointer select-none transition-all",
        isActive && "ring-2 ring-primary",
        isDisabled && "cursor-not-allowed opacity-60",
      )}
    >
      {/* Active check icon */}
      {isActive && (
        <CheckCircle2
          className="absolute right-3 top-3 h-5 w-5 text-primary"
          aria-hidden="true"
        />
      )}

      <CardHeader className="pb-2">
        <div className="flex items-center gap-2">
          <CardTitle className="text-base">{meta.name}</CardTitle>
          {meta.comingSoon && (
            <Badge variant="secondary" className="text-xs">
              Coming soon
            </Badge>
          )}
          {!meta.comingSoon && isConfigured && (
            <Badge
              variant="outline"
              className="border-emerald-500/50 bg-emerald-500/10 text-xs text-emerald-600 dark:text-emerald-400"
            >
              Configured
            </Badge>
          )}
          {!meta.comingSoon && !isConfigured && (
            <Badge
              variant="outline"
              className="border-amber-500/50 bg-amber-500/10 text-xs text-amber-600 dark:text-amber-400"
            >
              Not configured
            </Badge>
          )}
        </div>
        <p className="text-sm text-muted-foreground">{meta.description}</p>
      </CardHeader>

      <CardContent>
        <div className="flex items-center gap-3">
          <Badge variant="outline" className="text-xs font-normal">
            {meta.latencyHint}
          </Badge>
          <Badge variant="outline" className="text-xs font-normal">
            {meta.costHint}
          </Badge>

          {!meta.comingSoon && (
            <Button
              size="sm"
              variant="ghost"
              className="ml-auto"
              onClick={(e) => {
                e.stopPropagation();
                onConfigure(meta.id);
              }}
              disabled={isDisabled}
            >
              Configure
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
