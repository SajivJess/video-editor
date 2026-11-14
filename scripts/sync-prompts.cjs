const fs=require('node:fs');
const path=require('node:path');
const {randomUUID}=require('node:crypto');
function syncPrompts(target,source=path.resolve(__dirname,'..','prompts')){
  if(!target||!fs.statSync(target).isDirectory())throw Error('Supply an existing destination directory');
  const names=['meta.txt','gemini.txt','claude.txt'];
  const contents=names.map(name=>fs.readFileSync(path.join(source,name)));
  // Complete every backup before performing the first replacement.
  const backup=path.join(path.resolve(target),'prompt-backups',new Date().toISOString().replace(/[:.]/g,'-')+'-'+randomUUID().slice(0,8));
  fs.mkdirSync(backup,{recursive:true});
  for(const name of names)fs.copyFileSync(path.join(target,name),path.join(backup,name),fs.constants.COPYFILE_EXCL);
  const replaced=[];
  try{for(let i=0;i<names.length;i++){const temporary=path.join(target,names[i]+'.new-'+randomUUID());fs.writeFileSync(temporary,contents[i]);fs.renameSync(temporary,path.join(target,names[i]));replaced.push(names[i]);}}
  catch(error){for(const name of replaced)fs.copyFileSync(path.join(backup,name),path.join(target,name));throw error;}
  return backup;
}
if(require.main===module){try{console.log('Previous files backed up to '+syncPrompts(process.argv[2]));}catch(error){console.error(error.message);process.exitCode=1;}}
module.exports={syncPrompts};
