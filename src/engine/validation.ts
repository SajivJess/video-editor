import {
  AnimationSettings,
  EntityAsset,
  EditBeat,
  SceneTransition,
  TransitionName,
  AudioTrackConfig,
  CameraMove,
  CameraMoveType,
  CaptionPreset,
  CaptionSegment,
  CompositionSettings,
  GraphicSegment,
  GraphicType,
  IconName,
  InterstitialSegment,
  KenBurnsConfig,
  LogoSpotlightConfig,
  MediaAsset,
  MediaDictionary,
  PersonPictorialConfig,
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
  '.svg',
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
  'sparkle',
  'chip',
]);

const VALID_CAPTION_STYLES: ReadonlySet<CaptionSegment['style']> = new Set([
  'kinetic',
  'pill',
  'editorial',
  'stat',
  'modern',
]);

const VALID_CAPTION_PRESETS: ReadonlySet<CaptionPreset> = new Set([
  'kinetic',
  'editorial',
  'minimal',
  'data-callout',
]);

const VALID_TRANSITIONS: ReadonlySet<TransitionName> = new Set([
  'cut',
  'fade',
  'slide',
  'zoom', 'zoom-through', 'whip-pan', 'flash', 'diagonal-wipe',
]);

const VALID_GRAPHIC_TYPES: ReadonlySet<GraphicType> = new Set([
  'icon',
  'badge',
  'stat-card',
  'stat',
  'logo-spotlight',
  'person-pictorial',
  'collage-card',
  'step-card',
  'process-diagram',
  'comparison',
]);

const VALID_CAMERA_MOVE_TYPES: ReadonlySet<CameraMoveType> = new Set([
  'hold',
  'slow-zoom-in',
  'slow-zoom-out',
  'sudden-zoom',
  'pan',
  'whip-pan',
  'micro-shake',
]);

