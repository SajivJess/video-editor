import React from 'react';
import { Fonts } from './config/Fonts';
import { SceneTransitionTrack } from './components/transitions/SceneTransitionTrack';
import { AbsoluteFill, useCurrentFrame } from 'remotion';
import { AudioTrack } from './components/audio';
import { CaptionTrack } from './components/captions';
import {
  BackgroundVideoLayer,
  CaptionRegion,
  TopVisualRegion,
} from './components/layout';
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
 * Modern 9:16 Reel Composition Orchestrator:
 * - Base Layer (0%–100%): Full presenter video with continuous camera moves (smooth pans, sudden punch zooms, whip pans).
 * - Interstitial Layer: 5–10s Google Flow generative AI clips seamlessly intercut with transitions.
 * - Top 40% (0%–40%): 2D vector animations, logo reveals, person pictorials, and visual cards.
 * - Middle 30% (40%–70%): Clear, unobstructed view of presenter's face.
 * - Bottom 30% (70%–100%): Modern high-energy captions with word-level pop, NO blur.
 */
export const ReelComposition: React.FC<ReelCompositionProps> = ({ project }) => {
  const frame = useCurrentFrame();
  const validated = React.useMemo(() => validateProject(project), [project]);
  const fontFamily = validated.theme?.fontFamily ?? THEME.fontFamily;
  const visualGraphics = validated.graphics.filter((g) => g.region === 'visuals');
  const captionGraphics = validated.graphics.filter((g) => g.region === 'captions');
  const fullFrameClip = validated.interstitials?.some(clip => frame >= clip.startFrame && frame < clip.endFrame);
  const showOverlays = frame < (validated.composition.overlayEndFrame ?? validated.composition.durationFrames);

  return (
    <AbsoluteFill style={{ backgroundColor: '#07111F', fontFamily }}>
      <Fonts />
      {/* 1. Master Audio Track (Narration + Ducked Background Music + SFX) */}
      <AudioTrack
        media={validated.media}
        durationFrames={validated.composition.durationFrames}
        settings={validated.audio}
      />

      {/* 2. Full-frame Background Video + Camera Rig + Interstitial AI Clips */}
      <BackgroundVideoLayer
        src={validated.media.facecam}
        cameraMoves={validated.cameraMoves}
        interstitials={validated.interstitials}
        muted={Boolean(validated.media.narration)}
        volume={(validated.media.facecamVolume ?? validated.audio?.narrationVolume ?? 1) * (validated.audio?.volume ?? 1)}
      />

      {/* 3. Top 40% Overlay: 2D Vector Animations, Logos & Person Pictorials */}
      {showOverlays && !fullFrameClip && <TopVisualRegion
        visuals={validated.visuals}
        graphics={visualGraphics}
        theme={validated.theme}
      />}

      {/* 4. Bottom 30% Overlay: Modern Captions with Instagram Safe Margins (NO BLUR) */}
      {showOverlays && <CaptionRegion tintOpacity={validated.composition.tintOpacity}
        safeMarginX={validated.composition.safeMarginX} safeMarginY={validated.composition.safeMarginY}>
        <CaptionTrack
          captions={validated.captions}
          graphics={captionGraphics}
          theme={validated.theme}
        />
      </CaptionRegion>}
      {showOverlays && <SceneTransitionTrack transitions={validated.transitions} />}
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
