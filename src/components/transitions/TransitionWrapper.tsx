import React from 'react';
import { interpolate, useCurrentFrame } from 'remotion';

export type TransitionType = 'cut' | 'fade' | 'slide' | 'zoom';
export type SlideDirection = 'left' | 'right' | 'up' | 'down';

export interface TransitionWrapperProps {
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
 * Deterministic Remotion transition container wrapping segment content in a
 * full-size positioned layer (`position: 'absolute', inset: 0`).
 */
export const TransitionWrapper: React.FC<TransitionWrapperProps> = ({
  type = 'cut',
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
  const effectiveFrames = Math.max(0, Math.min(transitionFrames, duration / 2));

  let opacity = 1;
  let transform: string | undefined;

  if (type !== 'cut' && effectiveFrames > 0) {
    const fadeIn = interpolate(localFrame, [0, effectiveFrames], [0, 1], CLAMP);
    const fadeOut = interpolate(
      localFrame,
      [duration - effectiveFrames, duration],
      [1, 0],
      CLAMP
    );
    opacity = fadeIn * fadeOut;

    if (type === 'slide') {
      transform = computeSlideTransform(
        localFrame,
        duration,
        effectiveFrames,
        slideDirection
      );
    } else if (type === 'zoom') {
      const scale = interpolate(localFrame, [0, effectiveFrames], [1.06, 1], CLAMP);
      transform = `scale(${scale})`;
    }
  }

  return (
    <div
      style={{
        position: 'absolute',
        inset: 0,
        opacity,
        ...(transform !== undefined ? { transform } : {}),
        ...style,
      }}
    >
      {children}
    </div>
  );
};
