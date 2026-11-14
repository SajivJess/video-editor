import React from 'react';
import { COMPOSITION_DEFAULTS, LAYOUT } from '../../config/theme';

export const CAPTION_SAFE_PADDING = {
  top: 20,
  right: 56,
  bottom: 64,
  left: COMPOSITION_DEFAULTS.safeMarginX ?? 40,
} as const;

export interface CaptionRegionProps {
  safeMarginX?: number;
  safeMarginY?: number;
  children?: React.ReactNode;
  tintOpacity?: number;
}

/**
 * Modern Caption region — bottom 30% of frame (Y = 70%–100%, 1344px–1920px).
 * Sits transparently over the unblurred background presenter video beneath it.
 * Uses a soft linear gradient scrim for text legibility (NO BLUR OVER FOOTAGE).
 * Formatted with Instagram Reels safe margins to stay clear of like/comment buttons.
 */
export const CaptionRegion: React.FC<CaptionRegionProps> = ({
  children,
  tintOpacity = 0.25,
  safeMarginX = 64,
  safeMarginY = 96,
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
        pointerEvents: 'none',
        zIndex: 10,
      }}
    >
      {/* Soft gradient contrast scrim for text legibility — NO BLUR */}
      <div
        style={{
          position: 'absolute',
          inset: 0,
          background: `linear-gradient(180deg, rgba(0,0,0,0) 0%, rgba(0,0,0,${tintOpacity * 0.5}) 30%, rgba(0,0,0,${Math.min(tintOpacity + 0.35, 0.85)}) 100%)`,
          zIndex: 0,
        }}
      />

      {/* Safe-padded modern caption content */}
      <div
        style={{
          position: 'absolute',
          inset: 0,
          zIndex: 1,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          padding: `24px ${Math.max(safeMarginX, 80)}px ${Math.max(safeMarginY, 96)}px ${safeMarginX}px`,
          boxSizing: 'border-box',
        }}
      >
        {children}
      </div>
    </div>
  );
};
