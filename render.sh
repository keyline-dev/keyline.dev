#!/bin/sh
# Renders every image on the site with keyline itself, into assets/.
# Needs keyline-mcp on the PATH (or KEYLINE=/path/to/keyline-mcp) and, for
# the MP4, ffmpeg. The renders are committed; rerun after changing a scene.
set -eu
cd "$(dirname "$0")"
k=${KEYLINE:-keyline-mcp}
# The CPU renderer draws the same pixels on every machine.
$k render scenes/cold-brew.json --out assets/cold-brew --format webp --renderer cpu
$k render scenes/cold-brew-motion.json --out assets/cold-brew-motion --format mp4 --renderer cpu
# The preview shown when the site is shared.
$k render scenes/og.json --out assets/og --format png --renderer cpu --allow-read .
# The hero: stills, then its loops. keyline renders MP4 at full size; the
# page plays half-size copies (ffmpeg) to stay light.
$k render scenes/villa.json --out assets/villa --format webp --renderer cpu
$k render scenes/villa.json --out assets/villa --format mp4 --renderer cpu
for s in portrait banner sky; do
  scale=$([ "$s" = sky ] && echo "iw:-2" || echo "iw/2:-2")
  ffmpeg -v error -y -i "assets/villa/$s-v0.mp4" -vf "scale=$scale" -c:v libx264 -crf 24 -preset slow \
    -pix_fmt yuv420p -movflags +faststart -an "assets/villa/$s-web.mp4"
  rm "assets/villa/$s-v0.mp4"
done
