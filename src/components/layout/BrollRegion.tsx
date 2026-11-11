import React from 'react';
import {
  useCurrentFrame,
  useVideoConfig,
  interpolate,
  Img,
  OffthreadVideo,
  staticFile,
} from 'remotion';

interface BrollRegionProps {
  src?: string;
  startFrame?: number;
  kenBurns?: boolean;
}

function isVideoSrc(src: string): boolean {
  return /\.(mp4|mov|webm)$/i.test(src);
}

export const BrollRegion: React.FC<BrollRegionProps> = ({
  src,
  startFrame = 0,
  kenBurns = false,
}) => {
  const frame = useCurrentFrame();
  const { durationInFrames } = useVideoConfig();

  const scale = kenBurns
    ? interpolate(frame - startFrame, [0, durationInFrames], [1.0, 1.08], {
        extrapolateLeft: 'clamp',
        extrapolateRight: 'clamp',
      })
    : 1;

  const containerStyle: React.CSSProperties = {
    position: 'absolute',
    top: 0,
    left: 0,
    width: '100%',
    height: '40%',
    overflow: 'hidden',
  };

  const mediaStyle: React.CSSProperties = {
    width: '100%',
    height: '100%',
    objectFit: 'cover',
    transform: `scale(${scale})`,
    transformOrigin: 'center center',
  };

  if (src) {
    if (isVideoSrc(src)) {
      return (
        <div style={containerStyle}>
          <OffthreadVideo src={staticFile(src)} style={mediaStyle} />
        </div>
      );
    } else {
      return (
        <div style={containerStyle}>
          <Img src={staticFile(src)} style={mediaStyle} />
        </div>
      );
    }
  }

  // Placeholder
  return (
    <div
      style={{
        ...containerStyle,
        background: 'linear-gradient(180deg, #0d1a2a 0%, #1a2a3a 100%)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      <span
        style={{
          fontFamily: 'monospace',
          fontSize: 18,
          color: '#00D2FF',
          letterSpacing: '2px',
          opacity: 0.6,
        }}
      >
        STORY VISUALS
      </span>
    </div>
  );
};
