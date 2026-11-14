# Video Editor handoff

Snapshot: **14 November 2026, Asia/Calcutta**. Read `AGENTS.md` and
`instructions.md` before changing the editing behavior.

## Continue on the other laptop

```powershell
git clone --branch codex/standalone-studio --single-branch https://github.com/SajivJess/video-editor.git
Set-Location video-editor
npm.cmd ci
npm.cmd run typecheck
npm.cmd test
```

Open the cloned folder in Codex using your account and say:

> Read AGENTS.md, instructions.md, docs/HANDOFF.md, and
> docs/conversations/codex-video-editor-2026-11-14.md before continuing.
> Preserve the accepted visual direction and credential cleanup. Assess and
> benchmark this Dell before configuring it as the standalone server.

The [full conversation](conversations/codex-video-editor-2026-11-14.md) contains
the saved user/assistant messages, progress updates and question-dialog answers.
Its manifest records coverage, counts, exclusions and checksums. This document
is a separate summary. The archive stops at its stated cutoff; later verification
results are below and in Git history. Root-level `Video_Editor_Full_Conversation_Doc`
files cover the earlier conversation, not this current Codex chat. Older claims
and recommendations are historical; the limitations below describe current state.
These files supply context to a new chat; they do not import a native Codex session
or transfer authentication/login data.

## Sajiv's intent and accepted visual direction

The goal is a reusable studio that operates without Codex or a ChatGPT
subscription. Sajiv pastes a Meta AI report, reviews the resulting script, records
the presenter and uploads the video. Source checks, verification, hooks/Tanglish
scripting, editing, rendering and audio QA should eventually form one dependable
workflow. Fully automatic general-purpose visual planning is still incomplete.

- Keep Remotion + React + TypeScript. AI decisions belong in validated project
  data; render components stay deterministic without API calls, timers or randomness.
- 1080 x 1920, 30 FPS, full-frame original presenter: top 40% contextual graphics,
  middle 30% clear face, bottom 30% short speech-timed Tanglish captions.
- Default crimson editorial, cream condensed typography and deliberate keyword
  emphasis. Preserve narration and accepted timings; never fabricate ASR gaps.
- Every person-name mention uses the real standalone cutout. No black person box,
  nameplate, initials or invented face. Register aliases/assets in project data;
  retain attribution and extraction prompts in `public/images/SOURCES.md`.
- Most narration stays calm. Use reviewed meaningful `editBeats` for punches,
  pans, whips, wipes and sounds; no periodic motion or swoosh on every reveal.
  Preserve the original closing card using `composition.overlayEndFrame`.
- Hook reference: “Aavathum ponnale, azhivathum ponnale…”—a compelling Tanglish
  opening with a factual bridge, not the same proverb repeated in every script.
  Canonical Meta, Gemini and Claude prompts are in `prompts/`.

## Architecture and implemented behavior

| Area | Stack / behavior |
| --- | --- |
| Video | Remotion 4, React 18, TypeScript; validated `VideoProject` in `{project}` props |
| Editorial data | `src/demo/sampleProject.ts`, entity registry, styles and executable reel-template configuration |
| Dashboard | React/TypeScript, esbuild, Express 5, Multer; saved projects and fresh uploads |
| Project tools | `scripts/project.cjs`: assemble/export/restyle, validated timeline patches with backups, media/timing preflight |
| Speech | Python, faster-whisper CPU int8; raw text, word timestamps, probabilities and uncertainty review |
| Encoding | Chromium, Remotion compositor, FFmpeg, PyAV, imageio-ffmpeg; finishing and encoded QA |
| AI | Gemini extraction/verification/audit and writing; explicit zero-priced OpenRouter `:free` writer optional |
| Research | Regional RSS/discovery feeds plus Meta reports; heuristic scores, no private Meta analytics or trained virality prediction |
| State | Ignored `Output/.studio`, `.automation`, `.research`, media and editable project/transcript files |
| Hosting helpers | Native Node/Python runtime selection; ngrok and historical InstaBox bootstrap/systemd/benchmark scripts |

**Saved project** preserves accepted captions, entity cutouts, Flow offsets,
closing-card timing and edit beats. Ten dashboard palettes reach validated themes
and rendering, including transitions. Existing MP4s are not recolored live; a new
render is required. Brand logos keep their identity colors.

