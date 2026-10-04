# keyline.dev

The site for [keyline](https://github.com/keyline-dev/keyline): static pages, no build step on the host. Everything generated is committed.

- `index.html`, `style.css`, `site.js`: the page. The install tab for each client (between the `client tabs` and `client panels` markers) is built from the README's setup blocks by `npm run docs`; edit those blocks in keyline, never the tabs.
- `scenes/`: keyline scene files for every image on the page.
- `docs/`, `benchmark/`, `license/`, `privacy/`, `security/`, `llms.txt`, `llms-full.txt`, `sitemap.xml`: generated from keyline's Markdown by `npm run docs` (`docs.mjs`, after `npm install`; `KEYLINE_SRC=/path/to/keyline` if it isn't at `../visual-renderer`). `benchmark/` comes from keyline-bench's `versus-browser/README.md` (`KEYLINE_BENCH=/path/to/keyline-bench` if it isn't at `../keyline-bench`). Rerun when either changes. Each page also has a plain `index.md` beside it, for LLMs.
- `robots.txt`: hand-written.
- `assets/`: their renders, committed. `./render.sh` re-renders them with keyline (`KEYLINE=/path/to/keyline-mcp` if it isn't on the PATH; the MP4 needs ffmpeg).

Preview locally: `python3 -m http.server` and open http://localhost:8000.

Hosted on Cloudflare Pages from `main`, at https://keyline.dev.
