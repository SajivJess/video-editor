import React from 'react';
import {interpolate,spring,useCurrentFrame,useVideoConfig} from 'remotion';
import {groupCaptionWords} from '../../engine/captions';
import {captionArtDirection} from '../../engine/captionStyle';
import {highlightKeywords} from '../../utils/text';
import {REEL_TEMPLATE} from '../../config/reelTemplate';
import type {AnimationSettings,WordTiming} from '../../types/project';
export interface ModernWord extends WordTiming {}
export interface ModernCaptionProps {
  words:ModernWord[];startFrame:number;endFrame:number;accentColor?:string;textColor?:string;pillTextColor?:string;fontFamily?:string;fontSize?:number;
  maxWords?:number;keywords?:string[];animation?:AnimationSettings;fontWeight?:number;borderRadius?:number;treatment?:'expressive'|'clean';
}
export const ModernCaption:React.FC<ModernCaptionProps>=({words,startFrame,endFrame,accentColor='#C8102E',textColor='#FFF5E6',pillTextColor,
  fontFamily='"Barlow Condensed", "Noto Sans Tamil", sans-serif',fontSize=94,maxWords=3,keywords=[],animation,fontWeight=800,treatment='expressive'})=>{
  const frame=useCurrentFrame();const {fps,width}=useVideoConfig();
  if(frame<startFrame||frame>=endFrame)return null;
  const group=groupCaptionWords(words,endFrame,maxWords).find(item=>frame>=item.startFrame&&frame<item.endFrame);
  if(!group)return null;
  const matches=highlightKeywords(group.words.map(w=>w.word).join(' '),keywords);
  const timed=group.words.map((word,index)=>({...word,emphasis:word.emphasis||matches[index]?.highlight}));
  const direction=captionArtDirection(timed);
  const visible=timed.map((word,index)=>({word,index})).filter(({word})=>frame>=word.startFrame);
  const expressive=treatment==='expressive';
  const scale=width/1080;
  const groupPop=spring({frame:frame-group.startFrame,fps,config:{damping:18,stiffness:230,mass:.55}});
  const opacity=animation?.entrance==='fade'?Math.min(1,(frame-group.startFrame+1)/Math.max(1,animation.duration)):1;
  return <div data-caption-treatment={expressive?direction.layout:'clean'} style={{width:'100%',maxWidth:'100%',display:'flex',flexWrap:'wrap',gap:expressive?'9px 18px':'8px 14px',alignItems:'center',justifyContent:'center',
    textAlign:'center',opacity,transform:`translateY(${(1-groupPop)*22}px)`,lineHeight:1}}>
    {visible.map(({word,index})=>{
      const hero=expressive&&index===direction.hero;
      const plate=hero&&direction.plate;
      const active=frame>=word.startFrame&&frame<word.endFrame;
      const pop=spring({frame:frame-word.startFrame,fps,config:{damping:15,stiffness:285,mass:.46}});
      const tamil=/[\u0B80-\u0BFF]/.test(word.word);
      const target=expressive?(hero?(direction.layout==='number'?154:REEL_TEMPLATE.captions.heroSize):REEL_TEMPLATE.captions.supportingSize):fontSize;
      const size=Math.min(target*scale,width*.77/(Math.max(1,[...word.word].length)*(tamil?.84:hero?.5:.65)));
      const wipe=interpolate(frame-word.startFrame,[0,5],[0,1],{extrapolateLeft:'clamp',extrapolateRight:'clamp'});
      return <div key={`${word.startFrame}-${index}`} style={{maxWidth:'100%',flexBasis:hero&&direction.layout==='stacked'?'100%':undefined,display:'flex',justifyContent:'center'}}>
        <span style={{position:'relative',display:'inline-block',maxWidth:'100%',overflowWrap:'anywhere',padding:plate?'4px 22px 11px':'3px 0 10px',
          fontFamily:hero||!expressive?fontFamily:'"Noto Sans Tamil", sans-serif',fontSize:size,fontWeight:hero?800:expressive?700:fontWeight,
          lineHeight:1.04,letterSpacing:hero?'-.02em':'-.035em',color:plate?(pillTextColor??textColor):textColor,textTransform:hero||!expressive?'uppercase':'none',
          transform:`translateY(${(1-pop)*24}px) scale(${(.82+.18*pop)*(active&&hero?1.035:1)}) rotate(${plate?-2:0}deg)`,
          textShadow:plate?'0 2px 2px #0003':'0 3px 0 #111117, 0 6px 14px #000C',WebkitTextStroke:hero&&!plate?'1px #111117':undefined}}>
          {plate&&<span style={{position:'absolute',inset:0,zIndex:-1,background:accentColor,borderRadius:3,transform:`scaleX(${wipe})`,transformOrigin:'left center',boxShadow:'7px 8px 0 #111117',clipPath:'polygon(2% 0,100% 0,98% 100%,0 100%)'}}/>}
          {word.word}
          {((hero&&!plate)||(!expressive&&word.emphasis))&&<span style={{position:'absolute',bottom:1,left:0,right:0,height:6,background:accentColor,transform:`scaleX(${wipe}) rotate(-1deg)`,transformOrigin:'left'}}/>}
        </span>
      </div>;
    })}
  </div>;
};