**New video** uses the actual input's audio: source preparation -> Whisper ->
timeline validation -> Remotion -> audio finishing -> encoded QA. Jobs queue
serially with one render worker by default. New jobs persist stage checkpoints,
support bounded restart recovery (two automatic attempts) and explicit retry.
Older jobs lacking usable checkpoints can fail rather than silently resume.

**Standalone research** accepts Meta reports, retrieves supplied public article
pages, requests a Gemini claim/source dossier, creates three hooks and a Tanglish
script, audits it and waits for the recording. Missing evidence goes to review;
failed provider steps can retry from retained progress. Private-address retrieval
and invented source IDs are rejected. Retrieved text alone does not establish
truth; incomplete/conflicting evidence still needs review. Manual handoffs remain.

Gemini setup supports up to three keys with quota-response failover and persisted
hashed-key cooldowns. Keys from one Google project share quota. This is failover,
not unlimited usage; all unavailable keys cause a clear failure. The local default
limits attempted AI calls to 30 per UTC day, including failed attempts. Search
grounding is optional and off by default; check provider billing before enabling
it. OpenRouter checks the explicit `:free` model's zero pricing and disables paid
fallback. Live model availability, quotas and Tanglish quality remain unverified;
model names in code are defaults, not current catalogue guarantees.

Password auth is implemented (12+ characters). Set `REQUIRE_AUTH=true` before
public hosting and configure secure cookies behind HTTPS. Without a password the
local dashboard is unlocked; ngrok sharing itself does not enforce authentication.
Disk checks retain a default 2 GiB reserve and concurrent upload reservations.
Backup downloads include project/media history while excluding configuration
secrets and model caches; they are not full-machine backups.

## Verified results and remaining gaps

- The accepted local `Output/nvidia-selective-final.mp4` is about 61.9 seconds,
  1080 x 1920, 30 FPS. Its saved QA has no errors or black runs, -14.16 LUFS and
  -1.33 dBTP. That export is not in Git; transcript uncertainty notes still apply.
- The historical InstaBox **saved-project** full-render benchmark passed encoded
  QA in 196 seconds on four reported CPUs, peaking around 5.34 GiB observed system
  memory used. Its contact sheet was downloaded but not inspected before
  cancellation. This does not validate visual QA, new-upload Whisper performance,
  reliable hosting or Dell performance.
- Prior checks passed 54 Node tests, TypeScript and local media preflight. Fresh
  handoff checks are recorded at the end of this document.
- AI workflow, evidence handling, quota failover, auth, storage, recovery, packaging
  and backup have automated fixture/mock coverage. **No live user-key
  Gemini/OpenRouter workflow has been completed.**
- General automatic visual planning, new-person portrait discovery/download,
  image generation and Google Flow generation are not implemented. New topics
  and people still need an editorial plan, supplied assets and review.
- Raw-video enhancement/super-resolution is not integrated. Whisper remains
  imperfect for Tanglish/names; preserve uncertainty notes and proofread speech.
- Dell provisioning, startup supervision, public access and reboot/idle recovery
  have not been tested on the target laptop. No Docker build was validated.
- Watch the actual output and inspect rendered frames/audio before claiming a
  finished delivery. Passing automated tests alone is insufficient.

## Credential cleanup and cancelled cloud hosting

Sajiv cancelled InstaBox because the free runtime limit was unsuitable. Do not
reactivate cloud hosting, reconnect ngrok or reuse old credentials for this
handoff. Deployment helpers are retained as code, not an active service.

Prior cleanup stopped the cloud machine/local sharing worker, revoked the created
SSH token and deleted the saved local InstaBox/ngrok configuration files. No
project `.env` or saved `ai.env` existed. Cleanup verification found no remaining
known credential environment variables, project workers or project listeners.
Files were preserved on the stopped cloud machine.

Deleting a saved provider key is not provider-side revocation. The API did not
permit revoking the InstaBox API key itself; Sajiv was advised to revoke it and
any other unwanted provider keys in their dashboards. Do not claim those external
revocations are complete. The chat's dashboard screenshot exposed an SSH
credential: its reference is retained but the image is deliberately omitted.
No raw `.codex` session files or authentication stores are included.

## Proposed Dell server — not yet set up

Reported: Dell Inspiron 3542, i3-4005U 1.70 GHz (2 cores/4 threads), 8 GB DDR3,
480 GB Crucial BX500 SSD, integrated graphics, Windows 10 Pro, 1366 x 768 screen,
Wi-Fi and battery at 0%. Sajiv clarified it is normally empty, occasionally runs
Codex/RustDesk, and slow background rendering is acceptable. Verify actual 64-bit
OS, disk space, available RAM and load before installation.

