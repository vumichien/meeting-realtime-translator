import React from 'react';
import {useCurrentFrame} from 'remotion';
import {fadeIn} from '../design-tokens';
import {RealTranslateShellFrame} from './title-scene';

export const TaglineScene: React.FC = () => {
  const frame = useCurrentFrame();
  return <RealTranslateShellFrame mode="waiting" progress={fadeIn(frame, 2, 42)} showCursor />;
};
