import React from 'react';
import {AbsoluteFill, useCurrentFrame, useVideoConfig, spring, interpolate} from 'remotion';
import {loadFont} from '@remotion/google-fonts/SpaceGrotesk';
import {NB, BORDER, SHADOW_LG, SHADOW, SCENE_BASE} from '../design-tokens';

const {fontFamily} = loadFont('normal', {weights: ['600', '700'], subsets: ['latin']});

type Feature = {icon: string; title: string; desc: string; color: string; delay: number};

const FEATURES: Feature[] = [
  {
    icon: '🌍',
    title: '70+ Languages',
    desc: 'Auto-detects your source language — no manual config needed.',
    color: NB.yellow,
    delay: 10,
  },
  {
    icon: '⚡',
    title: 'Real-time Captions',
    desc: 'Side-by-side source & translation captions as you speak.',
    color: NB.cyan,
    delay: 38,
  },
  {
    icon: '🔒',
    title: 'Local-only, Private',
    desc: 'Backend runs on your machine. Your key never leaves.',
    color: NB.green,
    delay: 66,
  },
];

function FeatureCard({f, frame, fps}: {f: Feature; frame: number; fps: number}) {
  const s = spring({frame: frame - f.delay, fps, config: {damping: 14, stiffness: 180}});
  return (
    <div
      style={{
        flex: 1,
        opacity: s,
        transform: `translateY(${interpolate(s, [0, 1], [56, 0])}px) scale(${interpolate(s, [0, 1], [0.82, 1])})`,
        background: f.color,
        border: BORDER,
        boxShadow: SHADOW_LG,
        borderRadius: 10,
        padding: '28px 24px',
        display: 'flex',
        flexDirection: 'column',
        gap: 14,
      }}
    >
      <span style={{fontSize: 46}}>{f.icon}</span>
      <div>
        <div style={{fontSize: 24, fontWeight: 700, color: NB.ink, lineHeight: 1.15}}>
          {f.title}
        </div>
        <div
          style={{
            fontSize: 15,
            color: NB.inkSoft,
            fontWeight: 600,
            marginTop: 8,
            lineHeight: 1.45,
          }}
        >
          {f.desc}
        </div>
      </div>
    </div>
  );
}

export const FeaturesScene: React.FC = () => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();

  const labelS = spring({frame, fps, config: {damping: 200}});

  return (
    <AbsoluteFill
      style={{
        ...SCENE_BASE,
        fontFamily,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 40,
        padding: '60px 80px',
      }}
    >
      {/* Section label */}
      <div
        style={{
          opacity: labelS,
          transform: `translateY(${interpolate(labelS, [0, 1], [-16, 0])}px)`,
          background: NB.mint,
          border: BORDER,
          boxShadow: SHADOW,
          padding: '5px 14px',
          borderRadius: 6,
          fontSize: 13,
          fontWeight: 700,
          color: NB.ink,
          textTransform: 'uppercase' as const,
          letterSpacing: '0.1em',
        }}
      >
        Key Features
      </div>

      {/* Cards row */}
      <div style={{display: 'flex', gap: 24, width: '100%', alignItems: 'stretch'}}>
        {FEATURES.map((f) => (
          <FeatureCard key={f.title} f={f} frame={frame} fps={fps} />
        ))}
      </div>
    </AbsoluteFill>
  );
};
