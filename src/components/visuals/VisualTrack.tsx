import React from 'react';
import {
  Img,
  OffthreadVideo,
  Sequence,
  interpolate,
  staticFile,
  useCurrentFrame,
} from 'remotion';
import { THEME } from '../../config/theme';
import { VisualSegment } from '../../types/project';
import { TransitionWrapper } from '../transitions';

export interface VisualTrackProps {
  visuals: VisualSegment[];
}

const CLAMP = {
  extrapolateLeft: 'clamp',
  extrapolateRight: 'clamp',
} as const;

interface VisualSegmentViewProps {
  segment: VisualSegment;
}

const VisualSegmentView: React.FC<VisualSegmentViewProps> = ({ segment }) => {
  const frame = useCurrentFrame();
  const duration = segment.endFrame - segment.startFrame;

  if (duration <= 0 || frame < segment.startFrame || frame >= segment.endFrame) {
    return null;
  }

  let transform: string | undefined;
  if (segment.kenBurns) {
    const {
      fromScale,
      toScale,
      fromX = 0,
      toX = 0,
      fromY = 0,
      toY = 0,
    } = segment.kenBurns;

    const scale = interpolate(
      frame,
      [segment.startFrame, segment.endFrame],
      [fromScale, toScale],
      CLAMP
    );
    const tx = interpolate(
      frame,
      [segment.startFrame, segment.endFrame],
      [fromX, toX],
      CLAMP
    );
    const ty = interpolate(
      frame,
      [segment.startFrame, segment.endFrame],
      [fromY, toY],
      CLAMP
    );

    transform = `scale(${scale}) translate(${tx}px, ${ty}px)`;
  }

  const objectPosition = segment.focalPoint
    ? `${segment.focalPoint.x * 100}% ${segment.focalPoint.y * 100}%`
    : 'center center';

  const mediaStyle: React.CSSProperties = {
    width: '100%',
    height: '100%',
    objectFit: 'cover',
    objectPosition,
    transformOrigin: 'center center',
    ...(transform !== undefined ? { transform } : {}),
  };

  return (
    <TransitionWrapper
      type={segment.transition ?? 'cut'}
      startFrame={segment.startFrame}
      endFrame={segment.endFrame}
    >
      {segment.type === 'video' ? (
        <Sequence
          from={segment.startFrame}
          durationInFrames={duration}
          layout="none"
        >
          <OffthreadVideo
            src={staticFile(segment.src)}
            muted
            style={mediaStyle}
          />
        </Sequence>
      ) : (
        <Img src={staticFile(segment.src)} style={mediaStyle} />
      )}

      {segment.label && (
        <div
          style={{
            position: 'absolute',
            bottom: 16,
            left: 20,
            zIndex: 2,
            backgroundColor: 'rgba(0, 0, 0, 0.72)',
            border: '1px solid rgba(255, 255, 255, 0.22)',
            borderRadius: 6,
            padding: '4px 10px',
            color: THEME.primaryText,
            fontFamily: THEME.fontFamily,
            fontSize: 13,
            fontWeight: 700,
            letterSpacing: '1.2px',
            textTransform: 'uppercase',
          }}
        >
          {segment.label}
        </div>
      )}
    </TransitionWrapper>
  );
};

/**
 * Renders timed VisualSegment items inside the top 40% B-roll container.
 */
export const VisualTrack: React.FC<VisualTrackProps> = ({ visuals }) => {
  return (
    <div
      style={{
        position: 'absolute',
        inset: 0,
        overflow: 'hidden',
        background: 'linear-gradient(180deg, #0d1a2a 0%, #1a2a3a 100%)',
      }}
    >
      {visuals.map((segment) => (
        <VisualSegmentView key={segment.id} segment={segment} />
      ))}
    </div>
  );
};

