import type { CaptionSegment, EntityAsset, GraphicSegment } from '../types/project';
import { REEL_TEMPLATE } from '../config/reelTemplate';

const normalize = (text: string) => text.normalize('NFC').toLowerCase().replace(/['’]s$/u, '').replace(/[^\p{L}\p{N}]/gu, '');

/** Search timed words across caption boundaries for any registered person or brand. */
export function findEntityMentions(captions:CaptionSegment[],entities:EntityAsset[],fps:number){
  const words=captions.flatMap(c=>c.words??[]).flatMap(word=>word.word.split(/[\s-]+/).map(token=>({...word,token:normalize(token)}))).filter(word=>word.token).sort((a,b)=>a.startFrame-b.startFrame);
  const matches:{entity:EntityAsset;startFrame:number;endFrame:number}[]=[];
  for(const entity of entities)for(const alias of entity.aliases){
    const tokens=alias.split(/\s+/).map(normalize).filter(Boolean);
    for(let i=0;i<=words.length-tokens.length;i++){
      const span=words.slice(i,i+tokens.length);
      if(!tokens.length||!tokens.every((token,j)=>token===span[j].token))continue;
      if(span.at(-1)!.endFrame-span[0].startFrame>fps*2)continue;
      if(matches.some(m=>m.entity.id===entity.id&&m.startFrame===span[0].startFrame))continue;
      matches.push({entity,startFrame:span[0].startFrame,endFrame:span.at(-1)!.endFrame});
    }
  }
  return matches.sort((a,b)=>a.startFrame-b.startFrame);
}

export function planPersonMentions(captions:CaptionSegment[],entities:EntityAsset[],duration:number,fps:number):GraphicSegment[]{
  const mentions:GraphicSegment[]=findEntityMentions(captions,entities.filter(e=>e.kind==='person'),fps).map(({entity,startFrame,endFrame})=>({
    id:`person-${entity.id}-${startFrame}`,type:'person-pictorial',region:'visuals',label:entity.name,
    person:{name:entity.name,src:entity.src,accent:entity.accent},startFrame,
    endFrame:Math.min(duration,Math.max(startFrame+Math.round(fps*REEL_TEMPLATE.people.minSeconds),endFrame+Math.round(fps*REEL_TEMPLATE.people.tailSeconds)))}));
  return mentions.map((item,i)=>({...item,endFrame:Math.min(item.endFrame,mentions[i+1]?.startFrame??duration)})).filter(item=>item.endFrame>item.startFrame);
}

/** Split existing visuals around person cues instead of stacking an unrelated card behind a portrait. */
export function prioritizePersonMentions(graphics: GraphicSegment[], people: GraphicSegment[]): GraphicSegment[] {
  const result: GraphicSegment[]=[];
  const mentionedNames=new Set(people.map(person=>normalize(person.person?.name??person.label)));
  for(const graphic of graphics.filter(g=>g.type!=='person-pictorial'||!mentionedNames.has(normalize(g.person?.name??g.label)))) {
    if(graphic.region!=='visuals') {result.push(graphic);continue;}
    let parts=[graphic];
    for(const person of people) {
      parts=parts.flatMap(part=> {
        if(person.endFrame<=part.startFrame||person.startFrame>=part.endFrame)return [part];
        const split:GraphicSegment[]=[];
        if(part.startFrame<person.startFrame)split.push({...part,endFrame:person.startFrame});
        if(part.endFrame>person.endFrame)split.push({...part,id:`${part.id}-after-${person.id}`,startFrame:person.endFrame});
        return split;
      });
    }
    result.push(...parts);
  }
  return [...result,...people].sort((a,b)=>a.startFrame-b.startFrame);
}
