# Motion pass

The site-wide animation pass shipped on 2026-09-25, inside the Motion Rule (ADR 0006).
This page records what each move does, how the layer is wired, and the verification behind it.
The glossary terms it introduced (Entrance, Lights Up, Pointer Light, Lift into Reading, Glide, Finished at Rest) live in `CONTEXT.md`.

## The moves

Every move is always on.
Each one is a labelled block in `css/motion.css` and `js/motion.js` under its ID, so switching one off later is a deletion.

| ID | Name | Trigger | What happens |
|---|---|---|---|
| N1 | Lights up | page load, once | A night curtain lifts off the Set over 2.3s while the name's glyphs rise out of a 16px blur from the center outward, warm amber cooling to white; the role pill's frost, tint and rim form from nothing at 0.82s and its two lines rise; the hint fade moves to 1.55s and the first shimmer to 2.4s so it crosses just after the name settles. |
| N2 | Steer the shine | mouse over hero or contact | An amber light clipped to the name's letters follows the cursor with smoothing; invisible at rest; mouse and pen only. |
| N3 | Lift off | scroll | The hero name rises 22 percent faster than the page (capped at 70 percent of a viewport) and stays sharp; a mask dissolves it only along a fixed 60px band at the nav's bottom edge, so no scroll position leaves it half-blurred. Updates stop once the name has left through the top. |
| N4 | Sign-on | contact name scrolls in, once | Glyphs light in random order with one of four flicker patterns, amber with a glow, then cool to white. |
| S1 | Dissolve in | video starts | The video fades in over its poster (1.4s) instead of a display cut. |
| S2 | Lighting cues | scroll | A fixed overlay dims the Set a touch at the edges (up to 10 percent flat plus a 42 percent edge vignette at full level) weighted by section: hero 0, about 0.75, projects 1, contact 0.4, eased like a lighting desk. |
| F1 | Frost forms | panel scrolls in, once | Background tint, rim and backdrop blur animate from zero to their computed values while the panel rises 18px from 98.5 percent scale. |
| F2 | Words rise | scrolls in, once | Copy rises word by word from a soft blur; "projects" rises letter by letter; card titles, tags and actions rise in sequence. |
| F3 | Typing | about scrolls in, once | A three-dot typing bubble appears where the intro line will be, then the line arrives word by word. |
| F4 | Departures board | scrolls in, once | Mono labels (eyebrows, project categories, contact labels) resolve out of scrambled characters. |
| C1 | Glass catches light | mouse over a panel | Light pools in the frost under the cursor and the rim catches it near the edge; invisible at rest. |
| C2 | Lean | mouse over a project card | Cards lean up to 1.2 degrees toward the cursor and settle back on leave. |
| C3 | Lift into reading | Details, Close, Escape | A surface grows from the card's rect into the Reading Panel while the card title flies into the modal title; content staggers in; closing folds a surface back into the card. |
| C4 | Magnetic pills | mouse over a pill | Pills and the Visit GitHub button lean up to 7px toward the cursor. |
| C5 | Arrow flight | hover or keyboard focus | Arrows fly out along their direction and re-enter; nav underlines grow from the center. |
| C6 | Iris menu | phone menu button | The menu opens as a circular reveal from the button; links rise in turn. |
| C7 | Glide | nav jumps, back to top | Smooth scrolls use a longer quartic ease (700 to 1500ms by distance); any wheel, touch or key cancels it. |

Two static fixes shipped with the pass:

- `.hero__hint` joined the grounding text-shadow group, the only text on the Set that had none.
- `.home .topnav__link::after` sits at `calc(50% - 0.75em - 4px)`, 4px under the glyphs instead of 18px, since the links became 44px targets.

Left out on purpose: the four stretch moves from the review board (name hand-off into the nav, section marker and progress hairline, breathing hint arrow, rim glints).
They move chrome with scroll or on their own, which the Motion Rule forbids, and David did not ask to open it.

## Wiring

- `index.html` links `css/motion.css` after `css/style.css`, then runs an inline head script before first paint.
  If reduced motion is on, the script returns and nothing else exists.
  Otherwise it adds `mo` to `<html>` and removes it again after 3s unless `js/motion.js` has dispatched `motionpass:ready`, so a script that fails to load can never leave the name hidden.
- `js/motion.js` loads before `js/main.js` and returns immediately unless `html.mo` is set.
  Its `DOMContentLoaded` handler runs first and publishes `window.motionPass = {glideTo}`.
- `js/main.js` keeps video, menu, modal and focus exactly as they were and talks to the layer through three hooks: it skips its generic reveal when `window.motionPass` exists, dispatches `modal:open` after the panel is laid out and `modal:close` before it hides, and routes anchor and back-to-top scrolls through `motionPass.glideTo`.
- Split text exists only while an entrance plays.
  Each glyph or word box gets a `margin-left` nudge so it sits exactly where the kerned glyph sat, glyphs of one word share a `nowrap` span, and the split is abandoned if any box would land on a different line than its character.
  A visually hidden copy keeps the text readable to assistive tech while boxes are shown, and the original text node is put back when the entrance ends.
- A stylesheet transition outranks a script animation in the cascade, so the layer switches transitions off on an element for the frame in which it unhides it or gives a card its frost back, then restores them.
  Without this the Visit GitHub button and the card rims would fade in on their 400ms transition instead of the entrance.
