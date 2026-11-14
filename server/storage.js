const fs=require('node:fs'),path=require('node:path');
const {fail}=require('./files');
function createStorage({directory,reserveMb=Number(process.env.DISK_RESERVE_MB||2048),probe=target=>fs.statfsSync(target)}={}){
  if(!Number.isFinite(reserveMb)||reserveMb<64)throw Error('DISK_RESERVE_MB must be at least 64');
  let reserved=0;
  const snapshot=()=>{let target=directory;while(!fs.existsSync(target)){const parent=path.dirname(target);if(parent===target)throw Error('Storage directory is unavailable');target=parent;}const stat=probe(target);return {freeBytes:Number(stat.bavail)*Number(stat.bsize),totalBytes:Number(stat.blocks)*Number(stat.bsize),reserveBytes:reserveMb*1048576,reservedBytes:reserved};};
  function check(bytes=0){const info=snapshot();if(info.freeBytes-info.reservedBytes<info.reserveBytes+bytes)fail('Insufficient disk space. Download a backup and remove unneeded videos before starting more work; no files were deleted.',507);return info;}
  function reserve(bytes){check(bytes);reserved+=bytes;let released=false;return()=>{if(!released){released=true;reserved-=bytes;}};}
  return {snapshot,check,reserve};
}
module.exports={createStorage};
