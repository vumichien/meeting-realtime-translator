import React from 'react';
import {AbsoluteFill, interpolate, useCurrentFrame, useVideoConfig} from 'remotion';
import {LAYOUT, TYPE, UI, appFrame, card, control, fadeIn, rise, sceneBackground} from '../design-tokens';
import {RealMouseCursor} from './real-mouse-cursor';

type ShellMode = 'waiting' | 'translating' | 'final';

const navItems = ['Translate', 'Devices', 'Profiles', 'Providers', 'Diagnostics', 'Transcripts', 'Settings'];
const sourceText = '今日は会議の内容を日本語で説明します。準備ができたら翻訳を始めましょう。';
const translatedText = "Today I will explain the meeting in Japanese. When we're ready, let's start translating.";

export const TitleScene: React.FC = () => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();
  const enter = rise(frame, fps, 0);
  return (
    <InfoScene
      eyebrow="Babel Mic"
      title="Speak your language. The meeting hears theirs."
      body="Realtime captions and translated audio route from your browser into Zoom or Meet."
      opacity={interpolate(enter, [0, 1], [0.82, 1])}
      y={interpolate(enter, [0, 1], [18, 0])}
    />
  );
};

export const OutroInfoScene: React.FC = () => (
  <InfoScene
    eyebrow="Open source meeting translator"
    title="Local-first. BYO key. Built for real calls."
    body="Babel Mic keeps your API key local, shows source and translated captions, and sends translated speech to your meeting app."
  />
);

function InfoScene({body, eyebrow, opacity = 1, title, y = 0}: {body: string; eyebrow: string; opacity?: number; title: string; y?: number}) {
  return (
    <AbsoluteFill style={{...sceneBackground(), alignItems: 'center', color: UI.text, display: 'flex', fontFamily: TYPE.body, justifyContent: 'center'}}>
      <div style={{opacity, textAlign: 'center', transform: `translateY(${y}px)`, width: 760}}>
        <div style={{color: UI.textMuted, fontSize: 16, fontWeight: 700, marginBottom: 18}}>{eyebrow}</div>
        <div style={{fontSize: 54, fontWeight: 750, lineHeight: 1.05}}>{title}</div>
        <div style={{color: UI.textMuted, fontSize: 22, lineHeight: 1.45, marginTop: 24}}>{body}</div>
      </div>
    </AbsoluteFill>
  );
}

export function RealTranslateShell({mode, progress = 1}: {mode: ShellMode; progress?: number}) {
  return <RealTranslateShellFrame mode={mode} progress={progress} />;
}

export function RealTranslateShellFrame({
  mode,
  progress = 1,
  showCursor = false,
  translationProgress = progress,
}: {
  mode: ShellMode;
  progress?: number;
  showCursor?: boolean;
  translationProgress?: number;
}) {
  const clicked = showCursor && progress > 0.72;
  const running = mode !== 'waiting' || clicked;
  return (
    <AbsoluteFill style={{...sceneBackground(), color: UI.text, fontFamily: TYPE.body}}>
      <div style={{...appFrame, display: 'flex', height: LAYOUT.shellHeight, width: LAYOUT.shellWidth}}>
        <Sidebar translating={running} />
        <main style={{display: 'flex', flex: 1, flexDirection: 'column', minWidth: 0}}>
          <Header />
          <div style={{display: 'flex', flex: 1, minHeight: 0}}>
            <Captions mode={mode} progress={progress} translationProgress={translationProgress} />
          </div>
          <ControlBar running={running} />
        </main>
        {showCursor && <Cursor progress={progress} clicked={clicked} />}
      </div>
    </AbsoluteFill>
  );
}

function Sidebar({translating}: {translating: boolean}) {
  return (
    <aside style={{background: UI.card, borderRight: `1px solid ${UI.border}`, display: 'flex', flexDirection: 'column', width: LAYOUT.sidebarWidth}}>
      <div style={{alignItems: 'center', borderBottom: `1px solid ${UI.border}`, display: 'flex', height: 48, justifyContent: 'space-between', padding: '0 10px'}}>
        <span style={{fontSize: 14, fontWeight: 700}}>Babel Mic</span>
        <span style={{color: UI.textMuted, fontSize: 14}}>▣</span>
      </div>
      <nav style={{display: 'flex', flexDirection: 'column', gap: 1, padding: '8px 6px'}}>
        {navItems.map((item) => {
          const active = item === 'Translate';
          return (
            <div key={item} style={{alignItems: 'center', background: active ? UI.secondary : 'transparent', borderRadius: 6, color: active ? UI.text : UI.textMuted, display: 'flex', fontSize: 13, gap: 10, height: 34, padding: '0 8px'}}>
              <span style={{fontSize: 12, width: 12}}>{item.slice(0, 1)}</span>
              <span>{item}</span>
            </div>
          );
        })}
      </nav>
      <div style={{alignItems: 'center', borderTop: `1px solid ${UI.border}`, display: 'flex', gap: 8, marginTop: 'auto', padding: '9px 10px'}}>
        <span style={{background: translating ? UI.success : UI.textFaint, borderRadius: 999, height: 7, width: 7}} />
        <span style={{color: UI.textMuted, flex: 1, fontSize: 12}}>{translating ? 'Translating' : 'Idle'}</span>
        <span style={{color: UI.textMuted, fontSize: 12}}>{translating ? '0:01' : ''}</span>
      </div>
    </aside>
  );
}

