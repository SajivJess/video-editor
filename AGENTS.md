# Reel editing workflow

This repository is Sajiv's reusable editor for natural Tanglish technology reels.
Preserve the Remotion + React + TypeScript architecture. Editing decisions belong
in project data; render components must stay deterministic and independent of AI
API calls, timers, or randomness.

Read `instructions.md` before planning a new reel or applying a visual revision.
It is the reusable visual contract; `src/config/reelTemplate.ts` is its executable configuration.

## Established visual direction

- 1080 × 1920 at 30 FPS. Full-frame original presenter footage.
- Upper 40%: large contextual graphics, logos, real person cutouts, or animated
  explanations. Middle 30%: clear presenter face. Lower 30%: short captions.
- Default style: crimson editorial. Cream typography, crimson highlights,
  condensed bold text, short word-timed groups, deliberate keyword emphasis.
- Keep footage unblurred. Camera motion may use brief transition motion blur.
- Use a coherent graphic hierarchy and readable motion. Do not substitute long
  static subtitle paragraphs, tiny decorative graphics, or random stock imagery.
- At every person-name mention, use the real standalone cutout only. No black
  person card, heading, nameplate, initials, or placeholder avatar. Register new
  names/assets in project data rather than hardcoding them into components.
- Reserve punch zooms, pans/whips, transitions, and sound for reviewed meaningful
  `editBeats`. Never repeat them on a timer or attach sound to every name/reveal.
  Follow the spacing/overscan rules in the template; most narration stays calm.
- Caption actual Tamil/English speech in natural Tanglish. Do not invent missing
  speech, translate the whole narration to English, or silently accept ASR errors.
- If source footage contains a finished closing card, stop overlays and camera
  moves there using `composition.overlayEndFrame`; preserve the source card.

## Inputs and production

The presenter clip is already trimmed. Preserve narration and timing unless the
user requests a cut. Read optional script and vocabulary hints when provided.
Use the local Whisper workflow in `scripts/transcribe.py` and retain raw text,
timestamps, probabilities, and uncertain-word review data. Compare or retry
difficult speech; automatic transcription is not proof of accuracy. Avoid voice
activity filtering when it drops audible Tanglish speech.

Google Flow clips are supplied by the user, generally 5–10 seconds. Never label
reused presenter footage as generated content. Place only relevant supplied
clips, set source offsets explicitly, default their audio to muted, and keep the
presenter narration continuous. Ask for a missing essential visual instead of
inventing evidence or placing unrelated footage.

Use real, attributed assets for recognizable people and brands. Background
extraction must preserve the person's identity. Local vector/code animations
are appropriate for diagrams, UI cards, and explanations. Record source assets
and generated-asset prompts in `public/images/SOURCES.md`.

## Data and revision workflow

`src/demo/sampleProject.ts` is the current reel. Custom reels use a `VideoProject`
inside a `project` props object. Use stable IDs, integer frames, half-open time
ranges, normalized focal points, and the validated schema in `src/types/project.ts`.
Style definitions live in `src/config/styles.ts`.

`scripts/project.cjs` assembles transcripts, exports projects, checks media and
timeline gaps, and applies validated revision patches with backups. Prefer
targeted timeline revisions over rebuilding a video for every change. Remotion
Studio provides the current visual preview and timeline interface.

## Verification before delivery

Run TypeScript and project tests after code changes. Run project preflight before
exporting. Inspect actual rendered frames at caption entrances, long words,
graphics changes, Flow transitions, and both ends. Preserve the clear face zone.
Render the full MP4 before claiming export success. Normalize and inspect final
audio using `scripts/finish.py` and `scripts/qa.py`. Report remaining transcript
uncertainty, missing supplied assets, and unimplemented product features honestly.

Raw source media and large speech models stay out of Git. Preserve unrelated
working changes. Bundled fonts, original sound effects, and small attributed
graphic assets are tracked so a fresh checkout can reproduce the design.
