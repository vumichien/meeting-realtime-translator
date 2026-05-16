// First-run hero card shown when no session has started and transcript is empty.
// Displays a 3-item checklist (mic, output, provider) and a "Start translating"
// button that enables only when all checks pass.

import React from "react";
import { CheckCircle2, Circle, Mic, Volume2, Cpu } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";

export interface ChecklistItem {
  label: string;
  done: boolean;
  icon: React.ReactNode;
}

interface FirstRunHeroProps {
  micDone: boolean;
  outputDone: boolean;
  providerDone: boolean;
  onStart: () => void;
}

function CheckRow({ item }: { item: ChecklistItem }): React.JSX.Element {
  return (
    <div className="flex items-center gap-3 py-2">
      <span className="shrink-0 text-muted-foreground">{item.icon}</span>
      <span className={cn("flex-1 text-sm", item.done ? "text-foreground" : "text-muted-foreground")}>
        {item.label}
      </span>
      {item.done ? (
        <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-500" aria-label="Done" />
      ) : (
        <Circle className="h-4 w-4 shrink-0 text-muted-foreground/50" aria-label="Pending" />
      )}
    </div>
  );
}

/**
 * Centered hero card for first-time users.
 * Shows checklist of prerequisites and a start button.
 */
export function FirstRunHero({ micDone, outputDone, providerDone, onStart }: FirstRunHeroProps): React.JSX.Element {
  const allDone = micDone && outputDone && providerDone;

  const items: ChecklistItem[] = [
    { label: "Microphone selected", done: micDone, icon: <Mic className="h-4 w-4" /> },
    { label: "Output device selected", done: outputDone, icon: <Volume2 className="h-4 w-4" /> },
    { label: "Provider configured", done: providerDone, icon: <Cpu className="h-4 w-4" /> },
  ];

  const missingItems = items.filter((i) => !i.done).map((i) => i.label);
  const tooltipText = missingItems.length > 0
    ? `Still needed: ${missingItems.join(", ")}`
    : "All set — ready to start!";

  return (
    <div className="flex flex-1 items-center justify-center p-8">
      <Card className="w-full max-w-sm shadow-md">
        <CardHeader className="text-center">
          <CardTitle className="text-xl">Ready to translate</CardTitle>
          <CardDescription>Complete the steps below to start a live session.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-1">
          <div className="divide-y divide-border rounded-md border bg-muted/30 px-3">
            {items.map((item) => (
              <CheckRow key={item.label} item={item} />
            ))}
          </div>

          <div className="pt-4">
            <Tooltip>
              <TooltipTrigger asChild>
                {/* Wrapper span allows tooltip on disabled button */}
                <span className="block w-full">
                  <Button
                    className="w-full"
                    size="lg"
                    disabled={!allDone}
                    onClick={onStart}
                    aria-label={allDone ? "Start translating" : tooltipText}
                  >
                    Start translating
                  </Button>
                </span>
              </TooltipTrigger>
              {!allDone && (
                <TooltipContent>{tooltipText}</TooltipContent>
              )}
            </Tooltip>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
