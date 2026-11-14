import React from 'react';
import { interpolate, spring, useCurrentFrame, useVideoConfig } from 'remotion';

export interface LogoSpotlightProps {
  brand: 'nvidia' | 'openai' | 'gemini' | 'claude' | 'custom';
  label?: string;
  sublabel?: string;
  startFrame: number;
  endFrame: number;
}

const CLAMP = {
  extrapolateLeft: 'clamp',
  extrapolateRight: 'clamp',
} as const;

export const LogoSpotlight: React.FC<LogoSpotlightProps> = ({
  brand,
  label,
  sublabel,
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

  // Snappy spring entrance (Framer-style physics)
  const spr = spring({
    frame: localFrame,
    fps,
    config: { damping: 12, stiffness: 140, mass: 0.6 },
  });

  const exitOpacity = interpolate(
    localFrame,
    [duration - 6, duration],
    [1, 0],
    CLAMP
  );

  const scale = interpolate(spr, [0, 1], [0.65, 1.0]);
  const opacity = interpolate(spr, [0, 1], [0, 1]) * exitOpacity;
  const rotZ = interpolate(spr, [0, 1], [-8, 0]);

  // Subtle continuous orbit & pulse
  const orbitAngle = (localFrame * 2.2) % 360;
  const pulseGlow = 0.5 + 0.3 * Math.sin((localFrame / 15) * Math.PI);

  const brandColors: Record<string, { primary: string; glow: string; name: string }> = {
    nvidia: { primary: '#76B900', glow: 'rgba(118, 185, 0, 0.6)', name: 'NVIDIA' },
    openai: { primary: '#10A37F', glow: 'rgba(16, 163, 127, 0.6)', name: 'OPENAI · CHATGPT' },
    gemini: { primary: '#1BA1E2', glow: 'rgba(27, 161, 226, 0.6)', name: 'GOOGLE GEMINI' },
    claude: { primary: '#D97706', glow: 'rgba(217, 119, 6, 0.6)', name: 'ANTHROPIC CLAUDE' },
    custom: { primary: '#00D2FF', glow: 'rgba(0, 210, 255, 0.6)', name: 'AI ARCHITECTURE' },
  };

  const currentTheme = brandColors[brand] ?? brandColors.custom;
  const displayLabel = label ?? currentTheme.name;

  return (
    <div
      style={{
        opacity,
        transform: `scale(${scale}) rotate(${rotZ}deg)`,
        transformOrigin: 'center center',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 24,
        padding: '36px 48px 40px 48px',
        backgroundColor: 'rgba(11, 19, 32, 0.92)',
        backdropFilter: 'blur(20px)',
        border: `3px solid ${currentTheme.primary}99`,
        borderRadius: 32,
        boxShadow: `0 20px 56px rgba(0,0,0,0.75), 0 0 ${40 * pulseGlow}px ${currentTheme.glow}`,
        width: '88%',
        maxWidth: 920,
        textAlign: 'center',
      }}
    >
      {/* 2D Vector Logo Emblem with orbital accent ring — LARGE */}
      <div style={{ position: 'relative', width: 180, height: 180 }}>
        {/* Orbital ring */}
        <svg
          width="180"
          height="180"
          viewBox="0 0 180 180"
          style={{
            position: 'absolute',
            inset: 0,
            transform: `rotate(${orbitAngle}deg)`,
          }}
        >
          <circle
            cx="90"
            cy="90"
            r="82"
            fill="none"
            stroke={currentTheme.primary}
            strokeWidth="3"
            strokeDasharray="20 14 10 14"
            strokeOpacity="0.8"
          />
          <circle cx="172" cy="90" r="7" fill={currentTheme.primary} />
        </svg>

        {/* Brand Vector Icon — scaled up */}
        <div
          style={{
            position: 'absolute',
            inset: 0,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          {brand === 'nvidia' && (
            <svg width="108" height="84" viewBox="0 0 54 42" fill="none">
              <path
                d="M27 6C15.95 6 7 14.95 7 26C7 31.5 9.2 36.5 12.8 40C11.5 35.8 11.5 28.5 16 23C20.5 17.5 27 16.5 32 18.5C36 20 40 23.5 41 28C44 24 45 19 43 14C39 9 33.5 6 27 6Z"
                fill={currentTheme.primary}
              />
              <path
                d="M27 12C19.27 12 13 18.27 13 26C13 29.8 14.5 33.3 17 35.7C16 32.5 16.2 27 19.5 23C22.8 19 27.5 18.5 31 20C34 21.2 36.5 24 37 27C39 24 39.5 20.5 38 17C35.5 13.8 31.5 12 27 12Z"
                fill="#FFFFFF"
              />
              <circle cx="27" cy="26" r="4" fill={currentTheme.primary} />
            </svg>
          )}

          {brand === 'openai' && (
            <svg width="96" height="96" viewBox="0 0 48 48" fill="none">
              <path
                d="M24 4L28 12L38 10L36 20L44 24L36 28L38 38L28 36L24 44L20 36L10 38L12 28L4 24L12 20L10 10L20 12L24 4Z"
                stroke={currentTheme.primary}
                strokeWidth="3"
                fill="none"
              />
              <circle cx="24" cy="24" r="8" fill={currentTheme.primary} />
            </svg>
          )}

          {brand === 'gemini' && (
            <svg width="96" height="96" viewBox="0 0 48 48" fill="none">
              <path
                d="M24 0C24 13.25 13.25 24 0 24C13.25 24 24 34.75 24 48C24 34.75 34.75 24 48 24C34.75 24 24 13.25 24 0Z"
                fill={currentTheme.primary}
              />
            </svg>
          )}

          {brand === 'claude' && (
            <svg width="96" height="96" viewBox="0 0 48 48" fill="none">
              <path
                d="M24 4L28.5 16.5L41 18L31 27L34 40L24 33L14 40L17 27L7 18L19.5 16.5L24 4Z"
                fill={currentTheme.primary}
              />
            </svg>
          )}

          {brand === 'custom' && (
            <svg width="96" height="96" viewBox="0 0 48 48" fill="none">
              <rect x="8" y="8" width="32" height="32" rx="8" stroke={currentTheme.primary} strokeWidth="3" />
              <circle cx="24" cy="24" r="7" fill={currentTheme.primary} />
            </svg>
          )}
        </div>
      </div>

      {/* Label and Badge */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        <span
          style={{
            fontFamily: 'system-ui, -apple-system, "Arial Black", sans-serif',
            fontSize: 52,
            fontWeight: 900,
            color: '#FFFFFF',
            letterSpacing: '2px',
            textTransform: 'uppercase',
            lineHeight: 1.05,
          }}
        >
          {displayLabel}
        </span>
        {sublabel && (
          <span
            style={{
              fontFamily: 'system-ui, -apple-system, sans-serif',
              fontSize: 26,
              fontWeight: 800,
              color: currentTheme.primary,
              letterSpacing: '2px',
              textTransform: 'uppercase',
            }}
          >
            {sublabel}
          </span>
        )}
      </div>
    </div>
  );
};

