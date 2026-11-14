const fs=require('node:fs'),path=require('node:path');
const {Writable}=require('node:stream');
const {createInterface}=require('node:readline/promises');
const {encryptToken}=require('./setup-ngrok.cjs');
function cloudConfigFile(){return path.join(process.env.LOCALAPPDATA||path.join(require('node:os').homedir(),'.config'),'SajivReelStudio','instabox.json');}
async function main(){
  if(!process.stdin.isTTY)throw Error('Run npm.cmd run cloud:setup in an interactive terminal.');
  console.log('Create/sign in to your Free account at https://instabox.sh, then create an API key in its dashboard.');
  console.log('The key stays on this PC. It is not uploaded into the studio or included in backups.');
  let muted=false;const output=new Writable({write(chunk,encoding,done){if(!muted)process.stdout.write(chunk,encoding);done();}});output.columns=process.stdout.columns||80;
  const rl=createInterface({input:process.stdin,output,terminal:true,historySize:0}),abort=new AbortController();rl.on('SIGINT',()=>abort.abort());
  try{
    process.stdout.write('InstaBox API key (hidden): ');muted=true;
    const key=(await rl.question('',{signal:abort.signal})).trim();muted=false;process.stdout.write('\n');
    if(!key.startsWith('ibk_')||key.length<20)throw Error('Enter the account API key beginning ibk_.');
    const value=process.platform==='win32'?{apiKeyEncrypted:encryptToken(key)}:{apiKey:key};
    const file=cloudConfigFile();fs.mkdirSync(path.dirname(file),{recursive:true});fs.writeFileSync(file+'.tmp',JSON.stringify({...value,machineName:'sajiv-reel-studio'},null,2),{mode:0o600});fs.renameSync(file+'.tmp',file);
    console.log('Saved private InstaBox connection.');
  }finally{muted=false;rl.close();output.end();}
  require('../server/env').loadEnv();
  if(!process.env.GEMINI_API_KEY||!process.env.STUDIO_PASSWORD){console.log('Now configure the studio API key and password.');await require('./setup-ai.cjs').main();}
  console.log('Configuration complete. Reply "cloud configured" so deployment and benchmarking can begin.');
}
if(require.main===module)main().catch(error=>{console.error(error.name==='AbortError'?'Setup cancelled.':error.message);process.exitCode=1;});
module.exports={cloudConfigFile};
