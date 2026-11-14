"""Local, word-timed Tamil/English transcription. Keeps raw ASR and confidence for review."""
import argparse
import json
import re
import sys
import os
from pathlib import Path

def romanize(text):
    # Explicit Tamil grapheme mapping avoids Sanskrit substitutions such as bh/gh
    # and preserves English code-switching exactly as recognized.
    vowels = dict(zip('அஆஇஈஉஊஎஏஐஒஓஔ', ['a','aa','i','ee','u','oo','e','ae','ai','o','oa','au']))
    consonants = dict(zip('கஙசஜஞடணதநபமயரலவழளறனஷஸஹஶ', ['k','ng','s','j','ny','t','n','th','n','p','m','y','r','l','v','zh','l','r','n','sh','s','h','sh']))
    signs = dict(zip('ாிீுூெேைொோௌ்', ['aa','i','ee','u','oo','e','ae','ai','o','oa','au','']))
    out=[];i=0
    while i<len(text):
        char=text[i]
        if char in consonants:
            suffix='a'
            if i+1<len(text) and text[i+1] in signs:
                i+=1;suffix=signs[text[i]]
            out.append(consonants[char]+suffix)
        else: out.append(vowels.get(char,char))
        i+=1
    return ''.join(out)

def main():
    from faster_whisper import WhisperModel
    from faster_whisper.audio import decode_audio
    parser = argparse.ArgumentParser()
    parser.add_argument('input')
    parser.add_argument('output')
    parser.add_argument('--model', default='large-v3')
    parser.add_argument('--vocabulary', default='', help='Names and terms to aid recognition')
    parser.add_argument('--language', default='ta')
    parser.add_argument('--beam-size', type=int, default=1)
    parser.add_argument('--cpu-threads', type=int, default=int(os.environ.get('WHISPER_THREADS', min(6, os.cpu_count() or 2))))
    parser.add_argument('--window', type=int, default=0, help='Optional independent window seconds; 0 retains full narration context')
    parser.add_argument('--script', help='Optional spoken script used as decoding context, not forced alignment')
    parser.add_argument('--no-vad', action='store_true', default=True, help='Retain difficult speech that voice activity detection might skip')
    parser.add_argument('--vad', action='store_false', dest='no_vad', help='Opt in to voice-activity filtering')
    parser.add_argument('--native', action='store_true', help='Keep Tamil script instead of phonetic Latin transliteration')
    args = parser.parse_args()
    sys.stdout.reconfigure(encoding='utf-8')
    print(f'Loading {args.model} locally on CPU (first run downloads the model)...', flush=True)
    model = WhisperModel(args.model, device='cpu', compute_type='int8', cpu_threads=max(1,args.cpu_threads),
                         download_root=str(Path('.models').resolve()))
    audio = decode_audio(args.input, sampling_rate=16000)
    context = Path(args.script).read_text(encoding='utf-8') if args.script else None
    all_words, all_segments = [], []
    # Full context by default; explicit short-window retries are available for ASR review.
    window = args.window * 16000 if args.window > 0 else len(audio)
    for offset in range(0, len(audio), window):
        base = offset / 16000
        segments, _ = model.transcribe(audio[offset:offset + window], language=args.language,
            beam_size=args.beam_size, word_timestamps=True, condition_on_previous_text=False,
            vad_filter=not args.no_vad, vad_parameters={'threshold': .25, 'min_silence_duration_ms': 800}, no_speech_threshold=None if args.no_vad else .6, initial_prompt=context or args.vocabulary or None,
            repetition_penalty=1.0, compression_ratio_threshold=2.4)
        for segment in segments:
            print(f'ASR segment {base + segment.start:.1f}s - {base + segment.end:.1f}s', flush=True)
            all_segments.append({'start': base + segment.start, 'end': base + segment.end,
                'text': segment.text, 'avg_logprob': segment.avg_logprob})
            for word in segment.words or []:
                raw = word.word.strip()
                if raw and word.end > word.start:
                    all_words.append({'word': raw if args.native else romanize(raw), 'original': raw,
                        'start': round(base + word.start, 3), 'end': round(base + word.end, 3),
                        'probability': round(word.probability, 4)})
        result = {'model': args.model, 'language': args.language, 'duration': len(audio) / 16000,
            'scriptUsedAsContext': bool(context), 'segments': all_segments, 'words': all_words,
            'reviewRequired': [w for w in all_words if w['probability'] < .5 or w['end'] - w['start'] > 2.5 or len(w['word']) > 24]}
        output = Path(args.output)
        output.parent.mkdir(parents=True, exist_ok=True)
        output.write_text(json.dumps(result, ensure_ascii=False, indent=2), encoding='utf-8')
        print(f'{min(len(audio)/16000, base + window/16000):.1f}s / {len(audio)/16000:.1f}s: {len(all_words)} words', flush=True)

if __name__ == '__main__':
    main()
