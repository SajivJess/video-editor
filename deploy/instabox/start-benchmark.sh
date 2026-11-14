#!/usr/bin/env bash
set -euo pipefail
release=${1:?release required}
mode=${2:-saved-project}
source_name=${3:?source filename required}
[[ "$release" =~ ^/data/reel-studio/releases/[a-f0-9]{16}$ ]] || exit 1
[[ "$mode" == saved-project || "$mode" == new-video ]] || exit 1
[[ "$source_name" =~ ^benchmark-[a-f0-9]{16}\.(mp4|mov|webm)$ ]] || exit 1
base=/data/reel-studio
args=()
[[ "$mode" == new-video ]] && args+=(--new-video)
mkdir -p "$base/logs"
export PATH="$base/toolchain/node-v24.16.0-linux-x64/bin:$PATH"
export REEL_PYTHON="$base/venv/bin/python"
export WHISPER_MODEL="$base/models/large-v3-local"
export WHISPER_THREADS=4 RENDER_CONCURRENCY=1 REMOTION_BROWSER_EXECUTABLE=/usr/bin/chromium
cd "$release"
nohup sudo -u reelstudio -- env PATH="$PATH" REEL_PYTHON="$REEL_PYTHON" WHISPER_MODEL="$WHISPER_MODEL" WHISPER_THREADS=4 RENDER_CONCURRENCY=1 REMOTION_BROWSER_EXECUTABLE=/usr/bin/chromium node scripts/cloud-benchmark.cjs "${args[@]}" --source "$source_name" > "$base/logs/benchmark-$mode.log" 2>&1 </dev/null &
echo "Independent cloud benchmark started as PID $!"
