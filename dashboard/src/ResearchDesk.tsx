import React,{useEffect,useState} from 'react';
import {AutoResearch} from './AutoResearch';

type Source={id?:string;name?:string;url:string;publisher?:string;title?:string;publishedAt?:string|null;kind?:string;status?:string;error?:string;itemsReturned?:number;fetchedAt?:string;regionBasis?:string};
type Story={id:string;title:string;summary:string;publishedAt?:string|null;region?:string;regionBasis?:string;sources:Source[];verification:string;momentum?:string;score?:number;scoreParts?:Record<string,number>;caveats:string[];attention?:{geography:string;value:string;url:string;window:string}|null;attentionEvidence?:string};
type Scan={id:string;status:string;startedAt:string;completedAt:string|null;region:string;regionName:string;language:string;hours:number;sources:Source[];stories:Story[];notes:string[];error:string|null};
type MetaImport={id:string;report:string;stories:Story[];createdAt:string;note:string};
async function api<T>(url:string,body?:unknown):Promise<T>{
  const response=await fetch('/api/research'+url,body===undefined?undefined:{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(body)});
  if(response.status===401)window.dispatchEvent(new Event('studio-auth-required'));
  const value=await response.json();if(!response.ok)throw Error(value.error||`Request failed (${response.status})`);return value;
}
const date=(value?:string|null)=>value?new Date(value).toLocaleString('en-IN',{timeZone:'Asia/Kolkata'})+' IST':'Not established';
function savedDraft(field:string){try{return String(JSON.parse(localStorage.getItem('reel-research-draft')||'{}')[field]??'');}catch{return '';}}

