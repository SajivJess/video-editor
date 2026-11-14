import type {WordTiming} from '../types/project';

export function captionArtDirection(words:WordTiming[]) {
  const number=words.findIndex(w=>/\d/.test(w.word));
  const negative=words.findIndex(w=>/aagala|illa|never|\bnot\b|\bno\b/i.test(w.word));
  const emphasized=words.map((w,i)=>({w,i})).filter(item=>item.w.emphasis).sort((a,b)=>b.w.word.length-a.w.word.length)[0]?.i;
  const longest=words.reduce((best,w,i)=>w.word.length>(words[best]?.word.length??0)?i:best,0);
  const hero=number>=0?number:negative>=0?negative:emphasized??longest;
  return {hero,layout:number>=0?'number':words.length<=2?'impact':'stacked',plate:number>=0||negative>=0||Boolean(words[hero]?.emphasis)} as const;
}
