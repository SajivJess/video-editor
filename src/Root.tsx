import React from 'react';
import { Composition } from 'remotion';
import { COMPOSITION_DEFAULTS } from './config/index';
import { ReelComposition, DemoComposition, sampleProject } from './Composition';

export const RemotionRoot: React.FC = () => {
  return (
    <>
      <Composition
        id="ReelDemo"
        component={DemoComposition}
        width={COMPOSITION_DEFAULTS.width}
        height={COMPOSITION_DEFAULTS.height}
        fps={COMPOSITION_DEFAULTS.fps}
        durationInFrames={270}
      />
      <Composition
        id="ReelBase"
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        component={ReelComposition as any}
        width={COMPOSITION_DEFAULTS.width}
        height={COMPOSITION_DEFAULTS.height}
        fps={COMPOSITION_DEFAULTS.fps}
        durationInFrames={270}
        defaultProps={{ project: sampleProject }}
      />
    </>
  );
};
