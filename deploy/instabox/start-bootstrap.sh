#!/usr/bin/env bash
set -euo pipefail
release=${1:?release required}
[[ "$release" =~ ^/data/reel-studio/releases/[a-f0-9]{16}$ ]] || exit 1
mkdir -p /data/reel-studio/logs
nohup bash "$release/deploy/instabox/bootstrap.sh" "$release" > /data/reel-studio/logs/bootstrap.log 2>&1 </dev/null &
echo "Bootstrap started as PID $!"
