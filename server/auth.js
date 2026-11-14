const {randomBytes,createHash,timingSafeEqual}=require('node:crypto');
const digest=value=>createHash('sha256').update(value).digest();
function installAuth(app,{password=process.env.STUDIO_PASSWORD||'',required=process.env.REQUIRE_AUTH==='true',now=Date.now}={}){
  if(required&&password.length<12)throw Error('Set STUDIO_PASSWORD to at least 12 characters before starting a hosted studio.');
  if(password&&password.length<12)throw Error('STUDIO_PASSWORD must contain at least 12 characters.');
  const sessions=new Map(),attempts=new Map();
  const cookie=req=>String(req.headers.cookie||'').split(';').map(p=>p.trim()).find(p=>p.startsWith('studio_session='))?.slice(15);
  const authenticated=req=>!password||(sessions.get(cookie(req))??0)>now();
  app.get('/api/auth/status',(req,res)=>res.json({required:Boolean(password),authenticated:authenticated(req)}));
  app.post('/api/auth/login',(req,res)=>{
    if(!password)return res.json({authenticated:true});
    const client=req.ip||req.socket.remoteAddress;
    const prior=attempts.get(client);if(prior&&prior.until>now()&&prior.count>=10)return res.status(429).json({error:'Too many login attempts. Try again in 15 minutes.'});
    if(typeof req.body.password!=='string'||req.body.password.length>1000||!timingSafeEqual(digest(req.body.password),digest(password))){
      attempts.set(client,prior&&prior.until>now()?{...prior,count:prior.count+1}:{count:1,until:now()+15*60000});
      if(attempts.size>1000)for(const [key,value] of attempts)if(value.until<now())attempts.delete(key);
      return res.status(401).json({error:'Incorrect studio password'});
    }
    attempts.delete(client);for(const [key,expiry] of sessions)if(expiry<now())sessions.delete(key);
    if(sessions.size>=100)sessions.delete(sessions.keys().next().value);
    const token=randomBytes(32).toString('hex');sessions.set(token,now()+24*3600000);
    res.cookie('studio_session',token,{httpOnly:true,sameSite:'strict',secure:process.env.STUDIO_SECURE_COOKIE==='true'||req.secure,maxAge:24*3600000,path:'/'});res.json({authenticated:true});
  });
  app.use('/api',(req,res,next)=>{
    if(req.path==='/health')return next();
    if(!authenticated(req))return res.status(401).json({error:'Unlock the studio to continue'});
    if(password&&!['GET','HEAD','OPTIONS'].includes(req.method)&&req.headers.origin){
      try{if(new URL(req.headers.origin).host!==req.get('host'))return res.status(403).json({error:'Cross-origin requests are not allowed'});}catch{return res.status(403).json({error:'Invalid request origin'});}
    }
    next();
  });
  app.post('/api/auth/logout',(req,res)=>{sessions.delete(cookie(req));res.clearCookie('studio_session',{path:'/'});res.json({authenticated:false});});
  return {enabled:Boolean(password)};
}
module.exports={installAuth};
