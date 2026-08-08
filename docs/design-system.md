# Design system

The canonical token catalogue for davidajudua.com. Tokens are defined once in the `:root` block
of [`css/style.css`](../css/style.css) and consumed everywhere. See it rendered live at
[`styleguide.html`](../styleguide.html) (served locally at `http://localhost:8000/styleguide.html`).

Design intent and terminology live in [`CONTEXT.md`](../CONTEXT.md); the decision record is
[`docs/adr/0003-design-tokens.md`](adr/0003-design-tokens.md).

## Rules

- **Reference tokens, never literals.** No raw hex, `rgba()`, radii, blur, or `z-index` in
  component CSS &mdash; use a token. Add a token if one is missing.
- **Primitives feed semantics.** Point new colours at `--night-*` / `--amber-*` or the alpha
  ladders, then expose a semantic alias if it has a role (surface, border, text).
- **Pixel-identical constraint.** Token values equal the current design; changing a value
  re-skins the site on purpose. Full spacing/type normalisation is a deferred pass.

## Tokens

| Group | Tokens | Notes |
|---|---|---|
| Colour primitives | `--night-900/800`, `--amber-400/300`, `--accent-ink` | Raw hues from the skyline video |
| Accent alpha | `--accent-a05 … --accent-a55` | Tints, glows, borders |
| White / black alpha | `--white-a012 … --white-a14`, `--black-a55 … --black-a75` | Hairline borders, card washes, grounding shadows |
| Semantic surfaces | `--bg-night`, `--bg-panel`, `--bg-reading`, `--bg-elevated`, `--bg-card`, `--bg-cta`, `--bg-menu`, `--bg-modal-scrim`, `--vignette`, `--nav-grad-*` | `--bg-panel` = Frosted Furniture; `--bg-reading` = Reading Panel |
| Text | `--text-bright/primary/secondary/muted` | |
| Accent (semantic) | `--accent`, `--accent-hover`, `--accent-dim`, `--accent-glow` | |
| Borders | `--border`, `--border-hover`, `--border-accent`, `--border-nav` | |
| Typography | `--font-display/body/mono`, `--display-hero/name/section/ghost`, `--fw-regular/medium/semibold/bold` | Display steps are the shared fluid `clamp()` sizes |
| Spacing | `--space-1 … --space-36` | 4px base rhythm; applied where already on-grid |
| Radii | `--radius-xs/sm/card/modal/pill/round` | |
| Blur / frost | `--frost`, `--frost-nav/backdrop/modal/menu` | `backdrop-filter` values |
| z-index | `--z-set-poster/video/overlay`, `--z-base/raised`, `--z-back-to-top`, `--z-nav-backdrop`, `--z-rail`, `--z-nav`, `--z-nav-toggle`, `--z-modal`, `--z-grain`, `--z-loader` | Ordered stacking scale |
| Motion | `--ease-out`, `--ease-in-out`, `--duration-fast/med/slow/modal/expand/reading` | |
| Layout | `--max-width`, `--reading-width`, `--panel-max`, `--panel-pad-x/y`, `--nav-height` | |

## Known inline exceptions (deferred normalisation)

- Off-grid spacing rems (e.g. `0.85rem`, `1.9rem`, `4.5rem`) and most per-component
  `line-height` / `letter-spacing` values are still inline to preserve the exact look.
- `.bg-video` / `.bg-poster` `brightness(0.8)` and a couple of one-off `2px` focus radii remain
  literal; low value, high churn to tokenise.
