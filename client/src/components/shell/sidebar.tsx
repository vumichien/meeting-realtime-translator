import React from "react";
import { PanelLeftClose, PanelLeftOpen } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

interface SidebarProps {
  collapsed: boolean;
  onToggle: () => void;
  children: React.ReactNode;
  className?: string;
}

/**
 * Fixed-left sidebar shell.
 *
 * Width: 220px expanded / 64px collapsed.
 * Transition: transition-[width] duration-200 (width only, avoids layout jank).
 * Children are expected to be: brand area (top), nav (middle), footer (bottom).
 */
export function Sidebar({
  collapsed,
  onToggle,
  children,
  className,
}: SidebarProps): React.JSX.Element {
  return (
    <aside
      aria-label="Sidebar"
      className={cn(
        "flex h-full flex-col border-r border-border bg-card",
        "transition-[width] duration-200 overflow-hidden shrink-0",
        collapsed ? "w-16" : "w-[220px]",
        className,
      )}
    >
      {/* Brand / logo row with collapse toggle */}
      <div
        className={cn(
          "flex h-12 shrink-0 items-center border-b border-border px-2",
          collapsed ? "justify-center" : "justify-between px-3",
        )}
      >
        {!collapsed && (
          <span className="truncate text-sm font-semibold text-foreground">
            Babel Mic
          </span>
        )}

        <Button
          variant="ghost"
          size="icon"
          onClick={onToggle}
          aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
          className="h-8 w-8 shrink-0"
        >
          {collapsed ? (
            <PanelLeftOpen className="h-4 w-4" />
          ) : (
            <PanelLeftClose className="h-4 w-4" />
          )}
        </Button>
      </div>

      {/* Nav + footer children fill remaining height */}
      <div className="flex flex-1 flex-col overflow-hidden">{children}</div>
    </aside>
  );
}