export function ResearchDesk({onUseScript}:{onUseScript:(script:string)=>void}){
  const [region,setRegion]=useState('tamil-nadu'),[language,setLanguage]=useState('en'),[hours,setHours]=useState(72);
  const [scan,setScan]=useState<Scan|null>(null),[meta,setMeta]=useState<MetaImport|null>(null);
  const [selected,setSelected]=useState<string[]>([]),[report,setReport]=useState(()=>savedDraft('report')),[dossier,setDossier]=useState(()=>savedDraft('dossier'));
  const [draft,setDraft]=useState(()=>savedDraft('draft')),[handoff,setHandoff]=useState(''),[handoffTarget,setHandoffTarget]=useState('');
  const [error,setError]=useState(''),[message,setMessage]=useState(''),[pending,setPending]=useState(false);
  const [showAll,setShowAll]=useState(false);
  useEffect(()=>{
    let cancelled=false;setScan(null);setSelected([]);
    api<{scan:Scan|null;meta:MetaImport|null}>(`/latest?region=${region}&language=${language}&hours=${hours}`).then(data=>{
      if(cancelled)return;setScan(data.scan);setMeta(data.meta);if(data.meta)setReport(current=>current||data.meta!.report);
    }).catch(err=>{if(!cancelled)setError(err.message);});
    return()=>{cancelled=true;};
  },[region,language,hours]);
  useEffect(()=>{try{localStorage.setItem('reel-research-draft',JSON.stringify({report,dossier,draft}));}catch{/* Text remains in the current view if browser storage is full. */}},[report,dossier,draft]);
  useEffect(()=>{
    if(!scan||scan.status!=='running')return;let cancelled=false;
    const timer=setInterval(()=>api<Scan>('/scans/'+scan.id).then(value=>{if(!cancelled)setScan(value);}).catch(err=>{if(!cancelled)setError(err.message);}),1200);
    return()=>{cancelled=true;clearInterval(timer);};
  },[scan?.id,scan?.status]);
  async function startScan(){
    setPending(true);setError('');setMessage('');setSelected([]);setShowAll(false);
    try{setScan(await api<Scan>('/scan',{region,language,hours}));}catch(err){setError((err as Error).message);}finally{setPending(false);}
  }
  async function saveMeta(){
    setPending(true);setError('');
    try{const value=await api<MetaImport>('/meta',{report});setMeta(value);setMessage(value.note);}catch(err){setError((err as Error).message);}finally{setPending(false);}
  }
  async function prepare(target:'meta'|'gemini'|'claude'){
    setPending(true);setError('');setMessage('');
    try{
      const result=await api<{text:string}>('/handoff',{target,region,language,hours,scanId:scan?.status==='running'?undefined:scan?.id,importId:meta?.id,selectedIds:selected,verificationReport:target==='claude'?dossier:undefined});
      setHandoff(result.text);setHandoffTarget(target);
      try{await navigator.clipboard.writeText(result.text);setMessage(`${target} handoff copied. Paste it into that service; no model API has been called.`);}catch{setMessage('Handoff prepared below. Select and copy it, or download the text file.');}
    }catch(err){setError((err as Error).message);}finally{setPending(false);}
  }
  function download(){const url=URL.createObjectURL(new Blob([handoff],{type:'text/plain;charset=utf-8'}));const a=document.createElement('a');a.href=url;a.download=`${handoffTarget}-research-handoff.txt`;a.click();URL.revokeObjectURL(url);}
  function toggle(id:string){setSelected(current=>current.includes(id)?current.filter(value=>value!==id):current.length<5?[...current,id]:current);}
  const running=pending||scan?.status==='running';
  return <main className="research-container">
    <div className="research-heading"><div><span className="eyebrow">DISCOVER → CHECK → SCRIPT → RECORD → EDIT</span><h1>Research desk</h1><p>Two discovery lanes. One evidence standard. Your Meta workflow stays available alongside the regional finder.</p></div><span className="research-badge">No API keys needed for feed discovery</span></div>
    {error&&<div className="notice notice-error" role="alert">{error}</div>}
    {message&&<div className="notice" role="status">{message}</div>}
    <div className="research-grid">
      <section className="card research-discovery">
        <div className="card-title">1. Regional finder</div>
        <div className="research-controls">
          <label>Audience/story focus<select disabled={running} className="form-select" value={region} onChange={e=>setRegion(e.target.value)}><option value="tamil-nadu">Tamil Nadu / South India</option><option value="chennai">Chennai</option><option value="india">India</option><option value="global">International stories</option></select></label>
          <label>News language<select disabled={running} className="form-select" value={language} onChange={e=>setLanguage(e.target.value)}><option value="en">English</option><option value="ta">Tamil</option></select></label>
          <label>Research window<select disabled={running} className="form-select" value={hours} onChange={e=>setHours(Number(e.target.value))}><option value={24}>24 hours</option><option value={48}>48 hours</option><option value={72}>72 hours</option></select></label>
        </div>
        <button className="btn-primary" disabled={running} onClick={startScan}>{running?'Collecting live sources…':'Find current technology stories'}</button>
        <p className="field-help">India search signals + regional news queries + company announcements. City-level audience popularity is not supplied. Results are research leads, not verified news.</p>
        {scan&&<>
          <div className="research-status"><strong>{scan.status==='running'?'Scanning':scan.status==='partial'?'Partial source coverage':scan.status==='failed'?'Scan failed':'Snapshot ready'}</strong><span>{date(scan.completedAt??scan.startedAt)}</span></div>
          {scan.error&&<div className="notice notice-error">{scan.error}</div>}
          <details className="research-details"><summary>Source access & limitations ({scan.sources.filter(s=>s.status==='ok').length}/{scan.sources.length} succeeded)</summary>
            {scan.sources.map(source=><div className="source-status" key={source.id}><a href={source.url} target="_blank" rel="noreferrer">{source.name}</a><span>{source.status==='ok'?`${source.itemsReturned} items returned`:source.error}</span><small>{source.regionBasis} · fetched {date(source.fetchedAt)}</small></div>)}
            {scan.notes.map(note=><p className="field-help" key={note}>{note}</p>)}
          </details>
          <p className="field-help">Select up to five for Gemini. Without a selection, the top five are included. Scores are editorial heuristics; they are not confidence or virality predictions.</p>
          <div className="story-list">
            {scan.stories.slice(0,showAll?undefined:5).map((story,index)=><article className={`story-card ${selected.includes(story.id)?'selected':''}`} key={story.id}>
              <div className="story-top"><label><input type="checkbox" checked={selected.includes(story.id)} disabled={!selected.includes(story.id)&&selected.length>=5} onChange={()=>toggle(story.id)}/><span>Lead {index+1}</span></label><span>{story.score}/100 editorial</span></div>
              <h2>{story.title}</h2><p>{story.summary}</p>
              <div className="story-tags"><span>Unverified</span><span>{story.attention?'Search surge observed':'News lead · popularity unmeasured'}</span><span>{story.momentum}</span></div>
              <p className="field-help">Latest monitored report: {date(story.publishedAt)} · Event date not independently established</p>
              <p className="field-help">{story.regionBasis}</p>
              {story.attention&&<p className="field-help"><a href={story.attention.url} target="_blank" rel="noreferrer">Search signal</a>: {story.attention.value} · {story.attention.geography} · {story.attention.window}</p>}
              <details><summary>Source links & caveats ({story.sources.length})</summary>{story.sources.map(source=><a className="story-source" key={source.url} href={source.url} target="_blank" rel="noreferrer">{source.publisher||source.url} · {source.kind}</a>)}{story.caveats.map(c=><p className="field-help" key={c}>{c}</p>)}</details>
            </article>)}
            {scan.status!=='running'&&!scan.stories.length&&<p className="field-help">No eligible technology leads were returned for this window. Try another focus/window; the finder does not invent five stories.</p>}
          </div>
          {scan.stories.length>5&&<button className="btn-secondary" onClick={()=>setShowAll(value=>!value)}>{showAll?'Show top five only':`Show ${scan.stories.length-5} more leads`}</button>}
        </>}
      </section>
      <section className="research-workflow">
        <div className="card">
          <div className="card-title">2. Your Meta discovery lane</div>
          <p className="field-help">Use your usual Meta AI research. The enhanced prompt asks for access disclosure and a JSON shortlist, so its five leads can be compared with the finder. Ownership of a platform is not proof of live analytics access.</p>
          <div className="research-actions"><button className="btn-secondary" disabled={pending} onClick={()=>prepare('meta')}>Copy Meta research prompt</button><a className="btn-secondary" href="/api/research/prompts/meta">Download prompt</a></div>
          <label className="research-label" htmlFor="meta-report">Meta AI research report</label>
          <textarea id="meta-report" className="form-textarea" rows={7} value={report} onChange={e=>setReport(e.target.value)} placeholder="Paste Meta's full response, including its final JSON block. Plain text is retained too."/>
          <button className="btn-secondary" disabled={pending||!report.trim()} onClick={saveMeta}>Save Meta report</button>
          <AutoResearch report={report} region={region} onUseScript={(script,verification)=>{setDraft(script);setDossier(verification);setMessage('Generated script selected. Record your presenter video, then use the script in the reel editor.');}}/>
          {meta&&<><p className="field-help">{meta.note} · {date(meta.createdAt)}</p>{meta.stories.slice(0,5).map((story,index)=><article className="story-card compact" key={story.id}><span className="eyebrow">META PICK {index+1} · UNVERIFIED</span><h2>{story.title}</h2><p>{story.summary}</p><p className="field-help">{story.sources.length} supplied links · Attention claim: {story.attentionEvidence||'unavailable'}</p></article>)}</>}
        </div>
        <div className="card">
          <div className="card-title">3. Independent verification → script</div>
          <p className="field-help">Manual handoffs are also available. Inspect actual sources and corrections before passing a dossier to your chosen script writer. These copy controls prepare text; automatic API jobs run above.</p>
          <div className="research-actions"><button className="btn-secondary" disabled={pending||(!scan?.stories.length&&!meta)} onClick={()=>prepare('gemini')}>Copy Gemini verification handoff</button><a className="btn-secondary" href="/api/research/prompts/gemini">Download prompt</a></div>
          <label className="research-label" htmlFor="verification-report">Independent verification dossier</label>
          <textarea id="verification-report" className="form-textarea" rows={7} value={dossier} onChange={e=>setDossier(e.target.value)} placeholder="Paste Gemini's claim/source register, eligible stories, caveats and hook-safe facts. Pasting a report does not certify its truth."/>
          <div className="research-actions"><button className="btn-secondary" disabled={pending||!dossier.trim()} onClick={()=>prepare('claude')}>Copy Claude script handoff</button><a className="btn-secondary" href="/api/research/prompts/claude">Download prompt</a></div>
          <p className="field-help">Claude now explores rhythmic Tamil hooks, sayings, contrasts and incident openings, then chooses an accurate hook with an immediate story bridge. Default script: 45–50 seconds.</p>
          {handoff&&<details className="research-details" open><summary>Prepared {handoffTarget} handoff</summary><textarea aria-label="Prepared model handoff" className="form-textarea" rows={7} value={handoff} readOnly/><button className="btn-secondary" onClick={download}>Download complete handoff</button></details>}
          <label className="research-label" htmlFor="final-spoken-script">Final spoken script</label>
          <textarea id="final-spoken-script" className="form-textarea" rows={5} value={draft} onChange={e=>setDraft(e.target.value)} placeholder="Paste only the selected, reviewed spoken script. Record your presenter video next."/>
          <button className="btn-primary" disabled={!draft.trim()} onClick={()=>onUseScript(draft)}>Use script in reel editor</button>
          <p className="field-help">Your recording stays the narration source. This transfers script context into the existing upload workflow; it does not synthesize a voice or alter saved captions.</p>
        </div>
      </section>
    </div>
  </main>;
}