const VALID_INTERSTITIAL_TRANSITIONS: ReadonlySet<NonNullable<InterstitialSegment['transitionIn']>> = new Set([
  'cut',
  'fade',
  'slide',
  'zoom-through',
  'whip-pan',
  'flash', 'zoom', 'diagonal-wipe',
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

function assertNonNegativeInteger(value: unknown, field: string): number {
  const number = assertNonNegativeNumber(value, field);
  if (!Number.isInteger(number)) throw new Error(`${field} must be an integer`);
  return number;
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
  if (!Number.isInteger(start) || !Number.isInteger(end)) {
    throw new Error(`${context}: frame positions must be integers`);
  }

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
  if (word.emphasis !== undefined && typeof word.emphasis !== 'boolean') {
    throw new Error(`${context}.emphasis must be a boolean`);
  }
  return { word: wordText, startFrame, endFrame,
    ...(word.emphasis !== undefined ? { emphasis: word.emphasis } : {}) };
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
  const fromScale = assertPositiveNumber(kb.fromScale ?? kb.startScale ?? 1, `${context}.fromScale`);
  const toScale = assertPositiveNumber(kb.toScale ?? kb.endScale ?? 1.08, `${context}.toScale`);
  const result: KenBurnsConfig = { fromScale, toScale };

  if (kb.fromX !== undefined || kb.startX !== undefined) {
    result.fromX = assertFiniteNumber(kb.fromX ?? kb.startX, `${context}.fromX`);
  }
  if (kb.toX !== undefined || kb.endX !== undefined) {
    result.toX = assertFiniteNumber(kb.toX ?? kb.endX, `${context}.toX`);
  }
  if (kb.fromY !== undefined || kb.startY !== undefined) {
    result.fromY = assertFiniteNumber(kb.fromY ?? kb.startY, `${context}.fromY`);
  }
  if (kb.toY !== undefined || kb.endY !== undefined) {
    result.toY = assertFiniteNumber(kb.toY ?? kb.endY, `${context}.toY`);
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
      `${ctx}.style must be one of 'kinetic' | 'pill' | 'editorial' | 'stat' | 'modern'`
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
    words.forEach((word, index) => {
      if (word.startFrame < startFrame || word.endFrame > endFrame) {
        throw new Error(`${ctx}.words[${index}] must remain inside its caption segment`);
      }
      if (index > 0 && word.startFrame < words![index - 1].endFrame) {
        throw new Error(`${ctx}.words must be ordered and must not overlap`);
      }
    });
  }
  if (style === 'modern' && !seg.text.trim() && !words?.length) throw new Error(`${ctx} requires text or timed words`);

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

  let transition: TransitionName | undefined;
  if (seg.transition !== undefined) {
    if (
      typeof seg.transition !== 'string' ||
      !VALID_TRANSITIONS.has(seg.transition as TransitionName)
    ) {
      throw new Error(`${ctx}.transition is not supported`);
    }
    transition = seg.transition as TransitionName;
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
    if (focalPoint.x < 0 || focalPoint.x > 1 || focalPoint.y < 0 || focalPoint.y > 1) throw new Error(`${ctx}.focalPoint must be normalized to 0..1`);
  }

  return {
    id,
    src,
    type: seg.type,
    ...(seg.sourceStartFrame !== undefined ? { sourceStartFrame: assertNonNegativeInteger(seg.sourceStartFrame, `${ctx}.sourceStartFrame`) } : {}),
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
    !VALID_GRAPHIC_TYPES.has(seg.type as GraphicType)
  ) {
    throw new Error(
      `${ctx}.type must be one of: ${[...VALID_GRAPHIC_TYPES].join(', ')}`
    );
  }

  if (seg.steps !== undefined && (!Array.isArray(seg.steps) || seg.steps.length < 2 || seg.steps.length > 5 || seg.steps.some(step => typeof step !== 'string' || !step.trim()))) throw new Error(`${ctx}.steps must contain 2 to 5 nonempty labels`);
  const label = assertNonEmptyString(seg.label, `${ctx}.label`);
  const value = assertOptionalString(seg.value, `${ctx}.value`);
  const iconName = assertIconName(seg.iconName, `${ctx}.iconName`);

  if (seg.region !== 'captions' && seg.region !== 'visuals') {
    throw new Error(
      `${ctx}.region must be 'captions' | 'visuals' (got "${String(seg.region)}")`
    );
  }
  const region = seg.region as GraphicSegment['region'];
  if (region === 'captions' && !['badge', 'icon', 'stat', 'stat-card'].includes(String(seg.type))) {
    throw new Error(`${ctx}: captions graphics support badge, icon, stat, or stat-card; place larger graphics in visuals`);
  }

  const { startFrame, endFrame } = assertFrameRange(
    seg.startFrame,
    seg.endFrame,
    ctx,
    durationFrames
  );

  let person: PersonPictorialConfig | undefined;
  if (isPlainObject(seg.person)) {
    person = {
      src: assertOptionalString(seg.person.src, `${ctx}.person.src`),
      name: assertOptionalString(seg.person.name, `${ctx}.person.name`),
      title: assertOptionalString(seg.person.title, `${ctx}.person.title`),
      avatarType: seg.person.avatarType as PersonPictorialConfig['avatarType'],
      accent: assertOptionalString(seg.person.accent, `${ctx}.person.accent`),
    };
  }
  if (person?.avatarType && !['jensen', 'founder', 'analyst', 'custom'].includes(person.avatarType)) {
    throw new Error(`${ctx}.person.avatarType is not supported`);
  }
  if (seg.type === 'person-pictorial' && !person?.src?.trim()) throw new Error(`${ctx}: provide an attributed portrait src; person mentions cannot use a placeholder card`);

  let logo: LogoSpotlightConfig | undefined;
  if (isPlainObject(seg.logo)) {
    const brand = assertNonEmptyString(seg.logo.brand, `${ctx}.logo.brand`) as LogoSpotlightConfig['brand'];
    if (!['nvidia', 'openai', 'gemini', 'claude', 'custom'].includes(brand)) throw new Error(`${ctx}.logo.brand is not supported`);
    logo = {
      src: assertOptionalString(seg.logo.src, `${ctx}.logo.src`),
      brand,
      label: assertOptionalString(seg.logo.label, `${ctx}.logo.label`),
      glowColor: assertOptionalString(seg.logo.glowColor, `${ctx}.logo.glowColor`),
    };
  }

  return {
    id,
    type: seg.type as GraphicType,
    ...(Array.isArray(seg.steps) ? { steps: [...seg.steps] as string[] } : {}),
    label,
    ...(value !== undefined ? { value } : {}),
    ...(iconName !== undefined ? { iconName } : {}),
    ...(person !== undefined ? { person } : {}),
    ...(logo !== undefined ? { logo } : {}),
    startFrame,
    endFrame,
    region,
  };
}

export function validateCameraMove(
  move: unknown,
  durationFrames?: number
): CameraMove {
  if (!isPlainObject(move)) {
    throw new Error('CameraMove must be an object');
  }

  const id = assertNonEmptyString(move.id, 'CameraMove.id');
  const ctx = `CameraMove "${id}"`;

  if (
    typeof move.type !== 'string' ||
    !VALID_CAMERA_MOVE_TYPES.has(move.type as CameraMoveType)
  ) {
    throw new Error(
      `${ctx}.type must be one of: hold, slow-zoom-in, slow-zoom-out, sudden-zoom, pan, whip-pan, micro-shake`
    );
  }

  const { startFrame, endFrame } = assertFrameRange(
    move.startFrame,
    move.endFrame,
    ctx,
    durationFrames
  );
  for (const key of ['fromScale', 'toScale', 'fromX', 'toX', 'fromY', 'toY', 'intensity'] as const) {
    if (move[key] !== undefined) {
      if (key.includes('Scale')) assertPositiveNumber(move[key], `${ctx}.${key}`);
      else assertFiniteNumber(move[key], `${ctx}.${key}`);
    }
  }

  return {
    id,
    type: move.type as CameraMoveType,
    startFrame,
    endFrame,
    ...(move.fromScale !== undefined ? { fromScale: Number(move.fromScale) } : {}),
    ...(move.toScale !== undefined ? { toScale: Number(move.toScale) } : {}),
    ...(move.fromX !== undefined ? { fromX: Number(move.fromX) } : {}),
    ...(move.toX !== undefined ? { toX: Number(move.toX) } : {}),
    ...(move.fromY !== undefined ? { fromY: Number(move.fromY) } : {}),
    ...(move.toY !== undefined ? { toY: Number(move.toY) } : {}),
    ...(move.intensity !== undefined ? { intensity: Number(move.intensity) } : {}),
  };
}

export function validateInterstitialSegment(
  seg: unknown,
  durationFrames?: number,
  fps = 30
): InterstitialSegment {
  if (!isPlainObject(seg)) {
    throw new Error('InterstitialSegment must be an object');
  }

  const id = assertNonEmptyString(seg.id, 'InterstitialSegment.id');
  const ctx = `InterstitialSegment "${id}"`;

  const src = assertNonEmptyString(seg.src, `${ctx}.src`);
  assertSupportedExtension(src, SUPPORTED_VIDEO_EXTENSIONS, `${ctx}.src`);

  const { startFrame, endFrame } = assertFrameRange(
    seg.startFrame,
    seg.endFrame,
    ctx,
    durationFrames
  );

  const durationSec = (endFrame - startFrame) / fps;
  if (durationSec > 10.01) {
    throw new Error(
      `${ctx} duration (${durationSec.toFixed(1)}s) exceeds max 10.0s for AI interstitial clips`
    );
  }

  const label = assertOptionalString(seg.label, `${ctx}.label`);
  const transitionIn = seg.transitionIn !== undefined ? String(seg.transitionIn) : undefined;
  if (
    transitionIn !== undefined &&
    !VALID_INTERSTITIAL_TRANSITIONS.has(transitionIn as any)
  ) {
    throw new Error(`${ctx}.transitionIn "${transitionIn}" is not supported`);
  }

  const transitionOut = seg.transitionOut !== undefined ? String(seg.transitionOut) : undefined;
  if (
    transitionOut !== undefined &&
    !VALID_INTERSTITIAL_TRANSITIONS.has(transitionOut as any)
  ) {
    throw new Error(`${ctx}.transitionOut "${transitionOut}" is not supported`);
  }

  const cameraMove = seg.cameraMove !== undefined ? String(seg.cameraMove) : undefined;
  if (cameraMove && !['zoom-in', 'pan-left', 'pan-right', 'subtle-drift'].includes(cameraMove)) throw new Error(`${ctx}.cameraMove is not supported`);

  return {
    id,
    src,
    startFrame,
    endFrame,
    ...(seg.sourceStartFrame !== undefined ? { sourceStartFrame: assertNonNegativeInteger(seg.sourceStartFrame, `${ctx}.sourceStartFrame`) } : {}),
    ...(seg.volume !== undefined ? { volume: assertNonNegativeNumber(seg.volume, `${ctx}.volume`) } : {}),
    ...(label !== undefined ? { label } : {}),
    ...(transitionIn !== undefined ? { transitionIn: transitionIn as any } : {}),
    ...(transitionOut !== undefined ? { transitionOut: transitionOut as any } : {}),
    ...(cameraMove !== undefined ? { cameraMove: cameraMove as any } : {}),
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
    result.startFrame = assertNonNegativeInteger(
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
    result.fadeInFrames = assertNonNegativeInteger(
      track.fadeInFrames,
      `${field}.fadeInFrames`
    );
  }
  if (track.fadeOutFrames !== undefined) {
    result.fadeOutFrames = assertNonNegativeInteger(
      track.fadeOutFrames,
      `${field}.fadeOutFrames`
    );
  }
  for (const key of ['duckingAmount', 'sfxDuckAmount', 'bgMusicVolume', 'narrationVolume'] as const) {
    if (track[key] !== undefined) result[key] = assertNonNegativeNumber(track[key], `${field}.${key}`);
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

  const startFrame = assertNonNegativeInteger(
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
  if (media.facecamVolume !== undefined) result.facecamVolume = assertNonNegativeNumber(media.facecamVolume, 'media.facecamVolume');

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
  if (![width, height, durationFrames].every(Number.isInteger)) throw new Error('composition dimensions and durationFrames must be integers');

  const result: CompositionSettings = {
    width,
    height,
    fps,
    durationFrames,
  };
  if (comp.overlayEndFrame !== undefined) {
    result.overlayEndFrame = assertNonNegativeInteger(comp.overlayEndFrame, 'composition.overlayEndFrame');
    if (result.overlayEndFrame > durationFrames) throw new Error('overlayEndFrame exceeds composition duration');
  }

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
  if ((result.safeMarginX ?? 0) * 2 >= width || (result.safeMarginY ?? 0) >= height * .3) throw new Error('Composition safe margins leave no room for captions');

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
  if (theme.captionTreatment !== undefined) {
    if (theme.captionTreatment !== 'expressive' && theme.captionTreatment !== 'clean') throw new Error('theme.captionTreatment must be expressive or clean');
    result.captionTreatment=theme.captionTreatment;
  }
  const stringFields = [
    'primaryText',
    'pillTextColor',
    'name',
    'mood',
    'description',
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
  if (theme.captionFontSize !== undefined) result.captionFontSize = assertPositiveNumber(theme.captionFontSize, 'theme.captionFontSize');
  if (theme.captionMaxWords !== undefined) {
    result.captionMaxWords = assertPositiveNumber(theme.captionMaxWords, 'theme.captionMaxWords');
    if (!Number.isInteger(result.captionMaxWords) || result.captionMaxWords > 5) throw new Error('theme.captionMaxWords must be an integer from 1 to 5');
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
  for (const region of ['visuals', 'captions']) assertNoOverlaps(graphics.filter(g => g.region === region), `${region} graphics`);

  let interstitials: InterstitialSegment[] | undefined;
  if (project.interstitials !== undefined) {
    if (!Array.isArray(project.interstitials)) {
      throw new Error('project.interstitials must be an array');
    }
    interstitials = project.interstitials.map((seg) =>
      validateInterstitialSegment(seg, durationFrames, composition.fps)
    );
    assertUniqueIds(interstitials, 'InterstitialSegment');
    assertNoOverlaps(interstitials, 'interstitials');
  }

  let cameraMoves: CameraMove[] | undefined;
  if (project.cameraMoves !== undefined) {
    if (!Array.isArray(project.cameraMoves)) {
      throw new Error('project.cameraMoves must be an array');
    }
    cameraMoves = project.cameraMoves.map((m) =>
      validateCameraMove(m, durationFrames)
    );
    assertUniqueIds(cameraMoves, 'CameraMove');
    assertNoOverlaps(cameraMoves, 'cameraMoves');
  }

  let audio: AudioTrackConfig | undefined;
  if (project.audio !== undefined) {
    if (!isPlainObject(project.audio)) throw new Error('project.audio must be an object');
    audio = {};
    for (const key of ['volume', 'duckingAmount', 'sfxDuckAmount', 'bgMusicVolume', 'narrationVolume'] as const) {
      if (project.audio[key] !== undefined) audio[key] = assertNonNegativeNumber(project.audio[key], `audio.${key}`);
    }
  }
  let entities:EntityAsset[]|undefined;
  if(project.entities!==undefined){
    if(!Array.isArray(project.entities))throw new Error('project.entities must be an array');
    entities=project.entities.map((item,index)=>{
      if(!isPlainObject(item))throw new Error(`entities[${index}] must be an object`);
      const id=assertNonEmptyString(item.id,`entities[${index}].id`);
      const name=assertNonEmptyString(item.name,`entities[${index}].name`);
      if(item.kind!=='person'&&item.kind!=='brand')throw new Error(`Entity ${id} kind must be person or brand`);
      if(item.brand!==undefined&&!['nvidia','openai','gemini','claude','custom'].includes(String(item.brand)))throw new Error(`Entity ${id} has unsupported brand`);
      if(!Array.isArray(item.aliases)||!item.aliases.length)throw new Error(`Entity ${id} requires name aliases`);
      const aliases=item.aliases.map((alias,i)=>assertNonEmptyString(alias,`Entity ${id} alias ${i}`));
      return {id,name,kind:item.kind,aliases,src:assertOptionalString(item.src,`Entity ${id}.src`),accent:assertOptionalString(item.accent,`Entity ${id}.accent`),sourceUrl:assertOptionalString(item.sourceUrl,`Entity ${id}.sourceUrl`),brand:item.brand as EntityAsset['brand']};
    });
    assertUniqueIds(entities,'EntityAsset');
  }
  let editBeats:EditBeat[]|undefined;
  if(project.editBeats!==undefined){
    if(!Array.isArray(project.editBeats))throw new Error('project.editBeats must be an array');
    editBeats=project.editBeats.map((item,index)=>{
      if(!isPlainObject(item))throw new Error(`editBeats[${index}] must be an object`);
      const id=assertNonEmptyString(item.id,`editBeats[${index}].id`);
      const frame=assertNonNegativeInteger(item.frame,`EditBeat ${id}.frame`);
      if(frame>=(composition.overlayEndFrame??durationFrames))throw new Error(`EditBeat ${id} must precede the overlay end`);
      const reason=assertNonEmptyString(item.reason,`EditBeat ${id}.reason`);
      if(item.camera!==undefined&&!['punch','pan','whip'].includes(String(item.camera)))throw new Error(`EditBeat ${id} has unsupported camera`);
      if(item.transition!==undefined&&!['whip-pan','zoom-through','diagonal-wipe'].includes(String(item.transition)))throw new Error(`EditBeat ${id} has unsupported transition`);
      if(item.sound!==undefined&&!['impact','whoosh'].includes(String(item.sound)))throw new Error(`EditBeat ${id} has unsupported sound`);
      return {id,frame,reason,camera:item.camera as EditBeat['camera'],transition:item.transition as EditBeat['transition'],sound:item.sound as EditBeat['sound']};
    });
    assertUniqueIds(editBeats,'EditBeat');
  }
  let transitions:SceneTransition[]|undefined;
  if(project.transitions!==undefined){
    if(!Array.isArray(project.transitions))throw new Error('project.transitions must be an array');
    transitions=project.transitions.map((item,index)=>{
      if(!isPlainObject(item))throw new Error(`transitions[${index}] must be an object`);
      const id=assertNonEmptyString(item.id,`transitions[${index}].id`);
      if(!['whip-pan','zoom-through','diagonal-wipe'].includes(String(item.type)))throw new Error(`Transition ${id} has unsupported type`);
      const range=assertFrameRange(item.startFrame,item.endFrame,`Transition ${id}`,durationFrames);
      if(range.endFrame-range.startFrame>composition.fps*.5)throw new Error(`Transition ${id} must be brief (max 0.5 seconds)`);
      return {id,type:item.type as SceneTransition['type'],...range,color:assertOptionalString(item.color,`Transition ${id}.color`)};
    });
    assertUniqueIds(transitions,'SceneTransition');assertNoOverlaps(transitions,'scene transitions');
  }
  return {
    version: 1,
    composition,
    ...(theme !== undefined ? { theme } : {}),
    media,
    captions,
    visuals,
    graphics,
    ...(editBeats ? {editBeats} : {}),
    ...(entities ? {entities} : {}),
    ...(transitions ? {transitions} : {}),
    ...(interstitials !== undefined ? { interstitials } : {}),
    ...(cameraMoves !== undefined ? { cameraMoves } : {}),
    ...(audio ? { audio } : {}),
  };
}
