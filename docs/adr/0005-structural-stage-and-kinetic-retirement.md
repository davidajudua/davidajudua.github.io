# ADR 0005: One structural Stage, and the Kinetic Word Loop is retired

Date: 2026-08-08
Status: accepted, not yet implemented (extends ADR 0003)

## Context

Section content blocks drift horizontally down the page.
Measured live at a 1920 viewport, `.work__list` starts at 361px with 284px of dead space to its right, while `.timeline` starts at 453px and is evenly centred.
The cause is that `.work__list` and `.contact__cols` carry a `max-width` but no `margin: 0 auto`, inside a `.panel` capped at 1280px.

Centering those two is not sufficient on its own.
The blocks are 900/1000/900/1000 wide, so their left edges would still jump from section to section.

Separately, `--max-width: 1200px` survives in `:root` with zero usages, and the Kinetic Word Loop is dead in the markup: 12 CSS rules and two `js/main.js` blocks still build and animate elements that `index.html` no longer contains.

## Decision

- **Introduce `--stage: 1080px`**, replacing the orphaned `--max-width`.
  Every section's content block inherits it, so left edges align down the whole scroll.
- **Reading widths stay varied** (560, 620, 660, 680, 720).
  They are governed by comfortable line length rather than by layout, and are deliberately not snapped to the Stage.
- **Retire the Kinetic Word Loop in code and in vocabulary.**
  The term leaves `CONTEXT.md`, the Motion Rule stops citing it, and the dead CSS and JS go with it.

## Considered options

Naming the structural token `--measure` was rejected.
In typography, measure already means line length, which is precisely the concept the Stage is not; the glossary would have had to spend a line telling readers the word does not mean what it means.
`--stage` also extends the theatre metaphor ADR 0002 established.

## Consequences

- Stage and Measure are now separate glossary terms specifically so that a future pass does not "tidy" the varied reading widths into alignment with the Stage. That variation is the design, not drift.
- `--display-ghost` is referenced only by the dead `.ghost-title` and becomes orphaned by the deletion, so it goes too.
- `.kinetic__static` and `.whatido__heading` sit inside a shared text-shadow rule alongside 18 live selectors.
  Only those two selectors come out; deleting the whole rule would strip the grounding shadow from the hero, timeline, writing and contact text.
- The `js/main.js` header comment restates the Motion Rule in retired language: it calls the video "the atmosphere", which ADR 0002 reversed, and cites "kinetic words". It is corrected as part of this pass.
