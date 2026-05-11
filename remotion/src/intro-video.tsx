import React from 'react';
import {TransitionSeries, linearTiming} from '@remotion/transitions';
import {fade} from '@remotion/transitions/fade';
import {slide} from '@remotion/transitions/slide';
import {TitleScene} from './scenes/title-scene';
import {TaglineScene} from './scenes/tagline-scene';
import {FlowScene} from './scenes/flow-scene';
import {FeaturesScene} from './scenes/features-scene';
import {OutroScene} from './scenes/outro-scene';
import {SCENE} from './design-tokens';

const trans = (frames: number) => linearTiming({durationInFrames: frames});
const slideRight = slide({direction: 'from-right'});

export const IntroVideo: React.FC = () => (
  <TransitionSeries>
    <TransitionSeries.Sequence durationInFrames={SCENE.title}>
      <TitleScene />
    </TransitionSeries.Sequence>
    <TransitionSeries.Transition presentation={slideRight} timing={trans(SCENE.transition)} />
    <TransitionSeries.Sequence durationInFrames={SCENE.tagline}>
      <TaglineScene />
    </TransitionSeries.Sequence>
    <TransitionSeries.Transition presentation={slideRight} timing={trans(SCENE.transition)} />
    <TransitionSeries.Sequence durationInFrames={SCENE.flow}>
      <FlowScene />
    </TransitionSeries.Sequence>
    <TransitionSeries.Transition presentation={fade()} timing={trans(SCENE.transition)} />
    <TransitionSeries.Sequence durationInFrames={SCENE.features}>
      <FeaturesScene />
    </TransitionSeries.Sequence>
    <TransitionSeries.Transition presentation={slideRight} timing={trans(SCENE.transition)} />
    <TransitionSeries.Sequence durationInFrames={SCENE.outro}>
      <OutroScene />
    </TransitionSeries.Sequence>
  </TransitionSeries>
);
