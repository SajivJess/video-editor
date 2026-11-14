const fs=require('node:fs'),path=require('node:path');
const {createHash}=require('node:crypto');
const {fail}=require('./files');
function jsonOutput(value){
  let text=String(value).trim();if(text.startsWith('```'))text=text.replace(/^```(?:json)?\s*/,'').replace(/\s*```$/,'');
  let result;try{result=JSON.parse(text);}catch{throw Error('Model returned invalid JSON. Raw response retained for review.');}
  if(!result||Array.isArray(result)||typeof result!=='object')throw Error('Model must return one JSON object');return result;
}
function createProvider({env=process.env,fetcher=fetch,outputDir=path.resolve(__dirname,'../Output'),sleep=ms=>new Promise(resolve=>setTimeout(resolve,ms))}={}){
  const verifyModel=env.GEMINI_VERIFY_MODEL||'gemini-3.5-flash-lite',writeModel=env.GEMINI_WRITE_MODEL||verifyModel;
  const keys=[...new Set([env.GEMINI_API_KEY,env.GEMINI_API_KEY_2,env.GEMINI_API_KEY_3].filter(Boolean).map(key=>key.trim()))];
  const keyId=key=>createHash('sha256').update(key).digest('hex').slice(0,16);
  const writer=env.SCRIPT_PROVIDER||'gemini',search=env.GEMINI_ENABLE_SEARCH==='true';
  const quotaFile=path.join(outputDir,'.automation','usage.json');fs.mkdirSync(path.dirname(quotaFile),{recursive:true});
  let usage={date:new Date().toISOString().slice(0,10),attempts:0,cooldowns:{}};if(fs.existsSync(quotaFile))usage=JSON.parse(fs.readFileSync(quotaFile,'utf8'));usage.cooldowns=usage.cooldowns||{};
  const saveUsage=()=>{fs.writeFileSync(quotaFile+'.tmp',JSON.stringify(usage));fs.renameSync(quotaFile+'.tmp',quotaFile);};
  const limit=Number(env.AI_DAILY_REQUEST_LIMIT||30);if(!Number.isInteger(limit)||limit<1||limit>1000)throw Error('AI_DAILY_REQUEST_LIMIT must be 1–1000');
  const sanitize=error=>{let message=String(error?.message||error);for(const secret of [...keys,env.OPENROUTER_API_KEY])if(secret)message=message.split(secret).join('[REDACTED]');return message;};
  function status(){return {configured:Boolean(keys.length),geminiKeyCount:keys.length,availableGeminiKeys:keys.filter(key=>(usage.cooldowns[keyId(key)]||0)<=Date.now()).length,writer,verifyModel,writeModel:writer==='openrouter'?env.OPENROUTER_MODEL||null:writeModel,search,requestLimit:limit,usage:usage.date===new Date().toISOString().slice(0,10)?usage.attempts:0,protected:Boolean(env.STUDIO_PASSWORD),notes:['API quotas and pricing are controlled by your provider account. Local limits bound attempts, not a guaranteed currency budget. Keys in the same Google project share quota.',search?'Google Search grounding enabled; check model/region billing eligibility.':'Source-page verification enabled. Google Search grounding is disabled; no search-tool access is claimed.']};}
  function ready(){if(!env.STUDIO_PASSWORD||env.STUDIO_PASSWORD.length<12)fail('Set STUDIO_PASSWORD (12+ characters) before enabling automated model calls',503);if(!keys.length)fail('Configure GEMINI_API_KEY locally before starting automation',503);if(!['gemini','openrouter'].includes(writer))fail('Unsupported script provider');if(writer==='openrouter'&&(!env.OPENROUTER_API_KEY||!env.OPENROUTER_MODEL))fail('Configure an OpenRouter key and an explicit free model ID',503);}
  function consume(){const date=new Date().toISOString().slice(0,10);if(date!==usage.date)usage={date,attempts:0,cooldowns:usage.cooldowns};if(usage.attempts>=limit)fail('Local daily AI request limit reached. Retry tomorrow or explicitly change the configured limit.',429);usage.attempts++;saveUsage();}
  async function request(url,body,headers){
    const geminiCall=url.startsWith('https://generativelanguage.googleapis.com/');
    for(let attempt=0;attempt<3;attempt++){
      const key=geminiCall?keys.find(value=>(usage.cooldowns[keyId(value)]||0)<=Date.now()):null;
      if(geminiCall&&!key){const next=Math.min(...keys.map(value=>usage.cooldowns[keyId(value)]||0));throw Error('All configured Gemini keys are cooling down. Retry after '+new Date(next).toISOString()+'. The job checkpoint is retained.');}
      consume();let response;
      try{response=await fetcher(url,{method:'POST',headers:{'Content-Type':'application/json',...headers,...(key?{'x-goog-api-key':key}:{})},body:JSON.stringify(body),signal:AbortSignal.timeout(120000)});}catch(error){throw Error('Model connection failed: '+sanitize(error));}
      if(geminiCall&&response.status===429){
        const detail=await response.text();let parsed;try{parsed=JSON.parse(detail);}catch{}
        const retry=parsed?.error?.details?.find(item=>item.retryDelay)?.retryDelay;
        const header=response.headers.get('retry-after'),seconds=retry?parseFloat(retry):header?(Number(header)||Math.max(0,(Date.parse(header)-Date.now())/1000)):0;
        const daily=/per.?day|daily|requestsperday|rpd/i.test(detail);
        usage.cooldowns[keyId(key)]=Date.now()+Math.max(1000,(seconds|| (daily?86400:60))*1000);saveUsage();
        if(attempt<2)continue;throw Error('Gemini quota is unavailable across the attempted keys. Check provider quotas and retry after their cooldown.');
      }
      if((response.status===429||response.status>=500)&&attempt<2){const delay=Number(response.headers.get('retry-after')||0)*1000;await response.body?.cancel();await sleep(Math.min(30000,Math.max(1000*2**attempt,delay)));continue;}
      if(!response.ok){await response.body?.cancel();throw Error(`Model request failed (HTTP ${response.status}). Check key, model availability, billing and quota in your provider dashboard.`);}
      return response.json();
    }
  }
  async function gemini(system,input,{grounded=false,json=true}={}){
    ready();
    const body={systemInstruction:{parts:[{text:system}]},contents:[{role:'user',parts:[{text:input}]}],generationConfig:{temperature:.35,maxOutputTokens:12000,...(json&&!grounded?{responseMimeType:'application/json'}:{})},...(grounded?{tools:[{google_search:{}}]}:{})};
    const model=/^[a-zA-Z0-9._-]+$/.test(verifyModel)?verifyModel:fail('Invalid Gemini model ID');
    const data=await request(`https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent`,body,{'x-goog-api-key':env.GEMINI_API_KEY});
    const candidate=data.candidates?.[0],text=candidate?.content?.parts?.filter(part=>!part.thought).map(part=>part.text||'').join('')||'';
    if(!text||!['STOP',undefined].includes(candidate.finishReason))throw Error('Gemini did not return a complete answer; response blocked or truncated.');
    return {text,provider:'gemini',model,usage:data.usageMetadata||null,grounding:candidate.groundingMetadata||null};
  }
  async function script(system,input){
    if(writer==='gemini'){
      const prior=verifyModel; // Explicit script model can differ without changing verification routing.
      if(writeModel===prior)return gemini(system,input);
      const body={systemInstruction:{parts:[{text:system}]},contents:[{role:'user',parts:[{text:input}]}],generationConfig:{temperature:.55,maxOutputTokens:7000,responseMimeType:'application/json'}};
      ready();if(!/^[a-zA-Z0-9._-]+$/.test(writeModel))fail('Invalid Gemini script model ID');
      const data=await request(`https://generativelanguage.googleapis.com/v1beta/models/${writeModel}:generateContent`,body,{'x-goog-api-key':env.GEMINI_API_KEY});
      const candidate=data.candidates?.[0];if(!candidate||candidate.finishReason!=='STOP')throw Error('Script response was blocked or truncated');
      return {text:candidate.content.parts.filter(part=>!part.thought).map(part=>part.text||'').join(''),provider:'gemini',model:writeModel,usage:data.usageMetadata||null};
    }
    ready();const model=env.OPENROUTER_MODEL;
    if(!model.endsWith(':free'))fail('Use an explicit OpenRouter :free model. Paid or automatic routing is disabled.');
    const catalogResponse=await fetcher('https://openrouter.ai/api/v1/models',{signal:AbortSignal.timeout(15000)});if(!catalogResponse.ok)throw Error('Cannot verify OpenRouter free model pricing');
    const catalog=await catalogResponse.json();const entry=catalog.data?.find(item=>item.id===model);
    if(!entry||!entry.pricing||!['prompt','completion','request'].every(key=>entry.pricing[key]===undefined?key==='request':Number(entry.pricing[key])===0))throw Error('The selected OpenRouter model is unavailable or no longer zero-priced. No paid fallback was used.');
    const data=await request('https://openrouter.ai/api/v1/chat/completions',{model,messages:[{role:'system',content:system},{role:'user',content:input}],max_tokens:7000,temperature:.55,provider:{max_price:{prompt:0,completion:0,request:0},allow_fallbacks:false}}, {Authorization:'Bearer '+env.OPENROUTER_API_KEY});
    if(data.error||data.choices?.[0]?.finish_reason!=='stop')throw Error('OpenRouter returned an incomplete or failed script');
    return {text:data.choices[0].message.content,provider:'openrouter',model,usage:data.usage||null};
  }
  return {status,ready,gemini,script,jsonOutput,sanitize};
}
module.exports={createProvider,jsonOutput};
