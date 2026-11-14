/** Runs on the cloud machine. Actual full-length rendering, finishing and encoded QA. */
const fs=require('node:fs'),path=require('node:path'),os=require('node:os');
const {execFileSync}=require('node:child_process');
const {randomUUID}=require('node:crypto');
const {createPipeline,ROOT}=require('../server/pipeline');
const {createApp}=require('../server/index');
const {sampleProject}=require('./project.cjs');
async function main(){
  const label=process.argv.includes('--new-video')?'new-video':'saved-project';
  const directory=path.join(ROOT,'Output','benchmarks',label);fs.mkdirSync(directory,{recursive:true});
  const resultFile=path.join(directory,'result.json');
  const sourceArg=process.argv.indexOf('--source'),sourceName=sourceArg>=0?process.argv[sourceArg+1]:path.basename(sampleProject.media.facecam);
  if(!/^[a-zA-Z0-9_.-]+\.(mp4|mov|webm)$/.test(sourceName))throw Error('Invalid benchmark source filename');
  const project=structuredClone(sampleProject);project.media.facecam='video/'+sourceName;
  fs.writeFileSync(path.join(directory,'benchmark-project.json'),JSON.stringify({project}));
  const engine=createPipeline({root:ROOT,outputDir:directory}),password=randomUUID()+randomUUID();
  const server=createApp(engine,{auth:{password}}).listen(0,'127.0.0.1');await new Promise(resolve=>server.once('listening',resolve));
  const base='http://127.0.0.1:'+server.address().port,started=Date.now();let minimumFree=os.freemem();const timer=setInterval(()=>{minimumFree=Math.min(minimumFree,os.freemem());},2000);
  const report={kind:label,host:os.hostname(),platform:process.platform,arch:process.arch,totalRamBytes:os.totalmem(),cpuCount:os.cpus().length,status:'running',startedAt:new Date().toISOString()};
  const save=()=>fs.writeFileSync(resultFile,JSON.stringify(report,null,2));save();
  try{
    const logged=await fetch(base+'/api/auth/login',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({password})});if(!logged.ok)throw Error('Benchmark authentication failed');
    const cookie=logged.headers.get('set-cookie').split(';')[0],headers={'Content-Type':'application/json',Cookie:cookie};
    const source=path.join(ROOT,'public','video',sourceName);
    const input=label==='new-video'?{rawVideoPath:source,customName:'cloud-full-new',paletteKey:'crimson-editorial',overlayEndSeconds:(sampleProject.composition.overlayEndFrame||sampleProject.composition.durationFrames)/30,vocabulary:'Jensen Huang, Kimberly Powell, NVIDIA, GPU, GTC, AI'}:{projectId:'benchmark-project.json',customName:'cloud-full-approved',paletteKey:'crimson-editorial'};
    const queued=await fetch(base+'/api/generate',{method:'POST',headers,body:JSON.stringify(input)});if(queued.status!==202)throw Error('Render creation failed: '+await queued.text());
    const initial=await queued.json();let job,last='';
    const deadline=Date.now()+90*60000;
    while(true){
      job=engine.getJob(initial.job.id);if(job.activeStage!==last){console.log(job.activeStage);last=job.activeStage;report.stage=last;save();}
      if(['completed','failed'].includes(job.status))break;if(Date.now()>deadline)throw Error('Benchmark exceeded 90 minutes');await new Promise(resolve=>setTimeout(resolve,2000));
    }
    if(job.status!=='completed')throw Error(job.error);
    const python=process.env.REEL_PYTHON||'python3',ffmpeg=execFileSync(python,['-c','import imageio_ffmpeg; print(imageio_ffmpeg.get_ffmpeg_exe())'],{encoding:'utf8'}).trim();
    const count=sampleProject.composition.durationFrames;
    const frames=[0,count-1,...sampleProject.graphics.filter(g=>g.type==='person-pictorial').map(g=>g.startFrame+4),...(sampleProject.transitions||[]).map(t=>Math.floor((t.startFrame+t.endFrame)/2))];
    for(let n=1;new Set(frames).size<12;n++)frames.push(Math.floor(n*count/13));
    const selected=[...new Set(frames)].filter(n=>n>=0&&n<count).sort((a,b)=>a-b).slice(0,12),contact=path.join(directory,'contact-sheet.png');
    execFileSync(ffmpeg,['-y','-loglevel','error','-i',path.join(directory,job.outputFile),'-vf',"select='"+selected.map(n=>`eq(n,${n})`).join('+')+"',scale=270:480,tile=4x3",'-frames:v','1',contact],{windowsHide:true});
    report.status='passed';report.qa=job.qa;report.output=path.join(directory,job.outputFile);report.projectFile=job.projectFile;report.reviewFile=job.reviewFile;report.warnings=job.warnings;report.contactSheet=contact;report.elapsedSeconds=Math.round((Date.now()-started)/1000);report.peakObservedSystemUsedBytes=os.totalmem()-minimumFree;save();console.log(JSON.stringify(report,null,2));
  }catch(error){report.status='failed';report.error=error.message;save();throw error;}finally{clearInterval(timer);await new Promise(resolve=>server.close(resolve));}
}
if(require.main===module)main().catch(error=>{console.error(error.message);process.exitCode=1;});
