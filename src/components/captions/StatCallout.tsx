import type { ThemeSettings } from '../../types/project';
import React from 'react';
import { useCurrentFrame } from 'remotion';
import { THEME } from '../../config/theme';
import { IconName } from '../../types/project';
import { useFadeInOut, usePulse, useSpringScale } from '../animations';
import { VectorIcon } from '../graphics/Icons';

export interface StatCalloutProps {
  theme?: Partial<ThemeSettings>;
  value: string;
  label?: string;
  iconName?: IconName;
  iconEmoji?: string;
  startFrame: number;
  endFrame: number;
  accentColor?: string;
}

export const StatCallout: React.FC<StatCalloutProps> = ({
  theme,
  value,
  label,
  iconName,
  iconEmoji,
  startFrame,
  endFrame,
  accentColor,
}) => {
  const resolved = { ...THEME, ...theme };
  const frame = useCurrentFrame();
  const opacity = useFadeInOut(startFrame, endFrame, 15, 6);
  const scale = useSpringScale(startFrame, 0.75, 1);
  const glowIntensity = usePulse(startFrame, 60, 0, 1);

  if (frame < startFrame || frame >= endFrame) {
    return null;
  }

  const color = accentColor ?? resolved.highlightColor;

  return (
    <div
      style={{
        opacity,
        transform: `scale(${scale})`,
        background: 'rgba(0,0,0,0.72)',
        borderRadius: 24,
        border: '2px solid rgba(255,215,0,0.4)',
        padding: '24px 40px',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: 10,
        textAlign: 'center',
        maxWidth: '92%',
        boxShadow: `0 0 40px rgba(255,215,0,${glowIntensity * 0.4}), ${resolved.shadowStyle}`,
      }}
    >
      {iconName ? (
        <VectorIcon name={iconName} size="lg" color={color} />
      ) : iconEmoji ? (
        <div style={{ fontSize: 48, lineHeight: 1 }}>{iconEmoji}</div>
      ) : null}

      <div
        style={{
          fontSize: resolved.captionFontSize ?? 72,
          fontWeight: 900,
          color,
          lineHeight: 1.05,
          fontFamily: resolved.fontFamily,
          whiteSpace: 'normal',
          overflowWrap: 'break-word',
        }}
      >
        {value}
      </div>

      {label && (
        <div
          style={{
            fontSize: 22,
            fontWeight: 700,
            textTransform: 'uppercase',
            letterSpacing: '2px',
            color: 'rgba(255,255,255,0.85)',
            lineHeight: 1.3,
            fontFamily: resolved.fontFamily,
            whiteSpace: 'normal',
            overflowWrap: 'break-word',
          }}
        >
          {label}
        </div>
      )}
    </div>
  );
};
