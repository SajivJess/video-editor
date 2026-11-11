import test from 'node:test';
import assert from 'node:assert/strict';
import { registerHooks } from 'node:module';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import ts from 'typescript';

// Enable resolving extensionless TS imports and stripping type-only imports under Node ESM.
registerHooks({
  resolve(specifier, context, nextResolve) {
    if (
      (specifier.startsWith('./') || specifier.startsWith('../')) &&
      !path.extname(specifier) &&
      context.parentURL?.startsWith('file:')
    ) {
      const baseDir = path.dirname(fileURLToPath(context.parentURL));
      const candidates = [
        `${specifier}.ts`,
        `${specifier}.tsx`,
        path.join(specifier, 'index.ts'),
        path.join(specifier, 'index.tsx'),
      ];
      for (const rel of candidates) {
        const abs = path.resolve(baseDir, rel);
        if (fs.existsSync(abs) && fs.statSync(abs).isFile()) {
          return {
            shortCircuit: true,
            url: pathToFileURL(abs).href,
          };
        }
      }
    }
    return nextResolve(specifier, context);
  },
  load(url, context, nextLoad) {
    if (
      url.startsWith('file:') &&
      !url.includes('/node_modules/') &&
      (url.endsWith('.ts') || url.endsWith('.tsx'))
    ) {
      const source = fs.readFileSync(fileURLToPath(url), 'utf8');
      const transpiled = ts.transpileModule(source, {
        fileName: fileURLToPath(url),
        compilerOptions: {
          module: ts.ModuleKind.ESNext,
          target: ts.ScriptTarget.ES2022,
          jsx: ts.JsxEmit.ReactJSX,
          verbatimModuleSyntax: false,
        },
      });
      return {
        shortCircuit: true,
        format: 'module',
        source: transpiled.outputText,
      };
    }
    return nextLoad(url, context);
  },
});

const { LAYOUT, COMPOSITION_DEFAULTS } = await import('../src/config/theme.ts');
const {
  secondsToFrames,
  framesToSeconds,
  clampFrame,
  frameIsVisible,
  normalizedYtoPx,
  normalizedHeightToPx,
} = await import('../src/engine/frames.ts');
const {
  validateProject,
  validateCaptionSegment,
  validateVisualSegment,
  validateGraphicSegment,
  validateMediaAsset,
} = await import('../src/engine/validation.ts');
const { wrapText, highlightKeywords, formatNumber } = await import(
  '../src/utils/text.ts'
);
const { DEMO_DURATION_FRAMES, sampleProject } = await import(
  '../src/demo/sampleProject.ts'
);

test('Layout boundaries map cleanly to 1080x1920 regions with no facecam/caption overlap', () => {
  const height = COMPOSITION_DEFAULTS.height;
  assert.equal(COMPOSITION_DEFAULTS.width, 1080);
  assert.equal(height, 1920);
  assert.equal(COMPOSITION_DEFAULTS.fps, 30);

  // Top 40%: visuals -> 0..768px
  assert.deepEqual(LAYOUT.visuals, { y: 0, h: 0.4 });
  const visualsTop = normalizedYtoPx(LAYOUT.visuals.y, height);
  const visualsHeight = normalizedHeightToPx(LAYOUT.visuals.h, height);
  assert.equal(visualsTop, 0);
  assert.equal(visualsHeight, 768);
  assert.equal(visualsTop + visualsHeight, 768);

  // Portrait video continuation across 40%..100% -> 768..1920px
  assert.deepEqual(LAYOUT.facecam, { y: 0.4, h: 0.6 });
  const facecamTop = normalizedYtoPx(LAYOUT.facecam.y, height);
  const facecamHeight = normalizedHeightToPx(LAYOUT.facecam.h, height);
  assert.equal(facecamTop, 768);
  assert.equal(facecamHeight, 1152);
  assert.equal(facecamTop + facecamHeight, 1920);

  // Clear unblurred face zone 40%..60% -> 768..1152px
  assert.deepEqual(LAYOUT.facecamClear, { y: 0.4, h: 0.2 });
  const clearTop = normalizedYtoPx(LAYOUT.facecamClear.y, height);
  const clearHeight = normalizedHeightToPx(LAYOUT.facecamClear.h, height);
  assert.equal(clearTop, 768);
  assert.equal(clearHeight, 384);
  assert.equal(clearTop + clearHeight, 1152);

  // Bottom 40% blurred captions zone 60%..100% -> 1152..1920px
  assert.deepEqual(LAYOUT.captions, { y: 0.6, h: 0.4 });
  const captionsTop = normalizedYtoPx(LAYOUT.captions.y, height);
  const captionsHeight = normalizedHeightToPx(LAYOUT.captions.h, height);
  assert.equal(captionsTop, 1152);
  assert.equal(captionsHeight, 768);
  assert.equal(captionsTop + captionsHeight, 1920);

  // Non-overlapping zones covering full frame height
  assert.ok(visualsTop + visualsHeight <= clearTop);
  assert.ok(clearTop + clearHeight <= captionsTop);
  assert.equal(visualsHeight + clearHeight + captionsHeight, height);
});

