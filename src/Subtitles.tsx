import React from 'react';
import { interpolate, spring, useCurrentFrame, useVideoConfig } from 'remotion';

export interface SubtitleLine {
  text: string;
  highlight?: string;
  startFrame: number;
  endFrame: number;
  yOffset?: number;
  align?: 'center' | 'left';
}

export interface SubtitlesProps {
  lines?: SubtitleLine[];
}

/**
 * Timed subtitle overlay with fade transitions and optional keyword highlighting.
 */
export const Subtitles: React.FC<SubtitlesProps> = ({ lines = [] }) => {
  const frame = useCurrentFrame();

  const activeSub = lines.find(
    (s) => frame >= s.startFrame && frame < s.endFrame
  );

  if (!activeSub) return null;

  const fadeInDuration = 6;
  const fadeOutDuration = 5;
  const opacity = interpolate(
    frame,
    [
      activeSub.startFrame,
      activeSub.startFrame + fadeInDuration,
      activeSub.endFrame - fadeOutDuration,
      activeSub.endFrame,
    ],
    [0, 1, 1, 0],
    { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' }
  );

  let renderedContent: React.ReactNode = activeSub.text;
  if (activeSub.highlight && activeSub.text.includes(activeSub.highlight)) {
    const parts = activeSub.text.split(activeSub.highlight);
    renderedContent = (
      <>
        {parts[0]}
        <span
          style={{
            color: '#00d2ff',
            fontWeight: 800,
            textShadow: '0 0 16px rgba(0, 210, 255, 0.45)',
          }}
        >
          {activeSub.highlight}
        </span>
        {parts.slice(1).join(activeSub.highlight)}
      </>
    );
  }

  const isLeft = activeSub.align === 'left';

  return (
    <div
      style={{
        position: 'absolute',
        bottom: activeSub.yOffset ?? 125,
        left: isLeft ? 80 : 0,
        right: isLeft ? 'auto' : 0,
        width: isLeft ? 740 : '100%',
        display: 'flex',
        justifyContent: isLeft ? 'flex-start' : 'center',
        alignItems: 'center',
        pointerEvents: 'none',
        zIndex: 55,
        opacity,
      }}
    >
      <div
        style={{
          maxWidth: isLeft ? 740 : 1200,
          background: 'rgba(7, 17, 31, 0.92)',
          border: '1px solid rgba(48, 54, 61, 0.85)',
          boxShadow: '0 8px 32px rgba(0, 0, 0, 0.75)',
          backdropFilter: 'blur(16px)',
          borderRadius: 16,
          padding: '12px 28px',
          textAlign: isLeft ? 'left' : 'center',
          color: '#f0f6fc',
          fontSize: 27,
          lineHeight: 1.35,
          fontWeight: 600,
          fontFamily:
            '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", sans-serif',
          letterSpacing: '0.2px',
        }}
      >
        {renderedContent}
      </div>
    </div>
  );
};

export interface HeroProps {
  title: string;
  highlightTitle?: string;
  subtitle: string;
  accentColor?: string;
}

/**
 * Full-screen animated hero statement card for section breaks or title slides.
 */
export const HeroStatementCard: React.FC<HeroProps> = ({
  title,
  highlightTitle,
  subtitle,
  accentColor = '#00d2ff',
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const entrance = spring({
    frame,
    fps,
    config: { damping: 14, mass: 0.5, stiffness: 100 },
  });

  return (
    <div
      style={{
        position: 'absolute',
        inset: 0,
        backgroundColor: '#07111F',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 45,
        padding: '0 100px',
        textAlign: 'center',
      }}
    >
      <div
        style={{
          position: 'absolute',
          width: 750,
          height: 750,
          borderRadius: '50%',
          background: `radial-gradient(circle, ${accentColor}25 0%, rgba(0,0,0,0) 70%)`,
          filter: 'blur(100px)',
          pointerEvents: 'none',
        }}
      />

      <div
        style={{
          transform: `scale(${interpolate(entrance, [0, 1], [0.92, 1])})`,
          opacity: entrance,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: 20,
        }}
      >
        <div
          style={{
            fontSize: 72,
            fontWeight: 900,
            lineHeight: 1.1,
            color: '#ffffff',
            letterSpacing: '1px',
            textTransform: 'uppercase',
            maxWidth: 1400,
          }}
        >
          {title}{' '}
          {highlightTitle && (
            <span
              style={{
                color: accentColor,
                textShadow: `0 0 35px ${accentColor}60`,
              }}
            >
              {highlightTitle}
            </span>
          )}
        </div>

        <div
          style={{
            fontSize: 26,
            fontWeight: 500,
            color: '#8b949e',
            letterSpacing: '0.5px',
            maxWidth: 900,
            lineHeight: 1.4,
          }}
        >
          {subtitle}
        </div>

        <div
          style={{
            marginTop: 15,
            height: 3,
            width: 140,
            background: `linear-gradient(90deg, transparent, ${accentColor}, transparent)`,
            borderRadius: 2,
          }}
        />
      </div>
    </div>
  );
};
