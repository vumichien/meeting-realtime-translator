import React from "react";
import { cn } from "@/lib/utils";

interface ScreenHeaderProps {
  title: string;
  /** Optional action buttons rendered in the top-right corner (e.g. ThemeToggle) */
  actions?: React.ReactNode;
  className?: string;
}

/**
 * Sticky top bar for each screen — shows the current view title and
 * an optional actions slot (theme toggle, etc.).
 */
export function ScreenHeader({
  title,
  actions,
  className,
}: ScreenHeaderProps): React.JSX.Element {
  return (
    <header
      className={cn(
        "sticky top-0 z-10 flex h-12 items-center justify-between border-b border-border bg-background/80 px-4 backdrop-blur-sm",
        className,
      )}
    >
      <h2 className="text-sm font-semibold text-foreground">{title}</h2>
      {actions && <div className="flex items-center gap-2">{actions}</div>}
    </header>
  );
}
