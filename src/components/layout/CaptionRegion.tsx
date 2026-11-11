import React from 'react';
import { OffthreadVideo, staticFile } from 'remotion';

export const CAPTION_SAFE_PADDING = { x: 32, y: 24 };

interface CaptionRegionProps {
  children?: React.ReactNode;
  facecamSrc?: string;
  blurStrength?: number;
  tintOpacity?: number;
}

/**
 * Caption region — bottom 40% of frame.
 * Layers: portrait video continuation → blur → tint → content
 */
export const CaptionRegion: React.FC<CaptionRegionProps> = ({
  children,
  facecamSrc,
  blurStrength = 15,
  tintOpacity = 0.25,
}) => {
  return (
    <div
      style={{
        position: 'absolute',
        top: '60%',
        left: 0,
        width: '100%',
        height: '40%',
        overflow: 'hidden',
      }}
    >
      {/* Layer 1: portrait video continuation (or dark gradient) */}
      {facecamSrc ? (
        <OffthreadVideo
          src={staticFile(facecamSrc)}
          style={{
            position: 'absolute',
            width: '100%',
            height: '167%',
            top: '-67%',
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

      {/* Layer 2: blur */}
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
          backgroundColor: `rgba(0,0,0,${tintOpacity})`,
          zIndex: 2,
        }}
      />

      {/* Layer 4: content */}
      <div
        style={{
          position: 'absolute',
          inset: 0,
          zIndex: 3,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          padding: `${CAPTION_SAFE_PADDING.y}px ${CAPTION_SAFE_PADDING.x}px`,
        }}
      >
        {children}
      </div>
    </div>
  );
};
