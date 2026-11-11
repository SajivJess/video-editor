import React from 'react';
import { interpolate, spring, useCurrentFrame, useVideoConfig } from 'remotion';

interface StatCalloutProps {
  value: string;
  label?: string;
  iconEmoji?: string;
  startFrame: number;
  endFrame: number;
  accentColor?: string;
}

export const StatCallout: React.FC<StatCalloutProps> = ({
  value,
  label,
  iconEmoji,
  startFrame,
  endFrame,
  accentColor,
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const localFrame = frame - startFrame;
  const duration = endFrame - startFrame;

  const entranceSpring = spring({
    frame: localFrame,
    fps,
    config: { damping: 14, stiffness: 90 },
  });

  const scale = interpolate(entranceSpring, [0, 1], [0.75, 1]);

  const opacity = interpolate(
    localFrame,
    [0, 15, duration - 6, duration],
    [0, 1, 1, 0],
    { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' }
  );

  // Pulsing glow — deterministic, based on frame modulo
  const pulseProgress = localFrame % 60;
  const glowOpacity = interpolate(pulseProgress, [0, 30, 60], [0, 1, 0], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });

  const color = accentColor ?? '#FFD700';

  return (
    <div
      style={{
        opacity,
        transform: `scale(${scale})`,
        background: 'rgba(0,0,0,0.7)',
        borderRadius: 24,
        border: '2px solid rgba(255,215,0,0.4)',
        padding: '24px 40px',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: 8,
        textAlign: 'center',
        maxWidth: '90%',
        boxShadow: `0 0 40px rgba(255,215,0,${glowOpacity * 0.4})`,
      }}
    >
      {iconEmoji && (
        <div style={{ fontSize: 48, lineHeight: 1 }}>{iconEmoji}</div>
      )}
      <div
        style={{
          fontSize: 72,
          fontWeight: 900,
          color,
          lineHeight: 1,
          fontFamily:
            '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", sans-serif',
        }}
      >
        {value}
      </div>
      {label && (
        <div
          style={{
            fontSize: 22,
            fontWeight: 700,
            textTransform: 'uppercase',
            letterSpacing: '2px',
            color: 'rgba(255,255,255,0.8)',
            fontFamily:
              '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", sans-serif',
          }}
        >
          {label}
        </div>
      )}
    </div>
  );
};
