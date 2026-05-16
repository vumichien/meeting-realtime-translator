import React from "react";
import {
  AudioLines,
  Cpu,
  FileText,
  Mic,
  Settings,
  Stethoscope,
  Users,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import type { View } from "./shell-types";

// ─── Nav item definitions ─────────────────────────────────────────────────────

interface NavItem {
  id: View;
  label: string;
  icon: LucideIcon;
}

const NAV_ITEMS: NavItem[] = [
  { id: "translate", label: "Translate", icon: Mic },
  { id: "devices", label: "Devices", icon: AudioLines },
  { id: "profiles", label: "Profiles", icon: Users },
  { id: "providers", label: "Providers", icon: Cpu },
  { id: "diagnostics", label: "Diagnostics", icon: Stethoscope },
  { id: "transcripts", label: "Transcripts", icon: FileText },
  { id: "settings", label: "Settings", icon: Settings },
];

// ─── Component ────────────────────────────────────────────────────────────────

interface SidebarNavProps {
  activeView: View;
  collapsed: boolean;
  onSelect: (view: View) => void;
}

/**
 * Vertical nav list for the sidebar.
 *
 * - Expanded: icon + label, active item uses secondary variant styling.
 * - Collapsed: icon only; label shown in a Tooltip on hover.
 * - Active item gets aria-current="page" for accessibility.
 * - Arrow-key navigation between items for keyboard users.
 */
export function SidebarNav({
  activeView,
  collapsed,
  onSelect,
}: SidebarNavProps): React.JSX.Element {
  const navRef = React.useRef<HTMLElement>(null);

  function handleKeyDown(e: React.KeyboardEvent, index: number): void {
    const items = navRef.current?.querySelectorAll<HTMLButtonElement>(
      "button[data-nav-item]",
    );
    if (!items) return;

    if (e.key === "ArrowDown") {
      e.preventDefault();
      items[(index + 1) % items.length]?.focus();
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      items[(index - 1 + items.length) % items.length]?.focus();
    }
  }

  return (
    <nav
      ref={navRef}
      role="navigation"
      aria-label="Main navigation"
      className="flex flex-col gap-0.5 px-2"
    >
      {NAV_ITEMS.map(({ id, label, icon: Icon }, index) => {
        const isActive = activeView === id;

        const button = (
          <Button
            key={id}
            data-nav-item
            variant={isActive ? "secondary" : "ghost"}
            aria-current={isActive ? "page" : undefined}
            onClick={() => onSelect(id)}
            onKeyDown={(e) => handleKeyDown(e, index)}
            className={cn(
              "w-full justify-start gap-3 px-2 font-normal",
              collapsed && "justify-center px-0",
            )}
          >
            <Icon className="h-4 w-4 shrink-0" aria-hidden="true" />
            {collapsed ? (
              // Hidden visually but readable by screen readers in non-collapsed state
              <span className="sr-only">{label}</span>
            ) : (
              <span>{label}</span>
            )}
          </Button>
        );

        // Wrap with tooltip only in collapsed mode to show label on hover
        if (collapsed) {
          return (
            <Tooltip key={id}>
              <TooltipTrigger asChild>{button}</TooltipTrigger>
              <TooltipContent side="right">{label}</TooltipContent>
            </Tooltip>
          );
        }

        return button;
      })}
    </nav>
  );
}
