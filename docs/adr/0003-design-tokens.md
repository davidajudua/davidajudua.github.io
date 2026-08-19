# ADR 0003: Formal design token system

Date: 2026-07-14
Status: accepted (extends ADR 0002; the Set, palette, and motion cuts are unchanged)

## Context

`css/style.css` was already titled "Design System v9" and had a `:root` block, but it was
only a partial system. Colour, easing, durations, one radius, and two widths were tokenised;
almost everything else was hard-coded and repeated inline: ad-hoc spacing rems, per-component
`clamp()` font sizes, blur amounts (`14px`/`8px`/`6px`/`28px`), radii (`20px`/`100px`/`4px`/`3px`),
hand-written shadows, scattered `z-index` magic numbers (`99`…`10001`), and literal
`rgba(212,169,97,…)` / `rgba(255,255,255,…)` colours. The look was liked; the maintainability
was not. Dav asked to turn the rough draft into an actual design system without changing the
aesthetic.

## Decision

- **One token layer, one file.** Keep the framework-free, single-stylesheet setup. The `:root`
  block in [`css/style.css`](../../css/style.css) is the single source of truth, grouped into
  primitives, semantic aliases, and scales (colour, type/display, spacing, radii, blur/frost,
  z-index, motion, layout).
- **Primitives -> semantics.** Raw hues (`--night-*`, `--amber-*`) plus accent/white/black alpha
  ladders feed semantic tokens (`--accent`, `--border`, `--bg-panel`, …). Components reference
  semantics/scales, never raw hex or rgba.
- **Pixel-identical first.** Every new token is set to the exact pre-existing value, so
  `index.html` renders unchanged. This is a refactor, not a restyle. Alpha primitives are written
  in space/slash `rgba()` syntax (identical output) so a global swap of the old comma-form
  literals can't corrupt the definitions.
- **Living reference.** [`styleguide.html`](../../styleguide.html) (noindex, not in the nav)
  renders the palette, type, spacing, radii, frost, and real components through the same
  stylesheet, doubling as the visual-regression surface.
- **Spacing/type normalisation deferred.** Snapping the remaining off-grid spacing and the
  per-component `clamp()` sizes onto the scales would move pixels, so it is a separate, later pass.

## Consequences

- Re-skinning is now a token edit, not a find-and-replace across 1,100 lines; the Swappable Video
  Contract (ADR 0001) and the token layer are the two re-skin levers.
- A few off-grid spacing values and granular line-heights/letter-spacing remain inline, flagged for
  the deferred normalisation pass.
- The style guide must be kept in sync when tokens or components change; it is the human-facing
  contract for the system.
