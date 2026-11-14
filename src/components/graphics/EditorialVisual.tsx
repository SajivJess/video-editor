import React from 'react';
import {interpolate,spring,useCurrentFrame,useVideoConfig} from 'remotion';
import type {GraphicSegment,ThemeSettings} from '../../types/project';
import {mediaSource} from '../../utils/media';
import {VectorIcon} from './Icons';

/** Floating visual grammar: logos, metric reveals and editorial words each have distinct choreography. */
export const EditorialVisual:React.FC<{graphic:GraphicSegment;theme?:Partial<ThemeSettings>}>=({graphic:g,theme})=>{
  const frame=useCurrentFrame(),{fps}=useVideoConfig(),local=frame-g.startFrame;
  const duration=g.endFrame-g.startFrame;
  const enter=spring({frame:local,fps,config:{damping:16,stiffness:190,mass:.65}});
  const exit=interpolate(local,[duration-4,duration],[1,0],{extrapolateLeft:'clamp',extrapolateRight:'clamp'});
  const accent=g.logo?.glowColor??theme?.accentColor??'#C8102E';
  const logo=g.logo?.brand&&({nvidia:'nvidia',openai:'openai',gemini:'googlegemini',claude:'claude',custom:null}[g.logo.brand]);
  const metric=['stat','stat-card','collage-card'].includes(g.type);
  const title=g.logo?.label??g.label;
  const base:React.CSSProperties={width:'100%',height:610,position:'relative',color:theme?.primaryText??'#FFF5E6',fontFamily:'"Barlow Condensed", "Noto Sans Tamil", sans-serif',opacity:enter*exit,
    transform:`translateY(${(1-enter)*46}px)`,textShadow:'0 3px 0 #101015,0 8px 22px #000A'};
  const logoSrc=g.logo?.src??(logo?`logos/${logo}.svg`:undefined);
  if(logoSrc)return <div data-visual-treatment="floating-brand" style={{...base,display:'flex',flexDirection:'column',alignItems:'center',justifyContent:'center',gap:22}}>
    <div style={{width:280,height:230,position:'relative',transform:`scale(${.65+.35*enter}) rotate(${(1-enter)*-12}deg)`}}>
      <svg width="320" height="280" viewBox="0 0 320 280" style={{position:'absolute',left:-20,top:-25,opacity:.8,transform:`rotate(${local*.5}deg)`}}>
        <ellipse cx="160" cy="140" rx="150" ry="125" fill="none" stroke={accent} strokeWidth="2" strokeDasharray="22 20"/>
        <circle cx="310" cy="140" r="7" fill={accent}/>
      </svg>
      <div style={{position:'absolute',inset:28,backgroundColor:accent,maskImage:`url("${mediaSource(logoSrc)}")`,maskSize:'contain',maskRepeat:'no-repeat',maskPosition:'center',WebkitMaskImage:`url("${mediaSource(logoSrc)}")`,WebkitMaskSize:'contain',WebkitMaskRepeat:'no-repeat',WebkitMaskPosition:'center',filter:'drop-shadow(0 8px 10px #0007)'}}/>
    </div>
    <div style={{fontSize:108,lineHeight:1,textAlign:'center',letterSpacing:-1,WebkitTextStroke:'1px #101015'}}>{title}</div>
    {g.value&&<div style={{fontSize:26,letterSpacing:3,padding:'6px 18px',borderBottom:`4px solid ${accent}`,background:'#101015A0'}}>{g.value}</div>}
  </div>;
  if(metric)return <div data-visual-treatment="metric-reveal" style={{...base,display:'flex',flexDirection:'column',alignItems:'center',justifyContent:'center',gap:12}}>
    <div style={{fontSize:28,letterSpacing:5}}>{title}</div>
    <div style={{display:'flex',gap:2,justifyContent:'center',fontSize:220,lineHeight:1,color:accent,WebkitTextStroke:'2px #FFF5E6',letterSpacing:-5}}>
      {[...(g.value??'')].map((char,index)=>{const p=spring({frame:Math.max(0,local-index*2),fps,config:{damping:15,stiffness:230}});return <span key={index} style={{display:'inline-block',opacity:p,transform:`translateY(${(1-p)*80}px) rotate(${(1-p)*12}deg)`}}>{char}</span>;})}
    </div>
    <div style={{height:8,width:`${enter*70}%`,background:accent,transform:'rotate(-2deg)',boxShadow:'0 3px 0 #FFF5E6'}}/>
    <div style={{fontSize:38,letterSpacing:2,marginTop:18}}>{g.person?.title??g.value}</div>
  </div>;
  const words=title.split(/\s+/);
  return <div data-visual-treatment="editorial-reveal" style={{...base,display:'flex',alignItems:'center',justifyContent:'center',flexDirection:'column',gap:18}}>
    <div style={{transform:`translateX(${Math.sin(local/18)*9}px) rotate(${(1-enter)*-15}deg) scale(${enter})`}}><VectorIcon name={g.iconName??'sparkle'} size={88} color={accent}/></div>
    <div style={{textAlign:'center',maxWidth:'98%',display:'flex',justifyContent:'center',flexWrap:'wrap',gap:'8px 20px'}}>
      {words.map((word,index)=>{const p=spring({frame:Math.max(0,local-index*3),fps,config:{damping:17,stiffness:230}});return <span key={index} style={{fontSize:words.length>3?90:108,lineHeight:.98,display:'inline-block',WebkitTextStroke:'1px #101015',opacity:p,transform:`translateY(${(1-p)*38}px) rotate(${index===words.length-1?-2:0}deg)`,padding:index===words.length-1?'3px 14px 10px':0,background:index===words.length-1?accent:undefined,color:index===words.length-1?theme?.pillTextColor:undefined}}>{word}</span>;})}
    </div>
    {g.value&&<div style={{fontSize:25,letterSpacing:2,textAlign:'center',maxWidth:'85%',background:'#101015B0',padding:'6px 14px'}}>{g.value}</div>}
  </div>;
};
