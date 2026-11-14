const test=require('node:test'),assert=require('node:assert/strict');
const fs=require('node:fs'),path=require('node:path'),os=require('node:os');
const {spawnSync}=require('node:child_process');
const express=require('express');
const {installAuth}=require('../server/auth');
const {createStorage}=require('../server/storage');
const {createProvider}=require('../server/ai-provider');
const {createAutomation,validateDossier,validateScript}=require('../server/automation');
const {publicAddress,evidenceUrl,fetchPage,collectEvidence}=require('../server/evidence');
const {assertFree,packageFiles,createClient}=require('../deploy/instabox/client.cjs');
const {cloudEnvironment,ensureMachine}=require('../scripts/instabox.cjs');
function temporary(t){const root=fs.mkdtempSync(path.join(os.tmpdir(),'reel-standalone-test-'));t.after(()=>{assert.equal(path.dirname(root),os.tmpdir());assert.ok(path.basename(root).startsWith('reel-standalone-test-'));fs.rmSync(root,{recursive:true,force:true});});return root;}
const env=()=>({GEMINI_API_KEY:'fake-google-key-one-for-unit-test',GEMINI_API_KEY_2:'fake-google-key-two-for-unit-test',GEMINI_API_KEY_3:'fake-google-key-three-for-unit-test',STUDIO_PASSWORD:'fixture-password-long-enough'});
const answer=(text='{}')=>new Response(JSON.stringify({candidates:[{finishReason:'STOP',content:{parts:[{text}]}}]}),{headers:{'content-type':'application/json'}});

test('Studio authentication protects all data, validates origin, and invalidates logout cookies',async t=>{
  const app=express();app.use(express.json());installAuth(app,{password:'fixture-password-long-enough',required:true});app.get('/api/health',(req,res)=>res.json({status:'online'}));app.get('/api/media',(req,res)=>res.json({private:true}));app.post('/api/change',(req,res)=>res.json({ok:true}));
  const server=app.listen(0,'127.0.0.1');await new Promise(resolve=>server.once('listening',resolve));t.after(()=>new Promise(resolve=>server.close(resolve)));const base='http://127.0.0.1:'+server.address().port;
  assert.equal((await fetch(base+'/api/media')).status,401);assert.equal((await fetch(base+'/api/health')).status,200);
  const login=await fetch(base+'/api/auth/login',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({password:'fixture-password-long-enough'})});assert.equal(login.status,200);const cookie=login.headers.get('set-cookie');assert.match(cookie,/HttpOnly/);assert.match(cookie,/SameSite=Strict/);
  const headers={Cookie:cookie.split(';')[0]};assert.equal((await fetch(base+'/api/media',{headers})).status,200);
  assert.equal((await fetch(base+'/api/change',{method:'POST',headers:{...headers,Origin:'https://other.example'}})).status,403);
  await fetch(base+'/api/auth/logout',{method:'POST',headers});assert.equal((await fetch(base+'/api/media',{headers})).status,401);
  assert.throws(()=>installAuth(express(),{password:'short',required:true}),/12 characters/);
});

test('Disk reservations prevent concurrent uploads from consuming the recovery reserve',t=>{
  const root=temporary(t),gb=1024**3;const storage=createStorage({directory:root,reserveMb:2048,probe:()=>({bavail:5*gb,bsize:1,blocks:20*gb})});
  const release=storage.reserve(2*gb);assert.throws(()=>storage.reserve(2*gb),error=>error.status===507&&/no files were deleted/.test(error.message));release();release();assert.equal(storage.snapshot().reservedBytes,0);assert.doesNotThrow(()=>storage.check(2*gb));
});

