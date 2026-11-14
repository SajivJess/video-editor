# Portrait reel editor

For current standalone status, credential cleanup, the full conversation archive
and other-laptop setup, start with [docs/HANDOFF.md](docs/HANDOFF.md).
The proposed Dell server has not yet been provisioned or benchmarked.

The current reusable visual contract is [instructions.md](instructions.md).
Crimson cutout v2 uses standalone person photos at every name mention, expressive
caption hierarchy, and sparse camera/transition accents at reviewed `editBeats`.
Ordinary captions and portraits never trigger automatic swooshes or camera attacks.
Supply any new people or custom brands with `--entities path/to/registry.json`;
see `templates/entities.example.json`. Existing projects can use
`npm run project -- restyle Output/project.json entities.json` without retranscription.


The project renders a trimmed presenter recording as a 1080 × 1920 reel. The
top 40% holds contextual graphics, the middle 30% remains clear, and the bottom
30% holds short, word-timed captions. Original narration is preserved.

## Dashboard

The **Research desk** adds a regional feed finder alongside your Meta → Gemini →
Claude workflow. Select India, Tamil Nadu/South India, Chennai or international
stories; English/Tamil news; and a 24/48/72-hour window. Refresh is on demand.
Google Trends India, Google News RSS discovery and Google/Microsoft official
blogs currently supply leads. Google News RSS is a best-effort discovery feed,
not a guaranteed public API. Access failures and snapshot times remain visible.
State and raw feed snapshots live in ignored `Output/.research/`.

Interest geography, story location and editorial relevance are separate. The
finder supplies no private Instagram analytics or trained forecast. Scores are
heuristic; grouping can require correction. Snapshot comparisons require at
least ten minutes of separation and describe monitored coverage, not population
demand or a probability of future virality. No qualifying leads means no filler.

Paste your Meta report to retain its own picks alongside the finder. Copy the
Gemini handoff, bring back an independently researched claim/source dossier, and
copy the Claude handoff. Prompts live in `prompts/`; the final spoken script can
be transferred into the reel editor's script-context field before recording.
The standalone automation route can instead retrieve source pages, use Gemini
for verification/audit, and write hooks and a Tanglish script with Gemini or an
explicit free OpenRouter model. Configure new keys and a studio password privately
with `npm.cmd run ai:setup`. This has fixture-based tests; a live provider workflow
has not yet been validated. Missing evidence requires review.

```powershell
npm install
npm run dashboard
```

Open `http://localhost:3000`. If another app uses that port, run
`$env:PORT='4317'; npm run dashboard` and open `http://localhost:4317`.
The dashboard builds automatically when it starts.

### Fixed public URL with ngrok

The official `@ngrok/ngrok` SDK shares the dashboard without a separate ngrok
executable. Run `npm.cmd run share:setup` once in PowerShell. The explicit
`npm.cmd` launcher works when PowerShell blocks `npm.ps1`; setup runs in Node
and does not require a PowerShell script file or an execution-policy change.
Enter the assigned
domain from <https://dashboard.ngrok.com/domains> and your account authtoken
from <https://dashboard.ngrok.com/get-started/your-authtoken>. The token prompt
is hidden and saved using Windows user encryption outside the repository, in
`%LOCALAPPDATA%/SajivReelStudio/ngrok.json`.

Then run `npm.cmd run share`. It builds the dashboard, starts or reuses localhost
port 4317, requests the exact saved domain, and checks the public health endpoint
before reporting success. It refuses a different domain instead of silently
giving a new random link. Reuse this command after a restart. Keep the laptop
awake, online and the process running; a static URL is not always-on hosting.
Ctrl+C closes the tunnel and any local server started by that sharing process.
The public dashboard provides the same video, research and editing access as
the local dashboard. No login is added by this sharing command; configure a studio
password and `REQUIRE_AUTH=true` before exposing it publicly.

For environment-based setup, supply `NGROK_AUTHTOKEN` and `NGROK_DOMAIN`;
`REEL_SHARE_PORT` overrides the default port. These values are used only by the
sharing process, never bundled into the frontend. Do not commit credentials.

**Saved project** renders the current reel or an `Output/*-project.json` with its
accepted captions, real portraits, Flow offsets, closing card and reviewed
`editBeats`. A palette change adjusts colors while retaining that editorial plan.
**New video** accepts a workspace clip or upload, optional script/vocabulary
hints and the source closing-card time. Every new input runs local Whisper on its
own audio. Raw ASR, timestamps, probabilities and uncertainty notes remain
available through **Transcript review notes**. New topics and people still need
an editorial asset plan; the dashboard does not invent portraits or generate Flow clips.

