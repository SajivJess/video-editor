import React from 'react';
import { AbsoluteFill, useCurrentFrame } from 'remotion';
import { Subtitles, SubtitleLine } from './Subtitles';

export const FPS = 30;
export const TOTAL_FRAMES = 300; // 10 seconds @ 30fps

const SUBTITLE_LINES: SubtitleLine[] = [];

/**
 * Starter composition template. Add <Sequence> blocks and reference clips
 * stored under `Raw Clips/` using `staticFile('clip.mp4')`.
 */
export const MainVideo: React.FC = () => {
  const frame = useCurrentFrame();

  return (
    <AbsoluteFill
      style={{
        backgroundColor: '#07111F',
        overflow: 'hidden',
        fontFamily:
          '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
      }}
    >
      <Subtitles lines={SUBTITLE_LINES} />

      <div
        style={{
          position: 'absolute',
          bottom: 0,
          left: 0,
          width: '100%',
          height: 4,
          backgroundColor: '#21262d',
          zIndex: 60,
        }}
      >
        <div
          style={{
            height: '100%',
            width: `${(frame / TOTAL_FRAMES) * 100}%`,
            background: 'linear-gradient(90deg, #0081fb, #a371f7, #3fb950)',
          }}
        />
      </div>
    </AbsoluteFill>
  );
};
