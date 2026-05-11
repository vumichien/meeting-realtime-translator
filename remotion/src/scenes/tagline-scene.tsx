import React from 'react';
import {AbsoluteFill, useCurrentFrame, useVideoConfig, spring, interpolate} from 'remotion';
import {loadFont} from '@remotion/google-fonts/SpaceGrotesk';
import {NB, BORDER, SHADOW_LG, SHADOW, SCENE_BASE} from '../design-tokens';

const {fontFamily} = loadFont('normal', {weights: ['600', '700'], subsets: ['latin']});

const LINE1 = 'Speak your language.';
const LINE2 = 'Zoom hears yours.';
const CHARS_PER_FRAME = 1.4;

export const TaglineScene: React.FC = () => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();

  const labelEntrance = spring({frame, fps, config: {damping: 200}});

  // Typewriter — string slicing, not per-character opacity
  const line1Chars = Math.floor(Math.max(0, frame - 18) * CHARS_PER_FRAME);
  const line2Chars = Math.floor(Math.max(0, frame - 52) * CHARS_PER_FRAME);
  const line1 = LINE1.slice(0, line1Chars);
  const line2 = LINE2.slice(0, line2Chars);

  const cursor = frame % 18 < 9; // blinking cursor
  const subtitleOpacity = interpolate(frame, [72, 92], [0, 1], {extrapolateRight: 'clamp'});

  return (
    <AbsoluteFill
      style={{
        ...SCENE_BASE,
        fontFamily,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 32,
        padding: '60px 80px',
      }}
    >
      {/* Section label */}
      <div
        style={{
          opacity: labelEntrance,
          transform: `translateY(${interpolate(labelEntrance, [0, 1], [-16, 0])}px)`,
          background: NB.pink,
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
        What it does
      </div>

      {/* Typewriter lines */}
      <div style={{display: 'flex', flexDirection: 'column', gap: 12, alignItems: 'center'}}>
        <div
          style={{
            fontSize: 68,
            fontWeight: 700,
            color: NB.ink,
            letterSpacing: '-0.03em',
            lineHeight: 1.05,
            minHeight: 80,
          }}
        >
          {line1}
          {line1Chars < LINE1.length && cursor && (
            <span style={{opacity: 0.7}}>|</span>
          )}
        </div>
        <div
          style={{
            fontSize: 68,
            fontWeight: 700,
            color: NB.ink,
            letterSpacing: '-0.03em',
            lineHeight: 1.05,
            minHeight: 80,
          }}
        >
          {line2}
          {line2Chars > 0 && line2Chars < LINE2.length && cursor && (
            <span style={{opacity: 0.7}}>|</span>
          )}
        </div>
      </div>

      {/* Sub-caption */}
      <div
        style={{
          opacity: subtitleOpacity,
          background: NB.surfaceSunken,
          border: BORDER,
          boxShadow: SHADOW_LG,
          padding: '8px 20px',
          borderRadius: 999,
          fontSize: 17,
          fontWeight: 600,
          color: NB.inkSoft,
          textAlign: 'center' as const,
        }}
      >
        Auto-detects 70+ source languages · Local-only · BYO OpenAI key
      </div>
    </AbsoluteFill>
  );
};
