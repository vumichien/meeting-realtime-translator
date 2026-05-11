import React from 'react';
import {AbsoluteFill, useCurrentFrame, useVideoConfig, spring, interpolate} from 'remotion';
import {loadFont} from '@remotion/google-fonts/SpaceGrotesk';
import {NB, BORDER, SHADOW_LG, SHADOW, SCENE_BASE} from '../design-tokens';

const {fontFamily} = loadFont('normal', {weights: ['700'], subsets: ['latin']});

const TAGS = ['Open Source', 'MIT License', 'BYO OpenAI Key', 'Chrome / Edge'];

export const OutroScene: React.FC = () => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();

  const titleS = spring({frame, fps, config: {damping: 200}});
  const ctaS = spring({frame: frame - 12, fps, config: {damping: 14, stiffness: 180}});
  const tagsOpacity = interpolate(frame, [38, 58], [0, 1], {extrapolateRight: 'clamp'});

  return (
    <AbsoluteFill
      style={{
        ...SCENE_BASE,
        fontFamily,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 28,
      }}
    >
      {/* Heading */}
      <div
        style={{
          opacity: titleS,
          transform: `translateY(${interpolate(titleS, [0, 1], [-22, 0])}px)`,
          fontSize: 38,
          fontWeight: 700,
          color: NB.ink,
          letterSpacing: '-0.02em',
        }}
      >
        Ready to translate?
      </div>

      {/* CTA card */}
      <div
        style={{
          opacity: ctaS,
          transform: `scale(${interpolate(ctaS, [0, 1], [0.72, 1])})`,
          background: NB.yellow,
          border: BORDER,
          boxShadow: SHADOW_LG,
          borderRadius: 10,
          padding: '18px 44px',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: 8,
        }}
      >
        <div style={{fontSize: 15, fontWeight: 700, color: NB.inkSoft, letterSpacing: '0.06em', textTransform: 'uppercase' as const}}>
          Get started
        </div>
        <div style={{fontSize: 28, fontWeight: 700, color: NB.ink, letterSpacing: '-0.02em', fontFamily: '"JetBrains Mono", monospace'}}>
          npm run dev
        </div>
        <div style={{fontSize: 14, fontWeight: 600, color: NB.inkSoft}}>
          localhost:5173 · Chrome or Edge
        </div>
      </div>

      {/* Tag pills */}
      <div
        style={{
          opacity: tagsOpacity,
          display: 'flex',
          gap: 10,
          flexWrap: 'wrap' as const,
          justifyContent: 'center',
        }}
      >
        {TAGS.map((tag) => (
          <div
            key={tag}
            style={{
              background: NB.surface,
              border: BORDER,
              boxShadow: SHADOW,
              borderRadius: 999,
              padding: '6px 16px',
              fontSize: 13,
              fontWeight: 700,
              color: NB.ink,
            }}
          >
            {tag}
          </div>
        ))}
      </div>
    </AbsoluteFill>
  );
};
