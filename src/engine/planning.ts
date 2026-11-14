import type {CaptionSegment,EntityAsset,GraphicSegment} from '../types/project';
import {DEFAULT_ENTITIES} from '../config/entities';
import {findEntityMentions} from './entities';

export function planEntityGraphics(captions:CaptionSegment[],duration:number,fps:number,entities:EntityAsset[]=DEFAULT_ENTITIES):GraphicSegment[]{
  const seen=new Set<string>();
  const candidates:GraphicSegment[]=[];
  for(const mention of findEntityMentions(captions,entities.filter(e=>e.kind==='brand'),fps)){
    const {entity,startFrame}=mention;
    if(seen.has(entity.id))continue;
    seen.add(entity.id);
    candidates.push({id:`brand-${entity.id}-${startFrame}`,type:'logo-spotlight',region:'visuals',label:entity.name,
      logo:{brand:entity.brand??'custom',src:entity.src,glowColor:entity.accent},startFrame,endFrame:Math.min(duration,startFrame+fps*3)});
  }
  return candidates.map((item,i)=>({...item,endFrame:Math.min(item.endFrame,candidates[i+1]?.startFrame??duration)})).filter(item=>item.endFrame>item.startFrame);
}
