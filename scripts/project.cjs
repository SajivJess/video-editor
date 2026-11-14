const fs = require('node:fs');
const path = require('node:path');
const {spawnSync} = require('node:child_process');
const ts = require('typescript');
require.extensions['.ts'] = (module, filename) => module._compile(ts.transpileModule(fs.readFileSync(filename, 'utf8'), {
  compilerOptions: {module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022},
}).outputText, filename);
const {validateProject} = require('../src/engine/validation.ts');
const {sampleProject} = require('../src/demo/sampleProject.ts');
const {groupCaptionWords} = require('../src/engine/captions.ts');
const {planCameraMoves} = require('../src/engine/motion.ts');
const {planEntityGraphics} = require('../src/engine/planning.ts');
const {findEntityMentions} = require('../src/engine/entities.ts');
const {applyReelTemplate} = require('../src/engine/template.ts');
const {DEFAULT_ENTITIES} = require('../src/config/entities.ts');
const {EDITING_STYLES} = require('../src/config/styles.ts');
const root = path.resolve(__dirname, '..');
const publicDir = path.join(root, 'public');
let ffprobe = process.env.FFPROBE_PATH;
if (!ffprobe) {
  const platformPackage = process.platform === 'win32' ? '@remotion/compositor-win32-x64-msvc' : process.platform === 'darwin' ? `@remotion/compositor-darwin-${process.arch}` : `@remotion/compositor-linux-${process.arch}-gnu`;
  try { ffprobe = path.join(path.dirname(require.resolve(`${platformPackage}/package.json`)), process.platform === 'win32' ? 'ffprobe.exe' : 'ffprobe'); } catch { ffprobe = ''; }
}

function inspect(project) {
  const p = validateProject(project);
  const errors = [], warnings = [];
  const assets = [p.media.facecam, ...[p.media.narration, p.media.bgMusic].map(a => typeof a === 'string' ? a : a?.src),
    ...(p.media.sfx ?? []).map(a => a.src), ...p.visuals.map(a => a.src), ...(p.interstitials ?? []).map(a => a.src), ...p.graphics.flatMap(g => [g.person?.src,g.logo?.src]),
    'fonts/BarlowCondensed-ExtraBold.ttf', 'fonts/NotoSansTamil.ttf'];
  for (const src of new Set(assets.filter(Boolean))) {
    if (/^https?:/i.test(src)) { warnings.push(`Remote asset not probed: ${src}`); continue; }
    const file = path.resolve(publicDir, src);
    if (!fs.existsSync(file)) { errors.push(`Missing asset: ${src}`); continue; }
    if (/\.(mp4|mov|webm)$/i.test(src) && fs.existsSync(ffprobe)) {
      const probe = spawnSync(ffprobe, ['-v', 'error', '-show_entries', 'format=duration', '-of', 'json', file], {encoding:'utf8'});
      if (probe.status !== 0) { errors.push(`Cannot decode ${src}: ${probe.stderr}`); continue; }
      const duration = Number(JSON.parse(probe.stdout).format?.duration);
      const fps = p.composition.fps;
      if (src === p.media.facecam && duration + 1/fps < p.composition.durationFrames/fps) errors.push(`Presenter footage is shorter than the composition: ${src}`);
      for (const seg of [...p.visuals, ...(p.interstitials ?? [])].filter(s => s.src === src)) {
        if (((seg.sourceStartFrame ?? 0) + seg.endFrame - seg.startFrame)/fps > duration + 1/fps) errors.push(`Clip ${seg.id} reads beyond ${src}`);
      }
    }
  }
  if (!p.captions.length) warnings.push('No captions are configured');
  const sorted = [...p.captions].sort((a,b) => a.startFrame - b.startFrame);
  let end = 0;
  for (const cap of sorted) {
    if (cap.startFrame - end > p.composition.fps * 2) warnings.push(`Caption gap ${end/p.composition.fps}s to ${cap.startFrame/p.composition.fps}s`);
    end = cap.endFrame;
  }
  const contentEnd = p.composition.overlayEndFrame ?? p.composition.durationFrames;
  if (contentEnd - end > p.composition.fps * 2) warnings.push(`Caption gap at end: ${end/p.composition.fps}s to ${contentEnd/p.composition.fps}s`);
  for (const cap of p.captions) for (const word of cap.words ?? []) {
    if (word.word.length > 24) warnings.push(`Check long caption word: ${word.word}`);
    if (word.endFrame - word.startFrame > p.composition.fps * 2.5) warnings.push(`Check extended word timing: ${word.word}`);
  }
  return {errors, warnings, durationSeconds: p.composition.durationFrames/p.composition.fps,
    captions: p.captions.length, graphics: p.graphics.length, cameraMoves: p.cameraMoves?.length ?? 0,
    personMentions:p.graphics.filter(g=>g.type==='person-pictorial').length, sceneTransitions:p.transitions?.length??0,
    emphasizedWords: p.captions.flatMap(c => c.words ?? []).filter(w => w.emphasis).length};
}

