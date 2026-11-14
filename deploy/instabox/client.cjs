const fs=require('node:fs'),path=require('node:path');
const {randomUUID,createHash}=require('node:crypto');
const {execFileSync}=require('node:child_process');
const {windowsPowerShellEnv}=require('../../scripts/share.cjs');
const {cloudConfigFile}=require('../../scripts/setup-instabox.cjs');
function loadConnection(env=process.env){
  const file=cloudConfigFile();let config={};if(fs.existsSync(file))try{config=JSON.parse(fs.readFileSync(file,'utf8'));}catch{throw Error('Invalid private InstaBox configuration; run npm.cmd run cloud:setup again.');}
  let key=env.INSTABOX_API_KEY||config.apiKey;
  if(!key&&config.apiKeyEncrypted){
    const command="$c=Get-Content -Raw -LiteralPath $env:REEL_CLOUD_CONFIG | ConvertFrom-Json; $s=ConvertTo-SecureString $c.apiKeyEncrypted; [Console]::Write((New-Object System.Management.Automation.PSCredential('instabox',$s)).GetNetworkCredential().Password)";
    try{key=execFileSync('powershell.exe',['-NoProfile','-NonInteractive','-Command',command],{encoding:'utf8',env:{...windowsPowerShellEnv(),REEL_CLOUD_CONFIG:file},windowsHide:true,stdio:['ignore','pipe','pipe']}).trim();}catch{throw Error('Cannot unlock the local InstaBox key; run cloud:setup in the same Windows account.');}
  }
  if(!key)throw Error('Connect your Free InstaBox account first: npm.cmd run cloud:setup');
  return {key,get config(){return config;},file,save:patch=>{config={...config,...patch};fs.mkdirSync(path.dirname(file),{recursive:true});fs.writeFileSync(file+'.tmp',JSON.stringify(config,null,2),{mode:0o600});fs.renameSync(file+'.tmp',file);}};
}
function createClient(key,{fetcher=fetch,sleep=ms=>new Promise(resolve=>setTimeout(resolve,ms))}={}){
  const sanitize=value=>String(value).split(key).join('[REDACTED]');
  async function request(route,{method='GET',data,bytes,idempotency,timeout=45000,raw=false}={}){
    let response;try{response=await fetcher('https://api.instabox.sh'+route,{method,headers:{'X-API-Key':key,'Content-Type':bytes?'application/octet-stream':'application/json',...(idempotency?{'Idempotency-Key':idempotency}:{})},body:bytes|| (data===undefined?undefined:JSON.stringify(data)),signal:AbortSignal.timeout(timeout)});}catch(error){throw Error('InstaBox connection failed: '+sanitize(error.message));}
    if(!response.ok){let detail;try{detail=await response.json();}catch{}const error=Error('InstaBox '+(detail?.error?.code||response.status)+': '+sanitize(detail?.error?.message||response.statusText));error.code=detail?.error?.code;error.retryAfter=Number(response.headers.get('retry-after')||detail?.error?.retryAfterSeconds||0);throw error;}
    if(response.status===204)return null;return !raw&&response.headers.get('content-type')?.includes('json')?response.json():Buffer.from(await response.arrayBuffer());
  }
  async function operation(value){
    let current=value;const deadline=Date.now()+10*60000;
    while(!['succeeded','failed'].includes(current.state)){if(Date.now()>deadline)throw Error('InstaBox operation did not finish in ten minutes; re-run cloud:status before retrying.');current=await request('/v1/operations/'+encodeURIComponent(current.id)+'?wait=25s');}
    if(current.state==='failed')throw Error('InstaBox operation failed: '+sanitize(current.error?.message||'unknown'));return current;
  }
  async function exec(id,argv,timeoutSeconds=60){
    const result=await request('/v1/machines/'+encodeURIComponent(id)+'/exec',{method:'POST',data:{argv,timeoutSeconds,noHistory:true},timeout:(timeoutSeconds+30)*1000});
    if(result.exitCode!==0)throw Error('Remote command failed ('+result.exitCode+'): '+sanitize((result.stderr||result.stdout||'').slice(-2000)));return result;
  }
  async function upload(id,target,bytes){return request('/v1/machines/'+encodeURIComponent(id)+'/files?path='+encodeURIComponent(target)+'&parents=true',{method:'PUT',bytes,timeout:120000});}
  async function download(id,target){return request('/v1/machines/'+encodeURIComponent(id)+'/files/content?path='+encodeURIComponent(target),{raw:true,timeout:120000});}
  return {request,operation,exec,upload,download,sleep};
}
function assertFree(machine){if(machine.free!==true)throw Error('Refusing to deploy: this machine is not explicitly marked Free by InstaBox. No paid upgrade was requested.');if(machine.spec&&(machine.spec.vcpus!==4||machine.spec.memMiB!==8192))throw Error('Unexpected machine size; expected Free 4 vCPU / 8 GiB.');}
function packageFiles(root){
  const files=[];const roots=['src','server','dashboard','scripts','deploy','tests','prompts','templates','public/fonts','public/images','public/logos','public/audio'];
  const walk=relative=>{const full=path.join(root,relative),stat=fs.lstatSync(full);if(stat.isSymbolicLink())throw Error('Deployment source contains a symlink: '+relative);if(stat.isDirectory()){for(const name of fs.readdirSync(full)){if(['node_modules','__pycache__','.git','.venv'].includes(name))continue;walk(path.posix.join(relative.replace(/\\/g,'/'),name));}}else if(stat.isFile()&&!relative.endsWith('.map')&&!relative.endsWith('.pyc')&&!path.basename(relative).startsWith('.env')&&!/\.(key|pem|log)$/i.test(relative))files.push(relative.replace(/\\/g,'/'));};
  for(const item of roots)if(fs.existsSync(path.join(root,item)))walk(item);
  for(const name of ['package.json','package-lock.json','tsconfig.json','remotion.config.ts','requirements-transcription.txt','README.md','instructions.md','AGENTS.md','.env.example'])if(fs.existsSync(path.join(root,name)))files.push(name);
  return [...new Set(files)].sort();
}
function createPackage(root){
  const directory=path.join(root,'Output','deployment');fs.mkdirSync(directory,{recursive:true});
  const files=packageFiles(root),manifest=path.join(directory,'files.list');fs.writeFileSync(manifest,files.join('\0')+'\0');
  const temporary=path.join(directory,'studio-package.tar.gz');execFileSync('tar',['-czf',temporary,'--null','-T',manifest],{cwd:root,windowsHide:true});
  const sha256=createHash('sha256').update(fs.readFileSync(temporary)).digest('hex'),file=path.join(directory,'studio-'+sha256.slice(0,16)+'.tar.gz');fs.renameSync(temporary,file);
  fs.writeFileSync(file+'.manifest.json',JSON.stringify({sha256,files},null,2));return {file,sha256,release:sha256.slice(0,16),files};
}
module.exports={loadConnection,createClient,assertFree,packageFiles,createPackage};
