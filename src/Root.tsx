import React from 'react';
import { CalculateMetadataFunction, Composition } from 'remotion';
import {
  DemoComposition,
  ReelComposition,
  ReelCompositionProps,
  TOTAL_FRAMES,
  sampleProject,
} from './Composition';
import { COMPOSITION_DEFAULTS } from './config/index';

const calculateReelMetadata: CalculateMetadataFunction<ReelCompositionProps> = ({
  props,
}) => {
  return {
    durationInFrames: props.project.composition.durationFrames,
    fps: props.project.composition.fps,
    width: props.project.composition.width,
    height: props.project.composition.height,
  };
};

export const RemotionRoot: React.FC = () => {
  return (
    <>
      <Composition
        id="ReelDemo"
        component={DemoComposition}
        width={COMPOSITION_DEFAULTS.width}
        height={COMPOSITION_DEFAULTS.height}
        fps={COMPOSITION_DEFAULTS.fps}
        durationInFrames={TOTAL_FRAMES}
      />
      <Composition
        id="ReelBase"
        component={ReelComposition}
        width={COMPOSITION_DEFAULTS.width}
        height={COMPOSITION_DEFAULTS.height}
        fps={COMPOSITION_DEFAULTS.fps}
        durationInFrames={TOTAL_FRAMES}
        calculateMetadata={calculateReelMetadata}
        defaultProps={{ project: sampleProject }}
      />
    </>
  );
};
