import React from 'react';
import { OffthreadVideo, staticFile } from 'remotion';

interface FacecamRegionProps {
  src?: string;
}

/**
 * Facecam region — CLEAR portrait video, NO overlays.
 * STRICT: This component must have ZERO children that could place anything over the face.
 */
export const FacecamRegion: React.FC<FacecamRegionProps> = ({ src }) => {
  const containerStyle: React.CSSProperties = {
    position: 'absolute',
    top: '40%',
    left: 0,
    width: '100%',
    height: '20%',
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

  // Placeholder with SVG silhouette
  return (
    <div
      style={{
        ...containerStyle,
        backgroundColor: '#111111',
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
  );
};
