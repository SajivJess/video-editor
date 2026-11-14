import { mediaSource } from '../../utils/media';
import React from 'react';
import { Audio, Sequence, interpolate } from 'remotion';
import { AudioTrackConfig, MediaDictionary } from '../../types/project';

export interface AudioTrackProps {
  settings?: AudioTrackConfig;
  media: MediaDictionary;
  durationFrames: number;
}

const CLAMP = {
  extrapolateLeft: 'clamp',
  extrapolateRight: 'clamp',
} as const;

const DEFAULT_BG_MUSIC_VOLUME = 0.4;
const DEFAULT_BG_FADE_FRAMES = 15;
const DUCK_RAMP_FRAMES = 6;

export type NormalizedAudioTrack = AudioTrackConfig & { src: string };

/**
 * Normalizes a file path string or AudioTrackConfig into an AudioTrackConfig with guaranteed src,
 * returning null when empty or undefined.
 */
export function normalizeAudioTrack(
  input?: AudioTrackConfig | string
): NormalizedAudioTrack | null {
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
  settings,
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
  const hasSeparateNarration = narration !== null && narDuration > 0;
  const hasActiveNarration = hasSeparateNarration || Boolean(media.facecam && (media.facecamVolume ?? 1) > 0);
  const speechStart = hasSeparateNarration ? narStart : 0;
  const speechEnd = hasSeparateNarration ? narEnd : durationFrames;

  const bgStart = bgMusic ? Math.max(0, bgMusic.startFrame ?? 0) : 0;
  const bgEnd = bgMusic
    ? Math.min(durationFrames, bgMusic.endFrame ?? durationFrames)
    : 0;
  const bgDuration = bgEnd - bgStart;

  return (
    <>
      {hasSeparateNarration && narration && (
        <Sequence
          from={narStart}
          durationInFrames={narDuration}
          layout="none"
        >
          <Audio
            src={mediaSource(narration.src)}
            volume={(localFrame) => {
              const baseVolume = clampVolume(narration.volume ?? settings?.narrationVolume ?? 1);
              const fadeMultiplier = computeFadeMultiplier(
                localFrame,
                narDuration,
                narration.fadeInFrames ?? 0,
                narration.fadeOutFrames ?? 0
              );
              return clampVolume(baseVolume * fadeMultiplier * (settings?.volume ?? 1));
            }}
          />
        </Sequence>
      )}

      {bgMusic && bgDuration > 0 && (
        <Sequence from={bgStart} durationInFrames={bgDuration} layout="none">
          <Audio
            src={mediaSource(bgMusic.src)}
            volume={(localFrame) => {
              const normalVolume = clampVolume(
                bgMusic.volume ?? settings?.bgMusicVolume ?? DEFAULT_BG_MUSIC_VOLUME
              );
              const duckedVolume = normalVolume * (1 - Math.min(1, bgMusic.duckingAmount ?? settings?.duckingAmount ?? .8));
              const globalFrame = bgStart + localFrame;

              let duckedTarget = normalVolume;
              if (hasActiveNarration) {
                if (globalFrame >= speechStart && globalFrame < speechEnd) {
                  duckedTarget = duckedVolume;
                } else if (
                  globalFrame >= speechStart - DUCK_RAMP_FRAMES &&
                  globalFrame < speechStart
                ) {
                  duckedTarget = interpolate(
                    globalFrame,
                    [speechStart - DUCK_RAMP_FRAMES, speechStart],
                    [normalVolume, duckedVolume],
                    CLAMP
                  );
                } else if (
                  globalFrame >= speechEnd &&
                  globalFrame <= speechEnd + DUCK_RAMP_FRAMES
                ) {
                  duckedTarget = interpolate(
                    globalFrame,
                    [speechEnd, speechEnd + DUCK_RAMP_FRAMES],
                    [duckedVolume, normalVolume],
                    CLAMP
                  );
                }
              }

              for (const sfx of media.sfx ?? []) {
                const distance = Math.abs(globalFrame - sfx.startFrame);
                if (distance < 9) duckedTarget *= 1 - (settings?.sfxDuckAmount ?? .2) * (1 - distance / 9);
              }
              const fadeMultiplier = computeFadeMultiplier(
                localFrame,
                bgDuration,
                bgMusic.fadeInFrames ?? DEFAULT_BG_FADE_FRAMES,
                bgMusic.fadeOutFrames ?? DEFAULT_BG_FADE_FRAMES
              );

              return clampVolume(duckedTarget * fadeMultiplier * (settings?.volume ?? 1));
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
              src={mediaSource(src)}
              volume={clampVolume((sfx.volume ?? 0.8) * (settings?.volume ?? 1))}
            />
          </Sequence>
        );
      })}
    </>
  );
};

