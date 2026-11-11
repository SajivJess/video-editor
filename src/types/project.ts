// Strongly-typed interfaces for the Instagram Reel editing engine

export interface CompositionSettings {
  width: 1080;
  height: 1920;
  fps: 30;
  durationFrames: number;
}

export interface RegionLayout {
  visuals: { y: number; h: number };
  facecam: { y: number; h: number };
  captions: { y: number; h: number };
}

export interface CaptionSegment {
  id: string;
  style: 'kinetic' | 'pill' | 'editorial' | 'stat';
  text: string;
  title?: string;
  subtitle?: string;
  value?: string;
  label?: string;
  iconEmoji?: string;
  accentWord?: string;
  keywords: string[];
  startFrame: number;
  endFrame: number;
}

export interface VisualSegment {
  id: string;
  src: string;
  type: 'image' | 'video';
  startFrame: number;
  endFrame: number;
  transition?: 'cut' | 'fade';
}

export interface GraphicSegment {
  id: string;
  type: 'icon' | 'stat-card';
  label: string;
  value?: string;
  iconEmoji?: string;
  startFrame: number;
  endFrame: number;
}

export interface MediaDictionary {
  facecam?: string;
  narration?: string;
  bgMusic?: string;
}

export interface WordTiming {
  word: string;
  startFrame: number;
  endFrame: number;
}

export interface VideoProject {
  version: 1;
  composition: CompositionSettings;
  media: MediaDictionary;
  captions: CaptionSegment[];
  visuals: VisualSegment[];
  graphics: GraphicSegment[];
}
