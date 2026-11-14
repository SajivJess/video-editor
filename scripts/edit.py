"""Ingest a trimmed presenter video, build a timed project, and optionally export it."""
import argparse
import json
import shutil
import subprocess
import sys
from pathlib import Path
import imageio_ffmpeg

ROOT = Path(__file__).resolve().parents[1]

def run(*args):
    subprocess.run([str(arg) for arg in args], cwd=ROOT, check=True)

def main():
    parser = argparse.ArgumentParser()
    parser.add_argument('video')
    parser.add_argument('--name', default='reel')
    parser.add_argument('--model', default='large-v3')
    parser.add_argument('--vocabulary', default='')
    parser.add_argument('--style', default='crimson-editorial')
    parser.add_argument('--script')
    parser.add_argument('--entities', help='Person/brand asset registry JSON for this video')
    parser.add_argument('--flow', help='JSON list of supplied clips with src, startFrame, endFrame, optional sourceStartFrame')
    parser.add_argument('--render', action='store_true')
    args = parser.parse_args()
    name = ''.join(c for c in args.name if c.isalnum() or c in '-_')
    if not name: raise ValueError('Use a nonempty reel name')
    source = Path(args.video).resolve()
    out = ROOT / 'Output'
    out.mkdir(exist_ok=True)
    transcript, props = out / f'{name}-transcript.json', out / f'{name}-project.json'
    enhanced = out / f'{name}-asr.wav'
    run(imageio_ffmpeg.get_ffmpeg_exe(), '-y', '-loglevel', 'error', '-i', source, '-af',
        'highpass=f=100,lowpass=f=7500,afftdn=nf=-20,loudnorm=I=-16:TP=-1.5:LRA=11', '-ar', '16000', '-ac', '1', enhanced)
    cmd = [sys.executable, ROOT/'scripts/transcribe.py', enhanced, transcript, '--model', args.model, '--vocabulary', args.vocabulary]
    if args.script: cmd += ['--script', Path(args.script).resolve()]
    run(*cmd)
    assemble_cmd=['node', 'scripts/project.cjs', 'assemble', transcript, props, args.style]
    if args.entities: assemble_cmd.append(Path(args.entities).resolve())
    run(*assemble_cmd)
    data = json.loads(props.read_text(encoding='utf-8'))
    dest = ROOT / 'public/video' / f'{name}{source.suffix}'
    dest.parent.mkdir(parents=True, exist_ok=True)
    if source != dest.resolve(): shutil.copy2(source, dest)
    data['project']['media']['facecam'] = f'video/{dest.name}'
    if args.flow:
        clips = json.loads(Path(args.flow).read_text(encoding='utf-8'))
        data['project']['interstitials'] = []
        for index, clip in enumerate(clips):
            file = Path(clip['src']).resolve()
            target = ROOT/'public/video'/f'{name}-flow-{index}{file.suffix}'
            if file != target.resolve(): shutil.copy2(file, target)
            data['project']['interstitials'].append({**clip, 'id': clip.get('id', f'flow-{index}'), 'src':f'video/{target.name}'})
    props.write_text(json.dumps(data, ensure_ascii=False, indent=2), encoding='utf-8')
    run('node', 'scripts/project.cjs', 'check', props)
    print(f'Editable project: {props}', flush=True)
    if args.render:
        cli = ROOT/'node_modules/@remotion/cli/remotion-cli.js'
        raw = out/f'{name}-render.mp4'
        final = out/f'{name}-final.mp4'
        run('node', cli, 'render', 'src/index.ts', 'ReelBase', raw, f'--props={props}', '--concurrency=4')
        run(sys.executable, ROOT/'scripts/finish.py', raw, final)
        run(sys.executable, ROOT/'scripts/qa.py', final)

if __name__ == '__main__':
    main()
