import React, { useState, useEffect, useRef, useCallback } from 'react';
import { createRoot } from 'react-dom/client';
import { ResearchDesk } from './ResearchDesk';
import {AuthGate} from './AuthGate';

interface Palette {
  id: string;
  name: string;
  tag: string;
  primaryText: string;
  highlightColor: string;
  accentColor: string;
  pillTextColor: string;
  bgPanel: string;
  description: string;
  captionTreatment?: 'expressive' | 'clean';
}

interface VideoFile {
  filename: string;
  path: string;
  sizeMb: string;
  url?: string;
  downloadUrl?: string;
  verified?: boolean;
}

interface Stage {
  id: number;
  name: string;
  status: 'pending' | 'running' | 'completed' | 'failed';
  desc: string;
}

interface Job {
  id: string;
  name: string;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  progress: number;
  etaSeconds: number | null;
  activeStage: string;
  stages: Stage[];
  logs: string[];
  error?: string;
  outputFile?: string;
  outputUrl?: string;
  downloadUrl?: string;
  warnings: string[];
  projectUrl?: string;
  reviewUrl?: string;
  qa?: { integratedLUFS: string; truePeakDBTP: string };
}

interface SavedProject {id:string;name:string;captions:number;durationSeconds:number;}

async function request<T>(url:string,options?:RequestInit):Promise<T>{
  const response=await fetch(url,options);
  if(response.status===401)window.dispatchEvent(new Event('studio-auth-required'));
  const data=await response.json();
  if(!response.ok)throw new Error(data.error||`Request failed (${response.status})`);
  return data;
}

// ─── Professional SVG Icons ──────────────────────────────────────────────────
const SparklesIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="m12 3-1.912 5.813a2 2 0 0 1-1.275 1.275L3 12l5.813 1.912a2 2 0 0 1 1.275 1.275L12 21l1.912-5.813a2 2 0 0 1 1.275-1.275L21 12l-5.813-1.912a2 2 0 0 1-1.275-1.275L12 3Z"/>
    <path d="M5 3v4"/><path d="M19 17v4"/><path d="M3 5h4"/><path d="M17 19h4"/>
  </svg>
);

const VideoIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="m22 8-6 4 6 4V8Z"/><rect width="14" height="12" x="2" y="6" rx="2"/>
  </svg>
);

const UploadIcon = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" x2="12" y1="3" y2="15"/>
  </svg>
);

const PaletteIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="13.5" cy="6.5" r=".5" fill="currentColor"/><circle cx="17.5" cy="10.5" r=".5" fill="currentColor"/><circle cx="8.5" cy="7.5" r=".5" fill="currentColor"/><circle cx="6.5" cy="12.5" r=".5" fill="currentColor"/>
    <path d="M12 2C6.5 2 2 6.5 2 12s4.5 10 10 10c.926 0 1.648-.746 1.648-1.688 0-.437-.18-.835-.437-1.125-.29-.289-.438-.652-.438-1.125a1.64 1.64 0 0 1 1.668-1.668h1.996c3.051 0 5.555-2.503 5.555-5.554C21.965 6.012 17.461 2 12 2z"/>
  </svg>
);

const ClockIcon = () => (
  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/>
  </svg>
);

const DownloadIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" x2="12" y1="15" y2="3"/>
  </svg>
);

const EditIcon = () => (
  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M17 3a2.85 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z"/><path d="m15 5 4 4"/>
  </svg>
);

const CheckIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="20 6 9 17 4 12"/>
  </svg>
);

const TerminalIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="4 17 10 11 4 5"/><line x1="12" x2="20" y1="19" y2="19"/>
  </svg>
);

