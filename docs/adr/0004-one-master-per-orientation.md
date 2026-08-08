# ADR 0004: One video Master per orientation

Date: 2026-08-08
Status: accepted, not yet implemented (extends the Swappable Video Contract from ADR 0001; the Set framing from ADR 0002 is unchanged)

## Context

The Set still runs on its placeholder: a 576x1024 portrait clip.
The softness everyone reads as a bad encode is really an aspect-ratio problem.
`object-fit: cover` upscales that source 4.44x on a 2560x1440 desktop; a 1920x1080 landscape source would bring the same upscale down to 1.33x.

Going landscape on its own would move the problem rather than solve it.
A 16:9 clip cover-cropped into a 390x844 phone shows only the centre 26% of the frame.

## Decision

- **Two Masters, one per orientation**, selected with `<source media="(orientation: ...)">`, landscape first.
  No JavaScript.
- **The portrait Master stays as it is.**
  Dav chose this over cropping a portrait Master out of the landscape source, which means phone and desktop deliberately show different scenes.
- **The landscape Master is trimmed to roughly 13s and ping-ponged** (forward plus reversed) back to about 26s, landing near 7.5MB.
  Ping-ponging also guarantees the seamless loop ADR 0002 requires.
- **Posters become an orientation pair too.**
  The `poster` attribute is dropped in favour of a media-queried `background-image` on `.bg-video`, which already carries `object-fit: cover`.

## Considered options

Cropping a portrait Master from the same landscape source was rejected.
It would have kept one scene across every device, but a 9:16 crop of a 16:9 frame keeps only a narrow vertical slice of the composition, which throws away the framing that made the footage worth choosing.

## Consequences

- A re-skin now replaces four files rather than two, and replacing only one orientation leaves the other showing the old world.
  This is why the Swappable Video Contract names both Masters explicitly.
- `poster` cannot be media-switched, which is what forces the `background-image` approach.
  It also fixes a live bug: reduced-motion visitors see only the poster, so under the current single-poster setup they keep the portrait clip's softness permanently, on every viewport.
- The amber accent (`--accent: #d4a961`) was derived from the old clip's city lights per ADR 0001.
  It has not been checked against the new landscape footage.
  That check is outstanding and should happen before the swap is called done.
