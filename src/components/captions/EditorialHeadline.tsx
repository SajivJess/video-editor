import React from 'react';
import { interpolate, spring, useCurrentFrame, useVideoConfig } from 'remotion';

interface EditorialHeadlineProps {
  title: string;
  subtitle?: string;
  accentWord?: string;
  startFrame: number;
  endFrame: number;
}

export const EditorialHeadline: React.FC<EditorialHeadlineProps> = ({
  title,
  subtitle,
  accentWord,
  startFrame,
  endFrame,
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

  const scale = interpolate(entranceSpring, [0, 1], [0.9, 1]);
  const translateY = interpolate(entranceSpring, [0, 1], [30, 0]);

  const opacity = interpolate(
    localFrame,
    [0, 12, duration - 6, duration],
    [0, 1, 1, 0],
    { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' }
  );

  // Split title to highlight accentWord
  let titleContent: React.ReactNode = title.toUpperCase();
  if (accentWord) {
    const upper = title.toUpperCase();
    const accentUpper = accentWord.toUpperCase();
    const idx = upper.indexOf(accentUpper);
    if (idx !== -1) {
      titleContent = (
        <>
          {upper.slice(0, idx)}
          <span style={{ color: '#FFD700' }}>{upper.slice(idx, idx + accentUpper.length)}</span>
          {upper.slice(idx + accentUpper.length)}
        </>
      );
    }
  }

  return (
    <div
      style={{
        opacity,
        transform: `scale(${scale}) translateY(${translateY}px)`,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: 12,
        textAlign: 'center',
        maxWidth: '90%',
      }}
    >
      <div
        style={{
          fontSize: 56,
          fontWeight: 900,
          textTransform: 'uppercase',
          color: '#FFFFFF',
          lineHeight: 1.1,
          fontFamily:
            '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", sans-serif',
        }}
      >
        {titleContent}
      </div>

      {/* Underline bar */}
      <div
        style={{
          width: 60,
          height: 4,
          background: 'linear-gradient(90deg, #FFD700, #00D2FF)',
          borderRadius: 2,
        }}
      />

      {subtitle && (
        <div
          style={{
            fontSize: 24,
            color: 'rgba(255,255,255,0.75)',
            fontWeight: 500,
            fontFamily:
              '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", sans-serif',
          }}
        >
          {subtitle}
        </div>
      )}
    </div>
  );
};
