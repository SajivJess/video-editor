import React from 'react';
import { interpolate, spring, useCurrentFrame, useVideoConfig } from 'remotion';
import { highlightKeywords } from '../../utils/text';

interface HighlightPillProps {
  text: string;
  keywords?: string[];
  startFrame: number;
  endFrame: number;
  pillColor?: string;
}

export const HighlightPill: React.FC<HighlightPillProps> = ({
  text,
  keywords = [],
  startFrame,
  endFrame,
  pillColor,
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

  const scale = interpolate(entranceSpring, [0, 1], [0.88, 1]);

  const opacity = interpolate(
    localFrame,
    [0, 10, duration - 6, duration],
    [0, 1, 1, 0],
    { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' }
  );

  const tokens = highlightKeywords(text, keywords);

  return (
    <div
      style={{
        opacity,
        transform: `scale(${scale})`,
        borderRadius: 999,
        background: pillColor ?? '#1a1a2e',
        border: '2px solid rgba(255,255,255,0.15)',
        padding: '14px 32px',
        textAlign: 'center',
        maxWidth: '90%',
      }}
    >
      <span
        style={{
          fontSize: 32,
          fontWeight: 800,
          fontFamily:
            '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", sans-serif',
        }}
      >
        {tokens.map((token, i) => (
          <React.Fragment key={i}>
            {i > 0 && ' '}
            {token.highlight ? (
              <span style={{ color: '#FFD700' }}>{token.word}</span>
            ) : (
              <span style={{ color: '#FFFFFF' }}>{token.word}</span>
            )}
          </React.Fragment>
        ))}
      </span>
    </div>
  );
};
