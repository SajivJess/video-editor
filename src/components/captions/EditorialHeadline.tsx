import type { ThemeSettings } from '../../types/project';
import React from 'react';
import { useCurrentFrame } from 'remotion';
import { THEME } from '../../config/theme';
import { useFadeInOut, useSlide, useSpringScale } from '../animations';

export interface EditorialHeadlineProps {
  theme?: Partial<ThemeSettings>;
  title: string;
  subtitle?: string;
  accentWord?: string;
  startFrame: number;
  endFrame: number;
  accentColor?: string;
}

const isSixDigitHex = (color: string): boolean =>
  /^#[0-9a-fA-F]{6}$/.test(color);

const renderHighlightedTitle = (
  title: string,
  accentWord: string | undefined,
  highlightColor: string
): React.ReactNode => {
  const displayTitle = title.normalize('NFC').toUpperCase();
  const trimmedAccent = accentWord?.normalize('NFC').trim();

  if (!trimmedAccent) {
    return displayTitle;
  }

  const accentUpper = trimmedAccent.toUpperCase();
  let matchIndex = displayTitle.indexOf(accentUpper);
  if (matchIndex === -1) {
    return displayTitle;
  }

  const parts: React.ReactNode[] = [];
  let cursor = 0;

  while (matchIndex !== -1) {
    if (matchIndex > cursor) {
      parts.push(displayTitle.slice(cursor, matchIndex));
    }
    parts.push(
      <span
        key={`accent-${matchIndex}`}
        style={{
          color: highlightColor,
          textShadow: isSixDigitHex(highlightColor)
            ? `0 2px 16px rgba(0,0,0,0.7), 0 0 24px ${highlightColor}40`
            : THEME.shadowStyle,
        }}
      >
        {displayTitle.slice(matchIndex, matchIndex + accentUpper.length)}
      </span>
    );
    cursor = matchIndex + accentUpper.length;
    matchIndex = displayTitle.indexOf(accentUpper, cursor);
  }

  if (cursor < displayTitle.length) {
    parts.push(displayTitle.slice(cursor));
  }

  return <>{parts}</>;
};

export const EditorialHeadline: React.FC<EditorialHeadlineProps> = ({
  theme,
  title,
  subtitle,
  accentWord,
  startFrame,
  endFrame,
  accentColor,
}) => {
  const resolved = { ...THEME, ...theme };
  const frame = useCurrentFrame();
  const opacity = useFadeInOut(startFrame, endFrame, 12, 6);
  const scale = useSpringScale(startFrame, 0.9, 1);
  const slideTransform = useSlide(startFrame, 30, 'y');

  if (frame < startFrame || frame >= endFrame) {
    return null;
  }

  const highlightColor = accentColor ?? resolved.highlightColor;
  const titleContent = renderHighlightedTitle(title, accentWord, highlightColor);

  return (
    <div
      style={{
        opacity,
        transform: `${slideTransform} scale(${scale})`,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: 12,
        textAlign: 'center',
        maxWidth: '92%',
      }}
    >
      <div
        style={{
          fontSize: resolved.captionFontSize ?? 56,
          fontWeight: 900,
          textTransform: 'uppercase',
          color: resolved.primaryText,
          lineHeight: 1.15,
          fontFamily: resolved.fontFamily,
          textShadow: resolved.shadowStyle,
          whiteSpace: 'normal',
          overflowWrap: 'break-word',
        }}
      >
        {titleContent}
      </div>

      <div
        style={{
          width: 60,
          height: 4,
          background: `linear-gradient(90deg, ${highlightColor}, ${resolved.accentColor})`,
          borderRadius: 2,
        }}
      />

      {subtitle && (
        <div
          style={{
            fontSize: 24,
            color: 'rgba(255,255,255,0.8)',
            fontWeight: 600,
            lineHeight: 1.35,
            fontFamily: resolved.fontFamily,
            whiteSpace: 'normal',
            overflowWrap: 'break-word',
          }}
        >
          {subtitle}
        </div>
      )}
    </div>
  );
};