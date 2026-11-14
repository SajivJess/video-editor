const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const os=require('node:os');
const path=require('node:path');
const {createPipeline,PALETTES}=require('../server/pipeline');
const {createApp}=require('../server/index');
const {assemble,applyReelTemplate,sampleProject}=require('../scripts/project.cjs');
const {inside}=require('../server/files');

function fixture(t,failQA=false){
  const root=fs.mkdtempSync(path.join(os.tmpdir(),'reel-studio-test-'));
  t.after(()=>{if(!inside(os.tmpdir(),root)||!path.basename(root).startsWith('reel-studio-test-'))throw Error('Unsafe test cleanup');fs.rmSync(root,{recursive:true,force:true});});
  fs.mkdirSync(path.join(root,'Input'));fs.mkdirSync(path.join(root,'Output'));
  fs.writeFileSync(path.join(root,'Input','source.mp4'),'source');
  const project=assemble({duration:2,words:[{word:'Reviewed',start:0,end:1}]});
  project.media.facecam='video/source.mp4';
  project.editBeats=[{id:'section',frame:15,reason:'A deliberately selected section change',transition:'diagonal-wipe'}];
  project.transitions=[{id:'transition-section',type:'diagonal-wipe',startFrame:15,endFrame:22,color:'#C8102E'}];
  fs.writeFileSync(path.join(root,'Output','saved-project.json'),JSON.stringify({project}));
  // This unrelated old transcript must NEVER substitute for a new source's speech.
  fs.writeFileSync(path.join(root,'Output','nvidia-transcript.json'),JSON.stringify({duration:2,words:[{word:'WRONG',start:0,end:1}]}));
  const calls=[];let concurrent=0,maxConcurrent=0;
  const options={root,ffmpeg:'ffmpeg-test',inspect:()=>({errors:[],warnings:[]}),run:async(cmd,args,line)=>{
    calls.push(args);concurrent++;maxConcurrent=Math.max(maxConcurrent,concurrent);
    try{
      await new Promise(resolve=>setTimeout(resolve,2));
      if(args[0]?.endsWith('transcribe.py'))fs.writeFileSync(args[2],JSON.stringify({duration:2,words:[{word:'Fresh',start:0,end:1}],reviewRequired:[]}));
      if(args[1]==='render'){line('Rendered 60/60');fs.writeFileSync(args[4],'render');}
      if(args[0]?.endsWith('finish.py'))fs.writeFileSync(args[2],'final-video');
      if(args[0]?.endsWith('qa.py')){
        if(failQA)throw Error('Encoded audio QA failed');
        fs.writeFileSync(args[1]+'.qa.json',JSON.stringify({width:1080,height:1920,fps:30,integratedLUFS:'-14.1',truePeakDBTP:'-1.4',errors:[]}));
      }
    }finally{concurrent--;}
  }};
  return {root,options,calls,engine:createPipeline(options),maxConcurrent:()=>maxConcurrent};
}
async function done(job){
  const until=Date.now()+5000;
  while(['pending','processing'].includes(job.status)&&Date.now()<until)await new Promise(resolve=>setTimeout(resolve,5));
  assert.ok(['completed','failed'].includes(job.status),'Job must terminate');return job;
}

test('Dashboard palettes are executable renderer styles, including their actual colors',()=>{
  assert.equal(PALETTES.length,10);
  for(const palette of PALETTES){
    const project=assemble({duration:1,words:[]},palette.id);assert.equal(project.theme.highlightColor,palette.highlightColor);assert.equal(project.theme.pillTextColor,palette.pillTextColor);
    const withTransition=applyReelTemplate({...sampleProject,theme:{...sampleProject.theme,...palette}});
    assert.ok(withTransition.transitions.every(t=>t.color===palette.highlightColor));
  }
});
test('Saved project rendering preserves accepted captions and never calls Whisper; history survives restart',async t=>{
  const f=fixture(t);const job=f.engine.createJob({projectId:'saved-project.json',paletteKey:'hyperion-gold',customName:'Reviewed'});
  await done(job);assert.equal(job.status,'completed',job.error);
  assert.ok(!f.calls.some(args=>args[0]?.endsWith('transcribe.py')));
  const project=JSON.parse(fs.readFileSync(job.projectFile)).project;
  assert.equal(project.captions[0].text,'Reviewed');assert.equal(project.theme.highlightColor,'#FFD700');
  assert.equal(project.transitions[0].color,'#FFD700');assert.equal(project.transitions[0].startFrame,15);
  assert.equal(job.qa.errors.length,0);
  const restored=createPipeline(f.options).listJobs();assert.equal(restored.length,1);assert.equal(restored[0].status,'completed');
});
test('Each new upload transcribes its own audio and jobs serialize without filename collisions',async t=>{
  const f=fixture(t);
  const first=f.engine.createJob({rawVideoPath:path.join(f.root,'Input','source.mp4'),customName:'same',vocabulary:'Leela',scriptText:'Actual narration',overlayEndSeconds:1.5});
  const second=f.engine.createJob({rawVideoPath:path.join(f.root,'Input','source.mp4'),customName:'same'});
  await Promise.all([done(first),done(second)]);
  assert.equal(first.status,'completed',first.error);assert.equal(second.status,'completed',second.error);
  assert.notEqual(first.outputFile,second.outputFile);assert.equal(f.maxConcurrent(),1);
  const project=JSON.parse(fs.readFileSync(first.projectFile)).project;
  assert.equal(project.captions[0].text,'Fresh');assert.equal(project.composition.overlayEndFrame,45);assert.equal(project.cameraMoves.at(-1).endFrame,45);
  const transcriptions=f.calls.filter(args=>args[0]?.endsWith('transcribe.py'));assert.equal(transcriptions.length,2);assert.ok(transcriptions[0].includes('--script'));assert.ok(transcriptions[0].includes('Leela'));
});
test('Failed QA never exposes a successful export and marks the failing stage',async t=>{
  const f=fixture(t,true);const job=await done(f.engine.createJob({projectId:'saved-project.json'}));
  assert.equal(job.status,'failed');assert.equal(job.outputUrl,null);assert.match(job.error,/QA failed/);assert.equal(job.stages[5].status,'failed');assert.ok(job.finishedAt);
});
test('Empty Whisper results retain the review file and stop before rendering',async t=>{
  const f=fixture(t);const run=f.options.run;
  const engine=createPipeline({...f.options,run:async(command,args,line)=>{
    await run(command,args,line);
    if(args[0]?.endsWith('transcribe.py'))fs.writeFileSync(args[2],JSON.stringify({duration:2,words:[],reviewRequired:[]}));
  }});
  const job=await done(engine.createJob({rawVideoPath:path.join(f.root,'Input','source.mp4')}));
  assert.equal(job.status,'failed');assert.match(job.error,/no speech words/);assert.ok(job.reviewUrl);assert.equal(job.outputUrl,null);
  assert.ok(!f.calls.some(args=>args[1]==='render'));
});
test('A server restart marks interrupted work failed instead of claiming success',t=>{
  const f=fixture(t);const id='job_11111111-2222-4333-8444-555555555555';
  fs.writeFileSync(path.join(f.root,'Output','.studio',id+'.json'),JSON.stringify({id,status:'processing',stages:[{status:'running'}]}));
  const restored=createPipeline(f.options).getJob(id);
  assert.equal(restored.status,'failed');assert.equal(restored.stages[0].status,'failed');assert.match(restored.error,/restarted/);
});

