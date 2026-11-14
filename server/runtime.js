const fs=require('node:fs'),path=require('node:path');
function runtime(root,env=process.env){
  const python=env.REEL_PYTHON||[path.join(root,'.venv','Scripts','python.exe'),path.join(root,'.venv','bin','python')].find(fs.existsSync)||(process.platform==='win32'?'python.exe':'python3');
  const localModel=path.join(root,'.models','large-v3-local');
  const model=env.WHISPER_MODEL||(fs.existsSync(path.join(localModel,'model.bin'))?localModel:'large-v3');
  const concurrency=Number(env.RENDER_CONCURRENCY||1);if(!Number.isInteger(concurrency)||concurrency<1||concurrency>8)throw Error('RENDER_CONCURRENCY must be 1–8');
  return {python,model,concurrency};
}
module.exports={runtime};
