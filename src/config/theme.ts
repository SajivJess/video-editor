import { RegionLayout } from '../types/project';

export interface ThemeSettings {
  primaryText: string;
  highlightColor: string;
  accentColor: string;
  bgPanel: string;
  borderRadius: number;
  fontFamily: string;
}

export const THEME: ThemeSettings = {
  primaryText: '#FFFFFF',
  highlightColor: '#FFD700',
  accentColor: '#00D2FF',
  bgPanel: 'rgba(0,0,0,0.6)',
  borderRadius: 16,
  fontFamily:
    '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", sans-serif',
};

export const LAYOUT: RegionLayout = {
  visuals: { y: 0, h: 0.4 },
  facecam: { y: 0.4, h: 0.2 },
  captions: { y: 0.6, h: 0.4 },
};

export const COMPOSITION_DEFAULTS = {
  width: 1080,
  height: 1920,
  fps: 30,
} as const;
