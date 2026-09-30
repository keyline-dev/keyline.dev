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
$k render scenes/og.json --out assets/og --format png --renderer cpu
