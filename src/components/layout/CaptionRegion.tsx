import React from 'react';
import { OffthreadVideo, staticFile } from 'remotion';
import { COMPOSITION_DEFAULTS, LAYOUT } from '../../config/theme';

export const CAPTION_SAFE_PADDING = {
  x: COMPOSITION_DEFAULTS.safeMarginX,
  y: COMPOSITION_DEFAULTS.safeMarginY,
  top: 28,
  right: 48,
  bottom: 56,
  left: COMPOSITION_DEFAULTS.safeMarginX,
} as const;

export interface CaptionRegionProps {
  children?: React.ReactNode;
  facecamSrc?: string;
  blurStrength?: number;
  tintOpacity?: number;
}

/**
 * Caption region — bottom 40% of frame (Y = 60%–100%).
 * Layers: pixel-aligned portrait video duplicate → blur → dark tint → safe-padded content.
 */
export const CaptionRegion: React.FC<CaptionRegionProps> = ({
  children,
  facecamSrc,
  blurStrength = COMPOSITION_DEFAULTS.blurStrength,
  tintOpacity = COMPOSITION_DEFAULTS.tintOpacity,
}) => {
  return (
    <div
      style={{
        position: 'absolute',
        top: `${LAYOUT.captions.y * 100}%`,
        left: 0,
        width: '100%',
        height: `${LAYOUT.captions.h * 100}%`,
        overflow: 'hidden',
      }}
    >
      {/* Layer 1: duplicate portrait video aligned pixel-for-pixel with FacecamRegion (Y=40%..100%) */}
      {facecamSrc ? (
        <OffthreadVideo
          src={staticFile(facecamSrc)}
          muted
          style={{
            position: 'absolute',
            left: 0,
            width: '100%',
            height: '150%',
            top: '-50%',
            objectFit: 'cover',
            zIndex: 0,
          }}
        />
      ) : (
        <div
          style={{
            position: 'absolute',
            inset: 0,
            background: 'linear-gradient(180deg, #0a1420 0%, #07111F 100%)',
            zIndex: 0,
          }}
        />
      )}

      {/* Layer 2: Gaussian blur */}
      <div
        style={{
          position: 'absolute',
          inset: 0,
          backdropFilter: `blur(${blurStrength}px)`,
          WebkitBackdropFilter: `blur(${blurStrength}px)`,
          zIndex: 1,
        }}
      />

      {/* Layer 3: dark tint */}
      <div
        style={{
          position: 'absolute',
          inset: 0,
          backgroundColor: `rgba(0, 0, 0, ${tintOpacity})`,
          zIndex: 2,
        }}
      />

      {/* Layer 4: safe-padded captions/graphics content */}
      <div
        style={{
          position: 'absolute',
          inset: 0,
          zIndex: 3,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          padding: `${CAPTION_SAFE_PADDING.top}px ${CAPTION_SAFE_PADDING.right}px ${CAPTION_SAFE_PADDING.bottom}px ${CAPTION_SAFE_PADDING.left}px`,
        }}
      >
        {children}
      </div>
    </div>
  );
};
