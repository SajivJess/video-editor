import {interpolate,spring} from 'remotion';
import type {CameraMove} from '../types/project';
const CLAMP={extrapolateLeft:'clamp',extrapolateRight:'clamp'} as const;

export function evaluateCameraMove(move:CameraMove|undefined, frame:number, fps:number, width:number, height:number){
  if(!move)return {scale:1,x:0,y:0,rotation:0,blur:0};
  const local=frame-move.startFrame,duration=move.endFrame-move.startFrame;
  const progress=interpolate(local,[0,duration],[0,1],CLAMP);
  const fromScale=move.fromScale??1.055,toScale=move.toScale??fromScale;
  let motion=progress,blur=0,rotation=0;
  if(move.type==='sudden-zoom')motion=spring({frame:local,fps,config:{damping:17,stiffness:310,mass:.45},durationInFrames:Math.max(3,duration)});
  if(move.type==='whip-pan'){
    motion=progress*progress*(3-2*progress);
    const velocity=Math.sin(Math.PI*progress);
    blur=Math.max(0,velocity*7);rotation=velocity*((move.toX??0)>0?.5:-.5);
  }
  let x=interpolate(motion,[0,1],[move.fromX??0,move.toX??0]);
  let y=interpolate(motion,[0,1],[move.fromY??0,move.toY??0]);
  let scale=interpolate(motion,[0,1],[fromScale,toScale]);
  if(move.type==='hold'){scale+=Math.sin(local/25)*.002;y+=Math.sin(local/30)*1.2;}
  if(move.type==='micro-shake'){
    const decay=1-progress,intensity=move.intensity??5;
    x+=Math.sin(local*2.2)*intensity*decay;y+=Math.cos(local*2.8)*intensity*.5*decay;
  }
  // CSS scale is applied to translation too. Overscan must cover both axes and rotation.
  const safeX=1/Math.max(.6,1-2*(Math.abs(x)+Math.abs(rotation)*10)/width);
  const safeY=1/Math.max(.6,1-2*(Math.abs(y)+Math.abs(rotation)*10)/height);
  scale=Math.max(scale,safeX,safeY);
  return {scale,x,y,rotation,blur};
}
