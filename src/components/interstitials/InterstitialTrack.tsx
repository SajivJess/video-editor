import { mediaSource } from '../../utils/media';
import React from 'react';
import { OffthreadVideo, Sequence, interpolate, useCurrentFrame } from 'remotion';
import { InterstitialSegment } from '../../types/project';
import { TransitionWrapper } from '../transitions/TransitionWrapper';

export interface InterstitialTrackProps {
  interstitials?: InterstitialSegment[];
}

const CLAMP = {
  extrapolateLeft: 'clamp',
  extrapolateRight: 'clamp',
} as const;

/**
 * Interstitial AI-Generated Clip Track (Google Flow):
 * Seamlessly inserts 5–10s generative AI b-roll / concept sequences in between
 * presenter segments with snappy transitions (zoom-through, whip-pan, flash)
 * and an editorial badge.
 */
export const InterstitialTrack: React.FC<InterstitialTrackProps> = ({
  interstitials = [],
}) => {
  const frame = useCurrentFrame();

  const activeSegment = interstitials.find(
    (seg) => frame >= seg.startFrame && frame < seg.endFrame
  );

  if (!activeSegment) {
    return null;
  }

  const localFrame = frame - activeSegment.startFrame;
  const duration = activeSegment.endFrame - activeSegment.startFrame;

  // Camera drift on interstitial footage
  let scale = 1.0;
  let translateX = 0;
  if (activeSegment.cameraMove === 'zoom-in' || !activeSegment.cameraMove) {
    scale = interpolate(localFrame, [0, duration], [1.0, 1.08], CLAMP);
  } else if (activeSegment.cameraMove === 'pan-left') {
    translateX = interpolate(localFrame, [0, duration], [0, -30], CLAMP);
    scale = 1.04;
  } else if (activeSegment.cameraMove === 'pan-right') {
    translateX = interpolate(localFrame, [0, duration], [0, 30], CLAMP);
    scale = 1.04;
  } else if (activeSegment.cameraMove === 'subtle-drift') {
    scale = 1.0 + 0.03 * Math.sin((localFrame / 30) * Math.PI);
  }

  const transitionType = activeSegment.transitionIn ?? 'zoom-through';
  const labelText = activeSegment.label;

  return (
    <div style={{ position: 'absolute', inset: 0, zIndex: 10 }}>
      <TransitionWrapper
        type={transitionType}
        exitType={activeSegment.transitionOut ?? 'fade'}
        startFrame={activeSegment.startFrame}
        endFrame={activeSegment.endFrame}
        transitionFrames={10}
      >
        <div style={{ position: 'absolute', inset: 0, overflow: 'hidden' }}>
          <div
            style={{
              width: '100%',
              height: '100%',
              transform: `scale(${scale}) translateX(${translateX}px)`,
              transformOrigin: 'center center',
            }}
          >
            <Sequence from={activeSegment.startFrame} durationInFrames={duration} layout="none">
            <OffthreadVideo
              startFrom={activeSegment.sourceStartFrame ?? 0}
              muted={(activeSegment.volume ?? 0) === 0}
              volume={activeSegment.volume ?? 0}
              src={mediaSource(activeSegment.src)}
              style={{
                width: '100%',
                height: '100%',
                objectFit: 'cover',
              }}
            />
            </Sequence>
          </div>

          {/* AI Google Flow indicator badge */}
          {labelText && <div
            style={{
              position: 'absolute',
              top: 48,
              left: 40,
              display: 'flex',
              alignItems: 'center',
              gap: 8,
              padding: '8px 16px',
              borderRadius: 999,
              backgroundColor: 'rgba(0, 0, 0, 0.65)',
              border: '1px solid rgba(0, 210, 255, 0.4)',
              backdropFilter: 'blur(8px)',
              boxShadow: '0 4px 16px rgba(0,0,0,0.5)',
            }}
          >
            <span
              style={{
                width: 8,
                height: 8,
                borderRadius: '50%',
                backgroundColor: '#00D2FF',
                boxShadow: '0 0 10px #00D2FF',
              }}
            />
            <span
              style={{
                fontFamily: 'system-ui, -apple-system, sans-serif',
                fontSize: 13,
                fontWeight: 800,
                color: '#FFFFFF',
                letterSpacing: '1.2px',
                textTransform: 'uppercase',
              }}
            >
              {labelText}
            </span>
          </div>}
        </div>
      </TransitionWrapper>
    </div>
  );
};

