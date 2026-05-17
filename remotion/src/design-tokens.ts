import {CSSProperties} from 'react';
import {Easing, interpolate, spring} from 'remotion';

export const FPS = 30;

export const SCENE = {
  title: 72,
  tagline: 54,
  flow: 108,
  features: 0,
  outro: 60,
  appInfoOutro: 78,
} as const;

export const UI = {
  background: '#ffffff',
  card: '#ffffff',
  muted: '#f8fafc',
  secondary: '#f1f5f9',
  border: '#e2e8f0',
  text: '#0f172a',
  textMuted: '#64748b',
  textFaint: '#94a3b8',
  primary: '#111827',
  primaryText: '#ffffff',
  danger: '#ef4444',
  success: '#10b981',
} as const;

export const LAYOUT = {
  radius: 8,
  shellWidth: 1280,
  shellHeight: 720,
  sidebarWidth: 135,
  headerHeight: 48,
  controlHeight: 55,
} as const;

export const TYPE = {
  body: 'Inter, Arial, sans-serif',
  mono: 'JetBrains Mono, Consolas, monospace',
} as const;

export const fadeIn = (frame: number, from: number, to: number) =>
  interpolate(frame, [from, to], [0, 1], {
    easing: Easing.out(Easing.quad),
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });

export const rise = (frame: number, fps: number, delay = 0) =>
  spring({
    frame: frame - delay,
    fps,
    config: {damping: 200},
    durationInFrames: 24,
  });

export const appFrame: CSSProperties = {
  background: UI.background,
  borderRadius: 0,
  overflow: 'hidden',
};

export const card: CSSProperties = {
  background: UI.card,
  border: `1px solid ${UI.border}`,
  borderRadius: LAYOUT.radius,
};

export const control: CSSProperties = {
  ...card,
  background: UI.background,
};

export const sceneBackground = (): CSSProperties => ({
  background: UI.background,
});

// Compatibility aliases for older imports.
export const VIDEO_COLORS = {light: UI, dark: UI} as const;
export const color = (_progress: number, key: keyof typeof UI) => UI[key];
export const themeProgress = () => 0;
export const glassSurface = (): CSSProperties => card;
export const iconCircle = (): CSSProperties => ({
  alignItems: 'center',
  border: `1px solid ${UI.border}`,
  borderRadius: 999,
  color: UI.textMuted,
  display: 'flex',
  fontSize: 11,
  fontWeight: 700,
  height: 28,
  justifyContent: 'center',
  width: 28,
});
export const NB = {
  bg: UI.background,
  bgGrid: UI.border,
  surface: UI.card,
  surfaceSunken: UI.secondary,
  ink: UI.text,
  inkSoft: UI.textMuted,
  muted: UI.textMuted,
  yellow: UI.background,
  green: UI.background,
  mint: UI.background,
  cyan: UI.background,
  pink: UI.background,
  violet: UI.background,
  orange: UI.background,
} as const;
export const BORDER = `1px solid ${UI.border}`;
export const SHADOW = '0 12px 28px rgba(15, 23, 42, 0.08)';
export const SHADOW_LG = '0 24px 70px rgba(15, 23, 42, 0.12)';
export const SHADOW_SM = '0 8px 20px rgba(15, 23, 42, 0.06)';
export const SCENE_BASE: CSSProperties = sceneBackground();
