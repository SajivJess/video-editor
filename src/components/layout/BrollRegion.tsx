import { mediaSource } from '../../utils/media';
import React from 'react';
import {
  Img,
  OffthreadVideo,
  interpolate,
  useCurrentFrame,
  useVideoConfig,
} from 'remotion';
import { LAYOUT } from '../../config/theme';
import { GraphicSegment, ThemeSettings, VisualSegment } from '../../types/project';
import { VisualTrack } from '../visuals';
import { EditorialBadge } from '../graphics/Badge';

export interface BrollRegionProps {
  src?: string;
  visuals?: VisualSegment[];
  graphics?: GraphicSegment[];
  theme?: Partial<ThemeSettings>;
  startFrame?: number;
  kenBurns?: boolean;
}

function isVideoSrc(src: string): boolean {
  return /\.(mp4|mov|webm)$/i.test(src.split('?')[0]);
}

export const BrollRegion: React.FC<BrollRegionProps> = ({
  src,
  visuals,
  graphics = [],
  theme,
  startFrame = 0,
  kenBurns = false,
}) => {
  const frame = useCurrentFrame();
  const { durationInFrames } = useVideoConfig();

  const activeGraphic = graphics.find(
    (g) => frame >= g.startFrame && frame < g.endFrame
  );

  const graphicOverlay = activeGraphic && (
    <div
      style={{
        position: 'absolute',
        inset: 0,
        zIndex: 2,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '0 32px',
      }}
    >
      <EditorialBadge
        key={activeGraphic.id}
        label={activeGraphic.label}
        iconName={activeGraphic.iconName}
        accentColor={theme?.accentColor}
        size="lg"
        startFrame={activeGraphic.startFrame}
        endFrame={activeGraphic.endFrame}
      />
    </div>
  );

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
        {graphicOverlay}
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
          <OffthreadVideo src={mediaSource(src)} muted style={mediaStyle} />
        ) : (
          <Img src={mediaSource(src)} style={mediaStyle} />
        )}
        {graphicOverlay}
      </div>
    );
  }

  return (
    <div
      style={{
        ...containerStyle,
        background: 'linear-gradient(180deg, #0d1a2a 0%, #1a2a3a 100%)',
      }}
    >
      {graphicOverlay}
    </div>
  );
};
