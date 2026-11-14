import React,{useEffect,useState} from 'react';
export function StorageStatus(){
  const [space,setSpace]=useState<{freeBytes:number;reserveBytes:number}|null>(null);
  useEffect(()=>{let cancelled=false;fetch('/api/storage').then(r=>r.ok?r.json():null).then(value=>{if(!cancelled)setSpace(value);}).catch(()=>{});return()=>{cancelled=true;};},[]);
  return <div className="studio-storage">{space&&<span>{(space.freeBytes/1024**3).toFixed(1)} GB free{space.freeBytes<space.reserveBytes?' · storage full':''}</span>}<a href="/api/backup" className="btn-secondary">Download studio backup</a></div>;
}
