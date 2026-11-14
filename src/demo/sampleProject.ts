import { applyReelTemplate } from '../engine/template';
import { nvidiaCaptions } from './nvidiaCaptions';
import { EDITING_STYLES } from '../config/styles';
import type { VideoProject } from '../types/project';

export const DEMO_DURATION_FRAMES = 1856;

// Caption timings come from local Whisper large-v3. See nvidiaCaptionReview.json for uncertain words.
const baseProject: VideoProject = {
  version: 1,
  composition: {
    width: 1080,
    height: 1920,
    fps: 30,
    durationFrames: DEMO_DURATION_FRAMES,
    overlayEndFrame: 1800,
    tintOpacity: 0.2,
    safeMarginX: 40,
    safeMarginY: 48,
  },
  theme: EDITING_STYLES['crimson-editorial'],
  media: {
    facecam: 'video/nvidia.mp4',
  },
  visuals: [],
  editBeats: [
    {id:'main-subject',frame:160,reason:'The narration identifies NVIDIA as the main subject.',camera:'punch'},
    {id:'story-turn',frame:662,reason:'The explanation turns from the AI ecosystem to the problem.',transition:'diagonal-wipe',sound:'whoosh'},
    {id:'market-consequence',frame:1176,reason:'The story moves to the market reaction.',camera:'punch'},
    {id:'chip-race',frame:1510,reason:'Reframe for the NVIDIA versus AMD comparison.',camera:'pan'},
  ],
  interstitials: [],
  graphics: [
    {
        "id": "gfx-1",
        "type": "logo-spotlight",
        "label": "NVIDIA AI CHIPS",
        "value": "THE STORY BEHIND THE CHIPS",
        "logo": {
            "brand": "nvidia",
            "glowColor": "#76B900"
        },
        "startFrame": 0,
        "endFrame": 225,
        "region": "visuals"
    },
    {
        "id": "gfx-2",
        "type": "person-pictorial",
        "label": "JENSEN HUANG",
        "person": {
            "name": "JENSEN HUANG",
            "title": "NVIDIA / CO-FOUNDER",
            "src": "images/jensen-huang-cutout.png",
            "accent": "#76B900"
        },
        "startFrame": 225,
        "endFrame": 288,
        "region": "visuals"
    },
    {
        "id": "gfx-3",
        "type": "collage-card",
        "label": "NVIDIA BEGINS",
        "value": "1993",
        "person": {
            "title": "THE FOUNDING YEAR"
        },
        "startFrame": 288,
        "endFrame": 446,
        "region": "visuals"
    },
    {
        "id": "gfx-4",
        "type": "logo-spotlight",
        "label": "CHATGPT",
        "value": "THE AI ECOSYSTEM",
        "logo": {
            "brand": "openai",
            "glowColor": "#10A37F"
        },
        "startFrame": 446,
        "endFrame": 489,
        "region": "visuals"
    },
    {
        "id": "gfx-5",
        "type": "logo-spotlight",
        "label": "GOOGLE GEMINI",
        "value": "THE AI ECOSYSTEM",
        "logo": {
            "brand": "gemini",
            "glowColor": "#557EFF"
        },
        "startFrame": 489,
        "endFrame": 509,
        "region": "visuals"
    },
    {
        "id": "gfx-6",
        "type": "logo-spotlight",
        "label": "CLAUDE",
        "value": "THE AI ECOSYSTEM",
        "logo": {
            "brand": "claude",
            "glowColor": "#D9976A"
        },
        "startFrame": 509,
        "endFrame": 564,
        "region": "visuals"
    },
    {
        "id": "gfx-7",
        "type": "process-diagram",
        "label": "THE AI ECOSYSTEM",
        "value": "HARDWARE → COMPUTE → APPLICATIONS",
        "steps": [
            "CHIPS",
            "COMPUTE",
            "AI TOOLS"
        ],
        "startFrame": 564,
        "endFrame": 662,
        "region": "visuals"
    },
    {
        "id": "gfx-8",
        "type": "badge",
        "label": "BUT THERE’S A PROBLEM",
        "value": "THE NEXT CHAPTER",
        "iconName": "warning",
        "startFrame": 662,
        "endFrame": 718,
        "region": "visuals"
    },
    {
        "id": "gfx-9",
        "type": "badge",
        "label": "LEADERSHIP IN FOCUS",
        "value": "NVIDIA / THE NARRATIVE",
        "iconName": "business",
        "startFrame": 718,
        "endFrame": 824,
        "region": "visuals"
    },
    {
        "id": "gfx-10",
        "type": "badge",
        "label": "UNVERIFIED CLAIMS",
        "value": "AS DISCUSSED IN THE NARRATION",
        "iconName": "warning",
        "startFrame": 824,
        "endFrame": 957,
        "region": "visuals"
    },
    {
        "id": "gfx-11",
        "type": "badge",
        "label": "NOT VERIFIED",
        "value": "CLAIM STATUS",
        "iconName": "shield",
        "startFrame": 957,
        "endFrame": 1016,
        "region": "visuals"
    },
    {
        "id": "gfx-12",
        "type": "badge",
        "label": "SEPARATE ALLEGATIONS",
        "value": "AS DISCUSSED IN THE NARRATION",
        "iconName": "alert",
        "startFrame": 1016,
        "endFrame": 1132,
        "region": "visuals"
    },
    {
        "id": "gfx-13",
        "type": "badge",
        "label": "NOT PROVEN",
        "value": "CLAIM STATUS",
        "iconName": "shield",
        "startFrame": 1132,
        "endFrame": 1176,
        "region": "visuals"
    },
    {
        "id": "gfx-14",
        "type": "badge",
        "label": "MARKET REACTION",
        "value": "THE STORY CONTINUES",
        "iconName": "chart",
        "startFrame": 1176,
        "endFrame": 1361,
        "region": "visuals"
    },
    {
        "id": "gfx-15",
        "type": "person-pictorial",
        "label": "JENSEN HUANG",
        "person": {
            "name": "JENSEN HUANG",
            "title": "WHAT COMES NEXT?",
            "src": "images/jensen-huang-cutout.png",
            "accent": "#76B900"
        },
        "startFrame": 1361,
        "endFrame": 1510,
        "region": "visuals"
    },
    {
        "id": "gfx-16",
        "type": "comparison",
        "label": "THE AI CHIP RACE",
        "value": "WHO COMES NEXT?",
        "steps": [
            "NVIDIA",
            "AMD"
        ],
        "startFrame": 1510,
        "endFrame": 1695,
        "region": "visuals"
    },
    {
        "id": "gfx-17",
        "type": "badge",
        "label": "YOUR TAKE?",
        "value": "LET’S TALK IN THE COMMENTS",
        "iconName": "sparkle",
        "startFrame": 1695,
        "endFrame": 1800,
        "region": "visuals"
    }
],
  captions: nvidiaCaptions,
};

export const sampleProject = applyReelTemplate(baseProject);
