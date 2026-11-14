import React from 'react';
import {interpolate,useCurrentFrame} from 'remotion';
import type {SceneTransition} from '../../types/project';

/** Brief full-frame editorial punctuation. Never a narration cut or a lingering face overlay. */
export const SceneTransitionTrack:React.FC<{transitions?:SceneTransition[]}>=({transitions=[]})=>{
  const frame=useCurrentFrame();
  const item=transitions.find(t=>frame>=t.startFrame&&frame<t.endFrame);
  if(!item)return null;
  const p=(frame-item.startFrame)/Math.max(1,item.endFrame-item.startFrame-1);
  const envelope=Math.sin(p*Math.PI);
  const x=interpolate(p,[0,1],[-160,160]);
  return <div style={{position:'absolute',inset:0,pointerEvents:'none',zIndex:30,overflow:'hidden'}}>
    {item.type==='diagonal-wipe' ? <div style={{position:'absolute',top:'-25%',bottom:'-25%',width:'48%',left:`${x}%`,background:item.color??'#C8102E',transform:'skewX(-24deg)',boxShadow:'20px 0 0 #FFF5E6, 42px 0 0 #141419'}}/> :
    item.type==='whip-pan' ? <div style={{position:'absolute',inset:0,opacity:envelope*.45,background:`linear-gradient(100deg,transparent 15%,${item.color??'#C8102E'} 48%,#FFF5E6 50%,transparent 52%)`,transform:`translateX(${(p-.5)*130}%) skewX(-18deg)`}}/> :
      <div style={{position:'absolute',inset:0,opacity:envelope*.25,background:'radial-gradient(ellipse,transparent 15%,#FFF5E6 100%)',transform:`scale(${.7+p*.8})`}}/>}
  </div>;
};
