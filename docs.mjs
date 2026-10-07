// Builds the docs pages, llms.txt, llms-full.txt and sitemap.xml from
// keyline's Markdown. Run after the docs change: `npm run docs`.
// KEYLINE_SRC points at a keyline checkout (default ../visual-renderer),
// KEYLINE_BENCH at a keyline-bench checkout (default ../keyline-bench).
// The header and footer are copied from index.html, so they never drift.
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { execFileSync } from 'node:child_process';
import { dirname, join, posix } from 'node:path';
import { Marked } from 'marked';

const SRC = process.env.KEYLINE_SRC ?? '../visual-renderer';
const BENCH = process.env.KEYLINE_BENCH ?? '../keyline-bench';
const SITE = 'https://keyline.dev';
const REPO = 'https://github.com/keyline-dev/keyline/blob/main/';

// Source file, its URL, title, description. Order is the sidebar's.
const PAGES = [
  { src: 'README.md', section: 'Quick start', url: '/docs/install/', title: 'Install',
    seoTitle: 'Install the keyline MCP server: Claude Code, Cursor, VS Code, Codex',
    description: 'Install keyline for Claude Code, Claude Desktop, Codex, Cursor, VS Code and any MCP client, or run it in CI.' },
  { src: 'docs/concepts.md', url: '/docs/', title: 'Concepts',
    seoTitle: 'keyline docs: how the MCP design engine works',
    description: 'How keyline works: scenes, sizes, layout, checks and renders, the ideas behind the design engine for AI agents.' },
  { src: 'docs/scene.md', url: '/docs/scene/', title: 'Scene format',
    seoTitle: 'keyline scene format reference: layers, layout, text, motion',
    description: 'The keyline scene format: every layer, field, default and unit, from layout and text to motion and video.' },
  { src: 'docs/tools.md', url: '/docs/tools/', title: 'Tools and replies',
    seoTitle: 'keyline MCP tools, replies and server flags',
    description: 'keyline\'s MCP tools, their replies and problem lines, output formats, server flags and rendering without an agent.' },
  { root: BENCH, src: 'versus-browser/README.md', url: '/benchmark/', title: 'Benchmark: keyline vs a headless browser',
    seoTitle: 'keyline vs headless Chrome vs Playwright MCP: agent token benchmark',
    description: 'The same model makes the same images with keyline, HTML + headless Chrome and Playwright MCP: method, every run, tokens, turns and time.' },
];

// Pages outside the docs, from their sources as written.
const STANDALONE = [
  { src: 'LICENSE.md', url: '/license/', title: 'License',
    description: 'keyline is free and source-available under the Functional Source License 1.1, and each release becomes Apache-2.0 two years after it ships.',
    intro: 'keyline is free to use, change and share, commercially too, except to offer it as a competing commercial product or service; each release also becomes Apache-2.0 two years after it ships.' },
  { src: 'PRIVACY.md', url: '/privacy/', title: 'Privacy',
    description: 'keyline runs on your machine and collects nothing; what it fetches from the network, and why.' },
  { src: 'SECURITY.md', url: '/security/', title: 'Security',
    description: 'How to report a vulnerability in keyline privately, and where to get support.' },
];

const home = readFileSync('index.html', 'utf8');
// The one-sentence definition, from the home page's JSON-LD, so it never drifts.
const DEFINITION = JSON.parse(home.match(/<script type="application\/ld\+json">(.*?)<\/script>/)[1])['@graph']
  .find((n) => n['@type'] === 'SoftwareApplication').description;
// The page title, for search: its own, or "<title> · keyline".
const titleOf = (page) => page.seoTitle ?? `${page.title} · keyline`;
const header = home.match(/<header class="nav">[\s\S]*?<\/header>/)[0];
const footer = home.match(/<footer class="footer">[\s\S]*?<\/footer>/)[0];

