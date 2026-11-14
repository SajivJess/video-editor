const fs=require('node:fs');
const path=require('node:path');
const {parseEnv}=require('node:util');
function loadEnv(root=path.resolve(__dirname,'..')){
  const candidates=[...(process.env.STUDIO_ENV_FILE?[process.env.STUDIO_ENV_FILE]:[]),path.join(root,'.env'),...(process.env.LOCALAPPDATA?[path.join(process.env.LOCALAPPDATA,'SajivReelStudio','ai.env')]:[])];
  for(const file of candidates)if(fs.existsSync(file))for(const [key,value] of Object.entries(parseEnv(fs.readFileSync(file,'utf8'))))if(process.env[key]===undefined)process.env[key]=value;
}
module.exports={loadEnv};
