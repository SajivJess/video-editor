const fs=require('node:fs');
const path=require('node:path');
const {randomUUID}=require('node:crypto');
const {execFileSync}=require('node:child_process');
const {Writable}=require('node:stream');
const {createInterface}=require('node:readline/promises');
const {normalizeDomain,windowsPowerShellEnv,configPath}=require('./share.cjs');

function encryptToken(token){
  // Pass the secret over stdin, never in command arguments or diagnostic output.
  const command="$ErrorActionPreference='Stop'; $plain=[Console]::In.ReadToEnd(); $secret=ConvertTo-SecureString $plain -AsPlainText -Force; ConvertFrom-SecureString $secret";
  try{return execFileSync('powershell.exe',['-NoProfile','-NonInteractive','-Command',command],{
    input:token,encoding:'utf8',env:windowsPowerShellEnv(),windowsHide:true,stdio:['pipe','pipe','pipe'],timeout:10000,
  }).trim();}catch{throw Error('Windows could not encrypt the token. No account settings were replaced.');}
}
function saveSettings(domain,token,{file=configPath(),encrypt=encryptToken}={}){
  const hostname=normalizeDomain(domain);
  if(typeof token!=='string'||token.trim().length<10)throw Error('Enter your ngrok account authtoken.');
  const tokenEncrypted=encrypt(token.trim());
  if(!tokenEncrypted)throw Error('Token encryption returned no value. No settings were replaced.');
  fs.mkdirSync(path.dirname(file),{recursive:true});
  const temporary=file+'.new-'+randomUUID();
  try{
    fs.writeFileSync(temporary,JSON.stringify({domain:hostname,port:4317,tokenEncrypted},null,2),{flag:'wx'});
    fs.renameSync(temporary,file);
  }finally{if(fs.existsSync(temporary))fs.unlinkSync(temporary);}
  return {domain:hostname,file};
}
async function main(){
  if(!process.stdin.isTTY)throw Error('Run npm.cmd run share:setup in an interactive terminal.');
  let muted=false;
  const output=new Writable({write(chunk,encoding,done){if(!muted)process.stdout.write(chunk,encoding);done();}});
  output.columns=process.stdout.columns||80;
  const rl=createInterface({input:process.stdin,output,terminal:true,historySize:0});
  const abort=new AbortController();
  rl.on('SIGINT',()=>abort.abort());
  try{
    const domain=normalizeDomain(await rl.question('Assigned domain from https://dashboard.ngrok.com/domains: ',{signal:abort.signal}));
    process.stdout.write('Ngrok authtoken (hidden): ');
    muted=true;
    const token=await rl.question('',{signal:abort.signal});
    muted=false;process.stdout.write('\n');
    const saved=saveSettings(domain,token);
    console.log('Saved fixed domain: https://'+saved.domain);
    console.log('Token encrypted for your Windows account, outside this repository.');
    console.log('Run npm.cmd run share to start the public dashboard.');
  }finally{muted=false;rl.close();output.end();}
}
if(require.main===module)main().catch(error=>{console.error(error.name==='AbortError'?'Setup cancelled; no settings were replaced.':error.message);process.exitCode=error.name==='AbortError'?130:1;});
module.exports={encryptToken,saveSettings};
