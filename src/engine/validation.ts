import {
  AnimationSettings,
  AudioTrackConfig,
  CaptionPreset,
  CaptionSegment,
  CompositionSettings,
  GraphicSegment,
  IconName,
  KenBurnsConfig,
  MediaAsset,
  MediaDictionary,
  SfxSegment,
  ThemeSettings,
  VideoProject,
  VisualSegment,
  WordTiming,
} from '../types/project';

export const SUPPORTED_VIDEO_EXTENSIONS = ['.mp4', '.mov', '.webm'] as const;
export const SUPPORTED_IMAGE_EXTENSIONS = [
  '.jpg',
  '.jpeg',
  '.png',
  '.webp',
] as const;
export const SUPPORTED_AUDIO_EXTENSIONS = [
  '.wav',
  '.mp3',
  '.aac',
  '.m4a',
] as const;
export const SUPPORTED_MEDIA_EXTENSIONS = [
  ...SUPPORTED_VIDEO_EXTENSIONS,
  ...SUPPORTED_IMAGE_EXTENSIONS,
  ...SUPPORTED_AUDIO_EXTENSIONS,
] as const;

const VALID_ICON_NAMES: ReadonlySet<IconName> = new Set<IconName>([
  'shield',
  'alert',
  'ai',
  'currency',
  'car',
  'business',
  'space',
  'government',
  'warning',
  'lock',
  'check',
  'chart',
]);

const VALID_CAPTION_STYLES: ReadonlySet<CaptionSegment['style']> = new Set([
  'kinetic',
  'pill',
  'editorial',
  'stat',
]);

const VALID_CAPTION_PRESETS: ReadonlySet<CaptionPreset> = new Set([
  'kinetic',
  'editorial',
  'minimal',
  'data-callout',
]);

const VALID_TRANSITIONS: ReadonlySet<'cut' | 'fade' | 'slide'> = new Set([
  'cut',
  'fade',
  'slide',
]);

const VALID_GRAPHIC_TYPES: ReadonlySet<GraphicSegment['type']> = new Set([
  'icon',
  'badge',
  'stat-card',
]);

