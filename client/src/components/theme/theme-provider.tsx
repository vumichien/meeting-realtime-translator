import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
} from "react";

// ─── Types ────────────────────────────────────────────────────────────────────

export type ColorMode = "light" | "dark" | "system";
export type SurfaceStyle = "solid" | "translucent";

export interface ThemeContextValue {
  colorMode: ColorMode;
  surfaceStyle: SurfaceStyle;
  setColorMode: (mode: ColorMode) => void;
  setSurfaceStyle: (style: SurfaceStyle) => void;
}

// ─── Storage keys (project namespace convention) ──────────────────────────────

const STORAGE_COLOR_MODE = "mt.theme.color_mode";
const STORAGE_SURFACE_STYLE = "mt.theme.surface_style";

// ─── Context ─────────────────────────────────────────────────────────────────

const ThemeContext = createContext<ThemeContextValue | null>(null);

// ─── Helpers ─────────────────────────────────────────────────────────────────

function readStorage<T extends string>(key: string, fallback: T): T {
  try {
    return (localStorage.getItem(key) as T | null) ?? fallback;
  } catch {
    return fallback;
  }
}

function resolveIsDark(mode: ColorMode): boolean {
  if (mode === "dark") return true;
  if (mode === "light") return false;
  return window.matchMedia("(prefers-color-scheme: dark)").matches;
}

function applyClasses(isDark: boolean, surface: SurfaceStyle): void {
  const root = document.documentElement;
  root.classList.toggle("dark", isDark);
  root.classList.toggle("translucent", surface === "translucent");
}

// ─── Provider ─────────────────────────────────────────────────────────────────

interface ThemeProviderProps {
  children: React.ReactNode;
  defaultColorMode?: ColorMode;
  defaultSurfaceStyle?: SurfaceStyle;
}

export function ThemeProvider({
  children,
  defaultColorMode = "system",
  defaultSurfaceStyle = "translucent",
}: ThemeProviderProps): React.JSX.Element {
  const platform = window.electron?.platform;
  const resolvedSurfaceDefault =
    platform === "linux" ? "solid" : defaultSurfaceStyle;

  const [colorMode, setColorModeState] = useState<ColorMode>(() =>
    readStorage<ColorMode>(STORAGE_COLOR_MODE, defaultColorMode),
  );

  const [surfaceStyle, setSurfaceStyleState] = useState<SurfaceStyle>(() =>
    readStorage<SurfaceStyle>(STORAGE_SURFACE_STYLE, resolvedSurfaceDefault),
  );

  // Apply CSS classes whenever color mode or surface style changes.
  useEffect(() => {
    applyClasses(resolveIsDark(colorMode), surfaceStyle);
  }, [colorMode, surfaceStyle]);

  // Sync surface style to native window (vibrancy / Mica) on every change
  // and once on mount to restore the persisted preference after app restart.
  useEffect(() => {
    void window.electron?.setSurfaceStyle?.(surfaceStyle);
  }, [surfaceStyle]);

  // Listen to OS preference changes when mode is "system"
  useEffect(() => {
    if (colorMode !== "system") return;

    const mq = window.matchMedia("(prefers-color-scheme: dark)");

    const handler = (e: MediaQueryListEvent): void => {
      applyClasses(e.matches, surfaceStyle);
    };

    mq.addEventListener("change", handler);
    return () => mq.removeEventListener("change", handler);
  }, [colorMode, surfaceStyle]);

  const setColorMode = useCallback((mode: ColorMode): void => {
    try {
      localStorage.setItem(STORAGE_COLOR_MODE, mode);
    } catch {
      // localStorage unavailable (private browsing / Electron sandbox) — continue
    }
    setColorModeState(mode);
  }, []);

  const setSurfaceStyle = useCallback((style: SurfaceStyle): void => {
    try {
      localStorage.setItem(STORAGE_SURFACE_STYLE, style);
    } catch {
      // localStorage unavailable — continue
    }
    setSurfaceStyleState(style);
  }, []);

  return (
    <ThemeContext.Provider
      value={{ colorMode, surfaceStyle, setColorMode, setSurfaceStyle }}
    >
      {children}
    </ThemeContext.Provider>
  );
}

// ─── Hook ─────────────────────────────────────────────────────────────────────

export function useTheme(): ThemeContextValue {
  const ctx = useContext(ThemeContext);
  if (!ctx) {
    throw new Error("useTheme must be used within a <ThemeProvider>");
  }
  return ctx;
}
