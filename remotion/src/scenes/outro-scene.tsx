import React from 'react';
import {OutroInfoScene} from './title-scene';

type OutroSceneProps = {
  copy: string;
};

export const OutroScene: React.FC<OutroSceneProps> = () => (
  <OutroInfoScene />
);
