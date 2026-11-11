import React from 'react';
import { OffthreadVideo, staticFile } from 'remotion';
import { LAYOUT } from '../../config/theme';

export interface FacecamRegionProps {
  src?: string;
}

/**
 * Facecam region — CLEAR portrait video spanning 40%–100% (1080x1152), NO overlays.
 * STRICT: This component must have ZERO children that could place anything over the face.
 */
export const FacecamRegion: React.FC<FacecamRegionProps> = ({ src }) => {
  const containerStyle: React.CSSProperties = {
    position: 'absolute',
    top: `${LAYOUT.facecam.y * 100}%`,
    left: 0,
    width: '100%',
    height: `${LAYOUT.facecam.h * 100}%`,
    overflow: 'hidden',
  };

  if (src) {
    return (
      <div style={containerStyle}>
        <OffthreadVideo
          src={staticFile(src)}
          style={{
            width: '100%',
            height: '100%',
            objectFit: 'cover',
          }}
        />
      </div>
    );
  }

  // Placeholder mode: span 40%–100% in #111111, keep indicator inside upper 40%–60% clear zone
  const clearZoneHeightPct = `${(LAYOUT.facecamClear.h / LAYOUT.facecam.h) * 100}%`;

  return (
    <div
      style={{
        ...containerStyle,
        backgroundColor: '#111111',
      }}
    >
      <div
        style={{
          width: '100%',
          height: clearZoneHeightPct,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          gap: 8,
        }}
      >
        <svg
          width="60"
          height="55"
          viewBox="0 0 60 55"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          {/* Head */}
          <circle cx="30" cy="18" r="12" fill="#333333" />
          {/* Shoulders arc */}
          <path
            d="M 2 55 Q 30 32 58 55"
            stroke="#333333"
            strokeWidth="5"
            fill="none"
            strokeLinecap="round"
          />
        </svg>
        <span
          style={{
            fontFamily: 'monospace',
            fontSize: 14,
            color: '#555555',
            letterSpacing: '2px',
          }}
        >
          FACECAM
        </span>
      </div>
    </div>
  );
};