Jobs queue one at a time, expose real stages/render progress, and survive browser
refreshes. State and editable job snapshots live in ignored `Output/.studio/`.
New jobs persist stage checkpoints and can recover after a server restart, with
two automatic recovery attempts and an explicit retry action. Older jobs without
usable checkpoints can fail. Completed history is retained. An output is marked
verified only after finishing and encoded QA pass.
The player supports earlier outputs, ranged playback, downloads and rename with
collision protection. Palette data comes directly from `src/config/styles.ts`.
Color changes apply to the next render, including scene wipes and clean-caption
accent underlines; a finished MP4 in the player is not recolored live. Brand
logos retain their own identity colors. Saved-project recoloring preserves the
accepted caption treatment and scene timing.

`npm run test:dashboard:render` exercises real HTTP → Remotion → finishing → QA on
a three-second project. Append `-- --new-video` to also exercise upload and actual
local Whisper on a short narration excerpt. Test assets use
`public/video/studio-tests/`; temporary outputs stay outside the normal reel list.
`npm test` covers the API and pipeline regressions.

## Preview and export the current reel

```powershell
npm install
npm run studio
npm run validate
npm run typecheck
npm test
npm run build
```

The presenter file must exist at `public/video/nvidia.mp4`. Raw media is ignored
by Git. Copy `Input/nvidia 1.mp4` there when setting up a fresh checkout. Bundled
fonts, graphic assets, licenses, and original synthesized sound effects are
included in version control.

## Process another video locally

```powershell
python -m venv .venv
.venv\Scripts\python.exe -m pip install -r requirements-transcription.txt
npm run edit -- "Input/my-video.mp4" --name my-reel --render
```

The first run downloads Whisper large-v3. Inference runs locally using CPU int8.
`--model large-v3-turbo` is faster. `--model .models/large-v3-local` uses an
already downloaded model directory. `--vocabulary "company names and terms"`
provides decoding hints. `--script script.txt` supplies optional context; it is
not forced alignment. Raw Tamil, phonetic Latin transliteration, word timestamps,
probabilities, and a low-confidence review list are retained in the transcript.
ASR and phonetic transliteration need editorial proofreading, especially names.

The workflow writes an editable `Output/<name>-project.json`, creates camera
motion and conservative known-entity graphic cues, and optionally renders,
normalizes audio to -14 LUFS / -1.5 dBTP, and checks the encoded output. It does
not remove narration or generate Flow videos. Unknown topics need a supplied
visual plan; keyword matching is not a general semantic planning model.

## Supply Google Flow clips

Pass `--flow clips.json`. Use explicit, reviewed narration intervals:

```json
[
  {
    "src": "Input/flow/gpu-factory.mp4",
    "startFrame": 600,
    "endFrame": 810,
    "sourceStartFrame": 0,
    "transitionIn": "whip-pan",
    "transitionOut": "zoom-through",
    "volume": 0
  }
]
```

Flow clips begin at their own source offset, retain continuous presenter
narration, and use separate entrance and exit transitions. They default to muted.
Preflight rejects missing media and source overruns. Each interstitial must be
at most 10 seconds. No fake Flow footage is included in the sample.

## Styles and timeline revisions

Styles live in `src/config/styles.ts`: `crimson-editorial`, `clean-editorial`,
and `minimal`. Theme settings control caption size, grouping, font, colors,
and weight. Caption presets route to kinetic, pill, headline, or statistic
renderers. Modern captions show at most 1–5 words per group and retain actual
speech timings. Custom animations can choose spring, fade, or slide entrances.

```powershell
npm run project -- export
npm run project -- revise Output/project.json patch.json
npm run project -- check Output/project.json
node node_modules/@remotion/cli/remotion-cli.js render src/index.ts ReelBase Output/revised.mp4 --props=Output/project.json
```

A revision patch identifies a stable timeline ID, for example
`{"id":"gfx-2","changes":{"label":"JENSEN HUANG"}}`, or supplies a partial
`theme`. Validation runs before saving and a timestamped backup supports revert.
An editing agent can translate natural-language requests into these patches.
The dashboard handles pipeline jobs and final playback; Remotion Studio remains
the timeline preview interface. A conversational timeline editor and automatic
asset-search service are not included.

Graphics include real image cutouts, brand spotlights, metric cards, numbered
step cards, and animated process diagrams. Provide `person.src` for a real
portrait; person cues require real portraits rather than a placeholder card. Asset
attribution and the cutout prompt are recorded in `public/images/SOURCES.md`.

## Verification

Unit tests cover schema regressions, emphasis preservation, frame bounds,
graphics, caption grouping, aliases, and motion continuity. Preflight checks
asset existence, clip bounds, and caption gaps. `scripts/qa.py` checks actual
export dimensions, frame rate, black runs, loudness, and true peak. Inspect
rendered frames for caption clipping, crops, and visual relevance before sharing.

`scripts/finish.py <render.mp4> <final.mp4>` normalizes audio without re-encoding
the picture. `scripts/qa.py <final.mp4>` writes a neighboring QA report. These
scripts use the isolated transcription environment installed above.
