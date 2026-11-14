import type { EntityAsset } from '../types/project';

/** Asset registry, not a video-specific renderer. Any future reel can supply its own registry. */
export const DEFAULT_ENTITIES: EntityAsset[] = [
  { id:'jensen-huang',name:'Jensen Huang',aliases:['Jensen Huang','Jenson Huang'],kind:'person',src:'images/jensen-huang-cutout.png',accent:'#76B900',sourceUrl:'https://investor.nvidia.com/governance/management-team/default.aspx' },
  { id:'kimberly-powell',name:'Kimberly Powell',aliases:['Kimberly Powell','Kimberley Powell'],kind:'person',src:'images/kimberly-powell-cutout.png',accent:'#6CA9FF',sourceUrl:'https://blogs.nvidia.com/blog/author/kimberly-powell/' },
  { id:'nvidia',name:'NVIDIA',aliases:['NVIDIA'],kind:'brand',brand:'nvidia',accent:'#76B900' },
  { id:'openai',name:'ChatGPT',aliases:['ChatGPT','Chat GPT'],kind:'brand',brand:'openai',accent:'#10A37F' },
  { id:'gemini',name:'Google Gemini',aliases:['Gemini'],kind:'brand',brand:'gemini',accent:'#557EFF' },
  { id:'claude',name:'Claude',aliases:['Claude'],kind:'brand',brand:'claude',accent:'#D9976A' },
];
