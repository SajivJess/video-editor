# Reusable modern reel editing template

This is the default editing brief for every new video in this repository. Apply
it to the subject of the new narration; do not copy the NVIDIA reel's content.
The executable rules live in `src/config/reelTemplate.ts` and
`src/engine/template.ts`. The default style is **crimson cutout v2**.

## Inputs

Use the already-trimmed presenter video with its original narration, an optional
spoken script, supplied Google Flow clips, and reference material. Preserve the
narration and timeline. Use the existing local transcription and review workflow;
do not redo accepted captions when making a visual revision.

## Composition

Render 1080 × 1920 at 30 FPS. The presenter occupies the full frame. Keep
contextual visuals in the top 40%, the face clear in the middle 30%, and captions
in the bottom 30%. Keep footage unblurred except for a brief whip-transition
motion blur. Preserve a baked-in ending/disclaimer with `overlayEndFrame`.

## Every person name means the person's photo

1. Read the transcript and identify every person, including repeat mentions.
2. Retrieve the correct real portrait, preserve identity, remove its background,
   and retain the source URL and extraction prompt in `public/images/SOURCES.md`.
3. Add that person's full name, spelling aliases, portrait path, and source URL
   to the project's entity registry. Do not put names or frame numbers into a
   rendering component. Use `templates/entities.example.json` as the shape.
4. At each spoken name, display the real cutout prominently in the upper area.
   **Only the photo: no black box, person card, initials, header, title, or label.**
   The spoken name may still appear as an ordinary bottom caption.
5. Enter with a brisk slide/pop and settle; keep a thin cream outline and soft
   shadow. Switch to the next person's photo when their name is spoken.
6. Match names across caption boundaries. A recurring name gets a recurring
   photo, not just one introductory appearance. Do not leave the wrong person on
   screen during a later person's mention.
7. Missing portrait: obtain the real asset before export. Never invent a face or
   silently substitute a generic avatar.

Brand mentions use actual supplied or attributed logo assets. The registry
supports custom brand assets as well as the bundled marks. A process gets an
animated explanation; a comparison gets competing visuals; a number gets a
large metric reveal. Do not use the same black card for every content type.

## Caption art direction

Use short groups of one to three words, synchronized to actual speech. Preserve
natural Tanglish. Use a hierarchy: one large hero word, smaller supporting words,
and deliberate emphasis. Do not turn every word into an identical red pill.

- Numbers: oversized condensed display typography, cream text, animated crimson
  backing or underline. Supporting units remain smaller.
- Short emphasis: quick scale/slide entry, a slightly angled crimson brush plate,
  and a restrained impact shadow. Emphasize the meaningful word, including a
  negation when it changes the statement's meaning.
- Longer phrases: stacked typography with a single hero word. Mix condensed bold
  display text with simpler supporting text. Keep line breaks readable.
- Reveal words on their speech timings. Keep revealed text centered. Avoid dim
  upcoming words, empty reserved space, and early fade-outs during speech.
- Fit long words to the safe width. Never cover the presenter's face or clip text.

Palette: crimson `#C8102E`, cream `#FFF5E6`, restrained brand accents. Font files
are bundled locally. Animation and treatment choice must be deterministic.

## Visible camera choreography

Keep the presenter calm for most of the narration. Strong camera motion is
editorial punctuation, reserved for a key finding, narrative turn, or comparison.
Never run a repeating zoom/pan timer or trigger an attack for every emphasized
word, person name, caption, or graphic change.

- A smooth establishing move.
- A quick punch zoom on a meaningful beat: approximately 1.06× → 1.20× in 6–8
  frames, followed by a controlled recovery.
- A short directional whip with transient motion blur on selected changes.
- A visible pan/reframe between punctuation beats; retain enough overscan to
  prevent blank edges. Alternate direction and reset the framing deliberately.
- Leave at least 10 seconds between selected camera accents, usually longer.
  Two or three camera accents in a minute is a useful ceiling, not a quota.
  Recover over about 2.8 seconds, then hold. Omit an effect when it adds nothing.

Record reviewed moments in `project.editBeats`, each with an ID, integer `frame`,
and a concrete `reason`. Optional `camera` is `punch`, `pan`, or `whip`.
No edit beats means no automatic attacks. Select timings for the new narration;
do not copy this video's beats or put timestamps into rendering components.

## Transitions and motion graphics

Use full-frame editorial punctuation only at major narrative changes, separated
by at least 14 seconds: fast whip streak, crimson/cream diagonal wipe, or brief
zoom-through. Each lasts about 0.24 seconds; no lingering face obstruction.
Set the optional `transition` on the reviewed edit beat. Ordinary logo/photo/card
changes do not require a full-frame transition. Avoid stacking a whip, punch,
wipe, and sound on the same beat. Do not fade every visual in with the same animation.

Logos float with a clean mark reveal and controlled orbit. Statistics reveal
individual digits. Editorial typography assembles word by word. Process nodes
arrive in sequence, connecting strokes draw on, and the current node receives
emphasis. Comparison plates enter from opposing directions. Keep all movement
relevant to the explanation and allow the viewer time to read it.

## Sound

Keep the original voice primary. Sound is opt-in through an edit beat's `sound`
(`impact` or `whoosh`). Most camera accents should stay silent. Never add a sound
automatically to a person name, caption pop, or ordinary graphic reveal. Use a
quiet whoosh only when a major wipe/whip benefits from it. Space selected sounds
at least 12 seconds apart; one or two in a minute is usually enough, with zero
valid too. Align sound with the actual attack frame and preserve authored audio.
Do not add unrelated music.
Normalize and check the final encode with the repository's finish/QA scripts.

## Use for a new video

```powershell
npm run edit -- "Input/new-video.mp4" --name new-reel --entities my-entities.json --render
```

For an existing project, apply the template without retranscribing:

```powershell
npm run project -- restyle Output/my-project.json my-entities.json
npm run project -- check Output/my-project.json
```

Example of a deliberately selected section change:

```json
{"id":"chapter-turn","frame":660,"reason":"The explanation changes to the main problem","transition":"diagonal-wipe","sound":"whoosh"}
```

`restyle` keeps the project content and media, resolves person mentions from the
registry, gives photos priority over other graphics, and generates camera,
transition, and sound cues from reviewed `editBeats`. It saves a backup. Custom entities are data, not
new video-specific rendering code. Existing authored non-person graphics remain
editable through the project timeline.

## Delivery checks

The local dashboard (`npm run dashboard`) uses this same pipeline. Prefer its
**Saved project** mode for visual revisions so accepted captions, portraits,
Flow offsets, `overlayEndFrame`, and reviewed `editBeats` are preserved. **New
video** runs fresh local Whisper on the actual upload; never reuse another
video's transcript. Use the job's editable-project and transcript-review downloads
for later revisions. Palette choices come from `src/config/styles.ts`; maintain
the highlighted-text contrast color through validation and rendering.

Run TypeScript, tests, and preflight. Inspect actual frames at every person-name
handoff, caption entrance/long word, camera punch, whip, wipe midpoint, and both
ends. Render the full MP4 and run final audio/black-frame QA. Retain raw ASR and
uncertainty notes; do not claim imperfect transcription has been verified.

The older tool/skills catalog is preserved in
[docs/video-tools-reference.md](docs/video-tools-reference.md).
