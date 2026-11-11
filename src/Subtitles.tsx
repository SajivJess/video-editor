import React, { useMemo } from 'react';
import { useCurrentFrame, useVideoConfig } from 'remotion';
import {
  CaptionTrack,
  EditorialHeadline,
} from './components/captions';
import { THEME } from './config/theme';
import { CaptionSegment } from './types/project';

export {
  CaptionTrack,
  EditorialHeadline,
  HighlightPill,
  KineticCaption,
  StatCallout,
} from './components/captions';
export type {
  CaptionTrackProps,
  EditorialHeadlineProps,
  HighlightPillProps,
  KineticCaptionProps,
  StatCalloutProps,
} from './components/captions';

export interface SubtitleLine {
  text: string;
  highlight?: string;
  startFrame: number;
  endFrame: number;
  yOffset?: number;
  align?: 'center' | 'left';
}

export interface SubtitlesProps {
  lines?: SubtitleLine[];
}

/**
 * Backward-compatible timed subtitle wrapper delegating to `CaptionTrack`.
 */
export const Subtitles: React.FC<SubtitlesProps> = ({ lines = [] }) => {
  const frame = useCurrentFrame();

  const captions = useMemo<CaptionSegment[]>(
    () =>
      lines.map((line, index) => ({
        id: `subtitle-${index}-${line.startFrame}-${line.endFrame}`,
        style: 'kinetic',
        text: line.text,
        keywords: line.highlight ? [line.highlight] : [],
        startFrame: line.startFrame,
        endFrame: line.endFrame,
      })),
    [lines]
  );

  const activeLine = lines.find(
    (line) => frame >= line.startFrame && frame < line.endFrame
  );

  if (!activeLine) {
    return null;
  }

  if (activeLine.yOffset === undefined && activeLine.align === undefined) {
    return <CaptionTrack captions={captions} />;
  }

  const isLeft = activeLine.align === 'left';

  return (
    <div
      style={{
        position: 'absolute',
        bottom: activeLine.yOffset ?? 125,
        left: isLeft ? 80 : 0,
        right: isLeft ? 'auto' : 0,
        width: isLeft ? 740 : '100%',
        display: 'flex',
        justifyContent: isLeft ? 'flex-start' : 'center',
        alignItems: 'center',
        pointerEvents: 'none',
        zIndex: 55,
      }}
    >
      <CaptionTrack captions={captions} />
    </div>
  );
};

export interface HeroProps {
  title: string;
  highlightTitle?: string;
  subtitle: string;
  accentColor?: string;
}

const isSixDigitHex = (color: string): boolean =>
  /^#[0-9a-fA-F]{6}$/.test(color);

/**
 * Full-screen animated hero statement card delegating headline rendering
 * and animation to `EditorialHeadline`.
 */
export const HeroStatementCard: React.FC<HeroProps> = ({
  title,
  highlightTitle,
  subtitle,
  accentColor = THEME.accentColor,
}) => {
  const { durationInFrames } = useVideoConfig();
  const combinedTitle = highlightTitle
    ? `${title} ${highlightTitle}`.trim()
    : title;

  return (
    <div
      style={{
        position: 'absolute',
        inset: 0,
        backgroundColor: '#07111F',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 45,
        padding: '0 64px',
      }}
    >
      <div
        style={{
          position: 'absolute',
          width: 750,
          height: 750,
          borderRadius: '50%',
          background: isSixDigitHex(accentColor)
            ? `radial-gradient(circle, ${accentColor}25 0%, rgba(0,0,0,0) 70%)`
            : `radial-gradient(circle, ${THEME.accentColor}25 0%, rgba(0,0,0,0) 70%)`,
          filter: 'blur(100px)',
          pointerEvents: 'none',
        }}
      />

      <EditorialHeadline
        title={combinedTitle}
        subtitle={subtitle}
        accentWord={highlightTitle}
        accentColor={accentColor}
        startFrame={0}
        endFrame={Math.max(1, durationInFrames)}
      />
    </div>
  );
};
