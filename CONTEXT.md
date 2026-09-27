# Context: davidajudua.com

Glossary of terms for this site's design language.
No implementation details here; see `docs/adr/` for decisions.

## Terms

**Personal Homepage**
A place to meet David through his life at Howard and the software he works on.
Projects carry their own history and results instead of making the introduction a list of accomplishments.

**The Set**
The sharp, fully visible looping video that sits fixed behind the entire site.
It is the point, not decoration: the site's elements are staged on top of it, like set design.
(Replaces the retired term "Ambient Backdrop," which wrongly treated the video as blurred atmosphere.)

**Master**
One orientation's source video for The Set, together with its poster still.
There are exactly two: a landscape Master for wide viewports and a portrait Master for tall ones.
The two are independent footage, so a phone and a desktop deliberately show different scenes.
_Avoid_: clip, source, the video

**Swappable Video Contract**
The Set is defined by its two Masters and nothing else.
Replacing both re-skins the whole site's mood with zero code changes.
Replacing only one leaves the other orientation showing the old world, which is the mistake this term exists to prevent.

**Frosted Furniture**
The panels and cards staged on The Set.
They are translucent and frost what is behind them, so the Set glows through instead of being blocked.

**Nameplate Hero**
The first screen: the name large and centered over The Set, one quiet role line, a scroll hint.
Its job is identity, not information.

**Project Story**
The background, choices, and results attached to a particular project.
Business figures belong here as context for the work.

**Reading Panel**
The heaviest Frosted Furniture: a strongly tinted surface that project details sit on so extended reading stays comfortable over the moving Set.
Short content uses shadow or Frosted Furniture where the footage needs more contrast.

**Stage**
The single structural width that every section's content block shares, so their left edges align down the whole scroll.
It governs where a block's edges sit, never how long its lines are.
_Avoid_: max-width, container, wrapper, measure

**Measure**
The width of a text column, chosen by comfortable line length.
It varies from block to block by design and is not expected to match the Stage.
_Avoid_: reading width, text width

**Sheen**
The reactive band of light that passes across a control's face when the visitor hovers or presses it, and ambiently across the two names.
It is light moving over a surface, never a new shape: invisible at rest, so the resting look is unchanged.

**Motion Rule**
Ambient (self-playing) motion belongs to the names and The Set, never to the chrome around them.
Chrome may move only in direct response to the visitor: hover, press, focus (the Sheen and press compression).
The Set carries all remaining motion.

**Entrance**
The once-only move a piece of content or Frosted Furniture makes the first time it scrolls into view: frost forming, words rising, mono labels resolving out of scrambled characters.
Scrolling something into view counts as the visitor asking for it, the same way the reveal before the motion pass already did, so Entrances sit inside the Motion Rule.
Whatever is already on screen at load gets none, and every Entrance rests on the element's stylesheet look.
_Avoid_: reveal, scroll animation

**Lights Up**
The opening, once per page load: a night curtain lifts off The Set while the name warms on glyph by glyph and its role pill forms beneath it.
It replaces the plain fade-up of the Nameplate Hero and belongs to the names and The Set.

**Pointer Light**
Light that follows the visitor's hand: an amber glow steering across the names, and light pooling in the frost and catching the rim of Frosted Furniture.
Like the Sheen it is invisible at rest, and touch never shows it.

**Lift into Reading**
The press move that grows a project card into the Reading Panel, flying its title along, and folds the panel back into the card on close.

**Glide**
The eased scroll used for nav jumps and back to top, longer for longer distances.
Any wheel, touch or key hands the page straight back to the visitor.

**Finished at Rest**
David's rule for anything scroll-linked, from his review of the animation pass on 2026-09-25: nothing driven by scroll position may have a resting state that looks unfinished.
Scroll may trigger a move or set its direction, but the in-between frames belong to time, not to where the page happens to stop.
It is why the hero name dissolves only along a fixed band under the nav instead of blurring as a whole.
