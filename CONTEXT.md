# Context: davidajudua.com

Glossary of terms for this site's design language.
No implementation details here; see `docs/adr/` for decisions.

## Terms

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

**Proof Numbers**
The four About stats (community, revenue, orders, team) that count up when they enter view.
They are the site's evidence of impact and one of the few things allowed to move.

**Reading Panel**
The heaviest Frosted Furniture: a strongly tinted surface that long-form content (essays, project details) sits on so extended reading stays comfortable over the moving Set.
Short content floats directly on the video, protected by shadow rather than surface.

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
Ambient (self-playing) motion belongs to the content people are meant to look at (Proof Numbers, the names), never to the chrome around it.
Chrome may move only in direct response to the visitor: hover, press, focus (the Sheen and press compression).
The Set carries all remaining motion.
