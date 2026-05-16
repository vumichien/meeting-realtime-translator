import React from "react";
import { Monitor, Moon, Sun } from "lucide-react";
import { useTheme } from "@/components/theme/theme-provider";
import type { ColorMode } from "@/components/theme/theme-provider";
import { Button } from "@/components/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";

// Cycle order: light → dark → system → light …
const CYCLE: ColorMode[] = ["light", "dark", "system"];

const MODE_META: Record<ColorMode, { label: string; Icon: React.ElementType }> =
  {
    light: { label: "Light mode", Icon: Sun },
    dark: { label: "Dark mode", Icon: Moon },
    system: { label: "System mode", Icon: Monitor },
  };

/**
 * Icon button that cycles color mode: Light → Dark → System.
 * Reads and writes via useTheme() from Phase 1's ThemeProvider.
 */
export function ThemeToggle(): React.JSX.Element {
  const { colorMode, setColorMode } = useTheme();

  function handleClick(): void {
    const idx = CYCLE.indexOf(colorMode);
    const next = CYCLE[(idx + 1) % CYCLE.length];
    setColorMode(next);
  }

  const { label, Icon } = MODE_META[colorMode];

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          onClick={handleClick}
          aria-label={label}
          className="h-8 w-8"
        >
          <Icon className="h-4 w-4" />
        </Button>
      </TooltipTrigger>
      <TooltipContent side="bottom">{label}</TooltipContent>
    </Tooltip>
  );
}
