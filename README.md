# keyline.dev

The site for [keyline](https://github.com/keyline-dev/keyline): static pages, no build step on the host. Everything generated is committed.

- `index.html`, `style.css`, `site.js`: the page.
- `scenes/`: keyline scene files for every image on the page.
- `docs/`, `benchmark/`, `license/`, `llms.txt`, `llms-full.txt`, `sitemap.xml`: generated from keyline's Markdown by `npm run docs` (`docs.mjs`, after `npm install`; `KEYLINE_SRC=/path/to/keyline` if it isn't at `../visual-renderer`). Rerun when keyline's docs change. Each page also has a plain `index.md` beside it, for LLMs.
- `robots.txt`: hand-written.
- `assets/`: their renders, committed. `./render.sh` re-renders them with keyline (`KEYLINE=/path/to/keyline-mcp` if it isn't on the PATH; the MP4 needs ffmpeg).

Preview locally: `python3 -m http.server` and open http://localhost:8000.

Hosted on Cloudflare Pages from `main`, at https://keyline.dev.
