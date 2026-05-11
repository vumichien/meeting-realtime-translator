import React from 'react';
import {Composition} from 'remotion';
import {IntroVideo} from './intro-video';
import {FPS, SCENE} from './design-tokens';

// Total = sum of scenes − (transitions × overlap)
// 120 + 120 + 210 + 150 + 90 − (4 × 15) = 630 frames = 21s
const TOTAL_FRAMES =
  SCENE.title + SCENE.tagline + SCENE.flow + SCENE.features + SCENE.outro -
  4 * SCENE.transition;

export const RemotionRoot: React.FC = () => (
  <Composition
    id="IntroVideo"
    component={IntroVideo}
    durationInFrames={TOTAL_FRAMES}
    fps={FPS}
    width={1280}
    height={720}
  />
);
