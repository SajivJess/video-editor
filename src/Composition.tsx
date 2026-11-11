import React from 'react';
import { AbsoluteFill } from 'remotion';
import { VideoProject } from './types/project';
import { BrollRegion } from './components/layout/BrollRegion';
import { FacecamRegion } from './components/layout/FacecamRegion';
import { CaptionRegion } from './components/layout/CaptionRegion';
import { CaptionTrack } from './components/captions/CaptionTrack';
import { KineticCaption } from './components/captions/KineticCaption';
import { HighlightPill } from './components/captions/HighlightPill';
import { EditorialHeadline } from './components/captions/EditorialHeadline';
import { StatCallout } from './components/captions/StatCallout';

export const TOTAL_FRAMES = 270;

// ---------------------------------------------------------------------------
// Sample project (used as default props for ReelBase)
// ---------------------------------------------------------------------------
export const sampleProject: VideoProject = {
  version: 1,
  composition: {
    width: 1080,
    height: 1920,
    fps: 30,
    durationFrames: TOTAL_FRAMES,
  },
  media: {},
  captions: [
    {
      id: 'cap-1',
      style: 'kinetic',
      text: 'AI VOICE SCAM ஆல்',
      keywords: ['AI VOICE SCAM'],
      startFrame: 0,
      endFrame: 60,
    },
    {
      id: 'cap-2',
      style: 'pill',
      text: '₹1.2 LAKH இழந்தார்',
      keywords: ['₹1.2 LAKH'],
      startFrame: 60,
      endFrame: 120,
    },
    {
      id: 'cap-3',
      style: 'editorial',
      text: 'PROOF NOT VIBES',
      title: 'PROOF NOT VIBES',
      accentWord: 'PROOF',
      subtitle: 'Verified evidence only',
      keywords: [],
      startFrame: 120,
      endFrame: 180,
    },
    {
      id: 'cap-4',
      style: 'stat',
      text: '₹1,20,000',
      value: '₹1,20,000',
      label: 'TOTAL LOSS',
      iconEmoji: '⚠️',
      keywords: [],
      startFrame: 180,
      endFrame: 240,
    },
    {
      id: 'cap-5',
      style: 'kinetic',
      text: 'Stay safe online!',
      keywords: ['Stay safe'],
      startFrame: 240,
      endFrame: 270,
    },
  ],
  visuals: [],
  graphics: [],
};

// ---------------------------------------------------------------------------
// A) ReelComposition — real engine orchestrator
// ---------------------------------------------------------------------------
interface ReelCompositionProps {
  project: VideoProject;
}

export const ReelComposition: React.FC<ReelCompositionProps> = ({ project }) => {
  return (
    <AbsoluteFill style={{ backgroundColor: '#07111F' }}>
      <BrollRegion src={project.media.facecam} kenBurns />
      <FacecamRegion src={project.media.facecam} />
      <CaptionRegion facecamSrc={project.media.facecam}>
        <CaptionTrack captions={project.captions} />
      </CaptionRegion>
    </AbsoluteFill>
  );
};

// ---------------------------------------------------------------------------
// B) DemoComposition — hardcoded demo with synthetic data
// ---------------------------------------------------------------------------
export const DemoComposition: React.FC = () => {
  return (
    <AbsoluteFill
      style={{
        backgroundColor: '#07111F',
        fontFamily:
          '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", sans-serif',
      }}
    >
      {/* Top 40%: B-roll placeholder */}
      <BrollRegion />

      {/* Middle 20%: Facecam placeholder */}
      <FacecamRegion />

      {/* Bottom 40%: Caption region (no facecam src for demo) */}
      <CaptionRegion>
        {/* Frames 0–60: kinetic */}
        <KineticCaption
          text="AI VOICE SCAM ஆல்"
          keywords={['AI VOICE SCAM']}
          startFrame={0}
          endFrame={60}
        />
        {/* Frames 60–120: pill */}
        <HighlightPill
          text="₹1.2 LAKH இழந்தார்"
          keywords={['₹1.2 LAKH']}
          startFrame={60}
          endFrame={120}
        />
        {/* Frames 120–180: editorial */}
        <EditorialHeadline
          title="PROOF NOT VIBES"
          accentWord="PROOF"
          subtitle="Verified evidence only"
          startFrame={120}
          endFrame={180}
        />
        {/* Frames 180–240: stat */}
        <StatCallout
          value="₹1,20,000"
          label="TOTAL LOSS"
          iconEmoji="⚠️"
          startFrame={180}
          endFrame={240}
        />
        {/* Frames 240–270: kinetic */}
        <KineticCaption
          text="Stay safe online!"
          keywords={['Stay safe']}
          startFrame={240}
          endFrame={270}
        />
      </CaptionRegion>
    </AbsoluteFill>
  );
};

// Keep legacy exports for backward compat
export const FPS = 30;
export const MainVideo = DemoComposition;
