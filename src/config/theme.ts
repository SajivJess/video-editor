import {
  CaptionPreset,
  CaptionSegment,
  RegionLayout,
  ThemeSettings,
} from '../types/project';

export type { ThemeSettings };

export const THEME: ThemeSettings = {
  primaryText: '#FFFFFF',
  highlightColor: '#FFD700',
  accentColor: '#00D2FF',
  warningColor: '#FF4444',
  bgPanel: 'rgba(0,0,0,0.6)',
  fontFamily:
    '"Noto Sans Tamil", "Nirmala UI", "Latha", -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
  fontWeight: 800,
  borderRadius: 16,
  shadowStyle: '0 4px 24px rgba(0,0,0,0.6)',
};

export interface CaptionPresetConfig {
  style: CaptionSegment['style'];
  fontSize: number;
  fontWeight: number;
  textTransform: 'uppercase' | 'none';
  backgroundColor: string;
  borderRadius: number;
  padding: string;
  border?: string;
  backdropBlurPx?: number;
  textColor: string;
  highlightColor: string;
  accentColor: string;
  letterSpacing?: string;
  lineHeight: number;
  shadowStyle: string;
}

export const CAPTION_PRESETS: Record<CaptionPreset, CaptionPresetConfig> = {
  kinetic: {
    style: 'kinetic',
    fontSize: 36,
    fontWeight: 900,
    textTransform: 'none',
    backgroundColor: THEME.bgPanel,
    borderRadius: 20,
    padding: '16px 28px',
    backdropBlurPx: 8,
    textColor: THEME.primaryText,
    highlightColor: THEME.highlightColor,
    accentColor: THEME.accentColor,
    lineHeight: 1.3,
    shadowStyle: THEME.shadowStyle,
  },
  editorial: {
    style: 'editorial',
    fontSize: 56,
    fontWeight: 900,
    textTransform: 'uppercase',
    backgroundColor: 'transparent',
    borderRadius: 0,
    padding: '12px 24px',
    textColor: THEME.primaryText,
    highlightColor: THEME.highlightColor,
    accentColor: THEME.accentColor,
    lineHeight: 1.1,
    shadowStyle: THEME.shadowStyle,
  },
  minimal: {
    style: 'pill',
    fontSize: 32,
    fontWeight: 800,
    textTransform: 'none',
    backgroundColor: '#1a1a2e',
    borderRadius: 999,
    padding: '14px 32px',
    border: '2px solid rgba(255,255,255,0.15)',
    textColor: THEME.primaryText,
    highlightColor: THEME.highlightColor,
    accentColor: THEME.accentColor,
    lineHeight: 1.3,
    shadowStyle: THEME.shadowStyle,
  },
  'data-callout': {
    style: 'stat',
    fontSize: 72,
    fontWeight: 900,
    textTransform: 'uppercase',
    backgroundColor: 'rgba(0,0,0,0.7)',
    borderRadius: 24,
    padding: '24px 40px',
    border: '2px solid rgba(255,215,0,0.4)',
    textColor: THEME.primaryText,
    highlightColor: THEME.highlightColor,
    accentColor: THEME.accentColor,
    letterSpacing: '2px',
    lineHeight: 1.0,
    shadowStyle: THEME.shadowStyle,
  },
};

export const LAYOUT: RegionLayout = {
  visuals: { y: 0, h: 0.4 },
  facecam: { y: 0.4, h: 0.6 },
  facecamClear: { y: 0.4, h: 0.2 },
  captions: { y: 0.6, h: 0.4 },
};

export const COMPOSITION_DEFAULTS = {
  width: 1080,
  height: 1920,
  fps: 30,
  blurStrength: 15,
  tintOpacity: 0.25,
  safeMarginX: 40,
  safeMarginY: 48,
} as const;