test('Checkpointed jobs recover after restart without retranscribing the source',async t=>{
  const f=fixture(t);const engine=createPipeline({...f.options,run:async(cmd,args,line)=>{if(args[1]==='render')throw Error('Interrupted before render');return f.options.run(cmd,args,line);}});
  const job=await done(engine.createJob({rawVideoPath:path.join(f.root,'Input','source.mp4')}));assert.equal(job.status,'failed');assert.equal(job.checkpoints.transcribed,true);
  const saved=path.join(f.root,'Output','.studio',job.id+'.json'),data=JSON.parse(fs.readFileSync(saved));data.status='processing';data.stages[4].status='running';fs.writeFileSync(saved,JSON.stringify(data));
  const recovered=createPipeline(f.options).getJob(job.id);await done(recovered);assert.equal(recovered.status,'completed',recovered.error);assert.equal(f.calls.filter(args=>args[0]?.endsWith('transcribe.py')).length,1);
});
test('HTTP integration validates input, serves ranges, renames reports, and refuses overwrite',async t=>{
  const f=fixture(t);const server=createApp(f.engine).listen(0,'127.0.0.1');await new Promise(resolve=>server.once('listening',resolve));
  t.after(()=>new Promise(resolve=>server.close(resolve)));
  const base=`http://127.0.0.1:${server.address().port}`;
  const post=(url,body)=>fetch(base+url,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(body)});
  assert.equal((await fetch(base+'/api/health')).status,200);
  assert.equal((await post('/api/generate',{rawVideoPath:path.join(f.root,'Output','nvidia-transcript.json')})).status,400);
  assert.equal((await post('/api/generate',{projectId:'saved-project.json',paletteKey:'fake'})).status,400);
  const queued=await post('/api/generate',{projectId:'saved-project.json'});assert.equal(queued.status,202);
  const {job}=await queued.json();await done(f.engine.getJob(job.id));
  assert.equal((await fetch(base+job.projectUrl)).status,200);
  const output=f.engine.getJob(job.id).outputFile;
  const range=await fetch(base+`/api/stream/${output}`,{headers:{Range:'bytes=0-3'}});assert.equal(range.status,206);assert.equal((await range.arrayBuffer()).byteLength,4);
  assert.equal((await fetch(base+`/api/stream/${output}`,{headers:{Range:'bytes=900-999'}})).status,416);
  assert.equal((await post('/api/rename',{oldFilename:'../package.json',newName:'bad'})).status,400);
  const renamed=await post('/api/rename',{oldFilename:output,newName:'published'});assert.equal(renamed.status,200);assert.ok(fs.existsSync(path.join(f.root,'Output','published.mp4.qa.json')));
  fs.writeFileSync(path.join(f.root,'Output','occupied.mp4'),'preserve');
  assert.equal((await post('/api/rename',{oldFilename:'published.mp4',newName:'occupied'})).status,409);
  assert.equal(fs.readFileSync(path.join(f.root,'Output','occupied.mp4'),'utf8'),'preserve');
  const upload=new FormData();upload.append('video',new Blob(['clip'],{type:'video/mp4'}),'test.mp4');assert.equal((await fetch(base+'/api/upload',{method:'POST',body:upload})).status,201);
  const invalid=new FormData();invalid.append('video',new Blob(['text']),'bad.txt');assert.equal((await fetch(base+'/api/upload',{method:'POST',body:invalid})).status,400);
  assert.equal((await fetch(base+'/api/unknown')).status,404);
});