test('Gemini quota failover persists cooldowns, uses distinct keys, and never logs keys',async t=>{
  const root=temporary(t),used=[];const options={env:env(),outputDir:root,fetcher:async(url,request)=>{const key=request.headers['x-goog-api-key'];used.push(key);return key===env().GEMINI_API_KEY?new Response(JSON.stringify({error:{message:'RequestsPerDay quota exceeded'}}),{status:429,headers:{'retry-after':'120'}}):answer();}};
  const provider=createProvider(options);await provider.gemini('system','input');assert.deepEqual(used,[env().GEMINI_API_KEY,env().GEMINI_API_KEY_2]);
  used.length=0;await createProvider(options).gemini('system','input');assert.deepEqual(used,[env().GEMINI_API_KEY_2]);
  const saved=fs.readFileSync(path.join(root,'.automation','usage.json'),'utf8');for(const key of Object.values(env()).slice(0,3))assert.ok(!saved.includes(key));
  assert.ok(!provider.sanitize(Error(env().GEMINI_API_KEY_3)).includes(env().GEMINI_API_KEY_3));
});

test('All Gemini quotas exhausted stops after the configured keys; authentication errors do not rotate',async t=>{
  const root=temporary(t);let calls=0;const provider=createProvider({env:env(),outputDir:root,fetcher:async()=>{calls++;return new Response('{}',{status:429,headers:{'retry-after':'60'}});}});
  await assert.rejects(()=>provider.gemini('system','input'),/quota/);assert.equal(calls,3);assert.equal(provider.status().availableGeminiKeys,0);await assert.rejects(()=>provider.gemini('system','input'),/cooling down/);assert.equal(calls,3);
  const other=temporary(t);calls=0;const denied=createProvider({env:env(),outputDir:other,fetcher:async()=>{calls++;return new Response('{}',{status:403});}});await assert.rejects(()=>denied.gemini('system','input'),/403/);assert.equal(calls,1);
});

test('Local daily model cap applies across every key and unsuccessful attempt',async t=>{
  let calls=0;const provider=createProvider({env:{...env(),AI_DAILY_REQUEST_LIMIT:'1'},outputDir:temporary(t),fetcher:async()=>{calls++;return new Response('{}',{status:429});}});
  await assert.rejects(()=>provider.gemini('system','input'),/daily AI request limit/);assert.equal(calls,1);
});

test('OpenRouter only calls a current zero-priced explicit model with a zero-price provider ceiling',async t=>{
  const model='google/gemma-4-31b-it:free';let payload,calls=0;
  const provider=createProvider({env:{...env(),SCRIPT_PROVIDER:'openrouter',OPENROUTER_API_KEY:'fake-router-key',OPENROUTER_MODEL:model},outputDir:temporary(t),fetcher:async(url,request)=>{
    calls++;if(url.endsWith('/models'))return new Response(JSON.stringify({data:[{id:model,pricing:{prompt:'0',completion:'0'}}]}),{headers:{'content-type':'application/json'}});
    payload=JSON.parse(request.body);return new Response(JSON.stringify({choices:[{finish_reason:'stop',message:{content:'{}'}}]}),{headers:{'content-type':'application/json'}});
  }});
  await provider.script('system','input');assert.equal(calls,2);assert.equal(payload.model,model);assert.deepEqual(payload.provider.max_price,{prompt:0,completion:0,request:0});assert.equal(payload.provider.allow_fallbacks,false);
  const paid=createProvider({env:{...env(),SCRIPT_PROVIDER:'openrouter',OPENROUTER_API_KEY:'fake-router-key',OPENROUTER_MODEL:'paid/model'},outputDir:temporary(t),fetcher:()=>{throw Error('Must not call');}});await assert.rejects(()=>paid.script('system','input'),/:free/);
});

test('Source retrieval rejects private addresses, mapped IPv4, private DNS answers and invented citations',async()=>{
  for(const ip of ['127.0.0.1','10.1.2.3','169.254.169.254','172.16.1.1','192.168.1.2','100.64.0.1','::1','::ffff:127.0.0.1','fc00::1'])assert.equal(publicAddress(ip),false,ip);
  assert.equal(publicAddress('8.8.8.8'),true);assert.equal(publicAddress('2606:4700:4700::1111'),true);
  assert.throws(()=>evidenceUrl('http://169.254.169.254/latest/meta-data'),/Private/);
  await assert.rejects(()=>fetchPage('https://source.example/article',{lookup:async()=>[{address:'10.1.2.3',family:4}]}),/non-public/);
  assert.throws(()=>validateDossier({stories:[{id:'M01',status:'VERIFIED',claims:[{id:'C01',text:'Test claim',classification:'confirmed_fact',central:true,sourceIds:['UNKNOWN']}]}]},[{id:'M01'}],[{id:'S01',status:'ok'}]),/not retrieved/);
});

