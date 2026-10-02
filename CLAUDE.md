# CLAUDE.md

**Pushing to `main` publishes the website.** Cloudflare Pages deploys `main` to https://keyline.dev on every push, with no build step and no review in between, so a broken page is public within a minute.

- Work on a branch. Pages builds every pushed branch as a preview at `https://<branch>.keyline-dev.pages.dev`; check it there.
- Merge into `main` only when the work is finished and checked: the page at 1440, 768 and 390px wide in light and dark, and no broken links. Squash the branch into one commit.
- Never push `main` without the owner's go-ahead.
- After a push to `main`, check the live site: the home page, a missing path (must be a 404) and `llms.txt`.

Everything in this repo is served, this file included (`_headers` keeps repo files out of search). How the site is built is in [README.md](README.md); what to update after a keyline release is in the product repo's CLAUDE.md.
