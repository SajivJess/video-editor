const fs = require('node:fs');
const path = require('node:path');
const {randomUUID} = require('node:crypto');
const {spawn,execFileSync} = require('node:child_process');
const {inspect,assemble,validateProject,sampleProject,applyReelTemplate} = require('../scripts/project.cjs');
const {EDITING_STYLES} = require('../src/config/styles.ts');
const {fail,localFile,sourceVideo} = require('./files');
const {runtime}=require('./runtime');
const {createStorage}=require('./storage');
const ROOT = path.resolve(__dirname,'..');
const PALETTES = Object.entries(EDITING_STYLES).map(([id,theme])=>({id,...theme,tag:theme.mood?.split(',')[0]??'Editorial'}));
const cleanName = value => String(value||'reel').replace(/[^a-zA-Z0-9_-]/g,'_').slice(0,70).toLowerCase() || 'reel';

function runCommand(command,args,onLine){
  return new Promise((resolve,reject)=>{
    const child=spawn(command,args,{cwd:ROOT,windowsHide:true,env:{...process.env,PYTHONUTF8:'1',PYTHONUNBUFFERED:'1'}});
    let stdout='',stderr='';
    for(const [stream,key] of [[child.stdout,'out'],[child.stderr,'err']]){
      let pending='';
      stream.on('data',chunk=>{
        const text=chunk.toString('utf8');
        if(key==='out')stdout+=text;else stderr=(stderr+text).slice(-16000);
        const lines=(pending+text).split(/[\r\n]+/);pending=lines.pop();
        for(const line of lines)if(line.trim())onLine?.(line.replace(/\x1b\[[0-9;]*m/g,''));
      });
      stream.on('end',()=>{if(pending.trim())onLine?.(pending);});
    }
    child.on('error',reject);
    child.on('close',code=>code===0?resolve({stdout,stderr}):reject(new Error(`${path.basename(command)} failed (${code}): ${stderr.trim().slice(-1500)}`)));
  });
}

function createPipeline(options={}){
  const root=options.root??ROOT;
  const outputDir=options.outputDir??path.join(root,'Output');
  const publicVideoDir=options.publicVideoDir??path.join(root,'public','video');
  const stateDir=path.join(outputDir,'.studio');
  const runtimeConfig=runtime(root);
  const python=options.python??runtimeConfig.python;
  const model=options.model??runtimeConfig.model;
  const execute=options.run??runCommand;
  const inspectProject=options.inspect??inspect;
  for(const dir of [outputDir,publicVideoDir,stateDir])fs.mkdirSync(dir,{recursive:true});
  const storage=options.storage??createStorage({directory:outputDir});
  const jobs=new Map(),queue=[];
  let running=false,ffmpeg=options.ffmpeg;
  const save=job=>{const file=path.join(stateDir,`${job.id}.json`);fs.writeFileSync(file+'.tmp',JSON.stringify(job,null,2));fs.renameSync(file+'.tmp',file);};
  for(const entry of fs.readdirSync(stateDir).filter(file=>/^job_[0-9a-f-]{36}\.json$/.test(file))){
    try{
      const job=JSON.parse(fs.readFileSync(path.join(stateDir,entry),'utf8'));
      if(['pending','processing'].includes(job.status)){
        if(job.checkpoints&&(job.recoveryCount||0)<2){
          job.status='pending';job.activeStage='Recovering saved checkpoints';job.error=null;job.recoveryCount=(job.recoveryCount||0)+1;
          for(const stage of job.stages)if(stage.status==='running')stage.status='pending';queue.push(job);
        }else{
          job.status='failed';job.activeStage='Interrupted';job.error='The studio restarted before this job finished. Retry the saved job; repeated recovery is stopped after two attempts.';job.etaSeconds=null;job.finishedAt=Date.now();
          for(const stage of job.stages)if(stage.status==='running')stage.status='failed';
        }
        save(job);
      }
      jobs.set(job.id,job);
    }catch(error){console.error(`Cannot restore studio job ${entry}: ${error.message}`);}
  }
  function log(job,text){job.logs.push(`[${new Date().toLocaleTimeString()}] ${text}`);job.logs=job.logs.slice(-400);}
  function stage(job,id,status,progress){
    job.stages.find(item=>item.id===id).status=status;
    if(status==='running')job.activeStage=job.stages.find(item=>item.id===id).name;
    job.progress=progress;save(job);
  }
  function loadProject(id){
    if(id==='current')return structuredClone(validateProject(sampleProject));
    if(typeof id!=='string'||!id.endsWith('-project.json'))fail('Choose a saved project');
    const data=JSON.parse(fs.readFileSync(localFile(outputDir,id,['.json']),'utf8'));
    return validateProject(data.project??data);
  }
  function listProjects(){
    const describe=(id,project)=>({id,name:id==='current'?'Current reel (approved template)':id.replace(/-project\.json$/,''),captions:project.captions.length,durationSeconds:project.composition.durationFrames/project.composition.fps});
    const result=[describe('current',sampleProject)];
    for(const file of fs.readdirSync(outputDir).filter(file=>file.endsWith('-project.json'))){
      try{result.push(describe(file,loadProject(file)));}catch{/* Invalid drafts cannot be selected. */}
    }
    return result;
  }
  function createJob(request={}){
    if(!request||typeof request!=='object')fail('Invalid job request');
    const paletteKey=request.paletteKey||'crimson-editorial';
    if(!EDITING_STYLES[paletteKey])fail('Unknown palette');
    if(request.scriptText!==undefined&&typeof request.scriptText!=='string')fail('Script must be text');
    if(request.vocabulary!==undefined&&typeof request.vocabulary!=='string')fail('Vocabulary must be text');
    const saved=request.projectId?loadProject(request.projectId):null;
    const source=saved?null:sourceVideo(root,publicVideoDir,request.rawVideoPath);
    storage.check(source?fs.statSync(source).size+256*1048576:256*1048576);
    if(request.overlayEndSeconds!==undefined&&request.overlayEndSeconds!==null&&(!Number.isFinite(request.overlayEndSeconds)||request.overlayEndSeconds<=0))fail('Closing-card time must be a positive number');
    const id='job_'+randomUUID();
    const stem=cleanName(request.customName)+'-'+id.slice(4,12);
    const projectFile=path.join(stateDir,`${id}-project.json`);
    if(saved){
      // Preserve accepted words, all scene timings, portraits, Flow offsets and deliberately sparse effects.
      const theme=EDITING_STYLES[paletteKey];
      saved.theme={...saved.theme,primaryText:theme.primaryText,highlightColor:theme.highlightColor,accentColor:theme.accentColor,pillTextColor:theme.pillTextColor,bgPanel:theme.bgPanel};
      saved.transitions=saved.transitions?.map(transition=>({...transition,color:theme.highlightColor}));
      fs.writeFileSync(projectFile,JSON.stringify({project:validateProject(saved)},null,2));
    }
    const job={id,name:cleanName(request.customName),stem,projectId:request.projectId??null,rawVideoPath:source,paletteKey,
      scriptText:request.scriptText??'',vocabulary:request.vocabulary??'',overlayEndSeconds:request.overlayEndSeconds??null,
      status:'pending',progress:0,etaSeconds:null,activeStage:'Queued',startedAt:null,createdAt:Date.now(),finishedAt:null,
      checkpoints:{prepared:false,transcribed:false,timeline:false,rendered:false},recoveryCount:0,
      stages:[
        {id:1,name:'Source preparation',desc:saved?'Reuse the saved presenter and timeline':'Extract speech audio from this upload',status:'pending'},
        {id:2,name:'Tanglish captions',desc:saved?'Reuse reviewed captions; no retranscription':`Local Whisper ${path.basename(model)} with confidence notes`,status:'pending'},
        {id:3,name:'Timeline preflight',desc:'Validate assets, safe zones, and source ranges',status:'pending'},
        {id:4,name:'Palette',desc:'Apply the selected renderer theme',status:'pending'},
        {id:5,name:'Render',desc:'1080 × 1920 at 30 FPS',status:'pending'},
        {id:6,name:'Finish and verify',desc:'Normalize to −14 LUFS and inspect the encoded output',status:'pending'},
      ],logs:[],warnings:[],error:null,outputFile:null,outputUrl:null,downloadUrl:null,projectFile,
      projectUrl:`/api/jobs/${id}/project`,reviewFile:null,reviewUrl:null,qa:null};
    jobs.set(id,job);save(job);queue.push(job);queueMicrotask(drain);
    return job;
  }
  async function drain(){
    if(running)return;running=true;
    try{while(queue.length)await runPipeline(queue.shift());}finally{running=false;}
  }
  async function runPipeline(job){
    job.status='processing';job.startedAt=Date.now();log(job,`Starting ${job.name}.`);save(job);
    let lastSaved=0;
    const command=(cmd,args,callback)=>execute(cmd,args,line=>{
      log(job,line);callback?.(line);
      if(Date.now()-lastSaved>1000){save(job);lastSaved=Date.now();}
    });
    try{
      storage.check(256*1048576);
      stage(job,1,'running',2);
      if(job.projectId){
        stage(job,1,'completed',15);stage(job,2,'running',15);
        log(job,'Using the saved project. Captions, scene timings and supplied assets are preserved.');
        job.warnings.push('Saved captions reused. Existing transcript review notes still apply.');
        if(job.projectId==='current'){
          const review=path.join(root,'src','demo','nvidiaCaptionReview.json');
          if(fs.existsSync(review))job.reviewFile=review;
        }
        stage(job,2,'completed',35);
      }else{
        const ext=path.extname(job.rawVideoPath).toLowerCase();
        const facecam=path.join(publicVideoDir,`${job.stem}${ext}`);
        const asrWav=path.join(stateDir,`${job.id}-asr.wav`);
        if(!job.checkpoints?.prepared||!fs.existsSync(facecam)||!fs.existsSync(asrWav)){
          fs.copyFileSync(job.rawVideoPath,facecam);
          if(!ffmpeg)ffmpeg=execFileSync(python,['-c','import imageio_ffmpeg; print(imageio_ffmpeg.get_ffmpeg_exe())'],{encoding:'utf8',windowsHide:true}).trim();
          await command(ffmpeg,['-y','-loglevel','error','-i',facecam,'-af','highpass=f=100,lowpass=f=7500,afftdn=nf=-20,loudnorm=I=-16:TP=-1.5:LRA=11','-ar','16000','-ac','1',asrWav]);
          job.checkpoints={...job.checkpoints,prepared:true};save(job);
        }else log(job,'Recovered source preparation checkpoint.');
        stage(job,1,'completed',15);stage(job,2,'running',15);
        const transcript=path.join(stateDir,`${job.id}-transcript.json`);
        const args=[path.join(root,'scripts','transcribe.py'),asrWav,transcript,'--model',model,'--vocabulary',job.vocabulary];
        if(job.scriptText.trim()){
          const script=path.join(stateDir,`${job.id}-script.txt`);fs.writeFileSync(script,job.scriptText,'utf8');args.push('--script',script);
        }
        // Every new input gets its own ASR; never substitute a transcript from another clip.
        if(!job.checkpoints?.transcribed||!fs.existsSync(transcript)){
          await command(python,args);job.checkpoints={...job.checkpoints,transcribed:true};save(job);
        }else log(job,'Recovered this upload’s own transcription; no repeated Whisper call.');
        const asr=JSON.parse(fs.readFileSync(transcript,'utf8'));
        job.reviewFile=transcript;job.reviewUrl=`/api/jobs/${job.id}/review`;
        if(!asr.words?.length)throw new Error('Whisper returned no speech words. Check the audio or retry with a longer narration clip; no captioned export was produced.');
        if(!job.checkpoints?.timeline||!fs.existsSync(job.projectFile)){
        let project=assemble(asr,job.paletteKey);
        project.media.facecam=path.relative(path.join(root,'public'),facecam).split(path.sep).join('/');
        if(job.overlayEndSeconds!==null){
          project.composition.overlayEndFrame=Math.round(job.overlayEndSeconds*project.composition.fps);
          project=applyReelTemplate(project);
        }
        fs.writeFileSync(job.projectFile,JSON.stringify({project:validateProject(project)},null,2));
        job.checkpoints={...job.checkpoints,timeline:true};save(job);
        }
        job.reviewFile=transcript;
        job.warnings.push(`ASR draft: ${(asr.reviewRequired??[]).length} uncertain words flagged. Proofread names and Tanglish before publishing. New people and Flow visuals require a reviewed asset plan.`);
        stage(job,2,'completed',35);
      }
      if(job.reviewFile)job.reviewUrl=`/api/jobs/${job.id}/review`;
      stage(job,3,'running',36);
      const data=JSON.parse(fs.readFileSync(job.projectFile,'utf8'));
      const report=inspectProject(data.project);
      job.warnings.push(...report.warnings);
      if(report.errors.length)throw new Error(report.errors.join('\n'));
      stage(job,3,'completed',40);stage(job,4,'running',40);
      log(job,`Palette: ${job.paletteKey}. ${data.project.captions.length} caption groups; only reviewed edit beats add camera accents or sound.`);
      stage(job,4,'completed',45);stage(job,5,'running',45);
      const render=path.join(outputDir,`${job.stem}-render.mp4`),final=path.join(outputDir,`${job.stem}-final.mp4`);
      storage.check(256*1048576);
      const renderStart=Date.now();
      if(!job.checkpoints?.rendered||!fs.existsSync(render)){
      await command(process.execPath,[path.join(root,'node_modules','@remotion','cli','remotion-cli.js'),'render','src/index.ts','ReelBase',render,`--props=${job.projectFile}`,`--concurrency=${runtimeConfig.concurrency}`,'--crf=18'],line=>{
        const match=line.match(/Rendered\s+(\d+)\s*\/\s*(\d+)/i);
        if(match){const current=Number(match[1]),total=Number(match[2]);job.progress=45+Math.min(44,Math.round(current/total*44));if(current>10)job.etaSeconds=Math.round((Date.now()-renderStart)/1000/current*(total-current));}
      });
      job.checkpoints={...job.checkpoints,rendered:true};save(job);
      }else log(job,'Recovered complete render checkpoint; continuing audio finishing and QA.');
      job.etaSeconds=null;stage(job,5,'completed',90);stage(job,6,'running',91);
      await command(python,[path.join(root,'scripts','finish.py'),render,final]);
      await command(python,[path.join(root,'scripts','qa.py'),final]);
      const qa=JSON.parse(fs.readFileSync(final+'.qa.json','utf8'));
      if(qa.errors?.length)throw new Error(qa.errors.join('\n'));
      job.qa=qa;job.outputFile=path.basename(final);job.outputUrl=`/api/stream/${encodeURIComponent(job.outputFile)}`;job.downloadUrl=`/api/download/${encodeURIComponent(job.outputFile)}`;
      stage(job,6,'completed',100);job.status='completed';job.activeStage='Ready to view and download';job.etaSeconds=0;job.finishedAt=Date.now();log(job,'Full export, audio finishing and QA passed.');save(job);
    }catch(error){
      for(const step of job.stages)if(step.status==='running')step.status='failed';
      job.status='failed';job.error=error.message;job.activeStage='Failed';job.etaSeconds=null;job.finishedAt=Date.now();log(job,job.error);save(job);
    }
  }
  function renameReel(oldFilename,newName){
    const source=localFile(outputDir,oldFilename,['.mp4','.mov','.webm']);
    const newFilename=cleanName(newName)+path.extname(source);
    const target=path.join(outputDir,newFilename);
    if(source!==target&&fs.existsSync(target))fail('A reel with that filename already exists',409);
    if(source!==target){
      for(const suffix of ['.qa.json','.audio.json'])if(fs.existsSync(source+suffix)&&fs.existsSync(target+suffix))fail('A report with that filename already exists',409);
      fs.renameSync(source,target);
      for(const suffix of ['.qa.json','.audio.json'])if(fs.existsSync(source+suffix))fs.renameSync(source+suffix,target+suffix);
    }
    for(const job of jobs.values())if(job.outputFile===oldFilename){job.outputFile=newFilename;job.outputUrl=`/api/stream/${encodeURIComponent(newFilename)}`;job.downloadUrl=`/api/download/${encodeURIComponent(newFilename)}`;save(job);}
    return {oldFilename,newFilename,outputUrl:`/api/stream/${encodeURIComponent(newFilename)}`,downloadUrl:`/api/download/${encodeURIComponent(newFilename)}`};
  }
  function retryJob(id){
    const job=jobs.get(id);if(!job)fail('Render job not found',404);if(job.status!=='failed')fail('Only failed jobs can be retried',409);
    storage.check(256*1048576);job.status='pending';job.error=null;job.finishedAt=null;job.recoveryCount=0;job.checkpoints=job.checkpoints||{};
    for(const item of job.stages)if(item.status==='failed')item.status='pending';save(job);queue.push(job);queueMicrotask(drain);return job;
  }
  if(queue.length)queueMicrotask(drain);
  return {createJob,retryJob,getJob:id=>jobs.get(id),listJobs:()=>[...jobs.values()].sort((a,b)=>b.createdAt-a.createdAt),renameReel,listProjects,loadProject,outputDir,publicVideoDir,root,storage};
}
// Importing helpers for a benchmark must not restore or mutate the live server's jobs.
let singleton;
const current=()=>singleton||(singleton=createPipeline());
module.exports={createPipeline,PALETTES,ROOT,root:ROOT,outputDir:path.join(ROOT,'Output'),publicVideoDir:path.join(ROOT,'public','video'),OUTPUT_DIR:path.join(ROOT,'Output'),PUBLIC_VIDEO_DIR:path.join(ROOT,'public','video')};
for(const name of ['createJob','retryJob','getJob','listJobs','renameReel','listProjects','loadProject'])module.exports[name]=(...args)=>current()[name](...args);
Object.defineProperty(module.exports,'storage',{get:()=>current().storage});
