import React from 'react';
import { AbsoluteFill } from 'remotion';
import { AudioTrack } from './components/audio';
import { CaptionTrack } from './components/captions';
import { BrollRegion, CaptionRegion, FacecamRegion } from './components/layout';
import { THEME } from './config/theme';
import { DEMO_DURATION_FRAMES, sampleProject } from './demo/sampleProject';
import { validateProject } from './engine/validation';
import { VideoProject } from './types/project';

export const FPS = 30;
export const TOTAL_FRAMES = DEMO_DURATION_FRAMES;

export { sampleProject };

export type ReelCompositionProps = {
  project: VideoProject;
};

/**
 * Project-driven Instagram Reel orchestrator.
 * Validates the VideoProject and renders audio, B-roll, facecam, and captions/graphics.
 */
export const ReelComposition: React.FC<ReelCompositionProps> = ({ project }) => {
  const validated = validateProject(project);
  const fontFamily = validated.theme?.fontFamily ?? THEME.fontFamily;

  return (
    <AbsoluteFill style={{ backgroundColor: '#07111F', fontFamily }}>
      <AudioTrack
        media={validated.media}
        durationFrames={validated.composition.durationFrames}
      />
      <BrollRegion visuals={validated.visuals} />
      <FacecamRegion src={validated.media.facecam} />
      <CaptionRegion
        facecamSrc={validated.media.facecam}
        blurStrength={validated.composition.blurStrength}
        tintOpacity={validated.composition.tintOpacity}
      >
        <CaptionTrack
          captions={validated.captions}
          graphics={validated.graphics}
          theme={validated.theme}
        />
      </CaptionRegion>
    </AbsoluteFill>
  );
};

/**
 * Built-in demo reel composition backed by sampleProject.
 */
export const DemoComposition: React.FC = () => {
  return <ReelComposition project={sampleProject} />;
};

export const MainVideo = DemoComposition;
