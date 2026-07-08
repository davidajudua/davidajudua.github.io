# ADR 0001: Site-wide ambient video backdrop

Date: 2026-07-07
Status: partially superseded by ADR 0002 (the blur/darken treatment was reversed; the backdrop concept, swappable contract, palette, and motion cuts stand)

## Context

The v8 design was a light-to-dark cinematic scroll with a purple/lavender accent, marquee intro, glow blobs, custom cursor, and a pinned horizontal work pan.
Dav wanted a fresh visual draft built around one borrowed idea: a soft, aesthetic looping video as the page background.
The reference was inspiration for that single element, not a template.

The candidate video is portrait (576x1024) and low resolution, while the site is mostly viewed landscape.
The site also contains long-form reading (three full essays), which is hard to read over moving imagery.

## Decision

- One fixed video layer behind the entire site (`assets/ambient.mp4`), heavily blurred and darkened via CSS filter plus a gradient overlay.
  The blur hides both the portrait crop and the low source resolution.
- A poster still (`assets/ambient-poster.jpg`) covers first paint, `prefers-reduced-motion`, and load failure, so the page never flashes empty black.
- The video file is a swappable contract: replacing `assets/ambient.mp4` re-skins the site with no code changes.
- Long-form content sits on near-opaque Reading Panels; short content floats directly on the video.
- Motion was cut back to the content itself (Proof Numbers count-up, Kinetic Word Loop, the nameplate entrance); marquee, background scrub, glow blobs, custom cursor, and the horizontal work pan were removed.
- The palette derives from the video (night blue-black, city-light amber accent); the previous purple system was retired.
- Typography stays Geist: the identity remains "engineer", elevated by atmosphere rather than rebranded.

## Consequences

- The whole site's mood is controlled by one asset, which makes future re-skins trivial.
- A full-viewport blurred video costs GPU; acceptable on modern devices, and reduced-motion users get a static poster instead.
- Sound (the video's audio as site music) was deliberately deferred; browsers require muted autoplay anyway, so a future toggle is additive.
- The site is dark-only now; the light intro theme is gone.
