import React from 'react';
import {
  Easing,
  interpolate,
  spring,
  useVideoConfig,
} from 'remotion';
import {BORDER, NB, SHADOW} from './design-tokens';

type FlowStep = {
  label: string;
  sub: string;
  icon: string;
  color: string;
};

type Stat = {
  value: string;
  label: string;
  color: string;
};

export const FLOW: FlowStep[] = [
  {label: 'Real mic', sub: 'you speak naturally', icon: '🎙️', color: NB.pink},
  {label: 'Babel Mic', sub: 'browser WebRTC', icon: '🌐', color: NB.cyan},
  {label: 'OpenAI', sub: 'realtime translate', icon: '✨', color: NB.violet},
  {label: 'Virtual cable', sub: 'routes audio out', icon: '🔌', color: NB.mint},
  {label: 'Zoom / Meet', sub: 'hears target language', icon: '💬', color: NB.yellow},
];

export const STATS: Stat[] = [
  {value: '70+', label: 'source languages', color: NB.yellow},
  {value: '13', label: 'target languages', color: NB.cyan},
  {value: '1-3s', label: 'typical latency', color: NB.green},
];

export const PILL_TEXT = [
  'Local backend',
  'BYO OpenAI key',
  'Side-by-side captions',
  'Debug panel',
];

export const enter = (frame: number, fps: number, delay: number) =>
  spring({frame: frame - delay, fps, config: {damping: 200}, durationInFrames: 26});

export const fade = (frame: number, from: number, to: number) =>
  interpolate(frame, [from, to], [0, 1], {
    easing: Easing.out(Easing.quad),
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });

export const FlowCard: React.FC<{step: FlowStep; index: number; frame: number}> = ({
  step,
  index,
  frame,
}) => {
  const {fps} = useVideoConfig();
  const progress = enter(frame, fps, 54 + index * 10);

  return (
    <div
      style={{
        width: 172,
        height: 142,
        opacity: progress,
        transform: `translateY(${interpolate(progress, [0, 1], [26, 0])}px)`,
        background: step.color,
        border: BORDER,
        boxShadow: SHADOW,
        borderRadius: 8,
        padding: 14,
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'space-between',
        alignItems: 'center',
      }}
    >
      <div style={{fontSize: 34, lineHeight: 1}}>{step.icon}</div>
      <div style={{textAlign: 'center'}}>
        <div style={{fontSize: 18, fontWeight: 700, color: NB.ink, lineHeight: 1.15}}>
          {step.label}
        </div>
        <div
          style={{
            fontSize: 12,
            fontWeight: 600,
            color: NB.inkSoft,
            lineHeight: 1.25,
            marginTop: 6,
          }}
        >
          {step.sub}
        </div>
      </div>
    </div>
  );
};

export const StatCard: React.FC<{stat: Stat; index: number; frame: number}> = ({
  stat,
  index,
  frame,
}) => {
  const {fps} = useVideoConfig();
  const progress = enter(frame, fps, 122 + index * 8);

  return (
    <div
      style={{
        width: 185,
        height: 88,
        opacity: progress,
        transform: `scale(${interpolate(progress, [0, 1], [0.88, 1])})`,
        background: stat.color,
        border: BORDER,
        boxShadow: SHADOW,
        borderRadius: 8,
        padding: '12px 16px',
      }}
    >
      <div style={{fontSize: 32, fontWeight: 700, color: NB.ink, lineHeight: 1}}>
        {stat.value}
      </div>
      <div style={{fontSize: 13, fontWeight: 700, color: NB.inkSoft, marginTop: 8}}>
        {stat.label}
      </div>
    </div>
  );
};
