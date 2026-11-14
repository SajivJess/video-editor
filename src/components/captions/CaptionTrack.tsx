import { CAPTION_PRESETS } from '../../config/theme';
import { wordsForCaption } from '../../engine/captions';
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
import { ModernCaption, ModernWord } from './ModernCaption';

export interface CaptionTrackProps {
  captions: CaptionSegment[];
  graphics?: GraphicSegment[];
  theme?: Partial<ThemeSettings>;
}

const renderCaptionSegment = (
  segment: CaptionSegment,
  theme?: Partial<ThemeSettings>
): React.ReactNode => {
  const preset = segment.preset ? CAPTION_PRESETS[segment.preset] : undefined;
  const style = preset?.style ?? segment.style;
  theme = preset ? { ...theme, fontWeight: preset.fontWeight, borderRadius: preset.borderRadius, bgPanel: preset.backgroundColor, captionFontSize: preset.fontSize } : theme;
  switch (style) {
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
          theme={theme}
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
          theme={theme}
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
          theme={theme}
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
    case 'modern':
      {
        return (
          <ModernCaption
            key={segment.id}
            words={wordsForCaption(segment)}
            keywords={segment.keywords}
            animation={segment.animation}
            fontSize={theme?.captionFontSize}
            maxWords={theme?.captionMaxWords}
            fontFamily={theme?.fontFamily}
            treatment={theme?.captionTreatment}
            fontWeight={theme?.fontWeight}
            borderRadius={theme?.borderRadius}
            startFrame={segment.startFrame}
            endFrame={segment.endFrame}
            accentColor={theme?.highlightColor}
            textColor={theme?.primaryText}
            pillTextColor={theme?.pillTextColor}
          />
        );
      }
      return null;
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
      (g.type === 'badge' || g.type === 'icon' || g.type === 'stat' || g.type === 'stat-card') &&
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
      {activeGraphic && (activeGraphic.type === 'stat' || activeGraphic.type === 'stat-card') ? (
        <StatCallout key={activeGraphic.id} value={activeGraphic.value ?? activeGraphic.label} label={activeGraphic.label}
          iconName={activeGraphic.iconName} startFrame={activeGraphic.startFrame} endFrame={activeGraphic.endFrame} theme={theme} />
      ) : activeGraphic && (
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
