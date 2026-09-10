# Personal homepage refresh

David wants davidajudua.com to feel like his personal home on the internet.
He likes the existing city footage, night palette, amber accents, typography, and frosted panels.
Keep that visual identity while introducing his life at Howard and his software work in plain language.

## Confirmed direction

- Remove the essays and homepage timeline.
- Keep projects and make past experience available through their stories.
- Move revenue, community, order, and team numbers into the opscore details, as David confirmed on September 10, 2026.
- Use Downloads/3138-166335919.mp4 for the desktop background.
- Preserve the existing portrait footage on phones.
- Improve desktop framing, readability, navigation, and interaction quality.

## Implementation

The page order is nameplate, short introduction, projects, and contact.
The resume remains available in the contact section.
Writing routes and old writing/timeline bookmarks lead to About.
Each orientation has its own video and matching poster.
The landscape loop uses 13 seconds of the selected footage followed by its reverse.
Reduced motion uses a still without requesting the video.
A visible background control lets visitors pause playback.
Native scrolling and a single optional entrance replace repeated scroll reveals and animated counters.
The content remains readable without JavaScript.

## Audit evidence

The live background was 576 by 1024 at every tested viewport.
At 1440 by 900, the live page was approximately 6696 pixels tall and projects started at 2892 pixels.
At 390 by 844, the mobile menu did not close on Escape, and Tab moved into content behind the menu.
Project Details buttons measured 14 pixels high.
Without JavaScript, the loader remained visible and every reveal element had opacity zero.
The project modal opened, closed on Escape, and restored trigger focus correctly before the refresh.
No document overflow appeared at widths 1920, 1440, 1024, 768, 390, or 320.
About, projects, writing, contact, resume, and styleguide routes returned HTTP 200.
Reduced motion paused the live video but still requested its file.
The audit did not test real iOS Low Power Mode or conduct a throttled Lighthouse benchmark.

## Verification contract

Compare baseline commit 08df3141cebb84da24cd62768a356a42b911e5c5 with the working tree.
The baseline was copied before editing.
Expected visual changes are background source, brighter secondary/muted text, shorter section spacing, wider project cards, larger action targets, a two-line mobile role, smaller contact name, and removal of the timeline, essays, and counters.
The role line uses a tinted surface; the introduction and contact details use the existing frosted surface to stay readable over the water reflections.
The role's extra padding moves the centered hero name vertically while preserving its typography and horizontal geometry.
Hero name typography, panel borders, frost, amber palette, modal surfaces, and mobile poster framing should retain their computed values.
Shared styleguide components should have zero computed-style differences.
Check menu and modal focus, Escape, anchors, old routes, video pause and orientation changes, reduced motion, no-JavaScript content, browser errors, and overflow across the six audit widths.

## Results

Six viewport widths passed overflow, source selection, and 44-pixel project-action target checks.
Menu and modal focus wrap, Escape, trigger focus restoration, and inert background checks passed.
Project navigation lands 66 pixels below the viewport top, matching the fixed navigation height.
Writing redirects and legacy essay/timeline hashes land on About.
Both public project GitHub links returned HTTP 200.
Reduced motion and JavaScript-disabled contexts requested zero video files.
Simulated autoplay rejection showed the matching poster.
Pause, orientation change while paused, and explicit resume passed.
The shared styleguide had zero computed-style or bounding-box differences across 248 elements and their pseudo-elements at all six widths.
Additional styleguide checks at 2000ms and 5000ms animation times also returned zero differences.
Selected homepage components matched their intended property changes at all six widths; hero name typography and horizontal geometry, frost, modal surfaces, and portrait framing were preserved.
JavaScript syntax and whitespace checks passed.
Standards review identified two corrected issues: homepage text colors needed root tokens and edited files needed CRLF normalization.
The requirements review found no missing requirements.

## Review corrections

David asked for minimal copy that reads like his own texting, with less grammatical polish and no performative origin story.
The homepage introduction and project summaries use short, casual lowercase sentences.
He also identified inconsistent alignment.
The introduction, project cards, and contact surface share their full structural width and common horizontal padding.
Standalone section headings and contact actions use the same text inset.
The nameplate remains centered as the intentional hero treatment.
