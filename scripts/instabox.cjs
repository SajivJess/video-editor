const fs=require('node:fs'),path=require('node:path');
const {randomUUID,createHash}=require('node:crypto');
const {loadConnection,createClient,assertFree,createPackage}=require('../deploy/instabox/client.cjs');
const ROOT=path.resolve(__dirname,'..'),BASE='/data/reel-studio';
function cloudEnvironment(env=process.env){
  if(!env.GEMINI_API_KEY||(env.STUDIO_PASSWORD||'').length<12)throw Error('Finish npm.cmd run ai:setup before activating the public cloud studio.');
  const names=['GEMINI_API_KEY','GEMINI_API_KEY_2','GEMINI_API_KEY_3','GEMINI_VERIFY_MODEL','GEMINI_WRITE_MODEL','GEMINI_ENABLE_SEARCH','SCRIPT_PROVIDER','OPENROUTER_API_KEY','OPENROUTER_MODEL','STUDIO_PASSWORD','AI_DAILY_REQUEST_LIMIT'];
  const values=Object.fromEntries(names.filter(name=>env[name]!==undefined).map(name=>[name,env[name]]));
  return Object.entries({...values,HOST:'0.0.0.0',PORT:'4317',REQUIRE_AUTH:'true',STUDIO_SECURE_COOKIE:'true',RENDER_CONCURRENCY:'1',WHISPER_THREADS:'4',WHISPER_MODEL:BASE+'/models/large-v3-local',REEL_PYTHON:BASE+'/venv/bin/python',REMOTION_BROWSER_EXECUTABLE:'/usr/bin/chromium',DISK_RESERVE_MB:'2048'}).map(([key,value])=>key+'='+JSON.stringify(value)).join('\n')+'\n';
}
async function ensureMachine(connection,api){
  const data=await api.request('/v1/machines'),machines=Array.isArray(data)?data:data.machines||[];
  const matching=machines.find(machine=>machine.id===connection.config.machineId)||machines.find(machine=>machine.name==='videoeditor')||machines.find(machine=>machine.name===connection.config.machineName);
  if(!matching)throw Error('No designated Free machine found. Create one Free machine in the InstaBox dashboard, name it videoeditor, and rerun. Existing machines are never deleted or upgraded.');
  assertFree(matching);connection.save({machineId:matching.id,machineName:matching.name});
  if(matching.state==='running')return matching;
  const operation=await api.request('/v1/machines/'+matching.id+(matching.state==='stopped'?'/start':'/resume'),{method:'POST',data:{},idempotency:randomUUID()});await api.operation(operation);
  return api.request('/v1/machines/'+matching.id);
}
async function pollBootstrap(api,id,release){
  const deadline=Date.now()+35*60000;let previous='';
  while(Date.now()<deadline){
    try{
      const raw=await api.download(id,BASE+'/bootstrap-status.json');const status=JSON.parse(raw.toString());
      if(status.release===release){if(status.stage!==previous){console.log(status.stage);previous=status.stage;}if(status.state==='failed'){const log=await api.download(id,BASE+'/logs/bootstrap.log');throw Error('Bootstrap failed. Log tail:\n'+log.toString().slice(-4000));}if(['ready','needs_configuration'].includes(status.state))return status;}
    }catch(error){if(error.message.startsWith('Bootstrap failed'))throw error;if(error.code&&!['not_found','missing_file'].includes(error.code))throw error;}
    await api.sleep(15000);
  }
  throw Error('Bootstrap is still running or was interrupted. Use npm.cmd run cloud:status to inspect it; no success was claimed.');
}
async function deploy({prepareOnly=false}={}){
  require('../server/env').loadEnv(ROOT);const connection=loadConnection(),api=createClient(connection.key);
  const config=prepareOnly?null:cloudEnvironment();
  const machine=await ensureMachine(connection,api);console.log('Using Free machine: '+machine.name+' (4 vCPU / 8 GiB)');
  const bundle=createPackage(ROOT),release=BASE+'/releases/'+bundle.release;connection.save({release:bundle.release});
  await api.upload(machine.id,BASE+'/uploads/'+bundle.release+'.tar.gz',fs.readFileSync(bundle.file));
  await api.exec(machine.id,['mkdir','-p',release]);
  const checksum=await api.exec(machine.id,['sha256sum',BASE+'/uploads/'+bundle.release+'.tar.gz']);if(!checksum.stdout.startsWith(bundle.sha256))throw Error('Cloud archive checksum mismatch');
  await api.exec(machine.id,['tar','-xzf',BASE+'/uploads/'+bundle.release+'.tar.gz','-C',release]);
  if(config){
    await api.exec(machine.id,['mkdir','-p',BASE+'/uploads/private']);await api.exec(machine.id,['chmod','700',BASE+'/uploads/private']);
    const incoming=BASE+'/uploads/private/studio.env';await api.upload(machine.id,incoming,Buffer.from(config));
    await api.exec(machine.id,['sudo','install','-D','-o','root','-g','root','-m','600',incoming,BASE+'/config/studio.env']);
    await api.exec(machine.id,['rm','-f',incoming]);
  }
  await api.exec(machine.id,['bash',release+'/deploy/instabox/start-bootstrap.sh',release]);
  const status=await pollBootstrap(api,machine.id,bundle.release);
  if(status.state==='needs_configuration'){console.log('Cloud runtime prepared. Finish npm.cmd run ai:setup, then run npm.cmd run cloud:deploy to activate it.');return;}
  const auth=await api.exec(machine.id,['curl','--fail','--silent','http://127.0.0.1:4317/api/auth/status']);if(JSON.parse(auth.stdout).required!==true)throw Error('Refusing to publish a studio without password protection');
  const port=await api.request('/v1/machines/'+machine.id+'/ports',{method:'POST',data:{port:4317,name:'Sajiv Reel Studio'}});
  const url=port.url||port.publicUrl;if(!url||new URL(url).protocol!=='https:')throw Error('InstaBox did not return a published HTTPS URL; inspect cloud:status.');
  if(connection.config.publicUrl&&connection.config.publicUrl!==url)throw Error('Published URL changed unexpectedly; inspect the existing port instead of replacing it.');
  connection.save({publicUrl:url});const response=await fetch(new URL('/api/auth/status',url),{signal:AbortSignal.timeout(60000)});if(!response.ok||(await response.json()).required!==true)throw Error('Public authentication check failed');
  console.log('Password-protected cloud studio: '+url+'#research');console.log('Deployment is running. Full cloud benchmark and sleep/wake checks are still required.');
}
async function status(){
  const connection=loadConnection(),api=createClient(connection.key);const machines=await api.request('/v1/machines');console.log(JSON.stringify({machines:(Array.isArray(machines)?machines:machines.machines||[]).map(m=>({id:m.id,name:m.name,state:m.state,free:m.free,spec:m.spec,cooldownUntil:m.cooldownUntil})),publicUrl:connection.config.publicUrl||null},null,2));
  if(connection.config.machineId)try{console.log((await api.download(connection.config.machineId,BASE+'/bootstrap-status.json')).toString());}catch(error){console.log(error.message);}
}
async function benchmark(){
  const connection=loadConnection(),api=createClient(connection.key),machine=await ensureMachine(connection,api),release=BASE+'/releases/'+connection.config.release;
  if(!connection.config.release)throw Error('Prepare the cloud runtime first');
  const {sampleProject}=require('./project.cjs');const source=path.join(ROOT,'public',sampleProject.media.facecam);if(!fs.existsSync(source))throw Error('The full benchmark presenter recording is missing');
  const bytes=fs.readFileSync(source),sourceName='benchmark-'+createHash('sha256').update(bytes).digest('hex').slice(0,16)+path.extname(source).toLowerCase();
  const incomingSource=BASE+'/uploads/'+sourceName;await api.upload(machine.id,incomingSource,bytes);
  await api.exec(machine.id,['sudo','install','-o','reelstudio','-g','reelstudio','-m','644',incomingSource,BASE+'/state/video/'+sourceName]);
  for(const relative of ['scripts/cloud-benchmark.cjs','deploy/instabox/start-benchmark.sh','server/pipeline.js']){
    const incoming=BASE+'/uploads/benchmark-'+path.basename(relative);
    await api.upload(machine.id,incoming,fs.readFileSync(path.join(ROOT,relative)));
    await api.exec(machine.id,['sudo','install','-o','reelstudio','-g','reelstudio','-m','644',incoming,release+'/'+relative]);
  }
  const mode=process.argv.includes('--new-video')?'new-video':'saved-project';await api.exec(machine.id,['bash',release+'/deploy/instabox/start-benchmark.sh',release,mode,sourceName]);
  const deadline=Date.now()+95*60000;let previous='';
  while(Date.now()<deadline){
    try{
      const report=JSON.parse((await api.download(machine.id,BASE+'/state/Output/benchmarks/'+mode+'/result.json')).toString());
      if(report.stage!==previous){console.log(report.stage||report.status);previous=report.stage;}
      if(['passed','failed'].includes(report.status)){
        const local=path.join(ROOT,'Output','cloud-benchmark',mode);fs.mkdirSync(local,{recursive:true});fs.writeFileSync(path.join(local,'result.json'),JSON.stringify(report,null,2));
        if(report.status==='failed')throw Error('Cloud benchmark failed: '+report.error);
        for(const [remote,name] of [[report.output,'full-reel.mp4'],[report.contactSheet,'contact-sheet.png']])fs.writeFileSync(path.join(local,name),await api.download(machine.id,remote));
        console.log(JSON.stringify({status:report.status,elapsedSeconds:report.elapsedSeconds,qa:report.qa,artifacts:local,warnings:report.warnings},null,2));return;
      }
    }catch(error){if(error.message.startsWith('Cloud benchmark failed'))throw error;if(error.code&&!['not_found','missing_file'].includes(error.code))throw error;}
    await api.sleep(15000);
  }
  throw Error('Cloud benchmark is still running or interrupted; inspect its result and log before retrying.');
}
async function main(){const command=process.argv[2]||'status';if(command==='package'){const bundle=createPackage(ROOT);console.log(JSON.stringify({file:bundle.file,sha256:bundle.sha256,fileCount:bundle.files.length},null,2));return;}if(command==='prepare')return deploy({prepareOnly:true});if(command==='deploy')return deploy();if(command==='status')return status();if(command==='benchmark')return benchmark();throw Error('Use cloud:prepare, cloud:deploy, cloud:benchmark or cloud:status');}
if(require.main===module)main().catch(error=>{let message=String(error.message);for(const name of ['GEMINI_API_KEY','GEMINI_API_KEY_2','GEMINI_API_KEY_3','OPENROUTER_API_KEY','STUDIO_PASSWORD'])if(process.env[name])message=message.split(process.env[name]).join('[REDACTED]');console.error(message);process.exitCode=1;});
module.exports={cloudEnvironment,ensureMachine,pollBootstrap};
