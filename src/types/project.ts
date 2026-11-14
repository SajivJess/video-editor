// Strongly-typed interfaces for the Instagram Reel editing engine

export interface WordTiming {
  word: string;
  startFrame: number;
  endFrame: number;
  emphasis?: boolean;
}

export interface KenBurnsConfig {
  startScale?: number;
  endScale?: number;
  startX?: number;
  endX?: number;
  startY?: number;
  endY?: number;
  fromScale?: number;
  toScale?: number;
  fromX?: number;
  toX?: number;
  fromY?: number;
  toY?: number;
}

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
  | 'chart'
  | 'sparkle'
  | 'chip';

export type CaptionPreset = 'kinetic' | 'editorial' | 'minimal' | 'data-callout';

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
  name?: string;
  description?: string;
  mood?: string;
  captionTreatment?: 'expressive' | 'clean';
  captionFontSize?: number;
  captionMaxWords?: number;
  primaryText: string;
  highlightColor: string;
  accentColor: string;
  pillTextColor?: string;
  warningColor?: string;
  bgPanel?: string;
  fontFamily: string;
  fontWeight: number;
  borderRadius: number;
  shadowStyle: string;
}

export interface CompositionSettings {
  overlayEndFrame?: number;
  width: number;
  height: number;
  fps: number;
  durationFrames: number;
  blurStrength?: number;
  tintOpacity?: number;
  safeMarginX?: number;
  safeMarginY?: number;
}

export interface RegionBounds {
  y: number;
  h: number;
}

export interface RegionLayout {
  topVisuals: RegionBounds;
  clearMiddle: RegionBounds;
  captions: RegionBounds;
  // Aliases for compatibility
  visuals: RegionBounds;
  facecam: RegionBounds;
  facecamClear: RegionBounds;
}

export interface CaptionSegment {
  id: string;
  style: 'kinetic' | 'pill' | 'editorial' | 'stat' | 'modern';
  preset?: CaptionPreset;
  text: string;
  words?: WordTiming[];
  keywords: string[];
  startFrame: number;
  endFrame: number;
  title?: string;
  subtitle?: string;
  value?: string;
  label?: string;
  iconName?: IconName;
  iconEmoji?: string;
  accentWord?: string;
  animation?: AnimationSettings;
}

export type TransitionName = 'cut' | 'fade' | 'slide' | 'zoom' | 'zoom-through' | 'whip-pan' | 'flash' | 'diagonal-wipe';

export interface VisualSegment {
  sourceStartFrame?: number;
  id: string;
  src: string;
  type: 'image' | 'video';
  startFrame: number;
  endFrame: number;
  transition?: TransitionName;
  kenBurns?: KenBurnsConfig;
  label?: string;
  focalPoint?: { x: number; y: number };
}

export type CameraMoveType =
  | 'hold'
  | 'slow-zoom-in'
  | 'slow-zoom-out'
  | 'sudden-zoom'
  | 'pan'
  | 'whip-pan'
  | 'micro-shake';

export interface CameraMove {
  id: string;
  type: CameraMoveType;
  startFrame: number;
  endFrame: number;
  fromScale?: number;
  toScale?: number;
  fromX?: number;
  toX?: number;
  fromY?: number;
  toY?: number;
  intensity?: number;
}

export interface InterstitialSegment {
  sourceStartFrame?: number;
  volume?: number;
  id: string;
  src: string;
  startFrame: number;
  endFrame: number;
  label?: string;
  transitionIn?: TransitionName;
  transitionOut?: TransitionName;
  cameraMove?: 'zoom-in' | 'pan-left' | 'pan-right' | 'subtle-drift';
}

export type GraphicType =
  | 'badge'
  | 'stat'
  | 'logo-spotlight'
  | 'person-pictorial'
  | 'collage-card'
  | 'icon'
  | 'stat-card'
  | 'step-card'
  | 'process-diagram'
  | 'comparison';

export interface PersonPictorialConfig {
  src?: string;
  name?: string;
  title?: string;
  avatarType?: 'jensen' | 'founder' | 'analyst' | 'custom';
  accent?: string;
}

export interface LogoSpotlightConfig {
  src?: string;
  brand: 'nvidia' | 'openai' | 'gemini' | 'claude' | 'custom';
  label?: string;
  glowColor?: string;
}

export interface GraphicSegment {
  steps?: string[];
  id: string;
  type: GraphicType;
  label: string;
  value?: string;
  iconName?: IconName;
  person?: PersonPictorialConfig;
  logo?: LogoSpotlightConfig;
  startFrame: number;
  endFrame: number;
  region: 'captions' | 'visuals';
}

export interface EntityAsset {
  id: string;
  name: string;
  aliases: string[];
  kind: 'person' | 'brand';
  src?: string;
  brand?: LogoSpotlightConfig['brand'];
  accent?: string;
  sourceUrl?: string;
}

export interface SceneTransition {
  id: string;
  type: 'whip-pan' | 'zoom-through' | 'diagonal-wipe';
  startFrame: number;
  endFrame: number;
  color?: string;
}

/** Reviewed editorial intent. Emphasized captions and photo reveals do not imply effects. */
export interface EditBeat {
  id: string;
  frame: number;
  reason: string;
  camera?: 'punch' | 'pan' | 'whip';
  transition?: SceneTransition['type'];
  sound?: 'impact' | 'whoosh';
}

export interface AudioTrackConfig {
  src?: string;
  volume?: number;
  startFrame?: number;
  endFrame?: number;
  fadeInFrames?: number;
  fadeOutFrames?: number;
  duckingAmount?: number;
  sfxDuckAmount?: number;
  bgMusicVolume?: number;
  narrationVolume?: number;
}

export interface SfxSegment {
  id: string;
  src: string;
  startFrame: number;
  volume?: number;
}

export interface MediaDictionary {
  facecamVolume?: number;
  facecam?: string;
  narration?: AudioTrackConfig | string;
  bgMusic?: AudioTrackConfig | string;
  sfx?: SfxSegment[];
}

export interface VideoProject {
  editBeats?: EditBeat[];
  entities?: EntityAsset[];
  transitions?: SceneTransition[];
  version: 1;
  composition: CompositionSettings;
  theme?: Partial<ThemeSettings>;
  media: MediaDictionary;
  visuals: VisualSegment[];
  interstitials?: InterstitialSegment[];
  cameraMoves?: CameraMove[];
  graphics: GraphicSegment[];
  captions: CaptionSegment[];
  audio?: AudioTrackConfig;
}