function Header() {
  return (
    <header style={{alignItems: 'center', background: UI.background, borderBottom: `1px solid ${UI.border}`, display: 'flex', height: LAYOUT.headerHeight, justifyContent: 'space-between', padding: '0 16px'}}>
      <h2 style={{fontSize: 15, fontWeight: 700, margin: 0}}>Translate</h2>
      <div style={{color: UI.text, fontSize: 16}}>☼</div>
    </header>
  );
}

function Captions({mode, progress, translationProgress}: {mode: ShellMode; progress: number; translationProgress: number}) {
  const source = mode === 'waiting' ? 'Waiting for audio...' : sourceText.slice(0, Math.floor(sourceText.length * progress));
  const translation = mode === 'waiting' ? 'Waiting for audio...' : translatedText.slice(0, Math.floor(translatedText.length * translationProgress));
  return (
    <>
      <CaptionPanel label="Source" text={source} muted={mode === 'waiting'} />
      <CaptionPanel label="Translation" text={translation} muted={mode === 'waiting'} />
    </>
  );
}

function CaptionPanel({label, muted, text}: {label: string; muted?: boolean; text: string}) {
  return (
    <section style={{display: 'flex', flex: 1, flexDirection: 'column', minWidth: 0, borderRight: label === 'Source' ? `1px solid ${UI.border}` : 0}}>
      <div style={{borderBottom: `1px solid ${UI.border}`, color: UI.textMuted, fontSize: 12, fontWeight: 700, letterSpacing: 0.7, padding: '9px 16px', textTransform: 'uppercase'}}>{label}</div>
      <div style={{flex: 1, padding: 16}}>
        <p style={{color: muted ? UI.textFaint : UI.text, fontSize: muted ? 14 : 22, fontStyle: muted ? 'italic' : 'normal', fontWeight: muted ? 400 : 550, lineHeight: 1.55, margin: 0}}>{text}</p>
      </div>
    </section>
  );
}

function ControlBar({running}: {running: boolean}) {
  return (
    <div style={{background: UI.background, borderTop: `1px solid ${UI.border}`, minHeight: LAYOUT.controlHeight, padding: '8px 10px'}}>
      <div style={{alignItems: 'end', display: 'flex', gap: 8}}>
        <Field label="Source mic" value="マイク (C922 Pro Stream Webcam)" width={230} />
        <Field label="Output to meeting" value="★ CABLE Input (VB-Audio Virtual Cable)" width={260} />
        <Field label="Translate to" value="English" width={150} />
        <div style={{flex: 1}} />
        <button style={{background: running ? UI.danger : UI.primary, border: 0, borderRadius: 6, color: UI.primaryText, height: 36, padding: '0 15px'}}>
          {running ? '□ Stop' : 'Start'}
        </button>
        {['Clear', 'TXT', 'JSON'].map((label) => <button key={label} style={{...control, color: UI.text, height: 36, padding: '0 12px'}}>{label}</button>)}
      </div>
    </div>
  );
}

function Cursor({clicked, progress}: {clicked: boolean; progress: number}) {
  const x = interpolate(progress, [0, 0.7], [900, 1040], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });
  const y = interpolate(progress, [0, 0.7], [590, 690], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });
  return (
    <div
      style={{
        left: x,
        position: 'absolute',
        top: y,
      }}
    >
      <RealMouseCursor clicked={clicked} />
    </div>
  );
}

function Field({label, value, width}: {label: string; value: string; width: number}) {
  return (
    <div style={{display: 'flex', flexDirection: 'column', gap: 4}}>
      <div style={{color: UI.textMuted, fontSize: 11, fontWeight: 700, textTransform: 'uppercase'}}>{label}</div>
      <div style={{...control, alignItems: 'center', color: UI.text, display: 'flex', fontSize: 12, height: 35, overflow: 'hidden', padding: '0 10px', textOverflow: 'ellipsis', whiteSpace: 'nowrap', width}}>{value}</div>
    </div>
  );
}
