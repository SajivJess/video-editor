import React from 'react';
import { useCurrentFrame } from 'remotion';
// @ts-ignore
import { CaptionSegment } from '../../types/project';
import { KineticCaption } from './KineticCaption';
import { HighlightPill } from './HighlightPill';
import { EditorialHeadline } from './EditorialHeadline';
import { StatCallout } from './StatCallout';

interface CaptionTrackProps {
  captions: CaptionSegment[];
}

export const CaptionTrack: React.FC<CaptionTrackProps> = ({ captions }) => {
  const frame = useCurrentFrame();

  const active = captions.find(
    (c) => frame >= c.startFrame && frame < c.endFrame
  );

  if (!active) return null;

  switch (active.style) {
    case 'kinetic':
      return (
        <KineticCaption
          text={active.text}
          keywords={active.keywords}
          startFrame={active.startFrame}
          endFrame={active.endFrame}
        />
      );
    case 'pill':
      return (
        <HighlightPill
          text={active.text}
          keywords={active.keywords}
          startFrame={active.startFrame}
          endFrame={active.endFrame}
        />
      );
    case 'editorial':
      return (
        <EditorialHeadline
          title={active.title ?? active.text}
          subtitle={active.subtitle}
          accentWord={active.accentWord}
          startFrame={active.startFrame}
          endFrame={active.endFrame}
        />
      );
    case 'stat':
      return (
        <StatCallout
          value={active.value ?? active.text}
          label={active.label}
          iconEmoji={active.iconEmoji}
          startFrame={active.startFrame}
          endFrame={active.endFrame}
        />
      );
    default:
      return null;
  }
};
