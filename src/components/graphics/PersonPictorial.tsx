import React from 'react';
import { interpolate, spring, useCurrentFrame, useVideoConfig } from 'remotion';

export interface PersonPictorialProps {
  name: string;
  title?: string;
  avatarType?: 'jensen' | 'founder' | 'analyst' | 'custom';
  accent?: string;
  startFrame: number;
  endFrame: number;
}

const CLAMP = {
  extrapolateLeft: 'clamp',
  extrapolateRight: 'clamp',
} as const;

/**
 * 2D Vector Person Pictorial inspired by ClaudeAnimationBase and onetake:
 * Renders an expressive, animated vector portrait card with:
 * - Hand-crafted boiling-line animated SVG border ring
 * - Stylized vector character iconography (e.g. Jensen Huang leather jacket & glasses)
 * - Nameplate with editorial typography and verified status chip
 */
export const PersonPictorial: React.FC<PersonPictorialProps> = ({
  name,
  title = 'FOUNDER & CEO · NVIDIA',
  accent = '#76B900',
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

  // Snappy spring entrance
  const spr = spring({
    frame: localFrame,
    fps,
    config: { damping: 13, stiffness: 120, mass: 0.7 },
  });

  const exitOpacity = interpolate(
    localFrame,
    [duration - 6, duration],
    [1, 0],
    CLAMP
  );

  const scale = interpolate(spr, [0, 1], [0.75, 1.0]);
  const opacity = interpolate(spr, [0, 1], [0, 1]) * exitOpacity;
  const translateY = interpolate(spr, [0, 1], [24, 0]);

  // Boiling-line effect: frame-based dashoffset oscillation
  const dashOffset = (localFrame * 1.5) % 40;
  const wobbleX = 0.8 * Math.sin(localFrame * 0.4);
  const wobbleY = 0.8 * Math.cos(localFrame * 0.35);

  return (
    <div
      style={{
        opacity,
        transform: `translate3d(${wobbleX}px, ${translateY + wobbleY}px, 0) scale(${scale})`,
        transformOrigin: 'center center',
        display: 'flex',
        alignItems: 'center',
        gap: 32,
        padding: '28px 44px 28px 32px',
        backgroundColor: 'rgba(11, 19, 32, 0.95)',
        backdropFilter: 'blur(20px)',
        border: `3px solid ${accent}77`,
        borderRadius: 36,
        boxShadow: `0 20px 50px rgba(0,0,0,0.75), 0 0 32px ${accent}44`,
        width: '90%',
        maxWidth: 920,
      }}
    >
      {/* Avatar Container with Boiling Line Stroke — LARGE */}
      <div style={{ position: 'relative', width: 180, height: 180, flexShrink: 0 }}>
        {/* Animated boiling-line SVG ring */}
        <svg
          width="180"
          height="180"
          viewBox="0 0 180 180"
          style={{ position: 'absolute', inset: 0 }}
        >
          <circle
            cx="90"
            cy="90"
            r="84"
            fill="none"
            stroke={accent}
            strokeWidth="4"
            strokeDasharray="30 12 16 10"
            strokeDashoffset={dashOffset}
          />
        </svg>

        {/* 2D Vector Character Avatar (Jensen Huang stylized icon) */}
        <div
          style={{
            position: 'absolute',
            inset: 10,
            borderRadius: '50%',
            backgroundColor: '#1E293B',
            overflow: 'hidden',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <svg width="140" height="140" viewBox="0 0 72 72" fill="none">
            {/* Background gradient disk */}
            <circle cx="36" cy="36" r="36" fill="#0F172A" />

            {/* Leather Jacket shoulders */}
            <path
              d="M10 72 C12 50, 20 44, 36 44 C52 44, 60 50, 62 72 Z"
              fill="#18181B"
            />
            {/* Leather jacket collar & lapel details */}
            <path
              d="M26 44 L36 58 L46 44"
              stroke="#3F3F46"
              strokeWidth="2.5"
              fill="none"
            />
            <line x1="36" y1="58" x2="36" y2="72" stroke={accent} strokeWidth="2" />

            {/* Neck */}
            <rect x="31" y="36" width="10" height="12" fill="#E2E8F0" rx="2" />

            {/* Head */}
            <circle cx="36" cy="27" r="13" fill="#F1F5F9" />

            {/* Iconic Gray/Silver Hair */}
            <path
              d="M23 26 C23 15, 49 15, 49 26 C49 20, 45 16, 36 16 C27 16, 23 20, 23 26 Z"
              fill="#94A3B8"
            />

            {/* Signature Glasses */}
            <rect
              x="26"
              y="24"
              width="9"
              height="6"
              rx="2"
              fill="none"
              stroke="#09090B"
              strokeWidth="1.8"
            />
            <rect
              x="37"
              y="24"
              width="9"
              height="6"
              rx="2"
              fill="none"
              stroke="#09090B"
              strokeWidth="1.8"
            />
            <line x1="35" y1="27" x2="37" y2="27" stroke="#09090B" strokeWidth="1.8" />
          </svg>
        </div>

        {/* Large verified badge on avatar */}
        <div
          style={{
            position: 'absolute',
            bottom: 2,
            right: 2,
            width: 44,
            height: 44,
            borderRadius: '50%',
            backgroundColor: accent,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            border: '3px solid #0B1320',
          }}
        >
          <svg width="22" height="22" viewBox="0 0 14 14" fill="none">
            <path
              d="M3 7L6 10L11 4"
              stroke="#000000"
              strokeWidth="2.2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </div>
      </div>

      {/* Text Info — large */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 10, flex: 1 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
          <span
            style={{
              fontFamily: 'system-ui, -apple-system, "Arial Black", sans-serif',
              fontSize: 54,
              fontWeight: 900,
              color: '#FFFFFF',
              letterSpacing: '0.5px',
              lineHeight: 1.0,
            }}
          >
            {name}
          </span>
          <span
            style={{
              padding: '4px 14px',
              borderRadius: 8,
              backgroundColor: `${accent}30`,
              color: accent,
              fontSize: 18,
              fontWeight: 900,
              letterSpacing: '1.5px',
              textTransform: 'uppercase',
              flexShrink: 0,
            }}
          >
            KEYNOTE
          </span>
        </div>
        <span
          style={{
            fontFamily: 'system-ui, -apple-system, sans-serif',
            fontSize: 26,
            fontWeight: 700,
            color: '#94A3B8',
            letterSpacing: '1.5px',
            textTransform: 'uppercase',
          }}
        >
          {title}
        </span>
        {/* Accent underline bar */}
        <div
          style={{
            width: '60%',
            height: 4,
            backgroundColor: accent,
            borderRadius: 999,
            marginTop: 4,
            boxShadow: `0 0 10px ${accent}`,
          }}
        />
      </div>
    </div>
  );
};

