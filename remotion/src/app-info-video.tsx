import React from 'react';
import {SCENE} from './design-tokens';
import {IntroTimeline} from './intro-video';

export const AppInfoVideo: React.FC = () => (
  <IntroTimeline
    finalFrames={SCENE.appInfoOutro}
    finalCopy="Babel Mic keeps meetings moving across languages."
  />
);
