import React from 'react';
import {AbsoluteFill, useCurrentFrame, useVideoConfig, spring, interpolate} from 'remotion';
import {loadFont} from '@remotion/google-fonts/SpaceGrotesk';
import {NB, BORDER, SHADOW, SHADOW_SM, SCENE_BASE} from '../design-tokens';

const {fontFamily} = loadFont('normal', {weights: ['600', '700'], subsets: ['latin']});

type Node = {label: string; sub: string; color: string; icon: string; delay: number};

const NODES: Node[] = [
  {label: 'Your Mic',        sub: 'browser capture',    color: NB.pink,   icon: '🎙️', delay: 10},
  {label: 'Browser WebRTC',  sub: 'streams audio',      color: NB.cyan,   icon: '🌐', delay: 45},
  {label: 'OpenAI Realtime', sub: 'translates speech',  color: NB.violet, icon: '🤖', delay: 80},
  {label: 'Virtual Cable',   sub: 'VB-Cable/BlackHole', color: NB.mint,   icon: '🔌', delay: 115},
  {label: 'Zoom / Meet',     sub: 'hears translation',  color: NB.yellow, icon: '💼', delay: 150},
];

function FlowNode({node, frame, fps}: {node: Node; frame: number; fps: number}) {
  const s = spring({frame: frame - node.delay, fps, config: {damping: 200}});
  return (
    <div
      style={{
        flex: 1,
        opacity: s,
        transform: `translateY(${interpolate(s, [0, 1], [28, 0])}px)`,
        background: node.color,
        border: BORDER,
        boxShadow: SHADOW,
        borderRadius: 10,
        padding: '16px 12px',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: 8,
        minWidth: 0,
      }}
    >
      <span style={{fontSize: 30}}>{node.icon}</span>
      <span
        style={{
          fontWeight: 700,
          fontSize: 14,
          color: NB.ink,
          textAlign: 'center' as const,
          lineHeight: 1.2,
        }}
      >
        {node.label}
      </span>
      <span
        style={{
          fontSize: 11,
          color: NB.inkSoft,
          fontWeight: 600,
          textAlign: 'center' as const,
          lineHeight: 1.3,
        }}
      >
        {node.sub}
      </span>
    </div>
  );
}

function Arrow({delay, frame, fps}: {delay: number; frame: number; fps: number}) {
  const s = spring({frame: frame - delay, fps, config: {damping: 200}});
  return (
    <div
      style={{
        flexShrink: 0,
        width: 36,
        opacity: s,
        transform: `scaleX(${s})`,
        transformOrigin: 'left center',
        fontSize: 26,
        fontWeight: 900,
        color: NB.ink,
        textAlign: 'center' as const,
      }}
    >
      →
    </div>
  );
}

export const FlowScene: React.FC = () => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();

  const labelS = spring({frame, fps, config: {damping: 200}});
  const captionOpacity = interpolate(frame, [165, 190], [0, 1], {extrapolateRight: 'clamp'});

  return (
    <AbsoluteFill
      style={{
        ...SCENE_BASE,
        fontFamily,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 36,
        padding: '40px 40px',
      }}
    >
      {/* Section label */}
      <div
        style={{
          opacity: labelS,
          transform: `translateY(${interpolate(labelS, [0, 1], [-16, 0])}px)`,
          background: NB.cyan,
          border: BORDER,
          boxShadow: SHADOW_SM,
          padding: '5px 14px',
          borderRadius: 6,
          fontSize: 13,
          fontWeight: 700,
          color: NB.ink,
          textTransform: 'uppercase' as const,
          letterSpacing: '0.1em',
        }}
      >
        How it works
      </div>

      {/* Flow row */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 8,
          width: '100%',
        }}
      >
        {NODES.map((node, i) => (
          <React.Fragment key={node.label}>
            <FlowNode node={node} frame={frame} fps={fps} />
            {i < NODES.length - 1 && (
              <Arrow delay={node.delay + 22} frame={frame} fps={fps} />
            )}
          </React.Fragment>
        ))}
      </div>

      {/* Caption */}
      <div
        style={{
          opacity: captionOpacity,
          fontSize: 15,
          color: NB.muted,
          fontWeight: 600,
          textAlign: 'center' as const,
        }}
      >
        1–3 s latency · Chrome / Edge only · API key stays on your machine
      </div>
    </AbsoluteFill>
  );
};