- Turning reduced motion on mid-visit stands everything down: classes, loops, inline styles, split text and layers.
  Turning it off again leaves the pass off until reload.

## Verification

Serving: a no-cache static server for the site, and a second one serving the working tree as `a/` and the pre-change commit (exported with `git archive`) as `b/` from one origin for the harness.
Browser: headless Chrome through `chrome-devtools-axi`, with separate sessions launched with `--force-prefers-reduced-motion` and `--blink-settings=scriptEnabled=false`.

### Reduced motion

Loading the homepage with reduced motion forced: `<html>` classes were `has-js video-idle` with no `mo`, `document.getAnimations()` was empty, no motion layer element or split text existed, `window.motionPass` was absent, the hero name's opacity was 1, nothing inside `main` had opacity 0, the video had no source and no mp4 was requested.

### No JavaScript

With scripts disabled: `<html>` had no classes, so every rule in `css/motion.css` was inert; no motion layer element existed, nothing inside `main` had opacity 0, no mp4 was requested, Details buttons were hidden and project details rendered inline, and the hint carried its new shadow.

### Computed styles at rest

The harness from `docs/agents/verification.md` in intent mode, working tree against the pre-change commit, after scrolling the motion side through every scene and back, animations seeked to 5000ms on both sides.
Motion-only layers (`.mo-light`, `.mo-fx`, split text, typing bubble, ghosts) and script elements are skipped so indices align.

At 1440x900: 185 of 185 elements compared, document height 3611 on both sides, 0 moved boxes at scroll 0, and exactly 12 elements with differing styles, all expected:

- `.hero__hint` and its arrow span: the added text-shadow (fix), plus the hint's later `animation-delay`.
- Three `.topnav__link::after`: `bottom` (fix), `left` and `transform` centered (C5); width 0 at rest.
- `.hero__name` and `.hero__role`: the CSS `fadeUp` replaced by the opening, so the animation properties differ and `transform` reads `none` instead of the identity matrix the finished `fadeUp` leaves.
- `.hero__name::before` and `.contact__name::before`: the Pointer Light layer, opacity 0 at rest.
- `.bg-overlay::after`: the opening curtain, opacity 0 at rest.
- `.about__content` and `.contact__cols`: `position: relative`, same box.
- `.bg-video`: the opacity transition for the dissolve.

At scroll 2711 the only box that moves is the hero name, carrying N3's translate and mask; both are intended.

At 390x844: 185 of 185 elements, document height 3316 on both sides, and the same 12 plus the phone menu: `.topnav__links` sits at `right: 0` under a zero-radius `clip-path` instead of off-screen, and its three `li` rest at opacity 0 with a blur and translate.
All of that is inside a menu that is `visibility: hidden` at rest, so nothing visible changes.

### Behavior

- Scrolling through every scene at 1440x900: each entrance played (49 to 55 concurrent animations for the About and Projects scenes) and rested clean, with 0 elements at opacity 0, no split text, typing bubble or ghost left in the DOM, the contact name back to one text node, and no horizontal overflow.
- No stylesheet transition ran on any element during an entrance.
- The press and hover transforms on pills still compose: `--press: 0.98` with the unitless `--lift: 0` from `:active` computes to `matrix(0.98, 0, 0, 0.98, 0, 0)`, and hover to a 2px lift.
- The arrow's box switches to `inline-block` only while it flies; the glyph's own rect is identical in both states, so nothing shifts on hover.
- Details morph: during the open, 2 ghost layers exist, the panel is at opacity 0 and focus is on Close with `main` inert; after it, the ghosts are gone and the panel and title are at opacity 1.
  Escape hides the modal, returns focus to the Details button and lifts inert while the fold plays; after it, no ghosts remain and body overflow is restored.
- Lift off stopped at 300px: `translate: 0px -66px`, no filter, opacity 1, and the mask starts 84.8px into the name.
  Scrolled past the hero and back, the values are reproduced exactly; at 0 they are cleared.
- Phone at 390x844: no overflow, the name spans 47 to 343, the iris opens from a 0px circle to 1350px with all three links at opacity 1 and focus on About, and closes back to `visibility: hidden` with the links inert.
- No console errors in any session.

### Throttled CPU

Headless Chrome renders in software here, so backdrop blur and text blur cost CPU that a phone or laptop GPU would absorb.
Frame times were sampled with `requestAnimationFrame` under 4x CPU throttling at 1440x900, alternating today's site and the pass twice each with no other browser session running.
The opening ran at a steady 17ms per frame with no frame over 33ms.
Scrolling the whole page in 60px steps every 40ms, first on a fresh load (entrances playing) and again after they had played:

| Page | First scroll, average | Second scroll, average | Worst frame |
|---|---|---|---|
| Today's site | 21ms | 19ms | 50ms |
| Motion pass | 29ms | 27ms | 50 to 67ms |

Removing the lighting overlay alone brought the second scroll back to 18ms, and removing the glass layers as well changed nothing further.
So the whole per-frame cost is S2's full-viewport opacity change, which software rendering pays as a full-screen blend and a GPU composites as one quad.
Two changes came out of it anyway: `.mo-light` is promoted with `will-change: opacity`, and N3 stops writing the mask once the name has left the viewport.

### Not verified

- Safari was not available.
  The likeliest differences are `backdrop-filter` animated by the Web Animations API in F1 (worst case the frost appears at the end instead of forming) and `backdrop-filter` on the 3D-leaning cards in C2.