export const App: React.FC = () => {
  const [workspaceView,setWorkspaceView]=useState<'research'|'editor'>(window.location.hash==='#editor'?'editor':'research');
  const [palettes,setPalettes]=useState<Palette[]>([]);
  const [selectedPalette,setSelectedPalette]=useState('crimson-editorial');
  const [rawVideos,setRawVideos]=useState<VideoFile[]>([]);
  const [selectedVideoPath,setSelectedVideoPath]=useState('');
  const [scriptText,setScriptText]=useState('');
  const [customName,setCustomName]=useState('tanglish_tech_reel');
  const [activeJob,setActiveJob]=useState<Job|null>(null);
  const [isSubmitting,setIsSubmitting]=useState(false);
  const [isUploading,setIsUploading]=useState(false);
  const [showLogs,setShowLogs]=useState(false);
  const [recentReels,setRecentReels]=useState<VideoFile[]>([]);
  const [renameTarget,setRenameTarget]=useState('');
  const [newNameInput,setNewNameInput]=useState('');
  const [projects,setProjects]=useState<SavedProject[]>([]);
  const [projectId,setProjectId]=useState('current');
  const [inputMode,setInputMode]=useState<'project'|'video'>('project');
  const [vocabulary,setVocabulary]=useState('');
  const [overlayEndSeconds,setOverlayEndSeconds]=useState('');
  const [error,setError]=useState('');
  const [online,setOnline]=useState(false);
  const [selectedOutput,setSelectedOutput]=useState('');
  const logRef=useRef<HTMLDivElement>(null);
  const loadVideos=useCallback(async()=>{
    const data=await request<{rawVideos:VideoFile[];renderedVideos:VideoFile[]}>('/api/videos');
    setRawVideos(data.rawVideos);setRecentReels(data.renderedVideos);
    setSelectedVideoPath(current=>current||data.rawVideos[0]?.path||'');
  },[]);
  useEffect(()=>{
    request<{palettes:Palette[]}>('/api/palettes').then(data=>setPalettes(data.palettes)).catch(err=>setError(err.message));
    request<{projects:SavedProject[]}>('/api/projects').then(data=>setProjects(data.projects)).catch(err=>setError(err.message));
    request<{jobs:Job[]}>('/api/jobs').then(data=>{
      const stored=localStorage.getItem('reel-studio-job');
      setActiveJob(data.jobs.find(job=>job.id===stored)??data.jobs.find(job=>job.status==='processing'||job.status==='pending')??null);
    }).catch(err=>setError(err.message));
    loadVideos().catch(err=>setError(err.message));
    const health=()=>request('/api/health').then(()=>setOnline(true)).catch(()=>setOnline(false));
    health();const interval=setInterval(health,10000);return()=>clearInterval(interval);
  },[loadVideos]);
  useEffect(()=>{
    if(!activeJob||!['pending','processing'].includes(activeJob.status))return;
    let cancelled=false;
    const interval=setInterval(()=>{
      request<Job>(`/api/jobs/${activeJob.id}`).then(job=>{
        if(cancelled)return;
        setActiveJob(job);
        if(job.status==='completed'){setSelectedOutput(job.outputFile||'');loadVideos().catch(err=>setError(err.message));}
      }).catch(err=>{if(!cancelled)setError(err.message);});
    },1500);
    return()=>{cancelled=true;clearInterval(interval);};
  },[activeJob?.id,activeJob?.status,loadVideos]);
  useEffect(()=>{if(logRef.current)logRef.current.scrollTop=logRef.current.scrollHeight;},[activeJob?.logs]);
  const uploadFile=async(file?:File)=>{
    if(!file)return;
    if(file.size>2*1024*1024*1024){setError('Video exceeds the 2 GB upload limit');return;}
    if(!/\.(mp4|mov|webm)$/i.test(file.name)){setError('Choose an MP4, MOV or WEBM video');return;}
    setError('');setIsUploading(true);
    try{
      const body=new FormData();body.append('video',file);
      const data=await request<{path:string}>('/api/upload',{method:'POST',body});
      setSelectedVideoPath(data.path);await loadVideos();
    }catch(err){setError((err as Error).message);}finally{setIsUploading(false);}
  };
  const handleFileUpload=(event:React.ChangeEvent<HTMLInputElement>)=>uploadFile(event.target.files?.[0]);
  const handleGenerate=async()=>{
    if(inputMode==='video'&&!selectedVideoPath){setError('Select or upload a presenter video first.');return;}
    setIsSubmitting(true);setError('');
    try{
      const data=await request<{job:Job}>('/api/generate',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({
        projectId:inputMode==='project'?projectId:undefined,rawVideoPath:inputMode==='video'?selectedVideoPath:undefined,
        scriptText:inputMode==='video'?scriptText:undefined,vocabulary:inputMode==='video'?vocabulary:undefined,
        overlayEndSeconds:inputMode==='video'&&overlayEndSeconds!==''?Number(overlayEndSeconds):undefined,
        paletteKey:selectedPalette,customName,
      })});
      setActiveJob(data.job);localStorage.setItem('reel-studio-job',data.job.id);
    }catch(err){setError((err as Error).message);}finally{setIsSubmitting(false);}
  };
  const handleRename=async()=>{
    if(!renameTarget||!newNameInput.trim())return;
    setError('');
    try{
      const data=await request<{newFilename:string;outputUrl:string;downloadUrl:string}>('/api/rename',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({oldFilename:renameTarget,newName:newNameInput.trim()})});
      if(activeJob?.outputFile===renameTarget)setActiveJob({...activeJob,outputFile:data.newFilename,outputUrl:data.outputUrl,downloadUrl:data.downloadUrl});
      setSelectedOutput(data.newFilename);setRenameTarget('');setNewNameInput('');await loadVideos();
    }catch(err){setError((err as Error).message);}
  };
  const currentTheme=palettes.find(p=>p.id===selectedPalette)||palettes[0];
  const currentOutput=recentReels.find(reel=>reel.filename===selectedOutput)??recentReels.find(reel=>reel.filename===activeJob?.outputFile)??recentReels.find(reel=>reel.verified)??recentReels[0];
  const busy=isSubmitting||isUploading||activeJob?.status==='processing'||activeJob?.status==='pending';

  return (
    <div>
      {/* Top Header */}
      <header className="header">
        <div className="brand">
          <div className="brand-icon">
            <SparklesIcon />
          </div>
          <div>
            <div className="brand-title">Reel AI Studio</div>
            <div className="brand-badge">Remotion 4 · 40/30/30 Layout · Tanglish ASR</div>
          </div>
        </div>

        <div className="status-pill">
          <div className="status-dot" style={{background:online?'#10B981':'#EF4444'}}></div>
          <span>{online?`Engine online · ${palettes.length} palettes`:'Engine unavailable'}</span>
        </div>
      </header>

      <nav className="workspace-nav" aria-label="Studio workspace"><button className={workspaceView==='research'?'active':''} onClick={()=>{setWorkspaceView('research');window.location.hash='research';}}>Research desk</button><button className={workspaceView==='editor'?'active':''} onClick={()=>{setWorkspaceView('editor');window.location.hash='editor';}}>Reel editor</button></nav>
      {workspaceView==='research'?<ResearchDesk onUseScript={script=>{setScriptText(script);setInputMode('video');setWorkspaceView('editor');window.location.hash='editor';}}/>:<main className="container">
        {error&&<div role="alert" className="notice notice-error" style={{gridColumn:'1 / -1'}}>{error}<button type="button" onClick={()=>setError('')} aria-label="Dismiss error">×</button></div>}
        {/* Left Column: Input Form & Controls */}
        <section style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
          {/* Card 1: Video Ingestion & Naming */}
          <div className="card">
            <div className="card-title">
              <VideoIcon />
              <span>1. Project & Presenter Video</span>
            </div>

            {/* Rename / Custom Name Input */}
            <div className="form-group">
              <label htmlFor="reel-name" className="form-label">Output Reel Name</label>
              <div style={{ display: 'flex', gap: 10 }}>
                <input
                  type="text"
                  id="reel-name"
                  className="form-input"
                  value={customName}
                  onChange={(e) => setCustomName(e.target.value)}
                  placeholder="e.g. nvidia_deep_dive_reel"
                />
                <span style={{ display: 'flex', alignItems: 'center', color: 'var(--text-muted)', fontSize: 14 }}>
                  .mp4
                </span>
              </div>
            </div>

            <div className="mode-switch" role="group" aria-label="Reel source">
              <button type="button" className={inputMode==='project'?'active':''} onClick={()=>setInputMode('project')}>Saved project</button>
              <button type="button" className={inputMode==='video'?'active':''} onClick={()=>setInputMode('video')}>New video</button>
            </div>
            {inputMode==='project'?<div className="form-group">
              <label htmlFor="saved-project" className="form-label">Reviewed project</label>
              <select id="saved-project" className="form-select" value={projectId} onChange={event=>setProjectId(event.target.value)}>
                {projects.map(project=><option key={project.id} value={project.id}>{project.name} · {project.durationSeconds.toFixed(1)}s · {project.captions} captions</option>)}
              </select>
              <p className="field-help">Keeps saved captions, person photos, supplied clips, closing card, and selected effects. No retranscription.</p>
            </div>:<>

            {/* Video Selector or Upload */}
            <div className="form-group">
              <label htmlFor="workspace-video" className="form-label">Select Workspace Video</label>
              <select
                id="workspace-video"
                className="form-select"
                value={selectedVideoPath}
                onChange={(e) => setSelectedVideoPath(e.target.value)}
              >
                {!rawVideos.length&&<option value="">Upload a presenter video</option>}
                {rawVideos.map((v) => (
                  <option key={v.path} value={v.path}>
                    {v.filename} ({v.sizeMb} MB)
                  </option>
                ))}
              </select>
            </div>

            {/* Or Upload Drag-and-Drop */}
            <div
              className="dropzone"
              role="button" tabIndex={0}
              onClick={() => !isUploading&&document.getElementById('file-upload')?.click()}
              onKeyDown={event=>{if(event.key==='Enter'||event.key===' ')document.getElementById('file-upload')?.click();}}
              onDragOver={event=>event.preventDefault()}
              onDrop={event=>{event.preventDefault();if(!isUploading)uploadFile(event.dataTransfer.files[0]);}}
            >
              <input
                id="file-upload"
                type="file"
                accept="video/mp4,video/quicktime,video/webm"
                aria-label="Upload presenter video"
                disabled={isUploading}
                style={{ display: 'none' }}
                onChange={handleFileUpload}
              />
              <div className="dropzone-icon">
                <UploadIcon />
              </div>
              <div style={{ fontWeight: 700, fontSize: 14, marginBottom: 4 }}>
                {isUploading ? 'Uploading Raw Video...' : 'Upload New Presenter Video'}
              </div>
              <div style={{ color: 'var(--text-muted)', fontSize: 12 }}>
                MP4, MOV, or WEBM up to 2 GB · Drop a file here or choose one
              </div>
            </div>
            </>}
          </div>

          {/* Card 2: Script Input */}
          {inputMode==='video'&&<div className="card">
            <div className="card-title">
              <EditIcon />
              <span>2. Script & Tanglish Narration Hints</span>
            </div>

            <div className="form-group" style={{ marginBottom: 0 }}>
              <label htmlFor="spoken-script" className="form-label">Optional spoken script</label>
              <textarea
                id="spoken-script"
                className="form-textarea"
                rows={4}
                value={scriptText}
                onChange={(e) => setScriptText(e.target.value)}
                placeholder="Paste the actual Tamil/English narration if available. Used as Whisper context; it does not replace the audio."
              />
            </div>
            <div className="form-group" style={{marginTop:16}}>
              <label htmlFor="vocabulary" className="form-label">Names & vocabulary hints</label>
              <input id="vocabulary" className="form-input" value={vocabulary} onChange={event=>setVocabulary(event.target.value)} placeholder="e.g. Jensen Huang, Kimberly Powell, GPU"/>
            </div>
            <div className="form-group">
              <label htmlFor="closing-card" className="form-label">Closing card starts at (seconds, optional)</label>
              <input id="closing-card" type="number" min="0.1" step="0.1" className="form-input" value={overlayEndSeconds} onChange={event=>setOverlayEndSeconds(event.target.value)} placeholder="Leave blank if there is no source closing card"/>
            </div>
            <p className="field-help">New uploads get their own local Whisper transcription. Review uncertain Tanglish words and new person assets before publishing.</p>
          </div>}

          {/* Card 3: 10 Curated Color Palettes Picker */}
          <div className="card">
            <div className="card-title" style={{ justifyContent: 'space-between' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <PaletteIcon />
                <span>{inputMode==='video'?'3':'2'}. Choose Color Palette ({palettes.length} Styles)</span>
              </div>
              <span style={{ fontSize: 12, color: 'var(--accent-crimson)', fontWeight: 700 }}>
                {currentTheme?.name}
              </span>
            </div>

            <div className="palette-grid">
              {palettes.map((p) => {
                const isActive = p.id === selectedPalette;
                return (
                  <button type="button" aria-pressed={isActive}
                    key={p.id}
                    className={`palette-card ${isActive ? 'active' : ''}`}
                    style={
                      {
                        '--palette-accent': p.highlightColor,
                        '--palette-glow': `${p.highlightColor}55`,
                      } as React.CSSProperties
                    }
                    onClick={() => setSelectedPalette(p.id)}
                  >
                    <div className="palette-header">
                      <span className="palette-name">{p.name}</span>
                      <span className="palette-tag">{p.tag}</span>
                    </div>

                    <div className="palette-swatches">
                      <div className="swatch-dot" style={{ background: p.highlightColor }} title="Pill Highlight" />
                      <div className="swatch-dot" style={{ background: p.primaryText }} title="Primary Text" />
                      <div className="swatch-dot" style={{ background: p.accentColor }} title="Secondary Accent" />
                      <div className="swatch-dot" style={{ background: p.bgPanel }} title="Backing Panel" />
                    </div>

                    {/* Live Caption Pill Simulation */}
                    <div className="caption-simulation" style={{ color: p.primaryText }}>
                      <span>THIS IS</span>
                      <span
                        className="simulation-pill"
                        style={{
                          backgroundColor: p.captionTreatment==='clean'?'transparent':p.highlightColor,
                          color: p.captionTreatment==='clean'?p.primaryText:p.pillTextColor,
                          borderBottom:p.captionTreatment==='clean'?`3px solid ${p.highlightColor}`:undefined,
                        }}
                      >
                        VIRAL
                      </span>
                    </div>
                  </button>
                );
              })}
            </div>

            {/* Launch Action */}
            <button
              className="btn-primary"
              disabled={busy||!online}
              onClick={handleGenerate}
            >
              <SparklesIcon />
              <span>
                {isSubmitting?'Starting…':activeJob?.status==='pending'?'Queued…':activeJob?.status==='processing'?'Rendering In Progress…':inputMode==='project'?'Render Saved Reel (1080×1920)':'Generate & Edit Reel (1080×1920)'}
              </span>
            </button>
          </div>
        </section>

        {/* Right Column: Live Progress, ETA, & Video Player */}
        <section style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
          {/* Progress & Live Status Tracker */}
          {activeJob && (
            <div className="card">
              <div className="progress-header">
                <div>
                  <div style={{ fontSize: 13, color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 700 }}>
                    Active Job: {activeJob.name}
                  </div>
                  <div className="progress-pct">{activeJob.progress}%</div>
                </div>

                <div className="eta-badge">
                  <ClockIcon />
                  <span>
                    {activeJob.status === 'completed'
                      ? 'Done!'
                      : activeJob.status === 'failed'
                      ? 'Failed'
                      : activeJob.etaSeconds===null?activeJob.activeStage:`Render estimate: ~${activeJob.etaSeconds}s`}
                  </span>
                </div>
              </div>

              {activeJob.error&&<div className="notice notice-error" role="alert">{activeJob.error}</div>}
              {activeJob.status==='failed'&&<button className="btn-secondary" onClick={async()=>{try{const result=await request<{job:Job}>(`/api/jobs/${activeJob.id}/retry`,{method:'POST',headers:{'Content-Type':'application/json'},body:'{}'});setActiveJob(result.job);}catch(error){setError((error as Error).message);}}}>Retry saved job</button>}
              {activeJob.warnings?.length>0&&<div className="notice" role="status">{activeJob.warnings.map((warning,index)=><p key={index}>{warning}</p>)}</div>}
              <div className="report-links">
                {activeJob.projectUrl&&activeJob.progress>=35&&<a href={activeJob.projectUrl}>Editable project</a>}
                {activeJob.reviewUrl&&<a href={activeJob.reviewUrl}>Transcript review notes</a>}
                {activeJob.qa&&<span>QA passed · {activeJob.qa.integratedLUFS} LUFS</span>}
              </div>

              {/* Progress Bar Track */}
              <div className="progress-bar-track">
                <div
                  className="progress-bar-fill"
                  style={{ width: `${Math.max(2, activeJob.progress)}%` }}
                />
              </div>

              {/* 6 Pipeline Stage Steps */}
              <div className="stage-list">
                {activeJob.stages.map((st) => (
                  <div key={st.id} className={`stage-item ${st.status}`}>
                    {st.status === 'completed' ? (
                      <CheckIcon />
                    ) : st.status === 'running' ? (
                      <div className="status-dot" style={{ background: '#FF4A65' }} />
                    ) : (
                      <div style={{ width: 14, height: 14, borderRadius: '50%', border: '2px solid rgba(255,255,255,0.2)' }} />
                    )}
                    <div style={{ flex: 1 }}>
                      <div>{st.name}</div>
                      <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>{st.desc}</div>
                    </div>
                    <span style={{ fontSize: 11, textTransform: 'uppercase', fontWeight: 700 }}>
                      {st.status}
                    </span>
                  </div>
                ))}
              </div>

              {/* Live Terminal Output Drawer */}
              <div style={{ marginTop: 12 }}>
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    cursor: 'pointer',
                    marginBottom: 8,
                    fontSize: 12,
                    fontWeight: 700,
                    color: 'var(--text-muted)',
                  }}
                  onClick={() => setShowLogs(!showLogs)}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                    <TerminalIcon />
                    <span>Live Console Execution Log ({activeJob.logs.length} lines)</span>
                  </div>
                  <span>{showLogs ? '▲ Collapse' : '▼ Expand'}</span>
                </div>

                {showLogs && (
                  <div className="log-drawer" ref={logRef}>
                    {activeJob.logs.map((line, idx) => (
                      <div key={idx} className="log-line">
                        {line}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Finished Video Playable, Viewable & Downloadable */}
          <div className="card">
            <div className="card-title">
              <VideoIcon />
              <span>Output Player & Video Delivery</span>
            </div>

            {currentOutput ? (
              <div>
                <label htmlFor="output-reel" className="form-label">Rendered reels</label>
                <select id="output-reel" className="form-select" value={currentOutput.filename} onChange={event=>setSelectedOutput(event.target.value)} style={{marginBottom:16}}>
                  {recentReels.map(reel=><option key={reel.filename} value={reel.filename}>{reel.filename}{reel.verified?' · QA passed':''}</option>)}
                </select>
                {/* 1080x1920 Portrait Player */}
                <div className="player-container">
                  <video
                    controls
                    autoPlay={false}
                    key={currentOutput.filename} preload="metadata"
                    src={currentOutput.url}
                  />
                </div>

                {/* Video Info Badge */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12, padding: '0 4px' }}>
                  <div>
                    <div style={{ fontSize: 14, fontWeight: 800 }}>
                      {currentOutput.filename}
                    </div>
                    <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>
                      {currentOutput.verified?'Verified 1080 × 1920 · 30 FPS · Audio QA passed':'Workspace render · QA report unavailable'}
                    </div>
                  </div>
                </div>

                {/* Actions: Download, Rename, Share */}
                <div className="actions-row">
                  <a
                    className="btn-secondary btn-download"
                    style={{ textDecoration: 'none' }}
                    href={currentOutput.downloadUrl}
                    download
                  >
                    <DownloadIcon />
                    <span>Download MP4</span>
                  </a>

                  <button
                    className="btn-secondary"
                    onClick={() => {
                      const cur = currentOutput.filename;
                      setRenameTarget(cur || '');
                      setNewNameInput((cur || '').replace(/\.[^/.]+$/, ''));
                    }}
                  >
                    <EditIcon />
                    <span>Rename Reel</span>
                  </button>
                </div>

                {/* Inline Rename Form Modal/Bar */}
                {renameTarget && (
                  <div style={{ marginTop: 16, padding: 14, background: 'rgba(255,255,255,0.05)', borderRadius: 8 }}>
                    <div style={{ fontSize: 12, fontWeight: 700, marginBottom: 8, color: 'var(--accent-cyan)' }}>
                      Rename "{renameTarget}"
                    </div>
                    <div style={{ display: 'flex', gap: 10 }}>
                      <input
                        type="text"
                        className="form-input"
                        value={newNameInput}
                        onChange={(e) => setNewNameInput(e.target.value)}
                        placeholder="Enter new file name..."
                      />
                      <button
                        className="btn-secondary"
                        style={{ flex: '0 0 auto', padding: '0 16px', background: 'var(--accent-crimson)' }}
                        onClick={handleRename}
                      >
                        Save
                      </button>
                      <button
                        className="btn-secondary"
                        style={{ flex: '0 0 auto', padding: '0 12px' }}
                        onClick={() => setRenameTarget('')}
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div style={{ padding: 40, textAlign: 'center', color: 'var(--text-muted)' }}>
                <VideoIcon />
                <div style={{ marginTop: 12, fontWeight: 600 }}>No Rendered Videos Yet</div>
                <div style={{ fontSize: 12, marginTop: 4 }}>
                  Select your raw video, pick a color palette, and hit generate to render your first reel!
                </div>
              </div>
            )}
          </div>
        </section>
      </main>}
    </div>
  );
};

const root = createRoot(document.getElementById('root')!);
root.render(<AuthGate><App /></AuthGate>);