test('Evidence collection records readable source text, fingerprints and failures separately',async()=>{
  const stories=[{sources:[{url:'https://source.example/a'},{url:'https://source.example/b'}]}];
  const evidence=await collectEvidence(stories,{fetcher:async url=>{if(url.endsWith('/b'))throw Error('Access unavailable');return {url,body:'<html><head><title>Fixture</title></head><body><nav>Ignore navigation</nav><article>'+('Supported source text. '.repeat(20))+'</article><script>Ignore script</script></body></html>'};}});
  assert.equal(evidence[0].status,'ok');assert.equal(evidence[0].sha256.length,64);assert.ok(!evidence[0].text.includes('Ignore'));assert.equal(evidence[1].status,'failed');assert.equal(evidence[1].text,undefined);
});

const fixtureDossier=()=>({stories:[{id:'M01',title:'Fixture news',status:'VERIFIED',claims:[{id:'C01',text:'Fixture evidence for this test only',central:true,classification:'confirmed_fact',sourceIds:['S01']}]}]});
function fixtureScript(){return {storyId:'M01',hooks:['Indha test-ku oru hook.','Second test hook.','Third test hook.'],selectedHook:0,selectionReason:'Fixture only',sentences:[{text:'Indha test-ku oru hook.',claimIds:[]},{text:Array(96).fill('fixture').join(' ')+'.',claimIds:['C01']}]};}
async function done(job){const deadline=Date.now()+5000;while(['queued','processing'].includes(job.status)&&Date.now()<deadline)await new Promise(resolve=>setTimeout(resolve,5));assert.ok(!['queued','processing'].includes(job.status));return job;}
function automationFixture(t,{noEvidence=false,failScript=false}={}){
  const root=temporary(t);fs.mkdirSync(path.join(root,'prompts'));for(const name of ['gemini','claude'])fs.copyFileSync(path.join(__dirname,'../prompts',name+'.txt'),path.join(root,'prompts',name+'.txt'));
  const calls=[];let fail=failScript;
  const provider={ready(){},status:()=>({search:false}),sanitize:e=>e.message,gemini:async(system)=>{calls.push('gemini');return {text:system.includes('API OUTPUT CONTRACT')?JSON.stringify(fixtureDossier()):JSON.stringify({pass:true,issues:[]})};},script:async()=>{calls.push('script');if(fail){fail=false;throw Error('Temporary provider outage');}return {text:JSON.stringify(fixtureScript())};}};
  const options={root,provider,collectEvidence:async()=>noEvidence?[]:[{id:'S01',status:'ok',url:'https://source.example/a',text:'Fixture evidence only'}]};
  const report=JSON.stringify({stories:[{id:'M01',title:'Fixture news',sources:[{url:'https://source.example/a'}]}]});return {root,options,provider,calls,report};
}

test('Standalone Meta workflow creates hooks, audited script and durable history without invoking Codex',async t=>{
  const f=automationFixture(t),automation=createAutomation(f.options);const job=await done(automation.start({report:f.report}));assert.equal(job.status,'awaiting_recording',job.error);assert.equal(job.script.hooks.length,3);assert.deepEqual(f.calls,['gemini','script','gemini']);assert.equal(createAutomation(f.options).get(job.id).script.text,job.script.text);
  const bad=fixtureScript();bad.sentences[1].claimIds=['invented'];assert.throws(()=>validateScript(bad,fixtureDossier()),/eligible claim/);
});

