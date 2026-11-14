/** Real HTTP -> Remotion -> audio finishing -> encoded QA. No Whisper substitution or fake export. */
const fs=require('node:fs');
const os=require('node:os');
const path=require('node:path');
const assert=require('node:assert/strict');
const {execFileSync}=require('node:child_process');
const {createPipeline,ROOT}=require('../server/pipeline');
const {createApp}=require('../server/index');
const {sampleProject,validateProject,applyReelTemplate}=require('./project.cjs');

(async()=>{
  const outputDir=fs.mkdtempSync(path.join(os.tmpdir(),'reel-studio-render-'));
  const source=structuredClone(sampleProject);
  const duration=90;
  source.composition.durationFrames=duration;source.composition.overlayEndFrame=duration;
  source.captions=source.captions.filter(c=>c.endFrame<=duration);
  source.graphics=source.graphics.filter(g=>g.startFrame<duration).map(g=>({...g,endFrame:Math.min(duration,g.endFrame)}));
  source.visuals=[];source.interstitials=[];source.editBeats=[];source.media.sfx=[];
  const project=validateProject(applyReelTemplate(source));
  fs.writeFileSync(path.join(outputDir,'smoke-project.json'),JSON.stringify({project}));
  const newVideo=process.argv.includes('--new-video');
  const engine=createPipeline({root:ROOT,outputDir,publicVideoDir:path.join(ROOT,'public','video','studio-tests')});
  const server=createApp(engine).listen(0,'127.0.0.1');
  await new Promise(resolve=>server.once('listening',resolve));
  const base=`http://127.0.0.1:${server.address().port}`;
  try{
    let input={projectId:'smoke-project.json',customName:'dashboard-smoke',paletteKey:'hyperion-gold'};
    if(newVideo){
      const python=path.join(ROOT,'.venv','Scripts','python.exe');
      const ffmpeg=execFileSync(python,['-c','import imageio_ffmpeg; print(imageio_ffmpeg.get_ffmpeg_exe())'],{encoding:'utf8',windowsHide:true}).trim();
      const clip=path.join(outputDir,'test-source.mp4');
      execFileSync(ffmpeg,['-y','-loglevel','error','-ss','9','-i',path.join(ROOT,'public','video','nvidia.mp4'),'-t','12','-c:v','libx264','-preset','ultrafast','-crf','25','-c:a','aac',clip],{windowsHide:true});
      const form=new FormData();form.append('video',new Blob([fs.readFileSync(clip)],{type:'video/mp4'}),'test-source.mp4');
      const uploaded=await fetch(base+'/api/upload',{method:'POST',body:form});assert.equal(uploaded.status,201);
      input={rawVideoPath:(await uploaded.json()).path,customName:'dashboard-smoke',paletteKey:'hyperion-gold',vocabulary:'ChatGPT, Gemini, Claude'};
    }
    const response=await fetch(base+'/api/generate',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(input)});
    assert.equal(response.status,202);const {job:initial}=await response.json();
    let job,lastStage='';
    const deadline=Date.now()+300000;
    do{
      job=await (await fetch(base+`/api/jobs/${initial.id}`)).json();
      if(job.activeStage!==lastStage){console.log(job.activeStage);lastStage=job.activeStage;}
      if(!['pending','processing'].includes(job.status))break;
      if(Date.now()>deadline)throw Error('Smoke render exceeded five minutes');
      await new Promise(resolve=>setTimeout(resolve,1000));
    }while(true);
    assert.equal(job.status,'completed',job.error);assert.equal(job.progress,100);assert.deepEqual(job.qa.errors,[]);
    const streamed=await fetch(base+job.outputUrl,{headers:{Range:'bytes=0-1023'}});assert.equal(streamed.status,206);assert.equal((await streamed.arrayBuffer()).byteLength,1024);
    assert.equal((await fetch(base+job.projectUrl)).status,200);
    console.log(JSON.stringify({output:path.join(outputDir,job.outputFile),qa:job.qa},null,2));
  }finally{await new Promise(resolve=>server.close(resolve));}
})().catch(error=>{console.error(error);process.exitCode=1;});
