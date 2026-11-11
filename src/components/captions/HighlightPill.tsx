import React from 'react';
import { useCurrentFrame } from 'remotion';
import { THEME } from '../../config/theme';
import { IconName } from '../../types/project';
import { highlightKeywords } from '../../utils/text';
import { useFadeInOut, useSpringScale } from '../animations';
import { VectorIcon } from '../graphics/Icons';

export interface HighlightPillProps {
  text: string;
  keywords?: string[];
  startFrame: number;
  endFrame: number;
  pillColor?: string;
  iconName?: IconName;
}

export const HighlightPill: React.FC<HighlightPillProps> = ({
  text,
  keywords = [],
  startFrame,
  endFrame,
  pillColor,
  iconName,
}) => {
  const frame = useCurrentFrame();
  const opacity = useFadeInOut(startFrame, endFrame, 10, 6);
  const scale = useSpringScale(startFrame, 0.88, 1);

  if (frame < startFrame || frame >= endFrame) {
    return null;
  }

  const tokens = highlightKeywords(text, keywords);

  return (
    <div
      style={{
        opacity,
        transform: `scale(${scale})`,
        display: 'inline-flex',
        flexDirection: 'row',
        flexWrap: 'nowrap',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 12,
        borderRadius: 999,
        background: pillColor ?? '#1a1a2e',
        border: '2px solid rgba(255,255,255,0.18)',
        boxShadow: THEME.shadowStyle,
        padding: '14px 32px',
        maxWidth: '92%',
      }}
    >
      {iconName && (
        <span
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexShrink: 0,
          }}
        >
          <VectorIcon name={iconName} size="sm" color="#FFD700" />
        </span>
      )}
      <span
        style={{
          minWidth: 0,
          whiteSpace: 'normal',
          overflowWrap: 'break-word',
          textAlign: iconName ? 'left' : 'center',
          fontSize: 32,
          fontWeight: THEME.fontWeight,
          lineHeight: 1.3,
          fontFamily: THEME.fontFamily,
          color: THEME.primaryText,
        }}
      >
        {tokens.map((token, index) => (
          <React.Fragment key={`${token.word}-${index}`}>
            {index > 0 && ' '}
            {token.highlight ? (
              <span
                style={{
                  color: THEME.highlightColor,
                  fontWeight: 900,
                }}
              >
                {token.word}
              </span>
            ) : (
              <span style={{ color: THEME.primaryText }}>{token.word}</span>
            )}
          </React.Fragment>
        ))}
      </span>
    </div>
  );
};
