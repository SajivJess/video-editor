import { COMPOSITION_DEFAULTS } from '../config/theme';

/** Convert seconds to frames at the project fps */
export function secondsToFrames(seconds: number, fps: number = COMPOSITION_DEFAULTS.fps): number {
  return Math.round(seconds * fps);
}

/** Convert frames to seconds at the project fps */
export function framesToSeconds(frames: number, fps: number = COMPOSITION_DEFAULTS.fps): number {
  return frames / fps;
}

/** Clamp a frame number between 0 and maxFrame (inclusive) */
export function clampFrame(frame: number, maxFrame: number): number {
  return Math.min(Math.max(frame, 0), maxFrame);
}

/** Check if the current frame is within [startFrame, endFrame) */
export function frameIsVisible(
  frame: number,
  startFrame: number,
  endFrame: number
): boolean {
  return frame >= startFrame && frame < endFrame;
}

/**
 * Convert a normalised Y position (0–1) to pixels
 * based on the composition height.
 */
export function normalizedYtoPx(
  normalizedY: number,
  height: number = COMPOSITION_DEFAULTS.height
): number {
  return normalizedY * height;
}

/**
 * Convert a normalised height (0–1) to pixels
 * based on the composition height.
 */
export function normalizedHeightToPx(
  normalizedH: number,
  height: number = COMPOSITION_DEFAULTS.height
): number {
  return normalizedH * height;
}

