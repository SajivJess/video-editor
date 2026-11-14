import type {VideoProject,EntityAsset} from '../types/project';
import {DEFAULT_ENTITIES} from '../config/entities';
import {planPersonMentions,prioritizePersonMentions} from './entities';
import {planCameraMoves,planSceneTransitions} from './motion';
import {REEL_TEMPLATE} from '../config/reelTemplate';

export function applyReelTemplate(project:VideoProject,entities:EntityAsset[]=project.entities??DEFAULT_ENTITIES):VideoProject {
  const end=project.composition.overlayEndFrame??project.composition.durationFrames;
  const people=planPersonMentions(project.captions,entities,end,project.composition.fps);
  const graphics=prioritizePersonMentions(project.graphics,people);
  const beats=project.editBeats??[];
  const transitions=planSceneTransitions(beats,end,project.composition.fps,project.theme?.highlightColor??REEL_TEMPLATE.transitions.color);
  const cameraMoves=planCameraMoves(end,project.composition.fps,beats);
  const authored=(project.media.sfx??[]).filter(cue=>!cue.id.startsWith('template-sfx-'));
  const sfx=[...authored];
  for(const beat of [...beats].sort((a,b)=>a.frame-b.frame)){
    if(!beat.sound||beat.frame<0||beat.frame>=end)continue;
    if(sfx.some(cue=>Math.abs(cue.startFrame-beat.frame)<project.composition.fps*REEL_TEMPLATE.sound.minGapSeconds))continue;
    const whoosh=beat.sound==='whoosh';
    sfx.push({id:`template-sfx-${beat.frame}`,startFrame:beat.frame,src:whoosh?'audio/sfx/soft-whoosh.wav':'audio/sfx/soft-impact.wav',volume:whoosh?REEL_TEMPLATE.sound.whooshVolume:REEL_TEMPLATE.sound.impactVolume});
  }
  return {...project,entities,graphics,
    media:{...project.media,sfx},
    theme:{...project.theme,captionTreatment:project.theme?.captionTreatment??'expressive',captionFontSize:REEL_TEMPLATE.captions.baseSize},
    cameraMoves,transitions};
}
