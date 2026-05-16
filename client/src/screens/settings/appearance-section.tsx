// appearance-section.tsx — Color mode and surface style settings.
// Translucent surface option hidden on Linux (window.electron?.platform === 'linux').
// Binds to useTheme() for immediate effect without page reload.

import React from "react";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { useTheme } from "@/components/theme/theme-provider";
import type { ColorMode, SurfaceStyle } from "@/components/theme/theme-provider";

const COLOR_MODES: { value: ColorMode; label: string; description: string }[] = [
  { value: "light", label: "Light", description: "Always use light mode" },
  { value: "dark", label: "Dark", description: "Always use dark mode" },
  { value: "system", label: "System", description: "Follow OS preference" },
];

const SURFACE_STYLES: { value: SurfaceStyle; label: string; description: string }[] = [
  { value: "solid", label: "Solid", description: "Opaque background" },
  { value: "translucent", label: "Translucent", description: "Glass / acrylic effect (requires OS support)" },
];

export function AppearanceSection(): React.JSX.Element {
  const { colorMode, surfaceStyle, setColorMode, setSurfaceStyle } = useTheme();
  const isLinux = window.electron?.platform === "linux";

  return (
    <div className="flex flex-col gap-6">
      {/* Color mode */}
      <div>
        <p className="text-sm font-medium mb-3">Color mode</p>
        <RadioGroup
          value={colorMode}
          onValueChange={(v) => setColorMode(v as ColorMode)}
          className="flex flex-col gap-2"
        >
          {COLOR_MODES.map(({ value, label, description }) => (
            <label
              key={value}
              className="flex items-center gap-3 rounded-md border px-3 py-2.5 cursor-pointer hover:bg-accent/50 has-[[data-state=checked]]:border-primary has-[[data-state=checked]]:bg-accent/30"
            >
              <RadioGroupItem value={value} />
              <div>
                <span className="text-sm font-medium">{label}</span>
                <p className="text-xs text-muted-foreground">{description}</p>
              </div>
            </label>
          ))}
        </RadioGroup>
      </div>

      {/* Surface style — hidden on Linux */}
      {!isLinux && (
        <div>
          <p className="text-sm font-medium mb-3">Surface style</p>
          <RadioGroup
            value={surfaceStyle}
            onValueChange={(v) => setSurfaceStyle(v as SurfaceStyle)}
            className="flex flex-col gap-2"
          >
            {SURFACE_STYLES.map(({ value, label, description }) => (
              <label
                key={value}
                className="flex items-center gap-3 rounded-md border px-3 py-2.5 cursor-pointer hover:bg-accent/50 has-[[data-state=checked]]:border-primary has-[[data-state=checked]]:bg-accent/30"
              >
                <RadioGroupItem value={value} />
                <div>
                  <span className="text-sm font-medium">{label}</span>
                  <p className="text-xs text-muted-foreground">{description}</p>
                </div>
              </label>
            ))}
          </RadioGroup>
        </div>
      )}
    </div>
  );
}
