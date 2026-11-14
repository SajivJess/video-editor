import React from 'react';
import {spring,useCurrentFrame,useVideoConfig} from 'remotion';
import type {GraphicSegment} from '../../types/project';
export const ProcessDiagram:React.FC<{graphic:GraphicSegment;accent?:string;accentText?:string}>=({graphic:g,accent='#C8102E',accentText='#FFF5E6'})=>{
  const local=useCurrentFrame()-g.startFrame,{fps}=useVideoConfig(),duration=g.endFrame-g.startFrame;
  const steps=g.steps??['INPUT','PROCESS','OUTPUT'];
  const active=Math.min(steps.length-1,Math.floor(local/Math.max(1,duration/steps.length)));
  const compare=g.type==='comparison';
  return <div data-visual-treatment={compare?'versus':'connected-process'} style={{width:'100%',height:610,position:'relative',fontFamily:'"Barlow Condensed", "Noto Sans Tamil", sans-serif',color:'#FFF5E6',textShadow:'0 3px 0 #101015,0 6px 18px #0009'}}>
    <div style={{textAlign:'center',fontSize:76,lineHeight:1,position:'absolute',top:18,left:0,right:0,WebkitTextStroke:'1px #101015'}}>{g.label}</div>
    <div style={{display:'flex',alignItems:'center',gap:16,position:'absolute',left:0,right:0,top:215}}>
      {steps.map((step,index)=>{const p=spring({frame:Math.max(0,local-index*7),fps,config:{damping:14,stiffness:180,mass:.7}});
        return <React.Fragment key={`${step}-${index}`}>
          {index>0&&<div style={{width:compare?48:42,flexShrink:0,textAlign:'center',fontSize:compare?42:46,color:accent,transform:`scale(${p})`}}>{compare?'VS':'→'}</div>}
          <div style={{position:'relative',flex:1,minWidth:0,height:compare?210:180,display:'flex',alignItems:'center',justifyContent:'center',flexDirection:'column',gap:14,
            background:active===index?accent:'#101015E8',color:active===index?accentText:'#FFF5E6',border:`2px solid ${active===index?'#FFF5E6':accent}`,clipPath:compare?'polygon(5% 0,100% 0,95% 100%,0 100%)':undefined,borderRadius:compare?0:20,
            boxShadow:'0 12px 25px #0005',opacity:Math.min(1,p),transform:`translateY(${(1-p)*65+Math.sin(local/24+index)*5}px) scale(${.82+.18*p}) rotate(${compare?(index===0?-3:3):0}deg)`}}>
            <div style={{fontSize:20,letterSpacing:3,opacity:.65}}>{compare?'CONTENDER':`0${index+1}`}</div>
            <div style={{fontSize:compare?Math.min(92,450/(step.length*.5)):steps.length>3?30:48,textAlign:'center',lineHeight:1}}>{step}</div>
            {!compare&&<div style={{width:`${active===index?78:25}%`,height:4,background:'#FFF5E6',opacity:.65}}/>}
          </div>
        </React.Fragment>;
      })}
    </div>
    <div style={{position:'absolute',bottom:50,left:10,right:10,textAlign:'center',fontSize:30,letterSpacing:2}}>{g.value}</div>
    <svg viewBox="0 0 900 16" style={{position:'absolute',bottom:16,width:'100%',height:16}}><path d="M10 8H890" stroke={accent} strokeWidth="4" pathLength="1" strokeDasharray="1" strokeDashoffset={1-Math.min(1,local/18)}/><circle cx={10+880*((local%60)/60)} cy="8" r="6" fill="#FFF5E6"/></svg>
  </div>;
};
