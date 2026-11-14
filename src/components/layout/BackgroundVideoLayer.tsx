import { mediaSource } from '../../utils/media';
import React from 'react';
import { OffthreadVideo } from 'remotion';
import { CameraMove, InterstitialSegment } from '../../types/project';
import { CameraRig } from '../camera/CameraRig';
import { InterstitialTrack } from '../interstitials/InterstitialTrack';

export interface BackgroundVideoLayerProps {
  muted?: boolean;
  volume?: number;
  src?: string;
  cameraMoves?: CameraMove[];
  interstitials?: InterstitialSegment[];
}

/**
 * Full-frame Background Video Layer (0%–100%, 1080x1920):
 * - Renders presenter footage across the full portrait canvas (NO SPLIT BLUR).
 * - Governed by CameraRig (pan & zoom, sudden punch-zooms, whip-pans, micro-shakes).
 * - Interstitial AI-Generated clips (Google Flow, 5–10s) transition over this layer seamlessly.
 */
export const BackgroundVideoLayer: React.FC<BackgroundVideoLayerProps> = ({
  src,
  cameraMoves = [],
  interstitials = [],
  muted = false,
  volume = 1,
}) => {
  return (
    <div
      style={{
        position: 'absolute',
        inset: 0,
        backgroundColor: '#07111F',
        overflow: 'hidden',
      }}
    >
      {/* 1. Camera-rigged background presenter video */}
      <CameraRig moves={cameraMoves}>
        {src ? (
          <OffthreadVideo
            muted={muted}
            volume={volume}
            src={mediaSource(src)}
            style={{
              width: '100%',
              height: '100%',
              objectFit: 'cover',
            }}
          />
        ) : (
          /* Placeholder presenter studio mode */
          <div
            style={{
              width: '100%',
              height: '100%',
              background: 'radial-gradient(circle at 50% 55%, #162436 0%, #080D15 100%)',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            {/* Center face marker */}
            <div
              style={{
                width: 140,
                height: 140,
                borderRadius: '50%',
                border: '2px dashed rgba(255,255,255,0.2)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexDirection: 'column',
                gap: 6,
              }}
            >
              <svg width="44" height="44" viewBox="0 0 44 44" fill="none">
                <circle cx="22" cy="16" r="10" stroke="rgba(255,255,255,0.4)" strokeWidth="2.5" />
                <path
                  d="M4 40 C6 28, 14 26, 22 26 C30 26, 38 28, 40 40"
                  stroke="rgba(255,255,255,0.4)"
                  strokeWidth="2.5"
                />
              </svg>
              <span
                style={{
                  fontFamily: 'monospace',
                  fontSize: 12,
                  color: 'rgba(255,255,255,0.4)',
                  letterSpacing: '1px',
                }}
              >
                PRESENTER
              </span>
            </div>
          </div>
        )}
      </CameraRig>

      {/* 2. Interstitial AI-Generated clips (Google Flow) */}
      <InterstitialTrack interstitials={interstitials} />
    </div>
  );
};

