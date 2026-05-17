import React from 'react';
import {useCurrentFrame} from 'remotion';
import {fadeIn} from '../design-tokens';
import {RealTranslateShellFrame} from './title-scene';

export const FlowScene: React.FC = () => {
  const frame = useCurrentFrame();
  return <RealTranslateShellFrame mode="translating" progress={fadeIn(frame, 0, 84)} translationProgress={fadeIn(frame, 30, 104)} />;
};