test('Missing source evidence never creates a script; provider retry reuses completed verification',async t=>{
  const missing=automationFixture(t,{noEvidence:true}),blocked=await done(createAutomation(missing.options).start({report:missing.report}));assert.equal(blocked.status,'needs_review');assert.equal(blocked.script,undefined);assert.deepEqual(missing.calls,[]);
  const f=automationFixture(t,{failScript:true}),first=createAutomation(f.options);const failed=await done(first.start({report:f.report}));assert.equal(failed.status,'failed');assert.ok(failed.dossier);
  const restored=createAutomation(f.options);const retried=await done(restored.retry(failed.id));assert.equal(retried.status,'awaiting_recording');assert.deepEqual(f.calls,['gemini','script','script','gemini']);
});

test('Deployment packaging excludes credentials, raw inputs and outputs; Free-machine checks fail closed',t=>{
  const root=temporary(t);for(const dir of ['server','public/video','public/images','Input','Output'])fs.mkdirSync(path.join(root,dir),{recursive:true});
  for(const [name,value] of [['package.json','{}'],['.env','secret'],['server/index.js','code'],['server/.env.private','secret'],['public/video/raw.mp4','raw'],['public/images/cutout.png','asset'],['Output/export.mp4','result']])fs.writeFileSync(path.join(root,name),value);
  const files=packageFiles(root);assert.ok(files.includes('server/index.js'));assert.ok(files.includes('public/images/cutout.png'));assert.ok(!files.some(name=>name.includes('.env')||name.includes('raw.mp4')||name.includes('export.mp4')));
  assert.doesNotThrow(()=>assertFree({free:true,spec:{vcpus:4,memMiB:8192}}));assert.throws(()=>assertFree({free:false}),/not explicitly marked Free/);assert.throws(()=>assertFree({free:true,spec:{vcpus:8,memMiB:16384}}),/Unexpected/);
  const config=cloudEnvironment({...env(),INSTABOX_API_KEY:'never-export-this',RENDER_CONCURRENCY:'8'});assert.ok(!config.includes('never-export-this'));assert.match(config,/RENDER_CONCURRENCY="1"/);assert.ok(config.includes('GEMINI_API_KEY_3'));
});

test('Deployment reuses the designated machine and never creates or deletes another one',async()=>{
  const calls=[],connection={config:{machineName:'sajiv-reel-studio'},save(patch){Object.assign(this.config,patch);}},machine={id:'m_fixture',name:'videoeditor',free:true,state:'running',spec:{vcpus:4,memMiB:8192}};
  const found=await ensureMachine(connection,{request:async route=>{calls.push(route);return {machines:[machine]};}});assert.equal(found.id,machine.id);assert.deepEqual(calls,['/v1/machines']);assert.equal(connection.config.machineId,machine.id);
  const client=createClient('secret-fixture-key',{fetcher:async()=>new Response(JSON.stringify({error:{code:'invalid_key',message:'Bad secret-fixture-key'}}),{status:401,headers:{'content-type':'application/json'}})});await assert.rejects(()=>client.request('/v1/machines'),e=>!e.message.includes('secret-fixture-key'));
});

test('Backup includes project/media history and excludes local API settings, models and unrelated outputs',t=>{
  const root=temporary(t);for(const dir of ['Output/.studio','Output/prompt-original-recovery','public/video','.models'])fs.mkdirSync(path.join(root,dir),{recursive:true});
  fs.writeFileSync(path.join(root,'.env'),'SECRET');fs.writeFileSync(path.join(root,'Output/.studio/job.json'),'{}');fs.writeFileSync(path.join(root,'public/video/reel.mp4'),'video');fs.writeFileSync(path.join(root,'Output/prompt-original-recovery/private.txt'),'private');
  const result=spawnSync(process.platform==='win32'?'python.exe':'python3',[path.join(__dirname,'../scripts/backup.py'),'--root',root,'--list'],{encoding:'utf8',windowsHide:true});assert.equal(result.status,0,result.stderr);const files=JSON.parse(result.stdout);assert.ok(files.includes('Output/.studio/job.json'));assert.ok(files.includes('public/video/reel.mp4'));assert.ok(!files.some(file=>file.includes('.env')||file.includes('prompt-original')));
});
