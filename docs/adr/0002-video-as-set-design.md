# ADR 0002: The video is the set, not the atmosphere

Date: 2026-07-07
Status: accepted (supersedes the "blur + darken" treatment in ADR 0001; the rest of 0001 stands)

## Context

ADR 0001 treated the background video as atmosphere: heavily blurred, darkened to ~25% visibility, hidden behind near-solid panels.
On review Dav rejected that framing: the video is the point.
His intent is set design - a sharp, visible world with the site's elements staged on top of it.

## Decision

- **Sharp, full-bleed video.** No blur, no scale, only a light `brightness` trim. Desktop upscale softness from the 576px portrait source is accepted; the asset is a swappable placeholder.
- **Protect the text, not darken the world.** The heavy gradient overlay is gone; only a subtle edge vignette remains. Text floating on the Set carries its own shadow, and brief low-contrast moments as bright footage passes are accepted.
- **Frosted Furniture.** Panels switch from near-solid slabs to translucent surfaces with `backdrop-filter` frost, so the Set glows through them. Reading Panels keep a heavy tint (~88%) for long-form comfort; the project modal stays fully solid.
- **Ping-pong loop.** The asset is re-encoded forward+reversed (~31s, silent, ~5MB) so the visible-now loop seam disappears. Reversed water/cloud motion half the time is accepted.

## Consequences

- The site's look now depends on the footage being attractive; a bad swap is very visible. The Swappable Video Contract is therefore the main re-skin lever.
- `backdrop-filter` on several panels costs more GPU than solid fills; acceptable on modern devices, and reduced-motion users still get a static poster.
- Any future video swap should be encoded as a clean loop (or ping-ponged the same way).
