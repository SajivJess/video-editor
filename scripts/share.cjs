const fs=require('node:fs');
const path=require('node:path');
const {execFileSync}=require('node:child_process');

const ROOT=path.resolve(__dirname,'..');
function configPath(env=process.env){
  return env.REEL_NGROK_CONFIG||path.join(env.LOCALAPPDATA||path.join(require('node:os').homedir(),'.config'),'SajivReelStudio','ngrok.json');
}
function windowsPowerShellEnv(env=process.env){
  // Windows PowerShell must not auto-import PowerShell 7's incompatible modules.
  return {...Object.fromEntries(Object.entries(env).filter(([key])=>key.toLowerCase()!=='psmodulepath')),
    PSModulePath:path.join(env.SystemRoot||env.WINDIR||'C:\\Windows','System32','WindowsPowerShell','v1.0','Modules')};
}
function normalizeDomain(value){
  if(!value||typeof value!=='string')throw Error('Set up your fixed ngrok domain first: npm.cmd run share:setup');
  let url;try{url=new URL(value.includes('://')?value.trim():'https://'+value.trim());}catch{throw Error('Invalid ngrok domain');}
  if(url.protocol!=='https:'||url.username||url.password||url.port||url.pathname!=='/'||url.search||url.hash||
    !/^(?:[a-z0-9](?:[a-z0-9-]*[a-z0-9])?\.)+[a-z][a-z0-9-]*$/i.test(url.hostname)||url.hostname.endsWith('.localhost')){
    throw Error('Use your assigned HTTPS domain without a path, port or credentials');
  }
  return url.hostname;
}
function decryptToken(file){
  // The decrypted value stays in this process; it is never a command argument or log.
  const command="$settings=Get-Content -LiteralPath $env:REEL_NGROK_CONFIG -Raw | ConvertFrom-Json; $secret=ConvertTo-SecureString $settings.tokenEncrypted; $credential=New-Object System.Management.Automation.PSCredential('ngrok',$secret); [Console]::Write($credential.GetNetworkCredential().Password)";
  try{return execFileSync('powershell.exe',['-NoProfile','-NonInteractive','-Command',command],{
    env:{...windowsPowerShellEnv(),REEL_NGROK_CONFIG:file},encoding:'utf8',windowsHide:true,stdio:['ignore','pipe','pipe'],timeout:10000,
  }).trim();}catch{throw Error('Cannot decrypt your ngrok token. Run npm.cmd run share:setup in this Windows account.');}
}
function settings(env=process.env,decrypt=decryptToken){
  const file=configPath(env);
  let stored={};
  if(fs.existsSync(file)){try{stored=JSON.parse(fs.readFileSync(file,'utf8').replace(/^\uFEFF/,''));}catch{throw Error('Invalid ngrok settings file; run npm.cmd run share:setup again.');}}
  const domain=normalizeDomain(env.NGROK_DOMAIN||stored.domain);
  const port=Number(env.REEL_SHARE_PORT||stored.port||4317);
  if(!Number.isInteger(port)||port<1024||port>65535)throw Error('Sharing port must be an integer from 1024 to 65535');
  const token=(env.NGROK_AUTHTOKEN||(stored.tokenEncrypted?decrypt(file):'')).trim();
  if(!token)throw Error('Ngrok account not connected. Run npm.cmd run share:setup first.');
  return {domain,port,token};
}
function redact(error,token){return String(error?.message||error).split(token||'\0').join('[REDACTED]');}
function expectedUrl(listener,domain){
  const value=listener.url();
  if(!value||new URL(value).origin!=='https://'+domain)throw Error('Ngrok returned a different URL; refusing to switch away from your saved domain.');
  return new URL(value).origin;
}
async function health(url){
  const response=await fetch(url+'/api/health',{signal:AbortSignal.timeout(5000),headers:{'ngrok-skip-browser-warning':'1'}});
  if(!response.ok)throw Error('Dashboard health check returned HTTP '+response.status);
  const body=await response.json();if(body.status!=='online'||typeof body.palettes!=='number')throw Error('The selected port is occupied by another application.');
  return body;
}
async function run(){
  require('../server/env').loadEnv(ROOT);
  const config=settings();
  const ngrok=require('@ngrok/ngrok');
  let localServer,listener,keepAlive;
  const localUrl='http://127.0.0.1:'+config.port;
  const close=async()=>{clearInterval(keepAlive);if(listener)await listener.close().catch(()=>{});await ngrok.disconnect().catch(()=>{});if(localServer)await new Promise(resolve=>localServer.close(resolve));};
  try{
    try{await health(localUrl);}catch(error){
      // Only start on a free port; a bind error never stops/replaces another app.
      const {createApp}=require('../server/index');
      localServer=await new Promise((resolve,reject)=>{const server=createApp().listen(config.port,'127.0.0.1',()=>resolve(server));server.once('error',reject);});
      await health(localUrl);
    }
    console.log('Local dashboard: '+localUrl);
    console.log('Connecting saved domain: https://'+config.domain);
    listener=await ngrok.forward({addr:'127.0.0.1:'+config.port,authtoken:config.token,domain:config.domain});
    const publicUrl=expectedUrl(listener,config.domain);
    await health(publicUrl);
    const directory=path.join(ROOT,'Output');fs.mkdirSync(directory,{recursive:true});
    fs.writeFileSync(path.join(directory,'sharing-status.json'),JSON.stringify({url:publicUrl,localUrl,verifiedAt:new Date().toISOString(),pid:process.pid},null,2));
    console.log('Public dashboard verified: '+publicUrl+'/#research');
    console.log('This domain stays fixed across restarts. Keep this process and the laptop online. Ctrl+C stops sharing.');
    keepAlive=setInterval(()=>{},60000);
    for(const signal of ['SIGINT','SIGTERM'])process.once(signal,()=>{close().finally(()=>process.exit(0));});
  }catch(error){await close();throw Error(redact(error,config.token));}
}
if(require.main===module)run().catch(error=>{console.error(error.message);process.exitCode=1;});
module.exports={normalizeDomain,settings,expectedUrl,redact,windowsPowerShellEnv,configPath};
