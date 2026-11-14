import { EditorialVisual } from '../graphics/EditorialVisual';
import { PersonCutout } from '../graphics/PersonCutout';
import { ProcessDiagram } from '../graphics/ProcessDiagram';
import { TransitionWrapper } from '../transitions/TransitionWrapper';
import React from 'react';
import { useCurrentFrame } from 'remotion';
import { LAYOUT } from '../../config/theme';
import { GraphicSegment, ThemeSettings, VisualSegment } from '../../types/project';
import { VisualTrack } from '../visuals/VisualTrack';
import { StepCard } from '../graphics/StepCard';

export interface TopVisualRegionProps {
  visuals?: VisualSegment[];
  graphics?: GraphicSegment[];
  theme?: Partial<ThemeSettings>;
}

/**
 * Top 40% Visual & Vector Overlay Region (Y = 0%–40%, 0–768px):
 * Transparent overlay sitting directly on top of the full-frame background video.
 * Houses:
 * - 2D vector animations (animated brand logos, orbital rings)
 * - 2D character/person pictorials (e.g. Jensen Huang keynote badge)
 * - Tactile editorial halftone collage cards (assembled from empty)
 * - B-roll visual footage/images
 * - Editorial topic badges
 * STRICT: Must stay strictly within the top 40% (never entering the 40%–70% face zone).
 */
export const TopVisualRegion: React.FC<TopVisualRegionProps> = ({
  visuals = [],
  graphics = [],
  theme,
}) => {
  const frame = useCurrentFrame();

  const activeVisual = visuals.find(
    (v) => frame >= v.startFrame && frame < v.endFrame
  );

  const activeGraphic = graphics.find(
    (g) =>
      g.region === 'visuals' && frame >= g.startFrame && frame < g.endFrame
  );

  return (
    <div
      style={{
        position: 'absolute',
        top: 0,
        left: 0,
        width: '100%',
        height: `${LAYOUT.topVisuals.h * 100}%`,
        overflow: 'hidden',
        pointerEvents: 'none',
        zIndex: 5,
      }}
    >
      {/* Visual B-roll track if active */}
      {activeVisual && (
        <div style={{ position: 'absolute', inset: 0, zIndex: 1 }}>
          <VisualTrack visuals={visuals} />
        </div>
      )}

      {/* 2D Vector Animations, Person Pictorials & Badges */}
      {activeGraphic && (
        <TransitionWrapper key={activeGraphic.id}
          type={activeGraphic.type === 'person-pictorial' ? 'cut' : activeGraphic.type === 'step-card' ? 'diagonal-wipe' : 'zoom'}
          exitType="fade" startFrame={activeGraphic.startFrame} endFrame={activeGraphic.endFrame} transitionFrames={6}
          style={{
            position: 'absolute',
            inset: 0,
            zIndex: 2,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '38px 48px 26px',
            boxSizing: 'border-box',
          }}
        >
          {activeGraphic.type === 'person-pictorial' ? <PersonCutout graphic={activeGraphic}/> : activeGraphic.type === 'step-card' ? (
            <StepCard stepNumber={activeGraphic.value ?? '01'} stepLabel={activeGraphic.label}
              description={activeGraphic.person?.title} accentColor={theme?.accentColor ?? '#C8102E'}
              startFrame={activeGraphic.startFrame} endFrame={activeGraphic.endFrame} />
          ) : (activeGraphic.type === 'process-diagram' || activeGraphic.type === 'comparison') ? <ProcessDiagram graphic={activeGraphic} accent={theme?.accentColor} accentText={theme?.pillTextColor} /> : <EditorialVisual graphic={activeGraphic} theme={theme} />}
        </TransitionWrapper>
      )}
    </div>
  );
};

