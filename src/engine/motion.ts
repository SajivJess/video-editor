import type { CameraMove, EditBeat, SceneTransition } from '../types/project';
import { REEL_TEMPLATE } from '../config/reelTemplate';

/** Quiet by default. Only reviewed project beats can trigger an accent; never a repeating timer. */
export function planCameraMoves(durationFrames:number,fps:number,beats:EditBeat[]=[]):CameraMove[]{
  const spec=REEL_TEMPLATE.motion;
  const moves:CameraMove[]=[];
  let cursor=0,scale:number=spec.baseScale,x=0,lastAccent=-Infinity;
  const add=(type:CameraMove['type'],end:number,targetScale:number,targetX:number)=>{
    end=Math.min(durationFrames,end);
    if(end<=cursor)return;
    moves.push({id:`camera-${cursor}-${type}`,type,startFrame:cursor,endFrame:end,fromScale:scale,toScale:targetScale,fromX:x,toX:targetX,fromY:0,toY:0,intensity:5});
    cursor=end;scale=targetScale;x=targetX;
  };
  const cues=beats.filter(b=>b.camera&&b.frame>=0&&b.frame<durationFrames-Math.round(fps)).sort((a,b)=>a.frame-b.frame);
  add('slow-zoom-in',Math.min(Math.round(fps*2.5),cues[0]?.frame??durationFrames),1.075,0);
  for(const cue of cues){
    if(cue.frame<cursor||cue.frame-lastAccent<fps*spec.minCueGapSeconds)continue;
    add('hold',cue.frame,scale,x);
    if(cue.camera==='punch')add('sudden-zoom',cue.frame+Math.max(3,Math.round(fps*spec.attackSeconds)),spec.punchScale,0);
    else if(cue.camera==='whip')add('whip-pan',cue.frame+Math.max(3,Math.round(fps*spec.attackSeconds)),spec.punchScale,spec.panPixels);
    else add('pan',cue.frame+Math.round(fps*1.8),spec.panScale,-spec.panPixels);
    add('slow-zoom-out',cursor+Math.round(fps*spec.recoverySeconds),spec.baseScale,0);
    lastAccent=cue.frame;
  }
  add('hold',durationFrames,scale,x);
  return moves;
}

export function planSceneTransitions(beats:EditBeat[],duration:number,fps:number,color:string=REEL_TEMPLATE.transitions.color):SceneTransition[]{
  const result:SceneTransition[]=[];
  const spec=REEL_TEMPLATE.transitions;
  for(const beat of [...beats].sort((a,b)=>a.frame-b.frame)){
    if(!beat.transition||beat.frame<0||beat.frame>=duration)continue;
    if(result.length&&beat.frame-result.at(-1)!.startFrame<fps*spec.minGapSeconds)continue;
    const span=Math.max(4,Math.round(spec.durationSeconds*fps));
    result.push({id:`transition-${beat.id}`,type:beat.transition,startFrame:beat.frame,endFrame:Math.min(duration,beat.frame+span),color});
  }
  return result;
}
