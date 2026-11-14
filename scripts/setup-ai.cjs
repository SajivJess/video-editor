const fs=require('node:fs'),path=require('node:path');
const {Writable}=require('node:stream');
const {createInterface}=require('node:readline/promises');
const {parseEnv}=require('node:util');
async function main(){
  if(!process.stdin.isTTY)throw Error('Run npm.cmd run ai:setup in your interactive terminal.');
  let muted=false;const output=new Writable({write(chunk,encoding,done){if(!muted)process.stdout.write(chunk,encoding);done();}});output.columns=process.stdout.columns||80;
  const rl=createInterface({input:process.stdin,output,terminal:true,historySize:0}),abort=new AbortController();rl.on('SIGINT',()=>abort.abort());
  const ask=label=>rl.question(label,{signal:abort.signal});
  const secret=async label=>{process.stdout.write(label);muted=true;try{return (await ask('')).trim();}finally{muted=false;process.stdout.write('\n');}};
  try{
    console.log('One-time standalone AI setup. Keys stay on this computer, outside the browser and chat.');
    const key=await secret('Gemini API key from Google AI Studio (hidden): ');if(key.length<20)throw Error('Enter a valid Gemini API key.');
    const key2=await secret('Gemini API key 2, optional; Enter to skip (hidden): ');
    const key3=key2?await secret('Gemini API key 3, optional; Enter to skip (hidden): '):'';
    if([key2,key3].some(value=>value&&value.length<20))throw Error('Optional Gemini keys must be valid API keys.');
    const openrouter=(await ask('Use an OpenRouter :free model for script writing? [y/N]: ')).trim().toLowerCase()==='y';
    let routerKey='',routerModel='';
    if(openrouter){routerKey=await secret('OpenRouter API key (hidden): ');routerModel=(await ask('OpenRouter model [google/gemma-4-31b-it:free]: ')).trim()||'google/gemma-4-31b-it:free';if(routerKey.length<20||!routerModel.endsWith(':free'))throw Error('An OpenRouter key and explicit :free model are required.');}
    console.log('Google Search grounding may require billing for your chosen model; supplied article-page retrieval is the default.');
    const search=(await ask('Enable Google Search grounding after checking your API pricing? [y/N]: ')).trim().toLowerCase()==='y';
    let password;
    while(true){
      password=await secret('Choose studio password, 12+ characters (hidden): ');
      if(password.length<12){console.log('That password is too short. Use at least 12 characters; your earlier entries are retained.');continue;}
      if(await secret('Confirm studio password (hidden): ')!==password){console.log('Passwords did not match. Try the password again; your API entries are retained.');continue;}
      break;
    }
    const file=process.env.LOCALAPPDATA?path.join(process.env.LOCALAPPDATA,'SajivReelStudio','ai.env'):path.resolve(__dirname,'..','.env');
    const previous=fs.existsSync(file)?parseEnv(fs.readFileSync(file,'utf8')):{};
    const config={...previous,GEMINI_API_KEY:key,GEMINI_API_KEY_2:key2,GEMINI_API_KEY_3:key3,GEMINI_VERIFY_MODEL:'gemini-3.5-flash-lite',GEMINI_WRITE_MODEL:'gemini-3.5-flash-lite',SCRIPT_PROVIDER:openrouter?'openrouter':'gemini',OPENROUTER_API_KEY:routerKey,OPENROUTER_MODEL:routerModel,GEMINI_ENABLE_SEARCH:String(search),STUDIO_PASSWORD:password,AI_DAILY_REQUEST_LIMIT:'30',PORT:'4317',RENDER_CONCURRENCY:'1',WHISPER_THREADS:'2'};
    fs.mkdirSync(path.dirname(file),{recursive:true});fs.writeFileSync(file+'.tmp',Object.entries(config).map(([k,v])=>k+'='+JSON.stringify(v)).join('\n')+'\n',{mode:0o600});fs.renameSync(file+'.tmp',file);if(process.platform!=='win32')fs.chmodSync(file,0o600);
    console.log('Saved private API configuration: '+file);
    console.log('Restart the studio. Your studio password will protect the dashboard, media and API jobs.');
    console.log('Use npm.cmd run share for ngrok, or npm.cmd run standalone for localhost.');
  }finally{muted=false;rl.close();output.end();}
}
if(require.main===module)main().catch(error=>{console.error(error.name==='AbortError'?'Setup cancelled.':error.message);process.exitCode=1;});
module.exports={main};