function assemble(transcript, style = 'crimson-editorial', entities = DEFAULT_ENTITIES) {
  if (!EDITING_STYLES[style]) throw new Error(`Unknown style: ${style}`);
  if (transcript.words.some(item => /[\u0370-\u052f\u0600-\u06ff\u3040-\u30ff\uac00-\ud7af]/u.test(item.word))) throw new Error('Unexpected script in Tamil/English transcription. Review the ASR instead of rendering hallucinated words.');
  const fps = 30, durationFrames = Math.ceil(transcript.duration * fps);
  const words = [];
  for (const item of transcript.words) {
    const startFrame = Math.max(words.at(-1)?.endFrame ?? 0, Math.round(item.start * fps));
    const endFrame = Math.min(durationFrames, Math.max(startFrame + 1, Math.round(item.end * fps)));
    if (endFrame <= startFrame || !item.word?.trim()) continue;
    const word = item.word.trim();
    words.push({word, startFrame, endFrame, emphasis: /\d|\b(?:ai|ceo|gpu)\b/i.test(word)});
  }
  const captions = groupCaptionWords(words,durationFrames,EDITING_STYLES[style].captionMaxWords ?? 3).map(group=>({
    id:`speech-${group.startFrame}`,style:'modern',text:group.words.map(word=>word.word).join(' '),keywords:[],
    startFrame:group.startFrame,endFrame:group.endFrame,words:group.words,
  }));
  // Registry-driven emphasis works for any person or brand, even across caption groups.
  for (const mention of findEntityMentions(captions,entities,fps)) {
    for (const word of words) if (word.startFrame < mention.endFrame && word.endFrame > mention.startFrame) word.emphasis = true;
  }
  return validateProject(applyReelTemplate({version:1, composition:{width:1080,height:1920,fps,durationFrames,safeMarginX:64,safeMarginY:112,tintOpacity:.2},
    theme:EDITING_STYLES[style], media:{}, captions, visuals:[], graphics:planEntityGraphics(captions,durationFrames,fps,entities), interstitials:[], cameraMoves:planCameraMoves(durationFrames,fps)},entities));
}

function main() {
  const [command = 'check', input, output, extra, registryPath] = process.argv.slice(2);
  if (command === 'assemble') {
    if (!input || !output) throw new Error('assemble <transcript.json> <props.json> [style]');
    fs.writeFileSync(output, JSON.stringify({project:assemble(JSON.parse(fs.readFileSync(input,'utf8')), extra, registryPath?JSON.parse(fs.readFileSync(registryPath,'utf8')):DEFAULT_ENTITIES)}, null, 2));
    return;
  }
  if (command === 'export') { fs.writeFileSync(input ?? 'Output/project.json',JSON.stringify({project:validateProject(sampleProject)},null,2)); return; }
  const data = input ? JSON.parse(fs.readFileSync(input,'utf8')) : {project:sampleProject};
  const project = validateProject(data.project ?? data);
  if (command === 'restyle') {
    const registry=output?JSON.parse(fs.readFileSync(output,'utf8')):project.entities??DEFAULT_ENTITIES;
    const styled=validateProject(applyReelTemplate(project,registry));
    fs.copyFileSync(input,`${input}.${Date.now()}.bak`);
    fs.writeFileSync(input,JSON.stringify({project:styled},null,2));return;
  }
  if (command === 'revise') {
    if (!input || !output) throw new Error('revise <props.json> <patch.json>: patch contains id and changes, or theme');
    const patch = JSON.parse(fs.readFileSync(output,'utf8'));
    if (patch.theme) project.theme = {...project.theme,...patch.theme};
    else {
      const item = [...project.captions,...project.graphics,...project.visuals,...(project.editBeats??[]),...(project.cameraMoves??[]),...(project.interstitials??[])].find(x=>x.id===patch.id);
      if (!item) throw new Error(`Unknown timeline element: ${patch.id}`);
      Object.assign(item,patch.changes);
    }
    const validated=validateProject(project);
    fs.copyFileSync(input,`${input}.${Date.now()}.bak`);
    fs.writeFileSync(input,JSON.stringify({project:validated},null,2)); return;
  }
  const report = inspect(project);
  console.log(JSON.stringify(report,null,2));
  if (report.errors.length) process.exitCode=1;
}
module.exports={inspect,assemble,validateProject,sampleProject,applyReelTemplate};
if (require.main===module) {try {main();} catch(error) {console.error(error.message);process.exitCode=1;}}
