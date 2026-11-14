const test = require('node:test');
const assert = require('node:assert/strict');
const {assemble, inspect} = require('../scripts/project.cjs');

test('Transcript assembly preserves speech timing, emphasis, and complete camera coverage', () => {
  const project = assemble({duration:4,words:[
    {word:'NVIDIA',start:.1,end:.6}, {word:'AI',start:.6,end:1.1},
    {word:'chip.',start:1.1,end:1.5}, {word:'Next',start:2.5,end:3},
  ]});
  const words = project.captions.flatMap(c=>c.words);
  assert.deepEqual(words.map(w=>w.word),['NVIDIA','AI','chip.','Next']);
  assert.equal(words[0].startFrame,3);
  assert.equal(words[0].emphasis,true);
  assert.equal(project.cameraMoves.at(-1).endFrame,120);
  assert.equal(project.graphics[0].logo.brand,'nvidia');
});

test('Preflight reports actual missing assets and unknown topics have no invented visuals', () => {
  const project=assemble({duration:2,words:[{word:'Hello',start:0,end:1}]});
  assert.equal(project.graphics.length,0);
  project.media.facecam='video/this-file-does-not-exist.mp4';
  assert.ok(inspect(project).errors.some(message=>message.includes('Missing asset')));
  assert.throws(()=>assemble({duration:2,words:[]},'unknown'),/Unknown style/);
});

test('ASR script hallucinations are stopped before a timeline is rendered', () => {
  assert.throws(()=>assemble({duration:2,words:[{word:'Иманд',start:0,end:1}]}),/Unexpected script/);
});

test('A custom registry drives portraits and emphasis without NVIDIA-specific words', () => {
  const project=assemble({duration:5,words:[
    {word:'Leela',start:.2,end:.6}, {word:'Nair',start:.6,end:1},
    {word:'speaks.',start:1,end:1.4}, {word:'Leela',start:3,end:3.4}, {word:'Nair',start:3.4,end:3.8},
  ]},'crimson-editorial',[
    {id:'leela',name:'Leela Nair',aliases:['Leela Nair'],kind:'person',src:'images/leela.png'},
  ]);
  assert.equal(project.graphics.length,2);
  assert.ok(project.graphics.every(g=>g.person.src==='images/leela.png'));
  assert.ok(project.captions.flatMap(c=>c.words).filter(w=>w.word==='Leela'||w.word==='Nair').every(w=>w.emphasis));
});
