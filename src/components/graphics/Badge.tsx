import React from 'react';
import { useFadeInOut, useSlide, useSpringScale } from '../animations/primitives';
import { VectorIcon, VectorIconName, VectorIconSize } from './Icons';

export interface EditorialBadgeProps {
  label: string;
  iconName?: VectorIconName;
  accentColor?: string;
  startFrame: number;
  endFrame: number;
  size?: VectorIconSize;
  backgroundColor?: string;
  textColor?: string;
  style?: React.CSSProperties;
}

/**
 * Animated pill badge designed for the captions region, combining deterministic
 * fade, slide, and spring-scale primitives with a crisp inline SVG VectorIcon.
 */
export const EditorialBadge: React.FC<EditorialBadgeProps> = ({
  label,
  iconName,
  accentColor = '#00D2FF',
  startFrame,
  endFrame,
  size = 'sm',
  backgroundColor = 'rgba(0, 0, 0, 0.72)',
  textColor = '#FFFFFF',
  style,
}) => {
  const opacity = useFadeInOut(startFrame, endFrame, 8, 6);
  const scale = useSpringScale(startFrame, 0.86, 1);
  const slideTransform = useSlide(startFrame, 12, 'y');

  if (opacity <= 0) {
    return null;
  }

  return (
    <div
      style={{
        opacity,
        transform: `${slideTransform} scale(${scale})`,
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 12,
        padding: '12px 24px',
        borderRadius: 999,
        backgroundColor,
        border: `2px solid ${accentColor}`,
        boxShadow: '0 4px 24px rgba(0, 0, 0, 0.55)',
        maxWidth: '90%',
        ...style,
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
          <VectorIcon name={iconName} size={size} color={accentColor} />
        </span>
      )}
      <span
        style={{
          fontFamily:
            '"Noto Sans Tamil", "Nirmala UI", "Latha", -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
          fontSize: 26,
          fontWeight: 800,
          letterSpacing: '0.04em',
          textTransform: 'uppercase',
          color: textColor,
          lineHeight: 1.2,
          textAlign: 'center',
        }}
      >
        {label}
      </span>
    </div>
  );
};
