import { interpolate, spring, SpringConfig, useCurrentFrame, useVideoConfig } from 'remotion';

export const DEFAULT_SPRING_CONFIG: Partial<SpringConfig> = {
  damping: 14,
  stiffness: 90,
};

/**
 * Computes deterministic 0..1 opacity with smooth linear fade-in and fade-out
 * over `[startFrame, endFrame)`. Safely scales fades down for short segments.
 */
export const useFadeInOut = (
  startFrame: number,
  endFrame: number,
  fadeInFrames = 8,
  fadeOutFrames = 6
): number => {
  const frame = useCurrentFrame();
  const duration = endFrame - startFrame;

  if (duration <= 0) {
    return 0;
  }

  const localFrame = frame - startFrame;
  if (localFrame < 0 || localFrame >= duration) {
    return 0;
  }

  const safeFadeIn = Math.max(0, fadeInFrames);
  const safeFadeOut = Math.max(0, fadeOutFrames);

  const fadeIn =
    safeFadeIn === 0
      ? 1
      : interpolate(localFrame, [0, safeFadeIn], [0, 1], {
          extrapolateLeft: 'clamp',
          extrapolateRight: 'clamp',
        });

  const fadeOut =
    safeFadeOut === 0
      ? 1
      : interpolate(localFrame, [duration - safeFadeOut, duration], [1, 0], {
          extrapolateLeft: 'clamp',
          extrapolateRight: 'clamp',
        });

  return fadeIn * fadeOut;
};

/**
 * Returns a deterministic CSS `translateX(...)` or `translateY(...)` transform string
 * driving an element from `offsetPx` to `0` via Remotion `spring` + `interpolate`.
 */
export const useSlide = (
  startFrame: number,
  offsetPx = 24,
  axis: 'x' | 'y' = 'y'
): string => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const progress = spring({
    frame: Math.max(0, frame - startFrame),
    fps,
    config: DEFAULT_SPRING_CONFIG,
  });

  const offset = interpolate(progress, [0, 1], [offsetPx, 0]);
  return axis === 'x' ? `translateX(${offset}px)` : `translateY(${offset}px)`;
};

/**
 * Returns a deterministic spring-interpolated numeric scale from `fromScale` to `toScale`.
 */
export const useSpringScale = (
  startFrame: number,
  fromScale = 0.85,
  toScale = 1
): number => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const progress = spring({
    frame: Math.max(0, frame - startFrame),
    fps,
    config: DEFAULT_SPRING_CONFIG,
  });

  return interpolate(progress, [0, 1], [fromScale, toScale]);
};

/**
 * Returns a deterministic 0..1 spring progress for staggered list/word items.
 */
export const useStagger = (
  startFrame: number,
  index: number,
  stepFrames = 4
): number => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const itemStartFrame = startFrame + Math.max(0, index) * Math.max(0, stepFrames);

  return spring({
    frame: Math.max(0, frame - itemStartFrame),
    fps,
    config: DEFAULT_SPRING_CONFIG,
  });
};

/**
 * Returns a looping deterministic value oscillating smoothly between `min` and `max`
 * starting at `startFrame`.
 */
export const usePulse = (
  startFrame: number,
  cycleFrames = 60,
  min = 0,
  max = 1
): number => {
  const frame = useCurrentFrame();

  if (cycleFrames <= 0 || frame <= startFrame) {
    return min;
  }

  const localFrame = frame - startFrame;
  const phase = localFrame % cycleFrames;
  const normalized = 0.5 * (1 - Math.cos((2 * Math.PI * phase) / cycleFrames));

  return interpolate(normalized, [0, 1], [min, max], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });
};

/**
 * Pure frame-based helper returning 0..1 active highlight intensity for a timed word.
 * Hook-free so it can be called safely when mapping over word lists.
 */
export const useWordHighlightProgress = (
  frame: number,
  wordStartFrame: number,
  wordEndFrame: number
): number => {
  const duration = wordEndFrame - wordStartFrame;
  if (duration <= 0 || frame < wordStartFrame || frame >= wordEndFrame) {
    return 0;
  }

  const rampFrames = Math.min(3, duration / 3);
  if (rampFrames < 1) {
    return 1;
  }

  const localFrame = frame - wordStartFrame;
  const fadeIn = interpolate(localFrame + 1, [0, rampFrames], [0, 1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });
  const fadeOut = interpolate(localFrame, [duration - rampFrames, duration], [1, 0], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });

  return Math.min(fadeIn, fadeOut);
};
