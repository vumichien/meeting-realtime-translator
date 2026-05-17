import React, { useCallback, useState } from "react";
import { Toaster } from "@/components/ui/sonner";
import {
  TooltipProvider,
} from "@/components/ui/tooltip";
import { useMediaQuery } from "@/lib/use-media-query";
import { useKeyboardShortcut } from "@/lib/use-keyboard-shortcut";
import { Sidebar } from "./sidebar";
import { SidebarNav } from "./sidebar-nav";
import { SessionPill } from "./session-pill";
import { ScreenHeader } from "./screen-header";
import { ScreenRouter, VIEW_TITLES } from "./screen-router";
import { ThemeToggle } from "./theme-toggle";
import type { View } from "./shell-types";

// Re-export View so callers can import it from app-shell if preferred
export type { View };

/**
 * Root application shell.
 *
 * Layout: sidebar (fixed left) + scrollable main content area.
 * State-based routing — no router library.
 *
 * Sidebar behaviour:
 *  - Manual toggle via header button or Cmd/Ctrl+B
 *  - Auto-collapses when viewport < 900px; restores when ≥ 900px
 *    unless the user has manually toggled since the last auto event.
 */
export function AppShell(): React.JSX.Element {
  const [view, setView] = useState<View>("translate");
  const [collapsed, setCollapsed] = useState(false);
  // Track whether the user manually overrode the responsive auto-collapse
  const [manualOverride, setManualOverride] = useState(false);

  const isMobile = useMediaQuery("(max-width: 899px)");

  // Sync collapsed state with viewport width, respecting manual override
  React.useEffect(() => {
    if (manualOverride) return;
    setCollapsed(isMobile);
  }, [isMobile, manualOverride]);

  const toggleCollapsed = useCallback(() => {
    setManualOverride(true);
    setCollapsed((prev) => !prev);
  }, []);

  // Cmd/Ctrl+B shortcut — ignored inside INPUT/TEXTAREA (enforced by hook)
  useKeyboardShortcut("mod+b", toggleCollapsed);

  return (
    // TooltipProvider is required at an ancestor of all Tooltip usage
    <TooltipProvider delayDuration={300}>
      {/* Sonner toast host — top-right, rich color variants */}
      <Toaster position="top-right" richColors />

      <div className="flex h-dvh overflow-hidden bg-background text-foreground">
        <Sidebar collapsed={collapsed} onToggle={toggleCollapsed}>
          {/* Nav fills available space */}
          <div className="flex-1 overflow-y-auto py-2">
            <SidebarNav
              activeView={view}
              collapsed={collapsed}
              onSelect={setView}
            />
          </div>

          {/* Session status footer */}
          <div className="shrink-0 border-t border-border">
            <SessionPill collapsed={collapsed} />
          </div>
        </Sidebar>

        {/* Main content */}
        <main className="flex flex-1 flex-col overflow-hidden">
          <ScreenHeader
            title={VIEW_TITLES[view]}
            actions={<ThemeToggle />}
          />
          <div className="flex-1 overflow-y-auto">
            <ScreenRouter view={view} />
          </div>
        </main>
      </div>
    </TooltipProvider>
  );
}
