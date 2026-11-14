"""Inspect encoded output: actual dimensions/FPS, black runs, loudness, and true peak."""
import argparse
import json
import re
import subprocess
from pathlib import Path
import av
import imageio_ffmpeg

def main():
    parser = argparse.ArgumentParser()
    parser.add_argument('video')
    args = parser.parse_args()
    with av.open(args.video) as container:
        video = container.streams.video[0]
        width, height, fps = video.width, video.height, float(video.average_rate)
        duration = container.duration / av.time_base
        audio = bool(container.streams.audio)
    run = subprocess.run([imageio_ffmpeg.get_ffmpeg_exe(), '-hide_banner', '-i', args.video,
        '-vf', 'blackdetect=d=0.15:pix_th=0.05', '-af', 'loudnorm=I=-14:TP=-1.5:LRA=11:print_format=json', '-f', 'null', '-'],
        capture_output=True, text=True, check=True)
    loudness = json.loads(re.findall(r'\{\s*"input_i".*?\}', run.stderr, re.S)[-1])
    black = re.findall(r'black_start:([\d.]+) black_end:([\d.]+) black_duration:([\d.]+)', run.stderr)
    errors = []
    if (width, height) != (1080, 1920): errors.append('Unexpected output dimensions')
    if abs(fps - 30) > .01: errors.append('Unexpected frame rate')
    if not audio: errors.append('Missing audio')
    if float(loudness['input_tp']) > -.8: errors.append('True peak is too high')
    if abs(float(loudness['input_i']) + 14) > 1: errors.append('Integrated loudness outside -14 +/-1 LUFS')
    if black: errors.append('Black frame run detected')
    report = {'width': width, 'height': height, 'fps': fps, 'duration': duration,
        'integratedLUFS': loudness['input_i'], 'truePeakDBTP': loudness['input_tp'], 'blackRuns': black, 'errors': errors}
    Path(args.video + '.qa.json').write_text(json.dumps(report, indent=2), encoding='utf-8')
    print(json.dumps(report, indent=2))
    if errors: raise SystemExit(1)

if __name__ == '__main__':
    main()
