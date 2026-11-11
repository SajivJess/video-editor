// Strongly-typed interfaces for the Instagram Reel editing engine

export type IconName =
  | 'shield'
  | 'alert'
  | 'ai'
  | 'currency'
  | 'car'
  | 'business'
  | 'space'
  | 'government'
  | 'warning'
  | 'lock'
  | 'check'
  | 'chart';

export type CaptionPreset = 'kinetic' | 'editorial' | 'minimal' | 'data-callout';

export interface WordTiming {
  word: string;
  startFrame: number;
  endFrame: number;
}

export interface KenBurnsConfig {
  fromScale: number;
  toScale: number;
  fromX?: number;
  toX?: number;
  fromY?: number;
  toY?: number;
}

export interface MediaAsset {
  id: string;
  type: 'image' | 'video' | 'audio';
  src: string;
  startFrame?: number;
  endFrame?: number;
  crop?: { x: number; y: number; scale: number };
}

export interface AnimationSettings {
  entrance: 'spring' | 'fade' | 'slide-up';
  exit: 'fade' | 'slide-down';
  duration: number;
}

export interface ThemeSettings {
  primaryText: string;
  highlightColor: string;
  accentColor: string;
  warningColor: string;
  bgPanel: string;
  fontFamily: string;
  fontWeight: number;
  borderRadius: number;
  shadowStyle: string;
}

export interface CompositionSettings {
  width: number;
  height: number;
  fps: number;
  durationFrames: number;
  blurStrength?: number;
  tintOpacity?: number;
  safeMarginX?: number;
  safeMarginY?: number;
}

export interface RegionLayout {
  visuals: { y: number; h: number };
  facecam: { y: number; h: number };
  facecamClear: { y: number; h: number };
  captions: { y: number; h: number };
}

export interface CaptionSegment {
  id: string;
  style: 'kinetic' | 'pill' | 'editorial' | 'stat';
  preset?: CaptionPreset;
  text: string;
  words?: WordTiming[];
  title?: string;
  subtitle?: string;
  value?: string;
  label?: string;
  iconName?: IconName;
  iconEmoji?: string;
  accentWord?: string;
  keywords: string[];
  startFrame: number;
  endFrame: number;
  animation?: AnimationSettings;
}

export interface VisualSegment {
  id: string;
  src: string;
  type: 'image' | 'video';
  startFrame: number;
  endFrame: number;
  transition?: 'cut' | 'fade' | 'slide';
  kenBurns?: KenBurnsConfig;
  label?: string;
  focalPoint?: { x: number; y: number };
}

export interface GraphicSegment {
  id: string;
  type: 'icon' | 'badge' | 'stat-card';
  label: string;
  value?: string;
  iconName?: IconName;
  startFrame: number;
  endFrame: number;
  region: 'captions';
}

export interface AudioTrackConfig {
  src: string;
  volume?: number;
  startFrame?: number;
  endFrame?: number;
  fadeInFrames?: number;
  fadeOutFrames?: number;
}

export interface SfxSegment {
  id: string;
  src: string;
  startFrame: number;
  volume?: number;
}

export interface MediaDictionary {
  facecam?: string;
  narration?: AudioTrackConfig | string;
  bgMusic?: AudioTrackConfig | string;
  sfx?: SfxSegment[];
}

export interface VideoProject {
  version: 1;
  composition: CompositionSettings;
  theme?: Partial<ThemeSettings>;
  media: MediaDictionary;
  captions: CaptionSegment[];
  visuals: VisualSegment[];
  graphics: GraphicSegment[];
}
