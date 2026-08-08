# davidajudua.github.io

Source for my personal site: [davidajudua.github.io](https://davidajudua.github.io).

A static, hand-built portfolio (HTML/CSS/JS, no framework) covering what I build, selected
projects, and writing. Hosted on GitHub Pages.

## Structure

| File | Page |
|---|---|
| `index.html` | Home |
| `about.html` | About |
| `projects.html` | Projects |
| `writing.html` | Writing |
| `contact.html` | Contact |
| `assets/`, `css/`, `js/` | Styles, scripts, and media |
| `styleguide.html` | Living style guide / design-system reference |

The design system (tokens + usage rules) is documented in [`docs/design-system.md`](docs/design-system.md);
tokens live in the `:root` block of `css/style.css` and are rendered live at `styleguide.html`.

## Local preview

```bash
git clone https://github.com/davidajudua/davidajudua.github.io.git
cd davidajudua.github.io
python3 -m http.server 8000   # then open http://localhost:8000
```

Pushing to `main` deploys to GitHub Pages automatically.
