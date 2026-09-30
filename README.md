# keyline.dev

The marketing site for [keyline](https://github.com/keyline-dev/keyline): one static page, no build step.

- `index.html`, `style.css`, `site.js`: the page.
- `scenes/`: keyline scene files for every image on the page.
- `assets/`: their renders, committed. `./render.sh` re-renders them with keyline (`KEYLINE=/path/to/keyline-mcp` if it isn't on the PATH; the MP4 needs ffmpeg).

Preview locally: `python3 -m http.server` and open http://localhost:8000.

Hosted on Cloudflare Pages from `main`, at https://keyline.dev.