// Every path on the site is relative and names a page's folder, never its
// index.html: Pages redirects those, and Google lists each redirect. `up`
// climbs from a page to the site's root.
const up = (url) => '../'.repeat(url.split('/').filter(Boolean).length);
// A site path like /docs/tools/#replies, as seen from the page at `from`.
function rel(from, to) {
  const [path, hash] = to.split('#');
  return (up(from) + path.slice(1) || './') + (hash ? '#' + hash : '');
}
// The home page's header and footer, moved down to a page at `from`.
const relocate = (html, from) => html
  .replace(/(href|src|srcset)="(?![a-z]+:|#|\/)([^"]*)"/g, (_, a, v) =>
    `${a}="${v === './' ? up(from) || './' : up(from) + v}"`)
  .replace(/href="#([^"]*)"/g, (_, id) => `href="${up(from) || './'}#${id}"`);

// GitHub's heading ids, so links like tools.md#replies keep working.
const slug = (text) => text.toLowerCase().replace(/<[^>]+>/g, '').replace(/[^\w\- ]/g, '').replace(/ /g, '-');
const esc = (s) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

// A link in `from` (a repo path) to `href`: a docs page on the site, else the repo.
function link(from, href) {
  if (/^([a-z]+:|#|\/)/.test(href)) return href;
  const [path, hash = ''] = href.split('#');
  const target = posix.normalize(posix.join(posix.dirname(from), path));
  const page = PAGES.find((p) => p.src === target && !p.section)
    ?? STANDALONE.find((p) => p.src === target)
    ?? (target === 'README.md' && hash === 'quick-start' ? PAGES[0] : null);
  if (page) return page.url + (hash && !page.section ? '#' + hash : '');
  return REPO + target + (hash ? '#' + hash : '');
}

function markdown(page) {
  let md = readFileSync(join(page.root ?? SRC, page.src), 'utf8');
  if (page.section) {
    // One section of a bigger file, as its own page.
    const start = md.indexOf(`\n## ${page.section}\n`);
    const end = md.indexOf('\n## ', start + 1);
    md = `# ${page.title}\n\n${DEFINITION}\n` + md.slice(start + page.section.length + 5, end < 0 ? undefined : end)
      .replace(/^###(#*) /gm, '##$1 ');
  }
  return md.replace(/^# .*$/m, `# ${page.title}`);
}

// The Markdown copies (index.md, llms-full.txt) are read off the site, so
// repo-relative links become absolute: a docs page's index.md, else GitHub.
function absolute(page, md) {
  return md.replace(/(!?)\[([^\]]*)\]\(([^)\s]+)\)/g, (m, bang, text, href) => {
    if (bang) return m;
    const to = link(page.src, href);
    if (!to.startsWith('/')) return `[${text}](${to})`;
    const [path, hash] = to.split('#');
    return `[${text}](${SITE}${path}index.md${hash ? '#' + hash : ''})`;
  });
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
        const named = [...PAGES, ...STANDALONE].find((p) => to.split('#')[0] === p.url && /^(<code>)?[\w/.-]+\.md(<\/code>)?$/.test(text));
        if (named) text = named.title;
        return `<a href="${esc(out)}"${t}>${text}</a>`;
      },
    },
  });
  // Wide tables scroll inside their own box, not the page.
  const html = marked.parse(md).replace(/<table>/g, '<div class="table"><table>').replace(/<\/table>/g, '</table></div>');
  // A run of <details> blocks (the install page's clients) becomes buttons
  // with a panel each, like the home page's install tabs (site.js switches them).
  const body = html.replace(/(?:<details>\s*<summary>[\s\S]*?<\/details>\s*)+/g, (run) => {
    const items = [...run.matchAll(/<details>\s*<summary>([\s\S]*?)<\/summary>([\s\S]*?)<\/details>/g)].map(([, summary, inner]) => {
      const label = (summary.match(/<b>(.*?)<\/b>/)?.[1] ?? summary).replace(/<[^>]+>/g, '');
      return { label, id: label.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, ''), inner: inner.trim() };
    });
    const tabs = items.map((t, i) => `<button role="tab" aria-selected="${i === 0}" data-tab="${t.id}">${t.label}</button>`).join('');
    const panels = items.map((t, i) => `<div class="panel" data-panel="${t.id}"${i ? ' hidden' : ''}>\n${t.inner}\n</div>`).join('\n');
    return `<div class="tabs" role="tablist">${tabs}</div>\n${panels}\n`;
  });
  return { body, toc };
}

