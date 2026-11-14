import React from 'react';
import {useCurrentFrame,useVideoConfig} from 'remotion';
import type {CameraMove} from '../../types/project';
import {evaluateCameraMove} from '../../engine/camera';
export interface CameraRigProps {moves?:CameraMove[];children:React.ReactNode;style?:React.CSSProperties;}
export const CameraRig:React.FC<CameraRigProps>=({moves=[],children,style})=>{
  const frame=useCurrentFrame();
  const {fps,width,height}=useVideoConfig();
  const active=moves.find(move=>frame>=move.startFrame&&frame<move.endFrame);
  const motion=evaluateCameraMove(active,frame,fps,width,height);
  return <div style={{position:'absolute',inset:0,overflow:'hidden',...style}}>
    <div style={{width:'100%',height:'100%',transform:`scale(${motion.scale}) translate3d(${motion.x}px,${motion.y}px,0) rotate(${motion.rotation}deg)`,
      filter:motion.blur>.2?`blur(${motion.blur}px)`:undefined,transformOrigin:'50% 50%',willChange:'transform'}}>{children}</div>
  </div>;
};
