import {CSSProperties} from 'react';

// Colors sourced from client/src/styles.css neobrutalism theme
export const NB = {
  bg: '#fdf6e3',
  bgGrid: '#f0e7c8',
  surface: '#ffffff',
  surfaceSunken: '#fffbe8',
  ink: '#0a0a0a',
  inkSoft: '#2a2a2a',
  muted: '#6b6b6b',
  yellow: '#ffd93d',
  green: '#6bcb77',
  mint: '#b5e48c',
  cyan: '#4ecdc4',
  pink: '#ff8fa3',
  violet: '#b197fc',
  orange: '#ffa94d',
} as const;

export const BORDER = `3px solid ${NB.ink}`;
export const SHADOW = `4px 4px 0 0 ${NB.ink}`;
export const SHADOW_LG = `6px 6px 0 0 ${NB.ink}`;
export const SHADOW_SM = `2px 2px 0 0 ${NB.ink}`;

// Shared scene background — cream + dot-grid matching the app
export const SCENE_BASE: CSSProperties = {
  background: NB.bg,
  backgroundImage: `radial-gradient(${NB.bgGrid} 1.4px, transparent 1.4px)`,
  backgroundSize: '24px 24px',
  backgroundPosition: '-12px -12px',
};

export const FPS = 30;
// Scene durations in frames
export const SCENE = {
  title: 120,    // 4s
  tagline: 120,  // 4s
  flow: 210,     // 7s
  features: 150, // 5s
  outro: 90,     // 3s
  transition: 15,
} as const;
