if(require.main===module)require('./env').loadEnv();
const express=require('express');
const multer=require('multer');
const fs=require('node:fs');
const path=require('node:path');
const {randomUUID}=require('node:crypto');
const pipeline=require('./pipeline');
const {fail,localFile}=require('./files');
const {researchRoutes}=require('./research-routes');
const {automationRoutes}=require('./automation-routes');
const {installAuth}=require('./auth');
const {spawn}=require('node:child_process');
const {runtime}=require('./runtime');
const {createStorage}=require('./storage');

function createApp(engine=pipeline,researchOptions={}){
  const app=express();
  app.set('trust proxy','loopback');
  app.use(express.json({limit:'1mb'}));
  installAuth(app,researchOptions.auth);
  const storage=engine.storage??createStorage({directory:engine.outputDir});
  app.use('/api/research',researchRoutes({root:engine.root,outputDir:engine.outputDir,...researchOptions}));
  app.use('/api/automation',automationRoutes({root:engine.root,outputDir:engine.outputDir,...researchOptions.aiOptions}));
  app.get('/api/health',(req,res)=>res.json({status:'online',palettes:pipeline.PALETTES.length,queued:engine.listJobs().filter(job=>job.status==='pending').length}));
  app.get('/api/storage',(req,res)=>res.json(storage.snapshot()));
  app.get('/api/backup',(req,res)=>{
    if(engine.listJobs().some(job=>['pending','processing'].includes(job.status)))fail('Wait for video jobs to finish before downloading a consistent backup',409);
    const child=spawn(runtime(engine.root).python,[path.join(__dirname,'../scripts/backup.py'),'--root',engine.root],{windowsHide:true,stdio:['ignore','pipe','pipe']});let stderr='';
    child.stderr.on('data',chunk=>{stderr=(stderr+chunk.toString()).slice(-2000);});
    child.once('error',error=>{if(!res.headersSent)res.status(500).json({error:'Cannot start backup: '+error.message});else res.destroy();});
    res.type('application/gzip').attachment('reel-studio-backup-'+new Date().toISOString().slice(0,10)+'.tar.gz');child.stdout.pipe(res);
    child.once('close',code=>{if(code&& !res.writableEnded)res.destroy(Error('Backup failed: '+stderr));});res.on('close',()=>{if(child.exitCode===null)child.kill();});
  });
  app.get('/api/palettes',(req,res)=>res.json({palettes:pipeline.PALETTES}));
  app.get('/api/projects',(req,res)=>res.json({projects:engine.listProjects()}));
  app.get('/api/projects/:id',(req,res)=>res.json({project:engine.loadProject(req.params.id)}));
  app.get('/api/videos',(req,res)=>{
    const rawVideos=[],renderedVideos=[];
    for(const dir of [engine.publicVideoDir,path.join(engine.root,'Input')]){
      if(!fs.existsSync(dir))continue;
      for(const filename of fs.readdirSync(dir).filter(file=>/\.(mp4|mov|webm)$/i.test(file))){
        try{const file=localFile(dir,filename,['.mp4','.mov','.webm']);const stat=fs.statSync(file);rawVideos.push({filename,path:file,sizeMb:(stat.size/1048576).toFixed(1),mtime:stat.mtimeMs});}catch{}
      }
    }
    for(const filename of fs.readdirSync(engine.outputDir).filter(file=>/\.(mp4|mov|webm)$/i.test(file))){
      try{
        const file=localFile(engine.outputDir,filename,['.mp4','.mov','.webm']);const stat=fs.statSync(file);
        let qa=null;
        try{qa=JSON.parse(fs.readFileSync(file+'.qa.json','utf8'));}catch{}
        renderedVideos.push({filename,url:`/api/stream/${encodeURIComponent(filename)}`,downloadUrl:`/api/download/${encodeURIComponent(filename)}`,sizeMb:(stat.size/1048576).toFixed(1),mtime:stat.mtimeMs,verified:Boolean(qa&&Array.isArray(qa.errors)&&qa.errors.length===0),qa});
      }catch{}
    }
    rawVideos.sort((a,b)=>b.mtime-a.mtime);renderedVideos.sort((a,b)=>b.mtime-a.mtime);
    res.json({rawVideos,renderedVideos});
  });
  const upload=multer({
    storage:multer.diskStorage({destination:engine.publicVideoDir,filename:(req,file,done)=>done(null,`upload-${randomUUID()}${path.extname(file.originalname).toLowerCase()}`)}),
    limits:{fileSize:2*1024*1024*1024,files:1},
    fileFilter:(req,file,done)=>/\.(mp4|mov|webm)$/i.test(file.originalname)?done(null,true):done(Object.assign(new Error('Upload an MP4, MOV or WEBM video'),{status:400})),
  });
  app.post('/api/upload',(req,res,next)=>{
    try{const bytes=Number(req.get('content-length'))||2*1024**3;const release=storage.reserve(Math.min(bytes,2*1024**3));res.once('finish',release);res.once('close',release);next();}catch(error){next(error);}
  },upload.single('video'),(req,res)=>{
    if(!req.file)fail('No video file provided');
    res.status(201).json({filename:req.file.filename,path:req.file.path,sizeMb:(req.file.size/1048576).toFixed(1)});
  });
  app.post('/api/generate',(req,res)=>{
    const job=engine.createJob(req.body);
    res.status(202).json({jobId:job.id,job});
  });
  app.get('/api/jobs',(req,res)=>res.json({jobs:engine.listJobs()}));
  app.get('/api/jobs/:id',(req,res)=>{
    const job=engine.getJob(req.params.id);if(!job)fail('Job not found',404);res.json(job);
  });
  app.post('/api/jobs/:id/retry',(req,res)=>res.status(202).json({job:engine.retryJob(req.params.id)}));
  for(const [route,property] of [['project','projectFile'],['review','reviewFile']]){
    app.get(`/api/jobs/:id/${route}`,(req,res)=>{
      const job=engine.getJob(req.params.id);if(!job)fail('Job not found',404);
      if(!job[property]||!fs.existsSync(job[property]))fail('This report is not available yet',404);
      res.download(job[property],`${job.stem}-${route}.json`,{dotfiles:'allow'});
    });
  }
  app.post('/api/rename',(req,res)=>{
    if(!req.body.oldFilename||typeof req.body.newName!=='string'||!req.body.newName.trim())fail('Choose a reel and enter a new name');
    res.json(engine.renameReel(req.body.oldFilename,req.body.newName));
  });
  app.get('/api/stream/:filename',(req,res)=>res.sendFile(localFile(engine.outputDir,req.params.filename,['.mp4','.mov','.webm'])));
  app.get('/api/download/:filename',(req,res)=>res.download(localFile(engine.outputDir,req.params.filename,['.mp4','.mov','.webm']),req.params.filename));
  app.use('/api',(req,res)=>res.status(404).json({error:'API route not found'}));
  app.use(express.static(path.join(__dirname,'public')));
  app.get('/',(req,res)=>res.sendFile(path.join(__dirname,'public','index.html')));
  app.use((error,req,res,next)=>{
    if(res.headersSent)return next(error);
    const status=error.code==='LIMIT_FILE_SIZE'?413:error.status||500;
    res.status(status).json({error:error.code==='LIMIT_FILE_SIZE'?'Video exceeds the 2 GB upload limit':error.message});
  });
  return app;
}
if(require.main===module){
  const port=Number(process.env.PORT||3000);
  createApp().listen(port,process.env.HOST||'127.0.0.1',error=>{
    if(error){console.error(`Cannot start studio on port ${port}: ${error.message}`);process.exitCode=1;return;}
    console.log(`Reel AI Studio: http://localhost:${port}`);
  });
}
module.exports={createApp};
