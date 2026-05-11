import React from 'react';
import {AbsoluteFill, useCurrentFrame, useVideoConfig, spring, interpolate} from 'remotion';
import {loadFont} from '@remotion/google-fonts/SpaceGrotesk';
import {NB, BORDER, SHADOW_LG, SHADOW, SCENE_BASE} from '../design-tokens';

const {fontFamily} = loadFont('normal', {weights: ['700'], subsets: ['latin']});

export const TitleScene: React.FC = () => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();

  const iconScale = spring({frame, fps, config: {damping: 8}, durationInFrames: 30});
  const cardEntrance = spring({frame: frame - 8, fps, config: {damping: 200}});
  const badgeOpacity = interpolate(frame, [35, 55], [0, 1], {extrapolateRight: 'clamp'});
  const badgeY = interpolate(frame, [35, 55], [16, 0], {extrapolateRight: 'clamp'});

  return (
    <AbsoluteFill
      style={{
        ...SCENE_BASE,
        fontFamily,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 24,
      }}
    >
      {/* Mic icon — bouncy spring entrance */}
      <div style={{fontSize: 72, lineHeight: 1, transform: `scale(${iconScale})`}}>
        🎙️
      </div>

      {/* Yellow title card — slides up */}
      <div
        style={{
          opacity: cardEntrance,
          transform: `translateY(${interpolate(cardEntrance, [0, 1], [40, 0])}px) rotate(-0.6deg)`,
          background: NB.yellow,
          border: BORDER,
          boxShadow: SHADOW_LG,
          padding: '20px 44px',
          borderRadius: 10,
        }}
      >
        <h1
          style={{
            margin: 0,
            fontSize: 62,
            fontWeight: 700,
            color: NB.ink,
            letterSpacing: '-0.03em',
            lineHeight: 1.1,
            textAlign: 'center',
          }}
        >
          Meeting Realtime
          <br />
          Translator
        </h1>
      </div>

      {/* "Powered by" badge */}
      <div
        style={{
          opacity: badgeOpacity,
          transform: `translateY(${badgeY}px)`,
          background: NB.violet,
          border: BORDER,
          boxShadow: SHADOW,
          padding: '8px 20px',
          borderRadius: 6,
          fontSize: 18,
          fontWeight: 700,
          color: NB.ink,
        }}
      >
        Powered by OpenAI Realtime
      </div>
    </AbsoluteFill>
  );
};
