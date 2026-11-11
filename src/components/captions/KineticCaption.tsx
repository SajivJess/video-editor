import React from 'react';
import { interpolate, spring, useCurrentFrame, useVideoConfig } from 'remotion';
import { highlightKeywords } from '../../utils/text';

interface KineticCaptionProps {
  text: string;
  keywords?: string[];
  startFrame: number;
  endFrame: number;
}

export const KineticCaption: React.FC<KineticCaptionProps> = ({
  text,
  keywords = [],
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

  const translateY = interpolate(entranceSpring, [0, 1], [20, 0]);

  const opacity = interpolate(
    localFrame,
    [0, 8, duration - 6, duration],
    [0, 1, 1, 0],
    { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' }
  );

  const tokens = highlightKeywords(text, keywords);

  return (
    <div
      style={{
        opacity,
        transform: `translateY(${translateY}px)`,
        background: 'rgba(0,0,0,0.6)',
        borderRadius: 20,
        padding: '16px 28px',
        backdropFilter: 'blur(8px)',
        WebkitBackdropFilter: 'blur(8px)',
        textAlign: 'center',
        maxWidth: '90%',
      }}
    >
      <span
        style={{
          fontSize: 36,
          fontWeight: 900,
          color: '#FFFFFF',
          lineHeight: 1.3,
          fontFamily:
            '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", sans-serif',
        }}
      >
        {tokens.map((token, i) => (
          <React.Fragment key={i}>
            {i > 0 && ' '}
            {token.highlight ? (
              <span style={{ color: '#FFD700', fontWeight: 900 }}>{token.word}</span>
            ) : (
              token.word
            )}
          </React.Fragment>
        ))}
      </span>
    </div>
  );
};
