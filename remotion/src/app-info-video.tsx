import React from 'react';
import {
  AbsoluteFill,
  interpolate,
  useCurrentFrame,
  useVideoConfig,
} from 'remotion';
import {loadFont} from '@remotion/google-fonts/SpaceGrotesk';
import {BORDER, NB, SCENE_BASE, SHADOW, SHADOW_LG} from './design-tokens';
import {FLOW, FlowCard, PILL_TEXT, STATS, StatCard, enter, fade} from './app-info-elements';

const {fontFamily} = loadFont('normal', {weights: ['600', '700'], subsets: ['latin']});

export const AppInfoVideo: React.FC = () => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();

  const titleProgress = enter(frame, fps, -8);
  const subtitleOpacity = fade(frame, 8, 26);
  const lineProgress = fade(frame, 96, 144);
  const footerOpacity = fade(frame, 168, 188);

  return (
    <AbsoluteFill
      style={{
        ...SCENE_BASE,
        fontFamily,
        color: NB.ink,
        padding: '44px 58px',
      }}
    >
      <div
        style={{
          display: 'flex',
          alignItems: 'flex-start',
          justifyContent: 'space-between',
          gap: 28,
        }}
      >
        <div>
          <div
            style={{
              opacity: titleProgress,
              transform: `translateY(${interpolate(titleProgress, [0, 1], [24, 0])}px)`,
              display: 'inline-flex',
              background: NB.yellow,
              border: BORDER,
              boxShadow: SHADOW_LG,
              borderRadius: 8,
              padding: '16px 24px',
              fontSize: 48,
              fontWeight: 700,
              lineHeight: 1.04,
            }}
          >
            Meeting Realtime Translator
          </div>
          <div
            style={{
              opacity: subtitleOpacity,
              marginTop: 18,
              fontSize: 25,
              fontWeight: 700,
              lineHeight: 1.25,
              maxWidth: 760,
            }}
          >
            Speak your language. Your meeting hears the translated audio.
          </div>
        </div>

        <div
          style={{
            opacity: subtitleOpacity,
            background: NB.surface,
            border: BORDER,
            boxShadow: SHADOW,
            borderRadius: 8,
            padding: '14px 18px',
            width: 248,
            fontSize: 15,
            fontWeight: 700,
            lineHeight: 1.35,
          }}
        >
          Chrome / Edge app
          <br />
          OpenAI Realtime
          <br />
          local-only trust model
        </div>
      </div>

      <div
        style={{
          position: 'absolute',
          top: 238,
          left: 58,
          right: 58,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
        }}
      >
        {FLOW.map((step, index) => (
          <React.Fragment key={step.label}>
            <FlowCard step={step} index={index} frame={frame} />
            {index < FLOW.length - 1 && (
              <div
                style={{
                  width: 44,
                  height: 5,
                  background: NB.ink,
                  borderRadius: 999,
                  transform: `scaleX(${lineProgress})`,
                  transformOrigin: 'left center',
                }}
              />
            )}
          </React.Fragment>
        ))}
      </div>

      <div
        style={{
          position: 'absolute',
          left: 58,
          right: 58,
          bottom: 124,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: 18,
        }}
      >
        {STATS.map((stat, index) => (
          <StatCard key={stat.label} stat={stat} index={index} frame={frame} />
        ))}
        <div
          style={{
            flex: 1,
            opacity: fade(frame, 146, 164),
            background: NB.surfaceSunken,
            border: BORDER,
            boxShadow: SHADOW,
            borderRadius: 8,
            padding: '16px 20px',
            fontSize: 17,
            fontWeight: 700,
            lineHeight: 1.35,
          }}
        >
          API key stays out of the browser. The local server mints short-lived credentials.
        </div>
      </div>

      <div
        style={{
          position: 'absolute',
          left: 58,
          right: 58,
          bottom: 44,
          opacity: footerOpacity,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: 12,
        }}
      >
        {PILL_TEXT.map((text) => (
          <div
            key={text}
            style={{
              background: NB.surface,
              border: BORDER,
              boxShadow: SHADOW,
              borderRadius: 999,
              padding: '9px 16px',
              fontSize: 14,
              fontWeight: 700,
              whiteSpace: 'nowrap',
            }}
          >
            {text}
          </div>
        ))}
      </div>
    </AbsoluteFill>
  );
};
