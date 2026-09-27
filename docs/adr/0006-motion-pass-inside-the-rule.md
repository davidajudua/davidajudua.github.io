# ADR 0006: A motion pass inside the Motion Rule

Date: 2026-09-25
Status: accepted

## Context

After the refresh the homepage carried one generic reveal, the name shimmer and the Set.
The project modal's fade was dead: `hidden` and `open` changed in the same task, so its CSS transition never ran.
The hero's scroll hint was the only text on the Set without a grounding shadow, and the nav hover underline sat 18px under its text once the links became 44px targets.

A visual scout built a review board with 21 candidate moves, each on its own switch: 17 that follow the Motion Rule and 4 stretch moves that bend it (name hand-off into the nav, section marker with a progress hairline, breathing hint arrow, rim glints).
David reviewed it in three rounds.
He first asked what the Motion Rule even is, which says the rule is design shorthand he does not hold in his head; any future board must explain it in his words before asking him to rule on it.
He then rejected the scroll-scrubbed name hand-off because a visitor who stops mid-way leaves the name "just in the middle", which became the Finished at Rest term.
He picked "Motion pass -> Ship the pass inside the rule" with an empty note: nothing switched off, no stretch requested.

## Decision

- **Ship the 17 moves inside the rule and both static fixes.**
  Names: Lights Up (N1), Steer the shine (N2), Lift off (N3), Sign-on (N4).
  The Set: Dissolve in (S1), Lighting cues (S2).
  Panels and copy: Frost forms (F1), Words rise (F2), Typing (F3), Departures board (F4).
  Chrome answering the visitor: Glass catches light (C1), Lean (C2), Lift into reading (C3), Magnetic pills (C4), Arrow flight (C5), Iris menu (C6), Glide (C7).
  Fixes: the hint's text-shadow and the nav underline pulled up to 4px under the glyphs.
  The move-by-move record is `docs/motion-pass.md`.
- **The stretch set stays out and the Motion Rule's text stays as written.**
  The rule is read so that scrolling content into view counts as the visitor asking for it, and only for things that enter once; that reading is recorded as the Entrance term.
- **Lift off follows Finished at Rest.**
  The name rises a little faster than the page, stays sharp, and dissolves only along a fixed 60px band at the nav's bottom edge, so no scroll position leaves it half-blurred.
- **The layer is opt-in per visit and inert everywhere else.**
  An inline head script adds `html.mo` before first paint only when scripts run and reduced motion is off, and removes it again if `js/motion.js` never reports in.
  Every rule in `css/motion.css` is gated on that class; without JavaScript or under reduced motion the page is the site as it was, byte for byte in the DOM.
- **Explicit hooks instead of prototype seams.**
  `main.js` skips its generic reveal when `window.motionPass` exists, dispatches `modal:open` and `modal:close` on the modal, and scrolls through `motionPass.glideTo`.
  Nothing wraps `scrollIntoView` or `scrollTo`, nothing observes attributes, and no classes are renamed.
- **No per-move switches in production.**
  The board's `fx-*` classes, URL switchboard, message bridge and filming hooks are gone; all 17 moves are always on.
  Each move is a labelled block in both files so switching one off later is a deletion, not a refactor.

## Considered options

- **Open the rule for the stretch.**
  Only the name hand-off added meaning; David did not ask for it, and it stays out.
- **Ship only the two fixes.**
  Offered as keep-current on the board and not picked.
- **Switch off Lean and Magnetic pills.**
  The scout recommended it as the two moves that read most like a template; David left them on, so they ship.
- **A motion section inside `style.css`.**
  A separate `css/motion.css` keeps `styleguide.html` untouched, gives the layer its own cache buster, and makes the whole pass deletable in two files.
- **Keeping the switches for future review boards.**
  Rejected: no consumer exists in production, and every branch they created was dead code once the pick was final.

## Consequences

- Resting pixels do not change.
  At 1440x900 the computed-style diff against the pre-change commit compares 185 of 185 elements at the same document height with zero moved boxes, and exactly twelve elements differ in style, all expected; `docs/motion-pass.md` lists them.
- Entrances hide their parts with inline opacity while armed, so content below the fold is briefly `opacity: 0` in the DOM until it scrolls in; the no-JavaScript and reduced-motion paths never arm anything.
- The modal events are now a contract: `modal:open` must fire after the panel is laid out and `modal:close` before it hides.
- `js/motion.js` must load before `js/main.js`, because the reveal hand-off reads `window.motionPass` at `DOMContentLoaded`.
- Turning reduced motion on mid-visit stands the whole pass down; turning it off again leaves the pass off until reload, on purpose.
- Safari was not available to test.
  The likeliest differences are `backdrop-filter` animated by the Web Animations API in Frost forms and `backdrop-filter` on the 3D-leaning cards; the worst case is frost that appears at the end of the entrance instead of forming.
- Under 4x CPU throttling in software-rendered headless Chrome, scrolling with the pass costs a few milliseconds more per frame than today's site; the lighting overlay is promoted to its own layer and the hero stops updating once it has left the viewport to keep that small.
