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
