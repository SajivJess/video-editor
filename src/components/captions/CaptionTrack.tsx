import React from 'react';
import { useCurrentFrame } from 'remotion';
import {
  CaptionSegment,
  GraphicSegment,
  ThemeSettings,
} from '../../types/project';
import { EditorialBadge } from '../graphics/Badge';
import { EditorialHeadline } from './EditorialHeadline';
import { HighlightPill } from './HighlightPill';
import { KineticCaption } from './KineticCaption';
import { StatCallout } from './StatCallout';

export interface CaptionTrackProps {
  captions: CaptionSegment[];
  graphics?: GraphicSegment[];
  theme?: Partial<ThemeSettings>;
}

const renderCaptionSegment = (
  segment: CaptionSegment,
  theme?: Partial<ThemeSettings>
): React.ReactNode => {
  switch (segment.style) {
    case 'kinetic':
      return (
        <KineticCaption
          key={segment.id}
          text={segment.text}
          keywords={segment.keywords}
          words={segment.words}
          startFrame={segment.startFrame}
          endFrame={segment.endFrame}
          theme={theme}
        />
      );
    case 'pill':
      return (
        <HighlightPill
          key={segment.id}
          text={segment.text}
          keywords={segment.keywords}
          iconName={segment.iconName}
          startFrame={segment.startFrame}
          endFrame={segment.endFrame}
        />
      );
    case 'editorial':
      return (
        <EditorialHeadline
          key={segment.id}
          title={segment.title ?? segment.text}
          subtitle={segment.subtitle}
          accentWord={segment.accentWord}
          accentColor={theme?.highlightColor}
          startFrame={segment.startFrame}
          endFrame={segment.endFrame}
        />
      );
    case 'stat':
      return (
        <StatCallout
          key={segment.id}
          value={segment.value ?? segment.text}
          label={segment.label}
          iconName={segment.iconName}
          iconEmoji={segment.iconEmoji}
          accentColor={theme?.highlightColor}
          startFrame={segment.startFrame}
          endFrame={segment.endFrame}
        />
      );
    default:
      return null;
  }
};

export const CaptionTrack: React.FC<CaptionTrackProps> = ({
  captions,
  graphics = [],
  theme,
}) => {
  const frame = useCurrentFrame();

  const activeGraphic = graphics.find(
    (g) =>
      g.region === 'captions' &&
      (g.type === 'badge' || g.type === 'icon') &&
      frame >= g.startFrame &&
      frame < g.endFrame
  );

  const activeCaption = captions.find(
    (c) => frame >= c.startFrame && frame < c.endFrame
  );

  if (!activeGraphic && !activeCaption) {
    return null;
  }

  return (
    <div
      style={{
        width: '100%',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 16,
      }}
    >
      {activeGraphic && (
        <EditorialBadge
          key={activeGraphic.id}
          label={activeGraphic.label}
          iconName={activeGraphic.iconName}
          accentColor={theme?.accentColor}
          startFrame={activeGraphic.startFrame}
          endFrame={activeGraphic.endFrame}
        />
      )}
      {activeCaption ? renderCaptionSegment(activeCaption, theme) : null}
    </div>
  );
};
