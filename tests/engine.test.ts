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
  validateCameraMove,
  validateInterstitialSegment,
  validateMediaAsset,
} = await import('../src/engine/validation.ts');
const { wrapText, highlightKeywords, formatNumber } = await import(
  '../src/utils/text.ts'
);
const { DEMO_DURATION_FRAMES, sampleProject } = await import(
  '../src/demo/sampleProject.ts'
);

test('Layout boundaries map cleanly to 1080x1920 regions with zero facecam/caption overlap', () => {
  const height = COMPOSITION_DEFAULTS.height;
  assert.equal(COMPOSITION_DEFAULTS.width, 1080);
  assert.equal(height, 1920);
  assert.equal(COMPOSITION_DEFAULTS.fps, 30);

  // Top 40%: 2D vectors & visuals -> 0..768px (40%)
  assert.deepEqual(LAYOUT.topVisuals, { y: 0, h: 0.4 });
  const visualsTop = normalizedYtoPx(LAYOUT.topVisuals.y, height);
  const visualsHeight = normalizedHeightToPx(LAYOUT.topVisuals.h, height);
  assert.equal(visualsTop, 0);
  assert.equal(visualsHeight, 768);
  assert.equal(visualsTop + visualsHeight, 768);

  // Middle 30%: Clear presenter face zone 40%..70% -> 768..1344px (30%)
  assert.deepEqual(LAYOUT.clearMiddle, { y: 0.4, h: 0.3 });
  const clearTop = normalizedYtoPx(LAYOUT.clearMiddle.y, height);
  const clearHeight = normalizedHeightToPx(LAYOUT.clearMiddle.h, height);
  assert.equal(clearTop, 768);
  assert.equal(clearHeight, 576);
  assert.equal(clearTop + clearHeight, 1344);

  // Bottom 30%: Modern captions zone 70%..100% -> 1344..1920px (30%, NO BLUR)
  assert.deepEqual(LAYOUT.captions, { y: 0.7, h: 0.3 });
  const captionsTop = normalizedYtoPx(LAYOUT.captions.y, height);
  const captionsHeight = normalizedHeightToPx(LAYOUT.captions.h, height);
  assert.equal(captionsTop, 1344);
  assert.equal(captionsHeight, 576);
  assert.equal(captionsTop + captionsHeight, 1920);

  // Strict non-overlapping zones perfectly summing to full 1920 height
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

test('sampleProject passes validateProject cleanly with camera moves and interstitials', () => {
  assert.equal(DEMO_DURATION_FRAMES, 1856);
  const validated = validateProject(sampleProject);
  assert.equal(validated.version, 1);
  assert.equal(validated.composition.durationFrames, 1856);
  assert.ok(validated.captions.length > 0);
  assert.ok(validated.graphics.length > 0);
  assert.ok((validated.cameraMoves?.length ?? 0) > 0);
  assert.equal(validated.interstitials?.length, 0, 'Do not label presenter footage as a generated Flow clip');
  assert.equal(validated.graphics[0].type, 'logo-spotlight');
  assert.equal(validated.graphics[1].type, 'person-pictorial');
  assert.equal(validated.graphics[2].type, 'collage-card');
});

test('validateProject rejects invalid project versions, bounds, overlaps, regions, and extensions', () => {
  const cloneProject = () => structuredClone(sampleProject);

  // Invalid version
  const badVersion = { ...cloneProject(), version: 2 as any };
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
  outOfBounds.captions[outOfBounds.captions.length - 1].endFrame = DEMO_DURATION_FRAMES + 10;
  assert.throws(() => validateProject(outOfBounds), /exceeds composition durationFrames/i);

  // Overlapping captions
  const overlapCaptions = cloneProject();
  overlapCaptions.captions[1].startFrame = overlapCaptions.captions[0].startFrame + 5;
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

  // Graphic placed outside allowed regions (e.g. into clearMiddle)
  const badGraphicRegion = cloneProject();
  (badGraphicRegion.graphics[0] as { region: string }).region = 'clearMiddle';
  assert.throws(() => validateProject(badGraphicRegion), /region must be 'captions' | 'visuals'/i);

  // Interstitial exceeding 10 seconds (10s * 30fps = 300 frames)
  const badInterstitialDuration = cloneProject();
  badInterstitialDuration.interstitials = [
    { id: 'bad-flow', src: 'clip.mp4', startFrame: 0, endFrame: 330 },
  ];
  assert.throws(() => validateProject(badInterstitialDuration), /exceeds max 10.0s for AI interstitial clips/i);

  // Invalid camera move type
  const badCamMove = cloneProject();
  badCamMove.cameraMoves = [
    { id: 'cam-bad', type: 'hyper-warp' as any, startFrame: 0, endFrame: 30 },
  ];
  assert.throws(() => validateProject(badCamMove), /type must be one of/i);

  // Unsupported media file extensions
  const badFacecamExt = cloneProject();
  badFacecamExt.media.facecam = 'facecam.mkv';
  assert.throws(() => validateProject(badFacecamExt), /unsupported file extension/i);

  const badNarrationExt = cloneProject();
  badNarrationExt.media.narration = 'voiceover.ogg';
  assert.throws(() => validateProject(badNarrationExt), /unsupported file extension/i);

  const badVisualExt = cloneProject();
  badVisualExt.visuals = [
    { id: 'vis-bad', src: 'diagram.bmp', type: 'image', startFrame: 0, endFrame: 60 },
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

  // Disallow placing graphics in clear middle zone
  assert.throws(
    () =>
      validateGraphicSegment(
        {
          id: 'g1',
          type: 'badge',
          label: 'ALERT',
          startFrame: 0,
          endFrame: 30,
          region: 'clearMiddle' as any,
        },
        100
      ),
    /region must be 'captions' | 'visuals'/i
  );

  // Valid graphics in visuals and captions
  const validTopGraphic = validateGraphicSegment(
    {
      id: 'g-top',
      type: 'logo-spotlight',
      label: 'NVIDIA',
      logo: { brand: 'nvidia' },
      startFrame: 0,
      endFrame: 60,
      region: 'visuals',
    },
    100
  );
  assert.equal(validTopGraphic.region, 'visuals');
  assert.equal(validTopGraphic.type, 'logo-spotlight');

  // Valid camera move
  const validMove = validateCameraMove(
    {
      id: 'cam-1',
      type: 'sudden-zoom',
      startFrame: 10,
      endFrame: 25,
      fromScale: 1.0,
      toScale: 1.15,
    },
    100
  );
  assert.equal(validMove.type, 'sudden-zoom');
  assert.equal(validMove.toScale, 1.15);

  // Valid interstitial clip
  const validInterstitial = validateInterstitialSegment(
    {
      id: 'ai-1',
      src: 'flow.mp4',
      startFrame: 0,
      endFrame: 150, // 5.0 seconds at 30 fps
      transitionIn: 'whip-pan',
    },
    200,
    30
  );
  assert.equal(validInterstitial.transitionIn, 'whip-pan');

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

const { groupCaptionWords, wordsForCaption } = await import('../src/engine/captions.ts');

test('Validation preserves emphasis and all declared graphics and icons', () => {
  const cap = validateCaptionSegment({id:'cap',style:'modern',text:'NVIDIA AI',keywords:[],startFrame:0,endFrame:30,
    words:[{word:'NVIDIA',startFrame:0,endFrame:15,emphasis:true},{word:'AI',startFrame:15,endFrame:30,emphasis:false}]},30);
  assert.equal(cap.words?.[0].emphasis,true);
  assert.equal(cap.words?.[1].emphasis,false);
  for (const iconName of ['sparkle','chip'] as const) assert.equal(validateGraphicSegment({id:'g',type:'step-card',label:'Step',region:'visuals',startFrame:0,endFrame:30,iconName},30).iconName,iconName);
});

test('Malformed camera numbers, fractional frames, and escaped word timings fail early', () => {
  assert.throws(()=>validateCameraMove({id:'c',type:'pan',startFrame:0,endFrame:30,toScale:'bad'},30),/number/);
  assert.throws(()=>validateCameraMove({id:'c',type:'pan',startFrame:0.5,endFrame:30},30),/integer/);
  assert.throws(()=>validateCaptionSegment({id:'c',style:'modern',text:'hello',keywords:[],startFrame:10,endFrame:30,words:[{word:'hello',startFrame:0,endFrame:20}]},30),/inside/);
});

test('Ken Burns aliases survive normalization and source offsets are validated', () => {
  const visual=validateVisualSegment({id:'v',src:'test.jpg',type:'image',startFrame:0,endFrame:30,kenBurns:{startScale:1,endScale:1.2,startX:4,endY:8}},30);
  assert.deepEqual(visual.kenBurns,{fromScale:1,toScale:1.2,fromX:4,toY:8});
  assert.throws(()=>validateVisualSegment({id:'v',src:'test.mp4',type:'video',startFrame:0,endFrame:30,sourceStartFrame:-1},30),/>= 0/);
});

test('Speech groups break on punctuation, pauses, and width without losing words', () => {
  const words=[{word:'This',startFrame:0,endFrame:5},{word:'is',startFrame:5,endFrame:10},{word:'AI.',startFrame:10,endFrame:15},{word:'Next',startFrame:30,endFrame:35},{word:'chapter',startFrame:35,endFrame:40}];
  const groups=groupCaptionWords(words,45,3);
  assert.deepEqual(groups.map(g=>g.words.map(w=>w.word)),[['This','is','AI.'],['Next','chapter']]);
  assert.equal(groups[0].endFrame,20);
  assert.ok(groups.every(g=>g.words.length<=3));
  const fallback=wordsForCaption({id:'c',style:'modern',text:'A B C',keywords:[],startFrame:0,endFrame:2});
  assert.equal(fallback.length,2);
  assert.ok(fallback.every(w=>w.endFrame>w.startFrame));
});

const { planCameraMoves } = await import('../src/engine/motion.ts');
test('Camera planning covers the complete reel continuously and deterministically', () => {
  const moves=planCameraMoves(1856,30);
  assert.equal(moves[0].startFrame,0);
  assert.equal(moves.at(-1)?.endFrame,1856);
  for (let i=1;i<moves.length;i++) {
    assert.equal(moves[i-1].endFrame,moves[i].startFrame);
    assert.equal(moves[i-1].toScale,moves[i].fromScale);
  }
  assert.deepEqual(planCameraMoves(1856,30),moves);
});

test('Overlapping graphics and invalid optional fields cannot silently disappear', () => {
  const p=structuredClone(sampleProject);
  p.graphics.push({...p.graphics[0],id:'overlap'});
  assert.throws(()=>validateProject(p),/Overlapping visuals graphics/);
  assert.throws(()=>validateGraphicSegment({id:'p',type:'process-diagram',region:'visuals',label:'Process',steps:['one'],startFrame:0,endFrame:30},30),/2 to 5/);
});

test('Flow timing and separate transitions survive validation; invalid caption-region graphics fail', () => {
  const clip=validateInterstitialSegment({id:'flow',src:'clip.mp4',startFrame:300,endFrame:450,sourceStartFrame:600,volume:0,transitionIn:'diagonal-wipe',transitionOut:'zoom-through'},600,30);
  assert.equal(clip.sourceStartFrame,600);
  assert.equal(clip.volume,0);
  assert.equal(clip.transitionIn,'diagonal-wipe');
  assert.equal(clip.transitionOut,'zoom-through');
  assert.throws(()=>validateGraphicSegment({id:'large',type:'person-pictorial',label:'Person',region:'captions',startFrame:0,endFrame:30},30),/place larger graphics/);
});

const { planPersonMentions, prioritizePersonMentions } = await import('../src/engine/entities.ts');
const { applyReelTemplate } = await import('../src/engine/template.ts');
const { evaluateCameraMove } = await import('../src/engine/camera.ts');
const { captionArtDirection } = await import('../src/engine/captionStyle.ts');

test('Any registered person gets a portrait at repeated names across caption boundaries',()=>{
  const entity={id:'leela-nair',name:'Leela Nair',aliases:['Leela Nair'],kind:'person' as const,src:'images/leela.png'};
  const captions=[
    {id:'a',style:'modern' as const,text:'Leela',keywords:[],startFrame:30,endFrame:40,words:[{word:'Leela',startFrame:30,endFrame:40}]},
    {id:'b',style:'modern' as const,text:'Nair',keywords:[],startFrame:40,endFrame:50,words:[{word:'Nair',startFrame:40,endFrame:50}]},
    {id:'c',style:'modern' as const,text:'Leela Nair',keywords:[],startFrame:120,endFrame:140,words:[{word:'Leela',startFrame:120,endFrame:130},{word:'Nair.',startFrame:130,endFrame:140}]},
  ];
  const people=planPersonMentions(captions,[entity],180,30);
  assert.deepEqual(people.map(p=>p.startFrame),[30,120]);
  assert.ok(people.every(p=>p.person?.src==='images/leela.png'));
  const visuals=prioritizePersonMentions([{id:'background',type:'badge',region:'visuals',label:'Topic',startFrame:0,endFrame:180}],people);
  const validated=validateProject({version:1,composition:{width:1080,height:1920,fps:30,durationFrames:180},media:{},captions,visuals:[],graphics:visuals});
  assert.equal(validated.graphics.filter(g=>g.type==='person-pictorial').length,2);
  assert.throws(()=>validateGraphicSegment({id:'no-photo',type:'person-pictorial',region:'visuals',label:'Real Person',startFrame:0,endFrame:30},30),/attributed portrait/);
});

test('Reusable template is idempotent and retains registry, treatment, and real scene transitions',()=>{
  const styled=applyReelTemplate(sampleProject);
  assert.deepEqual(styled,applyReelTemplate(styled));
  const checked=validateProject(styled);
  assert.equal(checked.theme?.captionTreatment,'expressive');
  assert.ok((checked.entities?.length??0)>0);
  assert.ok((checked.transitions?.length??0)>0);
  assert.ok(checked.graphics.some(g=>g.person?.name==='Kimberly Powell'));
});

test('Reviewed camera beats remain visible, spaced, and finite across frame rates',()=>{
  for(const fps of [24,30,60]){
    const moves=planCameraMoves(fps*45,fps,[
      {id:'punch',frame:fps*4,reason:'Key finding',camera:'punch'},
      {id:'whip',frame:fps*17,reason:'Major topic change',camera:'whip'},
      {id:'pan',frame:fps*30,reason:'Comparison',camera:'pan'},
    ]);
    assert.ok(moves.some(m=>m.type==='pan'));
    assert.ok(moves.some(m=>m.type==='sudden-zoom'&&(m.toScale??1)-(m.fromScale??1)>.095));
    const whip=moves.find(m=>m.type==='whip-pan')!;
    assert.ok(whip);
    assert.ok(whip.endFrame-whip.startFrame<=fps*.3);
    for(let frame=whip.startFrame;frame<whip.endFrame;frame++){
      const p=evaluateCameraMove(whip,frame,fps,1080,1920);
      assert.ok(Object.values(p).every(Number.isFinite));
      assert.ok(p.blur>=0&&p.blur<=7.01);
      assert.ok(Math.abs(p.x)*p.scale<=(p.scale-1)*1080/2+.1);
    }
  }
});

test('Ordinary captions and repeated person reveals never manufacture camera attacks or sound',()=>{
  const quiet=applyReelTemplate({...sampleProject,editBeats:[]});
  assert.equal(quiet.cameraMoves?.filter(m=>['sudden-zoom','pan','whip-pan'].includes(m.type)).length,0);
  assert.equal(quiet.transitions?.length,0);
  assert.equal(quiet.media.sfx?.length,0);
  assert.equal(quiet.graphics.filter(g=>g.type==='person-pictorial').length,4);
  assert.equal(sampleProject.media.sfx?.length,1);
  assert.equal(sampleProject.cameraMoves?.filter(m=>m.type==='sudden-zoom').length,2);
  assert.equal(sampleProject.transitions?.length,1);
});

test('Editorial cue safety rejects invalid data and suppresses crowded effects',()=>{
  const beats=[
    {id:'first',frame:150,reason:'Finding',camera:'punch' as const,transition:'diagonal-wipe' as const,sound:'whoosh' as const},
    {id:'crowded',frame:210,reason:'Too close',camera:'whip' as const,transition:'whip-pan' as const,sound:'whoosh' as const},
  ];
  const styled=applyReelTemplate({...sampleProject,editBeats:beats});
  assert.equal(styled.cameraMoves?.filter(m=>['sudden-zoom','whip-pan'].includes(m.type)).length,1);
  assert.equal(styled.transitions?.length,1);
  assert.equal(styled.media.sfx?.length,1);
  assert.deepEqual(validateProject(styled).editBeats,beats);
  for(const changes of [{frame:1.5},{frame:1800},{reason:''},{camera:'shake'}]){
    assert.throws(()=>validateProject({...styled,editBeats:[{...beats[0],...changes}]}));
  }
});

test('Caption hierarchy gives figures and negation deliberate hero treatment',()=>{
  const word=(text:string)=>({word:text,startFrame:0,endFrame:10});
  assert.equal(captionArtDirection([word('only'),word('8%')]).hero,1);
  const negative=captionArtDirection([{...word('VERIFY'),emphasis:true},{...word('AAGALA'),emphasis:true}]);
  assert.equal(negative.hero,1);
  assert.equal(negative.plate,true);
});
