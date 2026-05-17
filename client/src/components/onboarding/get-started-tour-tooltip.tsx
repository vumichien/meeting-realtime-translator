import React from "react";
import type { TooltipRenderProps } from "react-joyride";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

export function TourTooltip({
  backProps,
  index,
  isLastStep,
  primaryProps,
  size,
  skipProps,
  step,
  tooltipProps,
}: TooltipRenderProps): React.JSX.Element {
  const isWelcome = index === 0;
  const featureStepCount = size - 1;

  return (
    <div
      {...tooltipProps}
      className="w-72 rounded-lg border border-border bg-popover p-4 shadow-xl"
    >
      <div className="mb-2 flex items-start justify-between gap-2">
        <p className="text-sm font-semibold leading-snug text-popover-foreground">
          {step.title as string}
        </p>
        {!isWelcome && (
          <Badge variant="secondary" className="shrink-0 tabular-nums text-xs">
            {index} / {featureStepCount}
          </Badge>
        )}
      </div>
      <div className="mb-4 text-sm text-muted-foreground">
        {step.content as React.ReactNode}
      </div>
      <div className="flex items-center justify-between gap-2">
        <Button
          {...skipProps}
          variant="ghost"
          size="sm"
          className="text-muted-foreground hover:text-foreground"
        >
          {isWelcome ? "Skip tour" : "Skip"}
        </Button>
        <div className="flex gap-2">
          {!isWelcome && (
            <Button {...backProps} variant="outline" size="sm">
              Back
            </Button>
          )}
          <Button {...primaryProps} size="sm">
            {isWelcome ? "Take the tour" : isLastStep ? "Done" : "Next"}
          </Button>
        </div>
      </div>
    </div>
  );
}
