// Install tabs and copy buttons; the page works without this, showing
// the first tab.
for (const tab of document.querySelectorAll('[role="tab"]')) {
  tab.addEventListener('click', () => {
    for (const t of document.querySelectorAll('[role="tab"]')) {
      t.setAttribute('aria-selected', String(t === tab));
    }
    for (const p of document.querySelectorAll('[data-panel]')) {
      p.hidden = p.dataset.panel !== tab.dataset.tab;
    }
  });
}

for (const button of document.querySelectorAll('.copy')) {
  button.addEventListener('click', async () => {
    const text = button.parentElement.querySelector('code').textContent;
    try {
      await navigator.clipboard.writeText(text);
      button.textContent = 'Copied';
    } catch {
      button.textContent = 'Select and copy';
    }
    setTimeout(() => { button.textContent = 'Copy'; }, 1600);
  });
}

// Visitors who ask for less motion get the still poster, not the video.
if (matchMedia('(prefers-reduced-motion: reduce)').matches) {
  for (const v of document.querySelectorAll('video[autoplay]')) {
    v.removeAttribute('autoplay');
    v.pause();
  }
}

// Star count and latest version from GitHub; without them the nav shows
// only the GitHub icon and the hero "Latest release".
const gh = (path) => fetch(`https://api.github.com/repos/keyline-dev/keyline${path}`).then((r) => r.ok ? r.json() : Promise.reject());
// ponytail: hidden below 50 stars, where a count argues against us.
gh('').then((repo) => {
  if (repo.stargazers_count < 50) return;
  document.getElementById('stars').textContent = `★ ${repo.stargazers_count.toLocaleString('en')}`;
}).catch(() => {});
gh('/releases/latest').then((rel) => {
  document.getElementById('release').textContent = `Latest: ${rel.tag_name} · release notes`;
}).catch(() => {});
