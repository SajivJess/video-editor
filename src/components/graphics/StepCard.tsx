import React from 'react';
import { interpolate, spring, useCurrentFrame, useVideoConfig } from 'remotion';

export interface StepCardProps {
  stepNumber: number | string;
  stepLabel: string;
  description?: string;
  accentColor?: string;
  startFrame: number;
  endFrame: number;
}

const CLAMP = { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' } as const;
const CRIMSON = '#C8102E';
const DOT_SIZE = 28;

/**
 * Full-width "STEP 01" section interstitial card — matches the reference reel style:
 * - Deep black dot-grid background
 * - Giant crimson outlined step number (editorial, theatrical)
 * - Bold uppercase step label underneath
 * - Diagonal red wipe entrance animation
 */
export const StepCard: React.FC<StepCardProps> = ({
  stepNumber,
  stepLabel,
  description,
  accentColor = CRIMSON,
  startFrame,
  endFrame,
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  if (frame < startFrame || frame >= endFrame) return null;

  const localFrame = frame - startFrame;
  const duration = endFrame - startFrame;

  const spr = spring({
    frame: localFrame,
    fps,
    config: { damping: 11, stiffness: 150, mass: 0.65 },
  });

  const exitOpacity = interpolate(localFrame, [duration - 8, duration], [1, 0], CLAMP);

  const scale = interpolate(spr, [0, 1], [0.88, 1.0]);
  const opacity = interpolate(spr, [0, 1], [0, 1]) * exitOpacity;
  // Wipe-in from left
  const wipeX = interpolate(spr, [0, 1], [-60, 0]);

  const stepStr = typeof stepNumber === 'number'
    ? stepNumber.toString().padStart(2, '0')
    : stepNumber;

  // Dot-grid pattern via repeating SVG
  const DOT_COLS = 24;
  const DOT_ROWS = 8;

  return (
    <div
      style={{
        opacity,
        transform: `translate3d(${wipeX}px, 0, 0) scale(${scale})`,
        transformOrigin: 'center center',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'flex-start',
        justifyContent: 'center',
        gap: 12,
        padding: '28px 48px',
        backgroundColor: '#070707',
        border: `3px solid ${accentColor}`,
        borderRadius: 20,
        boxShadow: `8px 8px 0px ${accentColor}44, 0 20px 50px rgba(0,0,0,0.9)`,
        width: '92%',
        maxWidth: 960,
        overflow: 'hidden',
        position: 'relative',
      }}
    >
      {/* Dot-grid background texture */}
      <svg
        style={{
          position: 'absolute',
          inset: 0,
          width: '100%',
          height: '100%',
          opacity: 0.12,
          pointerEvents: 'none',
        }}
        xmlns="http://www.w3.org/2000/svg"
      >
        <defs>
          <pattern id="dotgrid" x="0" y="0" width={DOT_SIZE} height={DOT_SIZE} patternUnits="userSpaceOnUse">
            <circle cx={DOT_SIZE / 2} cy={DOT_SIZE / 2} r="2.5" fill="#FFFFFF" />
          </pattern>
        </defs>
        <rect width="100%" height="100%" fill="url(#dotgrid)" />
      </svg>

      {/* "STEP" label */}
      <span
        style={{
          fontFamily: 'system-ui, -apple-system, "Arial Black", sans-serif',
          fontSize: 22,
          fontWeight: 900,
          color: accentColor,
          letterSpacing: '8px',
          textTransform: 'uppercase',
          position: 'relative',
        }}
      >
        STEP
      </span>

      {/* Giant outlined step number */}
      <span
        style={{
          fontFamily: 'system-ui, -apple-system, "Arial Black", sans-serif',
          fontSize: 160,
          fontWeight: 900,
          color: 'transparent',
          WebkitTextStroke: `4px ${accentColor}`,
          lineHeight: 0.9,
          letterSpacing: '-6px',
          position: 'relative',
          textShadow: `0 0 40px ${accentColor}44`,
        }}
      >
        {stepStr}
      </span>

      {/* Step label */}
      <span
        style={{
          fontFamily: 'system-ui, -apple-system, "Arial Black", sans-serif',
          fontSize: 40,
          fontWeight: 900,
          color: '#FFFFFF',
          textTransform: 'uppercase',
          letterSpacing: '2px',
          lineHeight: 1.1,
          position: 'relative',
          maxWidth: '90%',
        }}
      >
        {stepLabel}
      </span>

      {/* Optional description */}
      {description && (
        <span
          style={{
            fontFamily: 'system-ui, -apple-system, sans-serif',
            fontSize: 22,
            fontWeight: 600,
            color: '#94A3B8',
            letterSpacing: '0.5px',
            lineHeight: 1.4,
            position: 'relative',
          }}
        >
          {description}
        </span>
      )}

      {/* Bottom accent bar */}
      <div
        style={{
          position: 'absolute',
          bottom: 0,
          left: 0,
          right: 0,
          height: 5,
          background: `linear-gradient(90deg, ${accentColor}, transparent)`,
        }}
      />
    </div>
  );
};