function shell(page, { body, toc }, mdName) {
  const side = PAGES.map((p) => `<a href="${rel(page.url, p.url)}"${p === page ? ' aria-current="page"' : ''}>${esc(p.title.replace(/:.*/, ''))}</a>`).join('');
  const onPage = toc.length > 1 ? `<p class="toc-title">On this page</p>${toc.map((h) => `<a href="#${h.id}">${h.html}</a>`).join('')}` : '';
  const ld = {
    '@context': 'https://schema.org', '@type': 'TechArticle', headline: page.title,
    description: page.description, url: SITE + page.url, inLanguage: 'en',
    isPartOf: { '@id': SITE + '/#site' },
    about: { '@id': SITE + '/#app' },
    publisher: { '@id': SITE + '/#org' },
  };
  return `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>${esc(titleOf(page))}</title>
  <meta name="description" content="${esc(page.description)}">
  <link rel="canonical" href="${SITE}${page.url}">${mdName ? `\n  <link rel="alternate" type="text/markdown" href="${mdName}">` : ''}
  <meta property="og:type" content="article">
  <meta property="og:site_name" content="keyline">
  <meta property="og:title" content="${esc(titleOf(page))}">
  <meta property="og:description" content="${esc(page.description)}">
  <meta property="og:image" content="${SITE}/assets/og/og-v0.png">
  <meta property="og:image:width" content="1200">
  <meta property="og:image:height" content="630">
  <meta property="og:image:alt" content="keyline: design engine for AI agents">
  <meta property="og:url" content="${SITE}${page.url}">
  <meta name="twitter:card" content="summary_large_image">
  <meta name="twitter:title" content="${esc(titleOf(page))}">
  <meta name="twitter:description" content="${esc(page.description)}">
  <meta name="twitter:image" content="${SITE}/assets/og/og-v0.png">
  <link rel="icon" href="${up(page.url)}favicon.svg" type="image/svg+xml">
  <link rel="icon" href="${up(page.url)}favicon-48.png" sizes="48x48" type="image/png">
  <link rel="apple-touch-icon" href="${up(page.url)}apple-touch-icon.png">
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
${body}${mdName ? `\n      <p class="doc-source">Also as <a href="${mdName}">Markdown</a>.</p>` : ''}
    </article>
    <nav class="doc-toc" aria-label="On this page">${onPage}</nav>
  </main>

  ${relocate(footer, page.url)}
  <script src="${up(page.url)}site.js" defer></script>
</body>
</html>
`;
}

const write = (path, text) => { mkdirSync(dirname(path), { recursive: true }); writeFileSync(path, text); };
const full = [];
for (const page of PAGES) {
  const md = markdown(page);
  const mdUrl = page.url + 'index.md';
  write('.' + mdUrl, absolute(page, md));
  write('.' + page.url + 'index.html', shell(page, render(page, md), 'index.md'));
  full.push(absolute(page, md));
}

// The license, privacy and security pages, as written, with their links on the site.
for (const page of STANDALONE) {
  const text = readFileSync(join(SRC, page.src), 'utf8');
  const md = text.replace(/^# .*$/m, `# ${page.title}` + (page.intro ? `\n\n${page.intro}` : ''));
  write('.' + page.url + 'index.html', shell(page, render(page, md)));
}

// The home page's install tab for each client, from the README's setup
// blocks (all but the Claude ones without the plugin or extension, which
// the Claude tabs cover), between the client markers in index.html.
const readme = readFileSync(join(SRC, 'README.md'), 'utf8');
const clients = [...readme.matchAll(/<details>\n<summary>(.*?)<\/summary>\n([\s\S]*?)<\/details>/g)]
  .filter(([, summary]) => !summary.includes('without the'))
  .map(([, summary, body]) => {
    const name = summary.match(/<b>(.*?)<\/b>/)[1];
    const was = summary.match(/\(formerly (.*?)\)/)?.[1];
    const label = name === 'Any other client' ? 'Other clients' : was ? `${name} (${was})` : name;
    return { label, id: label.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, ''), body };
  });
