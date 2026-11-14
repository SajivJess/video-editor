import React from 'react';
import { Img, interpolate, spring, useCurrentFrame, useVideoConfig } from 'remotion';
import type { GraphicSegment } from '../../types/project';
import { mediaSource } from '../../utils/media';

/** A person is represented by the real photo only. No panel, heading, initials, or nameplate. */
export const PersonCutout: React.FC<{graphic:GraphicSegment}> = ({graphic}) => {
  const frame=useCurrentFrame()-graphic.startFrame;
  const {fps}=useVideoConfig();
  if(!graphic.person?.src)return null;
  const duration=graphic.endFrame-graphic.startFrame;
  const enter=spring({frame,fps,config:{damping:14,stiffness:210,mass:.65}});
  const exit=interpolate(frame,[duration-4,duration],[1,0],{extrapolateLeft:'clamp',extrapolateRight:'clamp'});
  return <div data-visual-treatment="person-cutout-only" style={{width:'100%',height:'100%',maxHeight:700,display:'flex',justifyContent:'center',alignItems:'flex-end',opacity:Math.min(1,enter)*exit,
    transform:`translate3d(${(1-enter)*110}px,${(1-enter)*55}px,0) rotate(${(1-enter)*-5}deg) scale(${.78+.22*enter})`,transformOrigin:'50% 90%'}}>
    <Img src={mediaSource(graphic.person.src)} alt={graphic.person.name??graphic.label} style={{width:'84%',height:'100%',objectFit:'contain',objectPosition:'center bottom',
      filter:'drop-shadow(3px 0 0 #FFF5E6) drop-shadow(-3px 0 0 #FFF5E6) drop-shadow(0 -3px 0 #FFF5E6) drop-shadow(0 16px 18px rgba(0,0,0,.35))'}} />
  </div>;
};
