"""Stream an authenticated studio backup without configuration secrets or model caches."""
import argparse
import json
import sys
import tarfile
from pathlib import Path


def entries(root):
    root = Path(root).resolve()
    output = root / 'Output'
    candidates = []
    if output.exists():
        candidates += [(p, 'Output/' + p.name) for p in output.iterdir()
                       if p.is_file() and p.suffix.lower() in {'.mp4', '.mov', '.webm', '.json'}
                       and p.name != 'sharing-status.json']
        for name in ['.studio', '.automation', '.research']:
            base = output / name
            if base.exists():
                candidates += [(p, str(p.relative_to(root)).replace('\\', '/')) for p in base.rglob('*') if p.is_file() and not p.is_symlink() and p.suffix != '.tmp']
    for name in ['video', 'images', 'logos', 'audio', 'fonts']:
        base = root / 'public' / name
        if not base.exists():
            continue
        resolved_base = base.resolve()
        for p in base.rglob('*'):
            if p.is_file() and not p.is_symlink() and p.resolve().is_relative_to(resolved_base):
                candidates.append((p, 'public/' + name + '/' + str(p.relative_to(base)).replace('\\', '/')))
    for source, archive in candidates:
        if source.name.lower().endswith(('.env', '.key', '.pem')) or source.name.startswith('.env'):
            continue
        yield source, archive


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument('--root', required=True)
    parser.add_argument('--list', action='store_true')
    args = parser.parse_args()
    files = list(entries(args.root))
    if args.list:
        print(json.dumps([name for _, name in files], indent=2))
        return
    with tarfile.open(fileobj=sys.stdout.buffer, mode='w|gz', dereference=True) as archive:
        for source, name in files:
            archive.add(source, arcname=name, recursive=False)


if __name__ == '__main__':
    main()
