import React from 'react';
import {AbsoluteFill, Sequence} from 'remotion';
import {TitleScene} from './scenes/title-scene';
import {TaglineScene} from './scenes/tagline-scene';
import {FlowScene} from './scenes/flow-scene';
import {OutroScene} from './scenes/outro-scene';
import {SCENE, TYPE} from './design-tokens';

type IntroTimelineProps = {
  finalFrames?: number;
  finalCopy?: string;
};

export const IntroTimeline: React.FC<IntroTimelineProps> = ({
  finalFrames = SCENE.outro,
  finalCopy = 'Speak once. Meeting hears translation.',
}) => {
  const taglineStart = SCENE.title;
  const flowStart = taglineStart + SCENE.tagline;
  const outroStart = flowStart + SCENE.flow;

  return (
    <AbsoluteFill style={{fontFamily: TYPE.body}}>
      <Sequence durationInFrames={SCENE.title}>
        <TitleScene />
      </Sequence>
      <Sequence from={taglineStart} durationInFrames={SCENE.tagline}>
        <TaglineScene />
      </Sequence>
      <Sequence from={flowStart} durationInFrames={SCENE.flow}>
        <FlowScene />
      </Sequence>
      <Sequence from={outroStart} durationInFrames={finalFrames}>
        <OutroScene copy={finalCopy} />
      </Sequence>
    </AbsoluteFill>
  );
};

export const IntroVideo: React.FC = () => <IntroTimeline />;