test('Frame conversion and clamping helpers', () => {
  assert.equal(secondsToFrames(9), 270);
  assert.equal(secondsToFrames(0.5, 30), 15);
  assert.equal(secondsToFrames(1.5, 60), 90);
  assert.equal(secondsToFrames(1 / 3, 30), 10);

  assert.equal(framesToSeconds(270), 9);
  assert.equal(framesToSeconds(15, 30), 0.5);
  assert.equal(framesToSeconds(60, 60), 1);

  assert.equal(clampFrame(-12, 270), 0);
  assert.equal(clampFrame(0, 270), 0);
  assert.equal(clampFrame(135, 270), 135);
  assert.equal(clampFrame(500, 270), 270);

  // Half-open [startFrame, endFrame)
  assert.equal(frameIsVisible(9, 10, 20), false);
  assert.equal(frameIsVisible(10, 10, 20), true);
  assert.equal(frameIsVisible(19, 10, 20), true);
  assert.equal(frameIsVisible(20, 10, 20), false);

  assert.equal(normalizedYtoPx(0.5, 1000), 500);
  assert.equal(normalizedHeightToPx(0.25, 1000), 250);
});

test('Text helpers: wrapText, multi-word + Tamil highlightKeywords, and formatNumber', () => {
  assert.deepEqual(wrapText('Verify before transferring money online', 18), [
    'Verify before',
    'transferring money',
    'online',
  ]);
  assert.deepEqual(wrapText('SingleLongWord', 5), ['SingleLongWord']);

  // Multi-word phrase + Tamil particle
  const kineticTokens = highlightKeywords('AI VOICE SCAM ஆல்', ['AI VOICE SCAM']);
  assert.deepEqual(kineticTokens, [
    { word: 'AI', highlight: true },
    { word: 'VOICE', highlight: true },
    { word: 'SCAM', highlight: true },
    { word: 'ஆல்', highlight: false },
  ]);

  // Multi-word currency + Tamil verb
  const pillTokens = highlightKeywords('₹1.2 LAKH இழந்தார்', ['₹1.2 LAKH']);
  assert.deepEqual(pillTokens, [
    { word: '₹1.2', highlight: true },
    { word: 'LAKH', highlight: true },
    { word: 'இழந்தார்', highlight: false },
  ]);

  // Tamil Unicode keywords preserved cleanly (combining marks intact)
  const tamilKeywordTokens = highlightKeywords(
    'AI VOICE SCAM ஆல் ₹1.2 LAKH இழந்தார்!',
    ['இழந்தார்', 'ஆல்']
  );
  assert.deepEqual(
    tamilKeywordTokens.map((t: { word: string; highlight: boolean }) => t.highlight),
    [false, false, false, true, false, false, true]
  );

  // Case-insensitive matching with edge punctuation
  const caseTokens = highlightKeywords('Stay safe, online!', ['stay safe']);
  assert.deepEqual(caseTokens, [
    { word: 'Stay', highlight: true },
    { word: 'safe,', highlight: true },
    { word: 'online!', highlight: false },
  ]);

  // Indian & US number formatting
  assert.equal(formatNumber(120000, 'INR'), '₹1,20,000');
  assert.equal(formatNumber(1500000, 'INR'), '₹15,00,000');
  assert.equal(formatNumber(-120000, 'INR'), '-₹1,20,000');
  assert.equal(formatNumber(120000), '120,000');
});

test('sampleProject passes validateProject cleanly', () => {
  assert.equal(DEMO_DURATION_FRAMES, 270);
  const validated = validateProject(sampleProject);
  assert.equal(validated.version, 1);
  assert.equal(validated.composition.durationFrames, 270);
  assert.equal(validated.captions.length, 5);
  assert.equal(validated.graphics.length, 1);
  assert.equal(validated.graphics[0].region, 'captions');
});