function isPlainObject(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function assertNonEmptyString(value: unknown, field: string): string {
  if (typeof value !== 'string' || value.trim().length === 0) {
    throw new Error(`${field} must be a non-empty string`);
  }
  return value;
}

function assertOptionalString(
  value: unknown,
  field: string
): string | undefined {
  if (value === undefined) return undefined;
  if (typeof value !== 'string') {
    throw new Error(`${field} must be a string`);
  }
  return value;
}

function assertFiniteNumber(value: unknown, field: string): number {
  if (typeof value !== 'number' || !Number.isFinite(value)) {
    throw new Error(`${field} must be a finite number`);
  }
  return value;
}

function assertPositiveNumber(value: unknown, field: string): number {
  const num = assertFiniteNumber(value, field);
  if (num <= 0) {
    throw new Error(`${field} must be greater than 0 (got ${num})`);
  }
  return num;
}

function assertNonNegativeNumber(value: unknown, field: string): number {
  const num = assertFiniteNumber(value, field);
  if (num < 0) {
    throw new Error(`${field} must be >= 0 (got ${num})`);
  }
  return num;
}

function extractExtension(src: string): string {
  const clean = src.split('?')[0].split('#')[0].trim();
  const lastSlash = Math.max(clean.lastIndexOf('/'), clean.lastIndexOf('\\'));
  const filename = lastSlash >= 0 ? clean.slice(lastSlash + 1) : clean;
  const dotIdx = filename.lastIndexOf('.');
  if (dotIdx <= 0 || dotIdx === filename.length - 1) {
    return '';
  }
  return filename.slice(dotIdx).toLowerCase();
}

function assertSupportedExtension(
  src: string,
  allowedExtensions: readonly string[],
  field: string
): void {
  const ext = extractExtension(src);
  if (!ext || !allowedExtensions.includes(ext)) {
    throw new Error(
      `${field} has unsupported file extension "${ext || '(none)'}" for "${src}". Supported: ${allowedExtensions.join(', ')}`
    );
  }
}

function assertFrameRange(
  startFrame: unknown,
  endFrame: unknown,
  context: string,
  durationFrames?: number
): { startFrame: number; endFrame: number } {
  const start = assertFiniteNumber(startFrame, `${context}.startFrame`);
  const end = assertFiniteNumber(endFrame, `${context}.endFrame`);

  if (start < 0) {
    throw new Error(`${context}: startFrame (${start}) must be >= 0`);
  }
  if (end <= start) {
    throw new Error(
      `${context}: endFrame (${end}) must be greater than startFrame (${start})`
    );
  }
  if (durationFrames !== undefined && end > durationFrames) {
    throw new Error(
      `${context}: endFrame (${end}) exceeds composition durationFrames (${durationFrames})`
    );
  }

  return { startFrame: start, endFrame: end };
}

function assertIconName(
  iconName: unknown,
  field: string
): IconName | undefined {
  if (iconName === undefined) return undefined;
  if (typeof iconName !== 'string' || !VALID_ICON_NAMES.has(iconName as IconName)) {
    throw new Error(
      `${field} has invalid iconName "${String(iconName)}"`
    );
  }
  return iconName as IconName;
}

function validateWordTiming(
  word: unknown,
  context: string,
  durationFrames?: number
): WordTiming {
  if (!isPlainObject(word)) {
    throw new Error(`${context} must be an object`);
  }
  const wordText = assertNonEmptyString(word.word, `${context}.word`);
  const { startFrame, endFrame } = assertFrameRange(
    word.startFrame,
    word.endFrame,
    context,
    durationFrames
  );
  return { word: wordText, startFrame, endFrame };
}

function validateAnimationSettings(
  anim: unknown,
  context: string
): AnimationSettings {
  if (!isPlainObject(anim)) {
    throw new Error(`${context} must be an object`);
  }
  if (
    anim.entrance !== 'spring' &&
    anim.entrance !== 'fade' &&
    anim.entrance !== 'slide-up'
  ) {
    throw new Error(
      `${context}.entrance must be 'spring' | 'fade' | 'slide-up'`
    );
  }
  if (anim.exit !== 'fade' && anim.exit !== 'slide-down') {
    throw new Error(`${context}.exit must be 'fade' | 'slide-down'`);
  }
  const duration = assertNonNegativeNumber(anim.duration, `${context}.duration`);
  return {
    entrance: anim.entrance,
    exit: anim.exit,
    duration,
  };
}

function validateKenBurnsConfig(
  kb: unknown,
  context: string
): KenBurnsConfig {
  if (!isPlainObject(kb)) {
    throw new Error(`${context} must be an object`);
  }
  const fromScale = assertPositiveNumber(kb.fromScale, `${context}.fromScale`);
  const toScale = assertPositiveNumber(kb.toScale, `${context}.toScale`);
  const result: KenBurnsConfig = { fromScale, toScale };

  if (kb.fromX !== undefined) {
    result.fromX = assertFiniteNumber(kb.fromX, `${context}.fromX`);
  }
  if (kb.toX !== undefined) {
    result.toX = assertFiniteNumber(kb.toX, `${context}.toX`);
  }
  if (kb.fromY !== undefined) {
    result.fromY = assertFiniteNumber(kb.fromY, `${context}.fromY`);
  }
  if (kb.toY !== undefined) {
    result.toY = assertFiniteNumber(kb.toY, `${context}.toY`);
  }

  return result;
}

export function validateCaptionSegment(
  seg: unknown,
  durationFrames?: number
): CaptionSegment {
  if (!isPlainObject(seg)) {
    throw new Error('CaptionSegment must be an object');
  }

  const id = assertNonEmptyString(seg.id, 'CaptionSegment.id');
  const ctx = `CaptionSegment "${id}"`;

  if (
    typeof seg.style !== 'string' ||
    !VALID_CAPTION_STYLES.has(seg.style as CaptionSegment['style'])
  ) {
    throw new Error(
      `${ctx}.style must be one of 'kinetic' | 'pill' | 'editorial' | 'stat'`
    );
  }
  const style = seg.style as CaptionSegment['style'];

  let preset: CaptionPreset | undefined;
  if (seg.preset !== undefined) {
    if (
      typeof seg.preset !== 'string' ||
      !VALID_CAPTION_PRESETS.has(seg.preset as CaptionPreset)
    ) {
      throw new Error(
        `${ctx}.preset must be one of 'kinetic' | 'editorial' | 'minimal' | 'data-callout'`
      );
    }
    preset = seg.preset as CaptionPreset;
  }

  if (typeof seg.text !== 'string') {
    throw new Error(`${ctx}.text must be a string`);
  }

  const title = assertOptionalString(seg.title, `${ctx}.title`);
  const subtitle = assertOptionalString(seg.subtitle, `${ctx}.subtitle`);
  const value = assertOptionalString(seg.value, `${ctx}.value`);
  const label = assertOptionalString(seg.label, `${ctx}.label`);
  const iconEmoji = assertOptionalString(seg.iconEmoji, `${ctx}.iconEmoji`);
  const accentWord = assertOptionalString(seg.accentWord, `${ctx}.accentWord`);
  const iconName = assertIconName(seg.iconName, `${ctx}.iconName`);

  if (
    (style === 'kinetic' || style === 'pill') &&
    seg.text.trim().length === 0
  ) {
    throw new Error(`${ctx}.text must not be empty for style "${style}"`);
  }
  if (
    style === 'editorial' &&
    !(title?.trim() || seg.text.trim())
  ) {
    throw new Error(
      `${ctx} must provide non-empty title or text for style "editorial"`
    );
  }
  if (
    style === 'stat' &&
    !(value?.trim() || seg.text.trim())
  ) {
    throw new Error(
      `${ctx} must provide non-empty value or text for style "stat"`
    );
  }

  if (!Array.isArray(seg.keywords)) {
    throw new Error(`${ctx}.keywords must be an array of strings`);
  }
  for (let i = 0; i < seg.keywords.length; i++) {
    if (typeof seg.keywords[i] !== 'string') {
      throw new Error(`${ctx}.keywords[${i}] must be a string`);
    }
  }

  const { startFrame, endFrame } = assertFrameRange(
    seg.startFrame,
    seg.endFrame,
    ctx,
    durationFrames
  );

  let words: WordTiming[] | undefined;
  if (seg.words !== undefined) {
    if (!Array.isArray(seg.words)) {
      throw new Error(`${ctx}.words must be an array`);
    }
    words = seg.words.map((w, idx) =>
      validateWordTiming(w, `${ctx}.words[${idx}]`, durationFrames)
    );
  }

  let animation: AnimationSettings | undefined;
  if (seg.animation !== undefined) {
    animation = validateAnimationSettings(seg.animation, `${ctx}.animation`);
  }

  return {
    id,
    style,
    ...(preset !== undefined ? { preset } : {}),
    text: seg.text,
    ...(words !== undefined ? { words } : {}),
    ...(title !== undefined ? { title } : {}),
    ...(subtitle !== undefined ? { subtitle } : {}),
    ...(value !== undefined ? { value } : {}),
    ...(label !== undefined ? { label } : {}),
    ...(iconName !== undefined ? { iconName } : {}),
    ...(iconEmoji !== undefined ? { iconEmoji } : {}),
    ...(accentWord !== undefined ? { accentWord } : {}),
    keywords: [...seg.keywords],
    startFrame,
    endFrame,
    ...(animation !== undefined ? { animation } : {}),
  };
}

export function validateMediaAsset(asset: unknown): MediaAsset {
  if (!isPlainObject(asset)) {
    throw new Error('MediaAsset must be an object');
  }

  const id = assertNonEmptyString(asset.id, 'MediaAsset.id');
  const ctx = `MediaAsset "${id}"`;

  if (
    asset.type !== 'image' &&
    asset.type !== 'video' &&
    asset.type !== 'audio'
  ) {
    throw new Error(`${ctx}.type must be 'image' | 'video' | 'audio'`);
  }

  const src = assertNonEmptyString(asset.src, `${ctx}.src`);
  const allowedByType =
    asset.type === 'image'
      ? SUPPORTED_IMAGE_EXTENSIONS
      : asset.type === 'video'
        ? SUPPORTED_VIDEO_EXTENSIONS
        : SUPPORTED_AUDIO_EXTENSIONS;
  assertSupportedExtension(src, allowedByType, `${ctx}.src`);

  let startFrame: number | undefined;
  if (asset.startFrame !== undefined) {
    startFrame = assertNonNegativeNumber(asset.startFrame, `${ctx}.startFrame`);
  }

  let endFrame: number | undefined;
  if (asset.endFrame !== undefined) {
    endFrame = assertPositiveNumber(asset.endFrame, `${ctx}.endFrame`);
    if (startFrame !== undefined && endFrame <= startFrame) {
      throw new Error(
        `${ctx}: endFrame (${endFrame}) must be greater than startFrame (${startFrame})`
      );
    }
  }

  let crop: { x: number; y: number; scale: number } | undefined;
  if (asset.crop !== undefined) {
    if (!isPlainObject(asset.crop)) {
      throw new Error(`${ctx}.crop must be an object`);
    }
    crop = {
      x: assertFiniteNumber(asset.crop.x, `${ctx}.crop.x`),
      y: assertFiniteNumber(asset.crop.y, `${ctx}.crop.y`),
      scale: assertPositiveNumber(asset.crop.scale, `${ctx}.crop.scale`),
    };
  }

  return {
    id,
    type: asset.type,
    src,
    ...(startFrame !== undefined ? { startFrame } : {}),
    ...(endFrame !== undefined ? { endFrame } : {}),
    ...(crop !== undefined ? { crop } : {}),
  };
}

export function validateVisualSegment(
  seg: unknown,
  durationFrames?: number
): VisualSegment {
  if (!isPlainObject(seg)) {
    throw new Error('VisualSegment must be an object');
  }

  const id = assertNonEmptyString(seg.id, 'VisualSegment.id');
  const ctx = `VisualSegment "${id}"`;

  if (seg.type !== 'image' && seg.type !== 'video') {
    throw new Error(`${ctx}.type must be 'image' | 'video'`);
  }

  const src = assertNonEmptyString(seg.src, `${ctx}.src`);
  const allowed =
    seg.type === 'image'
      ? SUPPORTED_IMAGE_EXTENSIONS
      : SUPPORTED_VIDEO_EXTENSIONS;
  assertSupportedExtension(src, allowed, `${ctx}.src`);

  const { startFrame, endFrame } = assertFrameRange(
    seg.startFrame,
    seg.endFrame,
    ctx,
    durationFrames
  );

  let transition: 'cut' | 'fade' | 'slide' | undefined;
  if (seg.transition !== undefined) {
    if (
      typeof seg.transition !== 'string' ||
      !VALID_TRANSITIONS.has(seg.transition as 'cut' | 'fade' | 'slide')
    ) {
      throw new Error(`${ctx}.transition must be 'cut' | 'fade' | 'slide'`);
    }
    transition = seg.transition as 'cut' | 'fade' | 'slide';
  }

  let kenBurns: KenBurnsConfig | undefined;
  if (seg.kenBurns !== undefined) {
    kenBurns = validateKenBurnsConfig(seg.kenBurns, `${ctx}.kenBurns`);
  }

  const label = assertOptionalString(seg.label, `${ctx}.label`);

  let focalPoint: { x: number; y: number } | undefined;
  if (seg.focalPoint !== undefined) {
    if (!isPlainObject(seg.focalPoint)) {
      throw new Error(`${ctx}.focalPoint must be an object`);
    }
    focalPoint = {
      x: assertFiniteNumber(seg.focalPoint.x, `${ctx}.focalPoint.x`),
      y: assertFiniteNumber(seg.focalPoint.y, `${ctx}.focalPoint.y`),
    };
  }

  return {
    id,
    src,
    type: seg.type,
    startFrame,
    endFrame,
    ...(transition !== undefined ? { transition } : {}),
    ...(kenBurns !== undefined ? { kenBurns } : {}),
    ...(label !== undefined ? { label } : {}),
    ...(focalPoint !== undefined ? { focalPoint } : {}),
  };
}

export function validateGraphicSegment(
  seg: unknown,
  durationFrames?: number
): GraphicSegment {
  if (!isPlainObject(seg)) {
    throw new Error('GraphicSegment must be an object');
  }

  const id = assertNonEmptyString(seg.id, 'GraphicSegment.id');
  const ctx = `GraphicSegment "${id}"`;

  if (
    typeof seg.type !== 'string' ||
    !VALID_GRAPHIC_TYPES.has(seg.type as GraphicSegment['type'])
  ) {
    throw new Error(`${ctx}.type must be 'icon' | 'badge' | 'stat-card'`);
  }

  const label = assertNonEmptyString(seg.label, `${ctx}.label`);
  const value = assertOptionalString(seg.value, `${ctx}.value`);
  const iconName = assertIconName(seg.iconName, `${ctx}.iconName`);

  if (seg.region !== 'captions') {
    throw new Error(
      `${ctx}.region must be 'captions' (got "${String(seg.region)}" — graphics cannot be placed outside the captions region)`
    );
  }

  const { startFrame, endFrame } = assertFrameRange(
    seg.startFrame,
    seg.endFrame,
    ctx,
    durationFrames
  );

  return {
    id,
    type: seg.type as GraphicSegment['type'],
    label,
    ...(value !== undefined ? { value } : {}),
    ...(iconName !== undefined ? { iconName } : {}),
    startFrame,
    endFrame,
    region: 'captions',
  };
}

function validateAudioTrack(
  track: unknown,
  field: string,
  durationFrames: number
): AudioTrackConfig | string {
  if (typeof track === 'string') {
    const src = assertNonEmptyString(track, field);
    assertSupportedExtension(src, SUPPORTED_AUDIO_EXTENSIONS, field);
    return src;
  }

  if (!isPlainObject(track)) {
    throw new Error(`${field} must be a file path string or AudioTrackConfig`);
  }

  const src = assertNonEmptyString(track.src, `${field}.src`);
  assertSupportedExtension(src, SUPPORTED_AUDIO_EXTENSIONS, `${field}.src`);

  const result: AudioTrackConfig = { src };

  if (track.volume !== undefined) {
    result.volume = assertNonNegativeNumber(track.volume, `${field}.volume`);
  }
  if (track.startFrame !== undefined) {
    result.startFrame = assertNonNegativeNumber(
      track.startFrame,
      `${field}.startFrame`
    );
    if (result.startFrame >= durationFrames) {
      throw new Error(
        `${field}.startFrame (${result.startFrame}) must be < durationFrames (${durationFrames})`
      );
    }
  }
  if (track.endFrame !== undefined) {
    result.endFrame = assertPositiveNumber(track.endFrame, `${field}.endFrame`);
    if (
      result.startFrame !== undefined &&
      result.endFrame <= result.startFrame
    ) {
      throw new Error(
        `${field}.endFrame (${result.endFrame}) must be > startFrame (${result.startFrame})`
      );
    }
    if (result.endFrame > durationFrames) {
      throw new Error(
        `${field}.endFrame (${result.endFrame}) exceeds durationFrames (${durationFrames})`
      );
    }
  }
  if (track.fadeInFrames !== undefined) {
    result.fadeInFrames = assertNonNegativeNumber(
      track.fadeInFrames,
      `${field}.fadeInFrames`
    );
  }
  if (track.fadeOutFrames !== undefined) {
    result.fadeOutFrames = assertNonNegativeNumber(
      track.fadeOutFrames,
      `${field}.fadeOutFrames`
    );
  }

  return result;
}

function validateSfxSegment(
  sfx: unknown,
  idx: number,
  durationFrames: number
): SfxSegment {
  const ctx = `media.sfx[${idx}]`;
  if (!isPlainObject(sfx)) {
    throw new Error(`${ctx} must be an object`);
  }
  const id = assertNonEmptyString(sfx.id, `${ctx}.id`);
  const src = assertNonEmptyString(sfx.src, `${ctx}.src`);
  assertSupportedExtension(src, SUPPORTED_AUDIO_EXTENSIONS, `${ctx}.src`);

  const startFrame = assertNonNegativeNumber(
    sfx.startFrame,
    `${ctx}.startFrame`
  );
  if (startFrame >= durationFrames) {
    throw new Error(
      `${ctx}.startFrame (${startFrame}) must be < durationFrames (${durationFrames})`
    );
  }

  const result: SfxSegment = { id, src, startFrame };
  if (sfx.volume !== undefined) {
    result.volume = assertNonNegativeNumber(sfx.volume, `${ctx}.volume`);
  }
  return result;
}

function validateMediaDictionary(
  media: unknown,
  durationFrames: number
): MediaDictionary {
  if (!isPlainObject(media)) {
    throw new Error('project.media must be an object');
  }

  const result: MediaDictionary = {};

  if (media.facecam !== undefined) {
    const facecam = assertNonEmptyString(media.facecam, 'media.facecam');
    assertSupportedExtension(
      facecam,
      SUPPORTED_VIDEO_EXTENSIONS,
      'media.facecam'
    );
    result.facecam = facecam;
  }

  if (media.narration !== undefined) {
    result.narration = validateAudioTrack(
      media.narration,
      'media.narration',
      durationFrames
    );
  }

  if (media.bgMusic !== undefined) {
    result.bgMusic = validateAudioTrack(
      media.bgMusic,
      'media.bgMusic',
      durationFrames
    );
  }

  if (media.sfx !== undefined) {
    if (!Array.isArray(media.sfx)) {
      throw new Error('media.sfx must be an array');
    }
    const seenIds = new Set<string>();
    result.sfx = media.sfx.map((item, idx) => {
      const validated = validateSfxSegment(item, idx, durationFrames);
      if (seenIds.has(validated.id)) {
        throw new Error(`Duplicate SFX id "${validated.id}"`);
      }
      seenIds.add(validated.id);
      return validated;
    });
  }

  return result;
}

function validateCompositionSettings(comp: unknown): CompositionSettings {
  if (!isPlainObject(comp)) {
    throw new Error('project.composition must be an object');
  }

  const width = assertPositiveNumber(comp.width, 'composition.width');
  const height = assertPositiveNumber(comp.height, 'composition.height');
  const fps = assertPositiveNumber(comp.fps, 'composition.fps');
  const durationFrames = assertPositiveNumber(
    comp.durationFrames,
    'composition.durationFrames'
  );

  const result: CompositionSettings = {
    width,
    height,
    fps,
    durationFrames,
  };

  if (comp.blurStrength !== undefined) {
    result.blurStrength = assertNonNegativeNumber(
      comp.blurStrength,
      'composition.blurStrength'
    );
  }
  if (comp.tintOpacity !== undefined) {
    const tint = assertNonNegativeNumber(
      comp.tintOpacity,
      'composition.tintOpacity'
    );
    if (tint > 1) {
      throw new Error(
        `composition.tintOpacity must be between 0 and 1 (got ${tint})`
      );
    }
    result.tintOpacity = tint;
  }
  if (comp.safeMarginX !== undefined) {
    result.safeMarginX = assertNonNegativeNumber(
      comp.safeMarginX,
      'composition.safeMarginX'
    );
  }
  if (comp.safeMarginY !== undefined) {
    result.safeMarginY = assertNonNegativeNumber(
      comp.safeMarginY,
      'composition.safeMarginY'
    );
  }

  return result;
}

function assertUniqueIds(
  items: ReadonlyArray<{ id: string }>,
  label: string
): void {
  const seen = new Set<string>();
  for (const item of items) {
    if (seen.has(item.id)) {
      throw new Error(`Duplicate ${label} id "${item.id}"`);
    }
    seen.add(item.id);
  }
}

function assertNoOverlaps(
  items: ReadonlyArray<{ id: string; startFrame: number; endFrame: number }>,
  label: string
): void {
  const sorted = [...items].sort((a, b) =>
    a.startFrame !== b.startFrame
      ? a.startFrame - b.startFrame
      : a.endFrame - b.endFrame
  );
  for (let i = 1; i < sorted.length; i++) {
    const prev = sorted[i - 1];
    const curr = sorted[i];
    if (curr.startFrame < prev.endFrame) {
      throw new Error(
        `Overlapping ${label}: "${prev.id}" [${prev.startFrame}, ${prev.endFrame}) overlaps with "${curr.id}" [${curr.startFrame}, ${curr.endFrame})`
      );
    }
  }
}

function validatePartialTheme(theme: unknown): Partial<ThemeSettings> {
  if (!isPlainObject(theme)) {
    throw new Error('project.theme must be an object');
  }
  const result: Partial<ThemeSettings> = {};
  const stringFields = [
    'primaryText',
    'highlightColor',
    'accentColor',
    'warningColor',
    'bgPanel',
    'fontFamily',
    'shadowStyle',
  ] as const;

  for (const key of stringFields) {
    if (theme[key] !== undefined) {
      result[key] = assertNonEmptyString(theme[key], `theme.${key}`);
    }
  }
  if (theme.fontWeight !== undefined) {
    result.fontWeight = assertPositiveNumber(
      theme.fontWeight,
      'theme.fontWeight'
    );
  }
  if (theme.borderRadius !== undefined) {
    result.borderRadius = assertNonNegativeNumber(
      theme.borderRadius,
      'theme.borderRadius'
    );
  }
  return result;
}

export function validateProject(project: unknown): VideoProject {
  if (!isPlainObject(project)) {
    throw new Error('VideoProject must be an object');
  }

  if (project.version !== 1) {
    throw new Error(
      `Unsupported project version: expected 1, got ${String(project.version)}`
    );
  }

  const composition = validateCompositionSettings(project.composition);
  const { durationFrames } = composition;

  const theme =
    project.theme !== undefined
      ? validatePartialTheme(project.theme)
      : undefined;

  const media = validateMediaDictionary(project.media, durationFrames);

  if (!Array.isArray(project.captions)) {
    throw new Error('project.captions must be an array');
  }
  const captions = project.captions.map((c) =>
    validateCaptionSegment(c, durationFrames)
  );
  assertUniqueIds(captions, 'CaptionSegment');
  assertNoOverlaps(captions, 'captions');

  if (!Array.isArray(project.visuals)) {
    throw new Error('project.visuals must be an array');
  }
  const visuals = project.visuals.map((v) =>
    validateVisualSegment(v, durationFrames)
  );
  assertUniqueIds(visuals, 'VisualSegment');
  assertNoOverlaps(visuals, 'visuals');

  if (!Array.isArray(project.graphics)) {
    throw new Error('project.graphics must be an array');
  }
  const graphics = project.graphics.map((g) =>
    validateGraphicSegment(g, durationFrames)
  );
  assertUniqueIds(graphics, 'GraphicSegment');

  return {
    version: 1,
    composition,
    ...(theme !== undefined ? { theme } : {}),
    media,
    captions,
    visuals,
    graphics,
  };
}
