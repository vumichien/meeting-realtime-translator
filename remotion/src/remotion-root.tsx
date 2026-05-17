import React from 'react';
import {Composition} from 'remotion';
import {IntroVideo} from './intro-video';
import {AppInfoVideo} from './app-info-video';
import {FPS, SCENE} from './design-tokens';

const BASE_FRAMES = SCENE.title + SCENE.tagline + SCENE.flow;
export const INTRO_TOTAL_FRAMES = BASE_FRAMES + SCENE.outro;
export const APP_INFO_TOTAL_FRAMES = BASE_FRAMES + SCENE.appInfoOutro;

export const RemotionRoot: React.FC = () => (
  <>
    <Composition
      id="IntroVideo"
      component={IntroVideo}
      durationInFrames={INTRO_TOTAL_FRAMES}
      fps={FPS}
      width={1280}
      height={720}
    />
    <Composition
      id="AppInfoVideo"
      component={AppInfoVideo}
      durationInFrames={APP_INFO_TOTAL_FRAMES}
      fps={FPS}
      width={1280}
      height={720}
    />
  </>
);
