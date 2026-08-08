# AGENTS.md

## Cursor Cloud specific instructions

This repo is a **static, hand-built portfolio site** (plain HTML/CSS/JS, no framework,
no build step, no package manager, no automated tests, no linter). Hosted on GitHub Pages;
pushing to `main` deploys automatically.

### Running the site (development)

Serve the repo root over HTTP and open it in a browser:

```bash
python3 -m http.server 8000   # then open http://localhost:8000
```

(This is the documented preview command in `README.md`.) Opening the HTML files via
`file://` is not reliable because pages like `contact.html`/`about.html` are redirect
stubs to root-relative anchors (e.g. `/#contact`), which only resolve when served over HTTP.

### Non-obvious notes

- **No dependencies to install.** The update script is effectively a no-op; there is
  nothing to `npm install` / `pip install`. Third-party libs (GSAP, ScrollTrigger, Lenis)
  are loaded from CDNs at runtime, so an internet connection is needed for full motion —
  the site degrades gracefully without them (progressive enhancement + reduced-motion safe).
- **The site is single-page.** `index.html` holds all sections (hero, about, work,
  writing, contact); `about.html`, `projects.html`, `writing.html`, `contact.html` are
  thin redirect stubs to `/#<anchor>`.
- **No lint/test/build tooling exists.** Do not invent CI commands. "Building" is just the
  static files as-is; "running" is serving them.
- Project details open in a slide-in modal driven by `js/main.js`; About stat numbers and
  the kinetic word loop are the sanctioned motion moments (see `CONTEXT.md`).
