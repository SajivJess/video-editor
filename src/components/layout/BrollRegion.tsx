import React from 'react';
import {
  Img,
  OffthreadVideo,
  interpolate,
  staticFile,
  useCurrentFrame,
  useVideoConfig,
} from 'remotion';
import { LAYOUT } from '../../config/theme';
import { VisualSegment } from '../../types/project';
import { VisualTrack } from '../visuals';

export interface BrollRegionProps {
  src?: string;
  visuals?: VisualSegment[];
  startFrame?: number;
  kenBurns?: boolean;
}

function isVideoSrc(src: string): boolean {
  return /\.(mp4|mov|webm)$/i.test(src.split('?')[0]);
}

export const BrollRegion: React.FC<BrollRegionProps> = ({
  src,
  visuals,
  startFrame = 0,
  kenBurns = false,
}) => {
  const frame = useCurrentFrame();
  const { durationInFrames } = useVideoConfig();

  const containerStyle: React.CSSProperties = {
    position: 'absolute',
    top: `${LAYOUT.visuals.y * 100}%`,
    left: 0,
    width: '100%',
    height: `${LAYOUT.visuals.h * 100}%`,
    overflow: 'hidden',
  };

  if (visuals && visuals.length > 0) {
    return (
      <div style={containerStyle}>
        <VisualTrack visuals={visuals} />
      </div>
    );
  }

  const scale = kenBurns
    ? interpolate(frame - startFrame, [0, durationInFrames], [1.0, 1.08], {
        extrapolateLeft: 'clamp',
        extrapolateRight: 'clamp',
      })
    : 1;

  const mediaStyle: React.CSSProperties = {
    width: '100%',
    height: '100%',
    objectFit: 'cover',
    transform: `scale(${scale})`,
    transformOrigin: 'center center',
  };

  if (src) {
    return (
      <div style={containerStyle}>
        {isVideoSrc(src) ? (
          <OffthreadVideo src={staticFile(src)} muted style={mediaStyle} />
        ) : (
          <Img src={staticFile(src)} style={mediaStyle} />
        )}
      </div>
    );
  }

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
