const fs=require('node:fs'),path=require('node:path'),os=require('node:os');
const {spawnSync}=require('node:child_process');
require('../server/env').loadEnv();
const root=path.resolve(__dirname,'..'),{runtime}=require('../server/runtime');
function inspect(){
  const config=runtime(root),checks=[];
  const add=(name,ok,detail,required=true)=>checks.push({name,ok,detail,required});
  add('Node.js',Number(process.versions.node.split('.')[0])>=24,process.version);
  const py=spawnSync(config.python,['-c','import json, av, faster_whisper, imageio_ffmpeg; print(json.dumps({"ffmpeg":imageio_ffmpeg.get_ffmpeg_exe(),"pyav":av.__version__}))'],{encoding:'utf8',windowsHide:true,timeout:30000});
  add('Python / Whisper / FFmpeg / PyAV',py.status===0,py.status===0?'All required imports available':'Install requirements-transcription.txt in the configured Python environment');
  const chrome=process.env.REMOTION_BROWSER_EXECUTABLE||(process.platform==='win32'?'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe':'/usr/bin/chromium');add('Chromium',fs.existsSync(chrome),chrome);
  add('RAM',os.totalmem()>=7*1024**3,Math.round(os.totalmem()/1024**3)+' GiB detected');
  const out=path.join(root,'Output');try{const stat=fs.statfsSync(fs.existsSync(out)?out:root),free=stat.bavail*stat.bsize;add('Disk reserve',free>=Number(process.env.DISK_RESERVE_MB||2048)*1048576,(free/1024**3).toFixed(1)+' GiB free');}catch{add('Disk reserve',false,'Cannot inspect filesystem');}
  add('Studio password',(process.env.STUDIO_PASSWORD||'').length>=12,process.env.STUDIO_PASSWORD?'Configured':'Not configured');
  add('Gemini API',Boolean(process.env.GEMINI_API_KEY),process.env.GEMINI_API_KEY?'Key present; live verification still required':'Not configured');
  add('Render worker',config.concurrency===1,'Concurrency '+config.concurrency);
  add('Whisper model',true,path.basename(config.model)+' CPU int8');
  return {ok:checks.every(c=>!c.required||c.ok),platform:process.platform,arch:process.arch,checks};
}
if(require.main===module){const report=inspect();console.log(JSON.stringify(report,null,2));if(!report.ok)process.exitCode=1;}
module.exports={inspect};
