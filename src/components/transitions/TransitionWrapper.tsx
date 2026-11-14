import React from 'react';
import { interpolate, useCurrentFrame } from 'remotion';

export type TransitionType =
  | 'cut'
  | 'fade'
  | 'slide'
  | 'zoom'
  | 'zoom-through'
  | 'whip-pan'
  | 'flash'
  | 'diagonal-wipe';

export type SlideDirection = 'left' | 'right' | 'up' | 'down';

export interface TransitionWrapperProps {
  exitType?: TransitionType;
  type?: TransitionType;
  startFrame: number;
  endFrame: number;
  transitionFrames?: number;
  slideDirection?: SlideDirection;
  children: React.ReactNode;
  style?: React.CSSProperties;
}

const CLAMP = {
  extrapolateLeft: 'clamp',
  extrapolateRight: 'clamp',
} as const;

const SLIDE_OFFSET_PERCENT = 18;

const computeSlideTransform = (
  localFrame: number,
  duration: number,
  effectiveFrames: number,
  direction: SlideDirection
): string => {
  const isHorizontal = direction === 'left' || direction === 'right';
  const sign = direction === 'left' || direction === 'up' ? 1 : -1;

  const enterOffset = interpolate(
    localFrame,
    [0, effectiveFrames],
    [sign * SLIDE_OFFSET_PERCENT, 0],
    CLAMP
  );
  const exitOffset = interpolate(
    localFrame,
    [duration - effectiveFrames, duration],
    [0, -sign * SLIDE_OFFSET_PERCENT],
    CLAMP
  );

  const totalOffset = enterOffset + exitOffset;
  return isHorizontal
    ? `translateX(${totalOffset}%)`
    : `translateY(${totalOffset}%)`;
};

/**
 * Deterministic Remotion transition container wrapping segment content.
 * Supports:
 * - 'cut': immediate frame cut
 * - 'fade': smooth opacity dissolve
 * - 'slide': directional slide entrance & exit
 * - 'zoom': subtle scale settle
 * - 'zoom-through': camera pushes deep through the layer into the next shot
 * - 'whip-pan': rapid whip snap with simulated motion blur
 * - 'flash': high-energy exposure white burst on cut boundaries
 */
export const TransitionWrapper: React.FC<TransitionWrapperProps> = ({
  type = 'cut',
  exitType = type,
  startFrame,
  endFrame,
  transitionFrames = 8,
  slideDirection = 'left',
  children,
  style,
}) => {
  const frame = useCurrentFrame();
  const duration = endFrame - startFrame;

  if (duration <= 0 || frame < startFrame || frame >= endFrame) {
    return null;
  }

  const localFrame = frame - startFrame;
  const effectiveFrames = Math.max(0, Math.min(transitionFrames, Math.floor(duration / 2)));

  let opacity = 1;
  let transform: string | undefined;
  let filter: string | undefined;
  let flashOpacity = 0;

  const currentType = localFrame >= duration - effectiveFrames ? exitType : type;
  if (currentType !== 'cut' && effectiveFrames > 0) {
    const fadeIn = interpolate(localFrame, [0, effectiveFrames], [0, 1], CLAMP);
    const fadeOut = interpolate(
      localFrame,
      [duration - effectiveFrames, duration],
      [1, 0],
      CLAMP
    );
    opacity = fadeIn * fadeOut;

    switch (currentType) {
      case 'diagonal-wipe': {
        transform = `translateX(${interpolate(localFrame, [0, effectiveFrames], [-28, 0], CLAMP)}px)`;
        break;
      }
      case 'slide':
        transform = computeSlideTransform(
          localFrame,
          duration,
          effectiveFrames,
          slideDirection
        );
        break;

      case 'zoom': {
        const scale = interpolate(localFrame, [0, effectiveFrames], [1.08, 1], CLAMP);
        transform = `scale(${scale})`;
        break;
      }

      case 'zoom-through': {
        const enterScale = interpolate(localFrame, [0, effectiveFrames], [0.85, 1.0], CLAMP);
        const exitScale = interpolate(
          localFrame,
          [duration - effectiveFrames, duration],
          [1.0, 1.25],
          CLAMP
        );
        transform = `scale(${enterScale * exitScale})`;
        break;
      }

      case 'whip-pan': {
        const enterX = interpolate(localFrame, [0, effectiveFrames], [-80, 0], CLAMP);
        const exitX = interpolate(
          localFrame,
          [duration - effectiveFrames, duration],
          [0, 80],
          CLAMP
        );
        const totalX = enterX + exitX;
        transform = `translateX(${totalX}px)`;

        // Motion blur on boundaries
        const enterBlur = interpolate(localFrame, [0, effectiveFrames], [6, 0], CLAMP);
        const exitBlur = interpolate(
          localFrame,
          [duration - effectiveFrames, duration],
          [0, 6],
          CLAMP
        );
        const blur = Math.max(enterBlur, exitBlur);
        if (blur > 0.5) {
          filter = `blur(${blur.toFixed(1)}px)`;
        }
        break;
      }

      case 'flash': {
        // White burst on entrance/exit
        const enterFlash = interpolate(localFrame, [0, effectiveFrames], [0.75, 0], CLAMP);
        const exitFlash = interpolate(
          localFrame,
          [duration - effectiveFrames, duration],
          [0, 0.75],
          CLAMP
        );
        flashOpacity = Math.max(enterFlash, exitFlash);
        break;
      }
    }
  }

  return (
    <div
      style={{
        position: 'absolute',
        inset: 0,
        opacity,
        ...(transform !== undefined ? { transform } : {}),
        ...(filter !== undefined ? { filter } : {}),
        ...(currentType === 'diagonal-wipe' ? { clipPath: `polygon(0 0, ${interpolate(localFrame, [0, effectiveFrames], [0, 140], CLAMP)}% 0, ${interpolate(localFrame, [0, effectiveFrames], [-40, 100], CLAMP)}% 100%, 0 100%)` } : {}),
        ...style,
      }}
    >
      {children}
      {flashOpacity > 0.01 && (
        <div
          style={{
            position: 'absolute',
            inset: 0,
            backgroundColor: '#FFFFFF',
            opacity: flashOpacity,
            pointerEvents: 'none',
            zIndex: 99,
          }}
        />
      )}
    </div>
  );
};
