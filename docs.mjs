// Builds the docs pages, llms.txt, llms-full.txt and sitemap.xml from
// keyline's Markdown. Run after the docs change: `npm run docs`.
// KEYLINE_SRC points at a keyline checkout (default ../visual-renderer).
// The header and footer are copied from index.html, so they never drift.
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { dirname, join, posix } from 'node:path';
import { Marked } from 'marked';

const SRC = process.env.KEYLINE_SRC ?? '../visual-renderer';
const SITE = 'https://keyline.dev';
const REPO = 'https://github.com/keyline-dev/keyline/blob/main/';

// Source file, its URL, title, description. Order is the sidebar's.
const PAGES = [
  { src: 'README.md', section: 'Quick start', url: '/docs/install/', title: 'Install',
    description: 'Install keyline for Claude Code, Claude Desktop, Codex, Cursor, VS Code and any MCP client, or run it in CI.' },
  { src: 'docs/concepts.md', url: '/docs/', title: 'Concepts',
    description: 'How keyline works: scenes, sizes, layout, checks and renders, the ideas behind the design engine for AI agents.' },
  { src: 'docs/scene.md', url: '/docs/scene/', title: 'Scene format',
    description: 'The keyline scene format: every layer, field, default and unit, from layout and text to motion and video.' },
  { src: 'docs/tools.md', url: '/docs/tools/', title: 'Tools and replies',
    description: 'keyline\'s MCP tools, their replies and problem lines, output formats, server flags and rendering without an agent.' },
  { src: 'bench/versus-browser/README.md', url: '/benchmark/', title: 'Benchmark: keyline vs a headless browser',
    description: 'The same model makes the same images with keyline and with headless Chrome: method, every run and the results.' },
];

const home = readFileSync('index.html', 'utf8');
const header = home.match(/<header class="nav">[\s\S]*?<\/header>/)[0];
const footer = home.match(/<footer class="footer">[\s\S]*?<\/footer>/)[0];

// Every path on the site is relative, so it works from any server, any
// folder, or opened as a file. `up` climbs from a page to the site's root.
const up = (url) => '../'.repeat(url.split('/').filter(Boolean).length);
// A site path like /docs/tools/#replies, as seen from the page at `from`.
function rel(from, to) {
  const [path, hash] = to.split('#');
  return up(from) + path.slice(1) + 'index.html' + (hash ? '#' + hash : '');
}
// The home page's header and footer, moved down to a page at `from`.
const relocate = (html, from) => html
  .replace(/(href|src|srcset)="(?![a-z]+:|#|\/)([^"]*)"/g, (_, a, v) => `${a}="${up(from)}${v}"`)
  .replace(/href="#([^"]*)"/g, (_, id) => `href="${up(from)}index.html#${id}"`);

// GitHub's heading ids, so links like tools.md#replies keep working.
const slug = (text) => text.toLowerCase().replace(/<[^>]+>/g, '').replace(/[^\w\- ]/g, '').replace(/ /g, '-');
const esc = (s) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

