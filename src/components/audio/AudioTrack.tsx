import React from 'react';
import { Audio, Sequence, interpolate, staticFile } from 'remotion';
import { AudioTrackConfig, MediaDictionary } from '../../types/project';

export interface AudioTrackProps {
  media: MediaDictionary;
  durationFrames: number;
}

const CLAMP = {
  extrapolateLeft: 'clamp',
  extrapolateRight: 'clamp',
} as const;

const DEFAULT_BG_MUSIC_VOLUME = 0.4;
const DUCKED_BG_MUSIC_VOLUME = 0.15;
const DEFAULT_BG_FADE_FRAMES = 15;
const DUCK_RAMP_FRAMES = 6;

/**
 * Normalizes a file path string or AudioTrackConfig into an AudioTrackConfig,
 * returning null when empty or undefined.
 */
export function normalizeAudioTrack(
  input?: AudioTrackConfig | string
): AudioTrackConfig | null {
  if (!input) {
    return null;
  }
  if (typeof input === 'string') {
    const trimmed = input.trim();
    return trimmed ? { src: trimmed } : null;
  }
  const trimmed = input.src?.trim();
  if (!trimmed) {
    return null;
  }
  return { ...input, src: trimmed };
}

function computeFadeMultiplier(
  localFrame: number,
  duration: number,
  fadeInFrames: number,
  fadeOutFrames: number
): number {
  if (duration <= 0) {
    return 0;
  }

  const safeFadeIn = Math.max(0, Math.min(fadeInFrames, duration / 2));
  const safeFadeOut = Math.max(0, Math.min(fadeOutFrames, duration / 2));

  const fadeIn =
    safeFadeIn > 0
      ? interpolate(localFrame, [0, safeFadeIn], [0, 1], CLAMP)
      : 1;

  const fadeOut =
    safeFadeOut > 0 && duration > safeFadeOut
      ? interpolate(localFrame, [duration - safeFadeOut, duration], [1, 0], CLAMP)
      : 1;

  return fadeIn * fadeOut;
}

function clampVolume(value: number): number {
  return Math.max(0, Math.min(1, value));
}

/**
 * Orchestrates narration, background music (with automatic ducking under narration
 * and smooth clamped fades), and Sequence-timed SFX tracks.
 */
export const AudioTrack: React.FC<AudioTrackProps> = ({
  media,
  durationFrames,
}) => {
  if (durationFrames <= 0) {
    return null;
  }

  const narration = normalizeAudioTrack(media.narration);
  const bgMusic = normalizeAudioTrack(media.bgMusic);

  const narStart = narration ? Math.max(0, narration.startFrame ?? 0) : 0;
  const narEnd = narration
    ? Math.min(durationFrames, narration.endFrame ?? durationFrames)
    : 0;
  const narDuration = narEnd - narStart;
  const hasActiveNarration = narration !== null && narDuration > 0;

  const bgStart = bgMusic ? Math.max(0, bgMusic.startFrame ?? 0) : 0;
  const bgEnd = bgMusic
    ? Math.min(durationFrames, bgMusic.endFrame ?? durationFrames)
    : 0;
  const bgDuration = bgEnd - bgStart;

  return (
    <>
      {hasActiveNarration && (
        <Sequence
          from={narStart}
          durationInFrames={narDuration}
          layout="none"
        >
          <Audio
            src={staticFile(narration.src)}
            volume={(localFrame) => {
              const baseVolume = clampVolume(narration.volume ?? 1);
              const fadeMultiplier = computeFadeMultiplier(
                localFrame,
                narDuration,
                narration.fadeInFrames ?? 0,
                narration.fadeOutFrames ?? 0
              );
              return clampVolume(baseVolume * fadeMultiplier);
            }}
          />
        </Sequence>
      )}

      {bgMusic && bgDuration > 0 && (
        <Sequence from={bgStart} durationInFrames={bgDuration} layout="none">
          <Audio
            src={staticFile(bgMusic.src)}
            volume={(localFrame) => {
              const normalVolume = clampVolume(
                bgMusic.volume ?? DEFAULT_BG_MUSIC_VOLUME
              );
              const duckedVolume = Math.min(normalVolume, DUCKED_BG_MUSIC_VOLUME);
              const globalFrame = bgStart + localFrame;

              let duckedTarget = normalVolume;
              if (hasActiveNarration) {
                if (globalFrame >= narStart && globalFrame < narEnd) {
                  duckedTarget = duckedVolume;
                } else if (
                  globalFrame >= narStart - DUCK_RAMP_FRAMES &&
                  globalFrame < narStart
                ) {
                  duckedTarget = interpolate(
                    globalFrame,
                    [narStart - DUCK_RAMP_FRAMES, narStart],
                    [normalVolume, duckedVolume],
                    CLAMP
                  );
                } else if (
                  globalFrame >= narEnd &&
                  globalFrame <= narEnd + DUCK_RAMP_FRAMES
                ) {
                  duckedTarget = interpolate(
                    globalFrame,
                    [narEnd, narEnd + DUCK_RAMP_FRAMES],
                    [duckedVolume, normalVolume],
                    CLAMP
                  );
                }
              }

              const fadeMultiplier = computeFadeMultiplier(
                localFrame,
                bgDuration,
                bgMusic.fadeInFrames ?? DEFAULT_BG_FADE_FRAMES,
                bgMusic.fadeOutFrames ?? DEFAULT_BG_FADE_FRAMES
              );

              return clampVolume(duckedTarget * fadeMultiplier);
            }}
          />
        </Sequence>
      )}

      {media.sfx?.map((sfx) => {
        const src = sfx.src?.trim();
        const start = Math.max(0, sfx.startFrame);
        const sfxDuration = durationFrames - start;
        if (!src || sfxDuration <= 0) {
          return null;
        }
        return (
          <Sequence
            key={sfx.id}
            from={start}
            durationInFrames={sfxDuration}
            layout="none"
          >
            <Audio
              src={staticFile(src)}
              volume={clampVolume(sfx.volume ?? 0.8)}
            />
          </Sequence>
        );
      })}
    </>
  );
};

