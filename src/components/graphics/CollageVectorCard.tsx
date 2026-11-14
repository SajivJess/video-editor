import React from 'react';
import { interpolate, spring, useCurrentFrame, useVideoConfig } from 'remotion';

export interface CollageVectorCardProps {
  title: string;
  statValue: string;
  statLabel: string;
  accentColor?: string;
  startFrame: number;
  endFrame: number;
}

const CLAMP = {
  extrapolateLeft: 'clamp',
  extrapolateRight: 'clamp',
} as const;

/**
 * Editorial Halftone & Paper Collage Card inspired by gbro-collage-broll & lemo-opuscar:
 * Assembles from empty with staggered stop-motion-like physics, tactile card backing,
 * animated vector progress bars, and high-contrast typography.
 */
export const CollageVectorCard: React.FC<CollageVectorCardProps> = ({
  title,
  statValue,
  statLabel,
  accentColor = '#FFD700',
  startFrame,
  endFrame,
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  if (frame < startFrame || frame >= endFrame) {
    return null;
  }

  const localFrame = frame - startFrame;
  const duration = endFrame - startFrame;

  // Staggered assemble animation
  const cardSpr = spring({
    frame: localFrame,
    fps,
    config: { damping: 14, stiffness: 130, mass: 0.8 },
  });

  const barSpr = spring({
    frame: Math.max(0, localFrame - 4),
    fps,
    config: { damping: 16, stiffness: 100 },
  });

  const exitOpacity = interpolate(
    localFrame,
    [duration - 6, duration],
    [1, 0],
    CLAMP
  );

  const cardScale = interpolate(cardSpr, [0, 1], [0.8, 1.0]);
  const cardOpacity = interpolate(cardSpr, [0, 1], [0, 1]) * exitOpacity;
  const barWidth = interpolate(barSpr, [0, 1], [0, 92]);

  return (
    <div
      style={{
        opacity: cardOpacity,
        transform: `scale(${cardScale}) rotate(-1.5deg)`,
        transformOrigin: 'center center',
        display: 'flex',
        flexDirection: 'column',
        gap: 20,
        padding: '32px 44px',
        backgroundColor: '#0F172A',
        border: `3px solid ${accentColor}`,
        borderRadius: 28,
        boxShadow: `12px 12px 0px rgba(0,0,0,0.9), 0 20px 48px rgba(0,0,0,0.6)`,
        width: '88%',
        maxWidth: 920,
      }}
    >
      {/* Top Header Row */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 24 }}>
        <span
          style={{
            fontFamily: 'system-ui, -apple-system, "Arial Black", sans-serif',
            fontSize: 28,
            fontWeight: 900,
            color: '#94A3B8',
            letterSpacing: '3px',
            textTransform: 'uppercase',
          }}
        >
          {title}
        </span>
        <span
          style={{
            padding: '6px 18px',
            borderRadius: 10,
            backgroundColor: accentColor,
            color: '#000000',
            fontSize: 20,
            fontWeight: 900,
            letterSpacing: '1.5px',
            textTransform: 'uppercase',
            flexShrink: 0,
          }}
        >
          METRIC
        </span>
      </div>

      {/* Hero Stat & Label */}
      <div style={{ display: 'flex', alignItems: 'baseline', gap: 20 }}>
        <span
          style={{
            fontFamily: 'system-ui, -apple-system, "Arial Black", sans-serif',
            fontSize: 100,
            fontWeight: 900,
            color: accentColor,
            lineHeight: 1,
            letterSpacing: '-3px',
            textShadow: `0 4px 20px rgba(0,0,0,0.9), 0 0 30px ${accentColor}66`,
          }}
        >
          {statValue}
        </span>
        <span
          style={{
            fontFamily: 'system-ui, -apple-system, sans-serif',
            fontSize: 32,
            fontWeight: 800,
            color: '#FFFFFF',
            lineHeight: 1.2,
          }}
        >
          {statLabel}
        </span>
      </div>

      {/* Animated Vector Bar Chart — taller */}
      <div
        style={{
          width: '100%',
          height: 18,
          backgroundColor: 'rgba(255,255,255,0.1)',
          borderRadius: 999,
          overflow: 'hidden',
        }}
      >
        <div
          style={{
            width: `${barWidth}%`,
            height: '100%',
            backgroundColor: accentColor,
            borderRadius: 999,
            boxShadow: `0 0 20px ${accentColor}`,
          }}
        />
      </div>
    </div>
  );
};

