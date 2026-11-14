#!/usr/bin/env bash
set -euo pipefail
base=/data/reel-studio
release=${1:?release directory required}
[[ "$release" =~ ^/data/reel-studio/releases/[a-f0-9]{16}$ ]] || { echo 'Invalid release directory'; exit 1; }
[[ -f "$release/package.json" ]] || { echo 'Missing release'; exit 1; }
mkdir -p "$base/logs" "$base/state" "$base/toolchain"
status() { printf '{"stage":"%s","state":"%s","release":"%s","updatedAt":"%s"}\n' "$1" "$2" "${release##*/}" "$(date -u +%FT%TZ)" > "$base/bootstrap-status.json.tmp"; mv "$base/bootstrap-status.json.tmp" "$base/bootstrap-status.json"; }
exec 9>"$base/deploy.lock"
flock -n 9 || { echo 'Another deployment is already preparing this machine'; exit 1; }
trap 'status "bootstrap failed; inspect bootstrap.log" failed' ERR
status 'Install Linux dependencies' running
sudo apt-get update -qq
sudo DEBIAN_FRONTEND=noninteractive apt-get install -y --no-install-recommends ca-certificates curl xz-utils python3 python3-venv ffmpeg chromium libgomp1 fonts-liberation tar
status 'Install pinned Node runtime' running
node_version=24.16.0
node_name=node-v${node_version}-linux-x64
if [[ ! -x "$base/toolchain/$node_name/bin/node" ]]; then
  curl --fail --location --retry 2 "https://nodejs.org/dist/v$node_version/$node_name.tar.xz" -o "$base/toolchain/$node_name.tar.xz"
  curl --fail --location --retry 2 "https://nodejs.org/dist/v$node_version/SHASUMS256.txt" -o "$base/toolchain/SHASUMS256.txt"
  (cd "$base/toolchain"; grep " $node_name.tar.xz$" SHASUMS256.txt | sha256sum -c -)
  tar -xJf "$base/toolchain/$node_name.tar.xz" -C "$base/toolchain"
fi
export PATH="$base/toolchain/$node_name/bin:$PATH"
status 'Install application dependencies' running
cd "$release"
npm ci --no-audit --no-fund
python3 -m venv "$base/venv"
"$base/venv/bin/pip" install --disable-pip-version-check --no-cache-dir -r requirements-transcription.txt
status 'Prepare persistent media and job storage' running
for name in Output video images logos audio fonts; do mkdir -p "$base/state/$name"; done
for name in images logos audio fonts; do
  if [[ -L "$release/public/$name" ]]; then continue; fi
  cp -an "$release/public/$name/." "$base/state/$name/"
  mv "$release/public/$name" "$release/public/$name.bundled"
  ln -s "$base/state/$name" "$release/public/$name"
done
[[ -L "$release/Output" ]] || ln -s "$base/state/Output" "$release/Output"
[[ -L "$release/public/video" ]] || ln -s "$base/state/video" "$release/public/video"
mkdir -p "$base/models"
status 'Download CPU-int8 Whisper model' running
"$base/venv/bin/python" -c "from faster_whisper.utils import download_model; download_model('large-v3', output_dir='/data/reel-studio/models/large-v3-local')"
status 'Build dashboard' running
npm run build:dashboard
if ! id reelstudio >/dev/null 2>&1; then sudo useradd --system --home-dir "$base/home" --create-home --shell /usr/sbin/nologin reelstudio; fi
sudo chown -R reelstudio:reelstudio "$base/state" "$base/home" "$base/models"
sudo chown -R reelstudio:reelstudio "$release"
if [[ ! -f "$base/config/studio.env" ]]; then
  status 'Runtime prepared; configure Gemini and a studio password' needs_configuration
  exit 0
fi
sudo chown root:root "$base/config/studio.env"
sudo chmod 600 "$base/config/studio.env"
sudo install -m 644 "$release/deploy/instabox/reel-studio.service" /etc/systemd/system/reel-studio.service
sudo install -m 644 "$release/deploy/instabox/reel-studio-health.service" /etc/systemd/system/reel-studio-health.service
sudo install -m 644 "$release/deploy/instabox/reel-studio-health.timer" /etc/systemd/system/reel-studio-health.timer
ln -sfn "$release" "$base/current"
sudo systemctl daemon-reload
sudo systemctl enable reel-studio.service reel-studio-health.timer
sudo systemctl restart reel-studio.service
sudo systemctl start reel-studio-health.timer
status 'Check supervised service' running
for attempt in $(seq 1 30); do
  if curl --fail --silent http://127.0.0.1:4317/api/health >/dev/null; then
    if ! curl --fail --silent http://127.0.0.1:4317/api/auth/status | grep -q '"required":true'; then echo 'Authentication was not enabled'; exit 1; fi
    status 'Service ready; cloud benchmark still required' ready
    exit 0
  fi
  sleep 2
done
echo 'Service failed to become healthy'; exit 1