const panel = new Marked({
  gfm: true,
  renderer: {
    code({ text }) {
      return `<div class="code"><pre><code>${esc(text)}</code></pre><button class="copy">Copy</button></div>\n`;
    },
  },
});
const install = '<p>First <a href="docs/install/#other-clients-install-then-add">install keyline</a> (on a Mac: <code>brew install keyline-dev/tap/keyline-mcp</code>), then:</p>';
const between = (html, name, inner) => html.replace(
  new RegExp(`(<!-- ${name}:[^>]*-->\\n)[\\s\\S]*?( *<!-- /${name} -->)`),
  (_, open, close) => open + inner + close);
const tabs = clients.map((c) => `        <button role="tab" aria-selected="false" data-tab="${c.id}">${esc(c.label)}</button>\n`).join('');
// Unindented: a code block's lines are copied as they are.
const panels = clients.map((c) => `      <div class="panel" data-panel="${c.id}" hidden>\n        ${install}\n        ${panel.parse(c.body).trim().replace(/<table>/g, '<div class="table"><table>').replace(/<\/table>/g, '</table></div>')}\n      </div>\n`).join('');
writeFileSync('index.html', between(between(home, 'client tabs', tabs), 'client panels', panels));

// llms.txt (llmstxt.org): what keyline is, the facts an answer needs, and
// where the plain-text docs are. The benchmark figures are the home page's.
const FACTS = `- Works with Claude Code, Claude Desktop, Cursor, Codex, Gemini CLI, VS Code, GitHub Copilot CLI, Antigravity, Grok Build, Kiro, opencode, JetBrains AI and Junie, Warp, Devin Desktop (Windsurf), Cline and any stdio MCP client; on macOS, Linux, Windows, Docker and GitHub Actions.
- Outputs PNG, JPEG, WebP, vector PDF, GIF, animated PNG, MP4 and WebM, at every size from one master layout.
- Deterministic: no model generates pixels; the same scene always renders the same design.
- In a benchmark (Claude Opus 5, 5 runs each on two tasks, a speaker card and a flyer) an agent used 2× fewer tokens than with HTML + headless Chrome, and 6× fewer than with Playwright MCP, and was correct as often.
- An alternative to Puppeteer or Playwright HTML-to-image screenshots, hosted image APIs like Bannerbear or Placid, and the Canva or Figma APIs, for agents.
- Free and source-available under the Functional Source License 1.1 (FSL-1.1-ALv2); each release becomes Apache-2.0 two years after it ships.`;
write('llms.txt', `# keyline

> ${DEFINITION}

${FACTS}

## Install

- Claude Code: \`/plugin marketplace add keyline-dev/keyline\`, then \`/plugin install keyline@keyline\`
- Cursor: install the binary (\`brew install keyline-dev/tap/keyline-mcp\`, or a download from https://github.com/keyline-dev/keyline/releases/latest), then add \`{ "mcpServers": { "keyline": { "command": "keyline-mcp" } } }\` to \`~/.cursor/mcp.json\`
- Every other client: [Install](${SITE}${PAGES[0].url}index.md)

## Docs

${PAGES.slice(0, 4).map((p) => `- [${p.title}](${SITE}${p.url}index.md): ${p.description}`).join('\n')}

## Optional

- [${PAGES[4].title}](${SITE}${PAGES[4].url}index.md): ${PAGES[4].description}
- [All docs in one file](${SITE}/llms-full.txt)
- [Source](https://github.com/keyline-dev/keyline)
`);
write('llms-full.txt', `# keyline\n\n> ${DEFINITION}\n\n${FACTS}\n\n---\n\n` + full.join('\n\n---\n\n'));

// Each URL's lastmod is its source's last commit, so it moves only when the page does.
const changed = (dir, file) => execFileSync('git', ['-C', dir, 'log', '-1', '--format=%cs', '--', file], { encoding: 'utf8' }).trim();
const urls = [['/', changed('.', 'index.html')], ...PAGES.map((p) => [p.url, changed(p.root ?? SRC, p.src)]), ...STANDALONE.map((p) => [p.url, changed(SRC, p.src)])];
write('sitemap.xml', `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls.map(([u, day]) => `  <url><loc>${SITE}${u}</loc><lastmod>${day}</lastmod></url>`).join('\n')}
</urlset>
`);
console.log(`built ${PAGES.length} pages, llms.txt, llms-full.txt, sitemap.xml`);