test('validateProject rejects invalid project versions, bounds, overlaps, regions, and extensions', () => {
  const cloneProject = () => structuredClone(sampleProject);

  // Invalid version
  const badVersion = { ...cloneProject(), version: 2 };
  assert.throws(() => validateProject(badVersion), /version/i);

  // Non-positive durationFrames
  const badDuration = cloneProject();
  badDuration.composition.durationFrames = 0;
  assert.throws(() => validateProject(badDuration), /durationFrames/i);

  const negativeDuration = cloneProject();
  negativeDuration.composition.durationFrames = -30;
  assert.throws(() => validateProject(negativeDuration), /durationFrames/i);

  // Duplicate caption IDs
  const dupCaptions = cloneProject();
  dupCaptions.captions[1].id = dupCaptions.captions[0].id;
  assert.throws(() => validateProject(dupCaptions), /Duplicate CaptionSegment id/i);

  // Out-of-bounds endFrame
  const outOfBounds = cloneProject();
  outOfBounds.captions[4].endFrame = 271;
  assert.throws(() => validateProject(outOfBounds), /exceeds composition durationFrames/i);

  // Overlapping captions
  const overlapCaptions = cloneProject();
  overlapCaptions.captions[1].startFrame = 55;
  assert.throws(() => validateProject(overlapCaptions), /Overlapping captions/i);

  // Overlapping visuals
  const overlapVisuals = cloneProject();
  overlapVisuals.visuals = [
    { id: 'vis-1', src: 'broll1.mp4', type: 'video', startFrame: 0, endFrame: 120 },
    { id: 'vis-2', src: 'broll2.jpg', type: 'image', startFrame: 100, endFrame: 200 },
  ];
  assert.throws(() => validateProject(overlapVisuals), /Overlapping visuals/i);

  // Duplicate visual IDs
  const dupVisuals = cloneProject();
  dupVisuals.visuals = [
    { id: 'vis-1', src: 'broll1.mp4', type: 'video', startFrame: 0, endFrame: 100 },
    { id: 'vis-1', src: 'broll2.jpg', type: 'image', startFrame: 100, endFrame: 200 },
  ];
  assert.throws(() => validateProject(dupVisuals), /Duplicate VisualSegment id/i);

  // Graphic placed outside 'captions' region
  const badGraphicRegion = cloneProject();
  (badGraphicRegion.graphics[0] as { region: string }).region = 'facecam';
  assert.throws(() => validateProject(badGraphicRegion), /region must be 'captions'/i);

  // Unsupported media file extensions
  const badFacecamExt = cloneProject();
  badFacecamExt.media.facecam = 'facecam.mkv';
  assert.throws(() => validateProject(badFacecamExt), /unsupported file extension/i);

  const badNarrationExt = cloneProject();
  badNarrationExt.media.narration = 'voiceover.ogg';
  assert.throws(() => validateProject(badNarrationExt), /unsupported file extension/i);

  const badVisualExt = cloneProject();
  badVisualExt.visuals = [
    { id: 'vis-bad', src: 'diagram.svg', type: 'image', startFrame: 0, endFrame: 60 },
  ];
  assert.throws(() => validateProject(badVisualExt), /unsupported file extension/i);
});

test('Segment-level validators enforce required fields and bounds', () => {
  assert.throws(
    () =>
      validateCaptionSegment({
        id: '',
        style: 'kinetic',
        text: 'Hello',
        keywords: [],
        startFrame: 0,
        endFrame: 30,
      }),
    /non-empty string/i
  );

  assert.throws(
    () =>
      validateVisualSegment(
        {
          id: 'v1',
          src: 'clip.mp4',
          type: 'video',
          startFrame: 20,
          endFrame: 20,
        },
        100
      ),
    /endFrame .* must be greater than startFrame/i
  );

  assert.throws(
    () =>
      validateGraphicSegment(
        {
          id: 'g1',
          type: 'badge',
          label: 'ALERT',
          startFrame: 0,
          endFrame: 30,
          region: 'visuals',
        },
        100
      ),
    /region must be 'captions'/i
  );

  assert.throws(
    () =>
      validateMediaAsset({
        id: 'm1',
        type: 'audio',
        src: 'track.flac',
      }),
    /unsupported file extension/i
  );

  const validAsset = validateMediaAsset({
    id: 'm2',
    type: 'audio',
    src: 'audio/bg.mp3',
  });
  assert.equal(validAsset.src, 'audio/bg.mp3');
});