Treat it as a candidate personal server. Use APIs for LLM inference; a modern
local LLM/image-generation host is not the proposed use. Start native Node 24+,
64-bit Python/venv and Chrome/Chromium; avoid VM overhead. Queue one video,
use one Remotion worker, two Whisper CPU threads and sequential heavy stages.
Try Whisper `medium` CPU-int8 and compare real Tanglish accuracy. Code still
defaults to `large-v3`, so explicitly select the lighter model. Allow about 30 GB
free working space initially and measure actual usage.

```powershell
python -m venv .venv
.venv\Scripts\python.exe -m pip install -r requirements-transcription.txt
$env:WHISPER_MODEL='medium'
$env:WHISPER_THREADS='2'
$env:RENDER_CONCURRENCY='1'
npm.cmd run ai:setup
npm.cmd run doctor
npm.cmd run standalone
```

Configure new keys/password privately through `ai:setup`; never paste keys into
Codex or Git. On Windows setup saves them outside the repository in the current
user's local application data. `doctor` checks prerequisites/key presence, not
provider quotas or successful live inference. Setup normally chooses port 4317;
an unconfigured dashboard defaults to 127.0.0.1:3000. Read the startup output.
`npm.cmd` avoids PowerShell's `npm.ps1` execution-policy issue without changing it.

For manual configuration, copy the root `.env.example` to `.env` and fill the
required Gemini key and studio password locally. It includes the proposed Dell
runtime settings, optional failover keys and optional OpenRouter writer settings.
It contains no old credentials. An empty password deliberately prevents startup
because the template enables `REQUIRE_AUTH=true`. A root `.env` takes precedence
over the setup-generated `ai.env`, including empty values: use one configuration
method, or remove the empty root `.env` before using `ai:setup`. Existing process
environment values have higher precedence than either file. Keep the filled
`.env` private; it is ignored by Git. Neither method configures hosting or ngrok.

Before unattended use, benchmark a full new upload and saved project at
1080 x 1920; inspect frames/audio, ASR accuracy, time, memory and thermals.
Test restart/retry and missing-evidence/quota/low-disk failures. Then configure a
supervised Windows startup task under the intended user, persistent runtime
settings and authenticated remote access. Select/test the access method separately;
no previous tunnel is active. Check OS security support and reliable AC power:
a 0% battery can interrupt work. Display resolution does not limit export size.

## Private media and source history

Inputs, model downloads, exports and temporary analysis are excluded. Included:
fonts/licenses, attributed cutouts/logos and original small sound effects. Restore
the NVIDIA recording separately to `public/video/nvidia.mp4` (for example from
private `Input/nvidia 1.mp4`), and supply any required Flow clips separately.
Preserve relative media paths in restored projects. Never commit raw recordings
just to make preflight pass.

With media restored, run `npm.cmd run validate` and `npm.cmd run studio`.
Without it, fresh-clone demo preflight must report missing video. New uploads use
their own footage/transcript. Project validation deliberately checks real media.

This branch starts at remote main `e020336c029428317397741fb58ea1ad8ded63c7`,
snapshots the current source and does not inherit the three unpublished local
commits containing raw media. Original local main, its commits and working files
are preserved. There is no force push or history rewrite.

## Fresh handoff verification

- Clean worktree dependency installation: `npm.cmd ci --no-audit --no-fund` passed.
- `npm.cmd run typecheck`: passed.
- `npm.cmd test`: 54 passed, 0 failed. Node reports the existing harmless
  module-type auto-detection warning for the TypeScript test file.
- `python -m unittest discover -s tests -p test_transcription.py`: 2 passed.
- `npm.cmd run build:dashboard`: passed; bundled frontend rebuilt from this source.
- Fresh source-only `npm.cmd run validate`: correctly failed solely on missing
  `video/nvidia.mp4`. With the private source temporarily copied into ignored
  media storage, it passed with zero errors/warnings (58 captions, 19 graphics,
  four person mentions, one scene transition, 61.87-second timeline). That
  temporary media copy is removed before committing; no video is shipped.
- The precommit eligible-file scan found no credential patterns or excluded raw
  media/models/configuration. Text and the legacy DOCX's XML were checked; that
  DOCX has no embedded media. The visible-message archive has a count/coverage
  manifest and SHA-256 checksums; the credential-bearing screenshot is omitted.
- No new full render or live AI call was needed for this source/document handoff.
  Historical render results above do not replace a Dell benchmark.
