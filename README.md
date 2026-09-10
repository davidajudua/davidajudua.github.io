# davidajudua.github.io

Edits belong in `career/portfolio-site` of the private [davidajudua/workspace](https://github.com/davidajudua/workspace) repo.
This GitHub repo is a public mirror for GitHub Pages.
Do not commit here.

Source for my personal site: [davidajudua.github.io](https://davidajudua.github.io).

A static personal homepage (HTML/CSS/JS, no framework) about David, life at Howard, and software projects.
Hosted on GitHub Pages.

## Structure

| File | Page |
|---|---|
| `index.html` | Home |
| `about.html` | About |
| `projects.html` | Projects |
| `writing.html` | Legacy redirect to About |
| `contact.html` | Contact |
| `assets/`, `css/`, `js/` | Styles, scripts, and media |
| `styleguide.html` | Living style guide / design-system reference |

The design system (tokens + usage rules) is documented in [`docs/design-system.md`](docs/design-system.md).
Tokens live in the `:root` block of `css/style.css` and are rendered live at `styleguide.html`.
The background uses independent landscape and portrait videos with matching posters.
Reduced motion and unavailable JavaScript use still images.
The [personal homepage refresh](docs/personal-site-refresh.md) records the content direction and verification.

## Local preview

```bash
git clone https://github.com/davidajudua/davidajudua.github.io.git
cd davidajudua.github.io
python3 -m http.server 8000   # then open http://localhost:8000
```

Pushing to `main` deploys to GitHub Pages automatically.
