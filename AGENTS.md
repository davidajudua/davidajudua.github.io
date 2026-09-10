# AGENTS.md

Workspace memory and routing live at `../../AGENTS.md` when this folder is inside `davidajudua/workspace`.
This directory is the site source of truth and is published to the public mirror `davidajudua/davidajudua.github.io`.
Do not commit on the mirror repo.

## Cursor Cloud specific instructions

This repo is a **static, hand-built personal site** (plain HTML/CSS/JS, no framework,
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

- **No dependencies to install.** The homepage uses native browser scrolling, animation, and media controls.
  Google Fonts is optional; system fonts provide the fallback.
- **The site is single-page.** `index.html` holds the hero, about, work, and contact sections.
  About, projects, and contact paths redirect to their corresponding anchors; legacy writing paths redirect to About.
- **No lint/test/build tooling exists.** Do not invent CI commands. "Building" is just the
  static files as-is; "running" is serving them.
- Project details open in a modal driven by `js/main.js`; their contents are inline without JavaScript.
  The names and background video carry ambient motion (see `CONTEXT.md`).
