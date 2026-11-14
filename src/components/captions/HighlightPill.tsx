import type { ThemeSettings } from '../../types/project';
import React from 'react';
import { useCurrentFrame } from 'remotion';
import { THEME } from '../../config/theme';
import { IconName } from '../../types/project';
import { highlightKeywords } from '../../utils/text';
import { useFadeInOut, useSpringScale } from '../animations';
import { VectorIcon } from '../graphics/Icons';

export interface HighlightPillProps {
  theme?: Partial<ThemeSettings>;
  text: string;
  keywords?: string[];
  startFrame: number;
  endFrame: number;
  pillColor?: string;
  iconName?: IconName;
}

export const HighlightPill: React.FC<HighlightPillProps> = ({
  theme,
  text,
  keywords = [],
  startFrame,
  endFrame,
  pillColor,
  iconName,
}) => {
  const resolved = { ...THEME, ...theme };
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
        boxShadow: resolved.shadowStyle,
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
          fontSize: resolved.captionFontSize ?? 32,
          fontWeight: resolved.fontWeight,
          lineHeight: 1.3,
          fontFamily: resolved.fontFamily,
          color: resolved.primaryText,
        }}
      >
        {tokens.map((token, index) => (
          <React.Fragment key={`${token.word}-${index}`}>
            {index > 0 && ' '}
            {token.highlight ? (
              <span
                style={{
                  color: resolved.highlightColor,
                  fontWeight: 900,
                }}
              >
                {token.word}
              </span>
            ) : (
              <span style={{ color: resolved.primaryText }}>{token.word}</span>
            )}
          </React.Fragment>
        ))}
      </span>
    </div>
  );
};