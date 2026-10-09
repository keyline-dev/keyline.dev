#!/bin/sh
# Renders every image on the site with keyline itself, into assets/.
# Needs keyline-mcp on the PATH (or KEYLINE=/path/to/keyline-mcp) and, for
# MP4, ffmpeg. The renders are committed; rerun after changing a scene.
set -eu
cd "$(dirname "$0")"
k=${KEYLINE:-keyline-mcp}
# The CPU renderer draws the same pixels on every machine; scenes read their
# photos and logo from this folder.
r() { "$k" render "$@" --renderer cpu --folder .; }

# The hero: stills, then loops. keyline renders MP4 at full size; the page
# plays half-size copies (ffmpeg) to stay light.
r scenes/villa.json --out assets/villa --format webp
r scenes/villa.json --out assets/villa --format mp4
for s in portrait banner sky; do
  scale=$([ "$s" = sky ] && echo "iw:-2" || echo "iw/2:-2")
  ffmpeg -v error -y -i "assets/villa/$s-v0.mp4" -vf "scale=$scale" -c:v libx264 -crf 24 -preset slow \
    -pix_fmt yuv420p -movflags +faststart -an "assets/villa/$s-web.mp4"
  rm "assets/villa/$s-v0.mp4"
done

# The gallery. Motion pieces render at half-size "web" or "*-loop" sizes;
# a video with no still of its own gets one from --time, as its poster.
r scenes/adoption.json --out assets/adoption --format webp --size instagram-square --size instagram-story --rows scenes/adoption-rows.json
r scenes/adoption.json --out assets/adoption --format mp4 --size story-loop --rows scenes/adoption-rows.json
r scenes/ebike.json --out assets/ebike --format webp --size portrait --size feed --size half-page --size mpu --size leaderboard
r scenes/ebike.json --out assets/ebike --format mp4 --size web
r scenes/festival.json --out assets/festival --format mp4
r scenes/festival.json --out assets/festival --format webp --time 7
r scenes/festival-thumb.json --out assets/festival --format webp
r scenes/campaign.json --out assets/campaign --format webp --rows scenes/campaign-rows.json
r scenes/cadence.json --out assets/cadence --format webp --size x-post --size linkedin --size square
r scenes/cadence.json --out assets/cadence --format mp4 --size web
r scenes/menu.json --out assets/menu --size a4 --format pdf --max-kb 300
r scenes/menu.json --out assets/menu --size instagram-portrait --size a4 --format webp
r scenes/menu.json --out assets/menu --size story-loop --format mp4
r scenes/menu.json --out assets/menu --size story-loop --format webp --time 5

# The image at the top of keyline's README (and for posts): one prompt, every size.
r scenes/readme-hero.json --out assets/readme --format png
# README motion: the festival teaser as animated WebP (GitHub doesn't play
# MP4 from another site), from keyline's own render.
ffmpeg -v error -y -i assets/festival/land-v0.mp4 -vf "fps=15,scale=640:-2:flags=lanczos" \
  -c:v libwebp_anim -loop 0 -quality 70 -compression_level 6 assets/readme/festival-v0.webp

# The preview shown when the site is shared.
r scenes/og.json --out assets/og --format png
