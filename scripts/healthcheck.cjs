const fs=require('node:fs'),path=require('node:path');
require('../server/env').loadEnv();
async function main(){
  const output=path.resolve(__dirname,'../Output'),file=path.join(output,'.studio','health-history.json');
  const record={at:new Date().toISOString(),healthy:false,freeBytes:null,error:null};
  try{const response=await fetch('http://127.0.0.1:'+(process.env.PORT||4317)+'/api/health',{signal:AbortSignal.timeout(10000)});record.healthy=response.ok&&(await response.json()).status==='online';if(!record.healthy)record.error='Studio health endpoint is unavailable';}catch(error){record.error=error.message;}
  try{const stat=fs.statfsSync(output);record.freeBytes=stat.bavail*stat.bsize;if(record.freeBytes<Number(process.env.DISK_RESERVE_MB||2048)*1048576){record.healthy=false;record.error='Disk reserve reached';}}catch(error){record.healthy=false;record.error=error.message;}
  fs.mkdirSync(path.dirname(file),{recursive:true});let history=[];if(fs.existsSync(file))try{history=JSON.parse(fs.readFileSync(file));}catch{}
  history.unshift(record);fs.writeFileSync(file+'.tmp',JSON.stringify(history.slice(0,100),null,2));fs.renameSync(file+'.tmp',file);
  console.log(JSON.stringify(record));if(!record.healthy)process.exitCode=1;
}
if(require.main===module)main().catch(error=>{console.error(error.message);process.exitCode=1;});