// A link in `from` (a repo path) to `href`: a docs page on the site, else the repo.
function link(from, href) {
  if (/^([a-z]+:|#|\/)/.test(href)) return href;
  const [path, hash = ''] = href.split('#');
  const target = posix.normalize(posix.join(posix.dirname(from), path));
  const page = PAGES.find((p) => p.src === target && !p.section)
    ?? (target === 'README.md' && hash === 'quick-start' ? PAGES[0] : null);
  if (page) return page.url + (hash && !page.section ? '#' + hash : '');
  return REPO + target + (hash ? '#' + hash : '');
}

function markdown(page) {
  let md = readFileSync(join(SRC, page.src), 'utf8');
  if (page.section) {
    // One section of a bigger file, as its own page.
    const start = md.indexOf(`\n## ${page.section}\n`);
    const end = md.indexOf('\n## ', start + 1);
    md = `# ${page.title}\n` + md.slice(start + page.section.length + 5, end < 0 ? undefined : end);
  }
  return md.replace(/^# .*$/m, `# ${page.title}`);
}

function render(page, md) {
  const toc = [];
  const marked = new Marked({
    gfm: true,
    renderer: {
      heading({ tokens, depth }) {
        const html = this.parser.parseInline(tokens);
        const id = slug(html);
        if (depth === 2) toc.push({ id, html });
        return depth === 1 ? `<h1>${html}</h1>\n`
          : `<h${depth} id="${id}"><a class="anchor" href="#${id}">${html}</a></h${depth}>\n`;
      },
      link({ href, title, tokens }) {
        const t = title ? ` title="${esc(title)}"` : '';
        const to = link(page.src, href);
        const out = to.startsWith('/') ? rel(page.url, to) : to;
        let text = this.parser.parseInline(tokens);
        // "tools.md" reads as a file on GitHub; on the site, name the page.
        const named = PAGES.find((p) => to.split('#')[0] === p.url && /^(<code>)?[\w/.-]+\.md(<\/code>)?$/.test(text));
        if (named) text = named.title;
        return `<a href="${esc(out)}"${t}>${text}</a>`;
      },
    },
  });
  // Wide tables scroll inside their own box, not the page.
  const body = marked.parse(md).replace(/<table>/g, '<div class="table"><table>').replace(/<\/table>/g, '</table></div>');
  return { body, toc };
}

function shell(page, { body, toc }, mdName) {
  const side = PAGES.map((p) => `<a href="${rel(page.url, p.url)}"${p === page ? ' aria-current="page"' : ''}>${esc(p.title.replace(/:.*/, ''))}</a>`).join('');
  const onPage = toc.length > 1 ? `<p class="toc-title">On this page</p>${toc.map((h) => `<a href="#${h.id}">${h.html}</a>`).join('')}` : '';
  const ld = {
    '@context': 'https://schema.org', '@type': 'TechArticle', headline: page.title,
    description: page.description, url: SITE + page.url, inLanguage: 'en',
    isPartOf: { '@type': 'WebSite', name: 'keyline', url: SITE + '/' },
    about: { '@type': 'SoftwareApplication', name: 'keyline', url: SITE + '/' },
  };
  return `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>${esc(page.title)} · keyline</title>
  <meta name="description" content="${esc(page.description)}">
  <link rel="canonical" href="${SITE}${page.url}">
  <link rel="alternate" type="text/markdown" href="${mdName}">
  <meta property="og:type" content="article">
  <meta property="og:site_name" content="keyline">
  <meta property="og:title" content="${esc(page.title)} · keyline">
  <meta property="og:description" content="${esc(page.description)}">
  <meta property="og:image" content="${SITE}/assets/og/og-v0.png">
  <meta property="og:url" content="${SITE}${page.url}">
  <meta name="twitter:card" content="summary_large_image">
  <link rel="icon" href="${up(page.url)}favicon.svg" type="image/svg+xml">
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&family=JetBrains+Mono:wght@400;500&display=swap" rel="stylesheet">
  <link rel="stylesheet" href="${up(page.url)}style.css">
  <script type="application/ld+json">${JSON.stringify(ld)}</script>
</head>
<body>
  ${relocate(header, page.url)}

  <main class="wrap doc">
    <nav class="doc-side" aria-label="Docs">${side}</nav>
    <article class="prose">
${body}
      <p class="doc-source">This page is built from <a href="${REPO}${page.src}">${esc(page.src)}</a>; also as <a href="${mdName}">Markdown</a>.</p>
    </article>
    <nav class="doc-toc" aria-label="On this page">${onPage}</nav>
  </main>

  ${relocate(footer, page.url)}
</body>
</html>
`;
}

const write = (path, text) => { mkdirSync(dirname(path), { recursive: true }); writeFileSync(path, text); };
const full = [];
for (const page of PAGES) {
  const md = markdown(page);
  const mdUrl = page.url + 'index.md';
  write('.' + mdUrl, md);
  write('.' + page.url + 'index.html', shell(page, render(page, md), 'index.md'));
  full.push(md);
}

// The license, as written.
const license = readFileSync(join(SRC, 'LICENSE'), 'utf8');
write('license/LICENSE.txt', license);
write('license/index.html', shell(
  { title: 'License', url: '/license/', src: 'LICENSE', description: 'keyline is source-available under the PolyForm Shield License 1.0.0.' },
  { body: `<h1>License</h1>\n<p>keyline is source-available under PolyForm Shield 1.0.0: use, change and share it, commercially too, except to compete with it.</p>\n<pre class="license">${esc(license)}</pre>`, toc: [] },
  'LICENSE.txt'));

// llms.txt (llmstxt.org): what keyline is, then where the plain-text docs are.
const summary = home.match(/<meta name="description" content="([^"]+)"/)[1];
write('llms.txt', `# keyline

> ${summary}

keyline is an MCP server (one native Rust binary on Skia) that an AI agent drives to compose images and video: the agent writes a small JSON scene, keyline lays it out at every requested size, measures it (text fit, overflow, contrast, safe areas) and replies with problems to fix, then renders PNG, JPEG, WebP, PDF, GIF, animated PNG, MP4 or WebM. Source-available under PolyForm Shield 1.0.0.

## Docs

${PAGES.slice(0, 4).map((p) => `- [${p.title}](${SITE}${p.url}index.md): ${p.description}`).join('\n')}

## Optional

- [${PAGES[4].title}](${SITE}${PAGES[4].url}index.md): ${PAGES[4].description}
- [All docs in one file](${SITE}/llms-full.txt)
- [Source](https://github.com/keyline-dev/keyline)
`);
write('llms-full.txt', full.join('\n\n---\n\n'));

const day = new Date().toISOString().slice(0, 10);
write('sitemap.xml', `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${['/', ...PAGES.map((p) => p.url), '/license/'].map((u) => `  <url><loc>${SITE}${u}</loc><lastmod>${day}</lastmod></url>`).join('\n')}
</urlset>
`);
console.log(`built ${PAGES.length} pages, llms.txt, llms-full.txt, sitemap.xml`);
