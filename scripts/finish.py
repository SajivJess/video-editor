"""Normalize a rendered reel's audio in two passes without re-encoding the picture."""
import argparse
import json
import re
import subprocess
from pathlib import Path
import imageio_ffmpeg

def main():
    parser = argparse.ArgumentParser()
    parser.add_argument('input')
    parser.add_argument('output')
    args = parser.parse_args()
    if Path(args.input).resolve() == Path(args.output).resolve():
        raise ValueError('Choose a separate output file')
    exe = imageio_ffmpeg.get_ffmpeg_exe()
    first = subprocess.run([exe, '-hide_banner', '-i', args.input, '-vn', '-af',
        'loudnorm=I=-14:TP=-1.5:LRA=11:print_format=json', '-f', 'null', '-'], capture_output=True, text=True, check=True)
    matches = re.findall(r'\{\s*"input_i".*?\}', first.stderr, re.S)
    if not matches:
        raise RuntimeError('Loudness analysis did not return measurements')
    stats = json.loads(matches[-1])
    af = ('loudnorm=I=-14:TP=-1.5:LRA=11:linear=true:print_format=json:'
          f'measured_I={stats["input_i"]}:measured_TP={stats["input_tp"]}:'
          f'measured_LRA={stats["input_lra"]}:measured_thresh={stats["input_thresh"]}:offset={stats["target_offset"]}')
    second = subprocess.run([exe, '-hide_banner', '-y', '-i', args.input, '-map', '0:v:0', '-map', '0:a:0',
        '-c:v', 'copy', '-af', af, '-c:a', 'aac', '-ar', '48000', '-b:a', '192k', '-movflags', '+faststart', args.output], capture_output=True, text=True, check=True)
    report = {'input': args.input, 'output': args.output, 'firstPass': stats,
        'secondPass': json.loads(re.findall(r'\{\s*"input_i".*?\}', second.stderr, re.S)[-1])}
    Path(args.output + '.audio.json').write_text(json.dumps(report, indent=2), encoding='utf-8')
    print(json.dumps(report, indent=2))

if __name__ == '__main__':
    main()
