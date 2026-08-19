# Verification

How to prove a change to this site is correct.

This repo has no test suite, no build step and nothing to typecheck.
It is static HTML, CSS and one JS file.
So the instruction in `/implement` to "run the full test suite" has nothing to run here, and screenshots are not a substitute.
Verify by diffing **computed styles in a real browser** between the pre-change commit and the working tree.

## Pick the mode first

**Regression mode: prove nothing changed.**
For refactors that must be invisible, such as tokenisation or a rename.
Success is a diff of exactly zero properties across every element.

**Intent mode: prove only the intended thing changed.**
For deliberate visual work, such as introducing the Stage.
Success is a diff containing only the properties you meant to move, and nothing else.
Write down the expected set before running, then assert the diff equals it.
A diff that is merely "small" is not a pass; an unexpected property in it is a regression you would otherwise ship.

Intent mode is the harder and more valuable one.
Most visual bugs are not the thing you changed, they are the thing you changed by accident three sections away.

## The method

Serve both versions from one origin so a single page can read both documents.
Two ports means two origins, and cross-origin iframes cannot be inspected.

1. Check out the baseline into a temp worktree: `git worktree add <tmp>/base <ref> --detach`.
2. Copy the working tree to `<tmp>/cmp/a` and the baseline to `<tmp>/cmp/b`.
3. Rewrite absolute paths to relative in both copies, or nothing resolves from a subdirectory.
   Affects `href="/`, `src="/` and `url(/` in `index.html`, `css/style.css` and `js/main.js`.
   Rewrite as bytes so CRLF survives.
4. Serve `<tmp>/cmp` on one port, open the harness below, call `__run()`.
5. Remove the worktree and stop the server when done.

## Gotchas that will give you false results

These all produced wrong answers before being handled.
Do not drop any of them.

**Browser extensions inject elements into the page.**
Skip any element whose tag name contains a dash, and its subtree.
This site uses no custom elements, so a hyphenated tag is always foreign.

**Pausing an animation is not enough.**
`animation-play-state: paused` freezes each side at whatever moment it happened to reach, so two runs disagree by a fraction of a keyframe and every animated element reports a false diff.
Seek instead: `for (const a of doc.getAnimations()) { a.pause(); a.currentTime = T; }` with the same `T` on both sides.
Run at two or three different `T` values.

**JS-driven animations settle late.**
Staggered entrance effects can still be mid-flight on first arrival at a scroll position.
If a diff appears once and vanishes on re-run, it is settling, not a regression.
Always re-run a position before believing a diff there.

**`url()` computed values resolve to absolute URLs** containing `/a/` or `/b/`, so they always differ.
Normalise the prefix before comparing.

**Custom properties are not comparable in a token refactor.**
The whole point of such a change is that `--*` definitions differ.
Skip any property starting with `--` and compare only the resolved standard properties, which is what the pixels actually depend on.

**Cover the axes, not just the default view.**
Breakpoints 1920, 1440, 1024, 768, 390 and several scroll positions.
Media queries and scroll-driven state hide differences that a single default-view check will pass.

**Compare `getBoundingClientRect` too**, and the document height.
Equal heights on both sides is a strong signal that nothing shifted.

## Also check, every time

- Bump the `?v=` cache-buster on `css/style.css` in `index.html` whenever the stylesheet changes.
- Repo files are CRLF. Edit as bytes or you will produce a whole-file diff.
- `styleguide.html` renders components through the same stylesheet, so it is a second regression surface. Check it when tokens or components move.

## The harness

Save as `<tmp>/cmp/diff.html`, alongside the `a/` and `b/` copies.
`__run()` returns `{countA, countB, diffs}`; `diffs` is empty when the two are identical.

```html
<div class="wrap" style="position:fixed;top:0;left:0;width:1920px;height:1080px;transform:scale(.25);transform-origin:0 0">
  <iframe id="a" src="./a/index.html" style="width:1920px;height:1080px;border:0"></iframe>
  <iframe id="b" src="./b/index.html" style="width:1920px;height:1080px;border:0;position:absolute;top:0;left:0;visibility:hidden"></iframe>
</div>
<script>
const norm = v => String(v).replace(/https?:\/\/[^\/"')\s]+\/(a|b)\//g, '/_/').replace(/\?v=\d+/g, '?v=_');
const skip = el => { for (let n = el; n; n = n.parentElement) if (n.tagName && n.tagName.includes('-')) return true; return false; };

function collect(doc, win){
  const els = [doc.documentElement, ...doc.querySelectorAll('*')].filter(e => !skip(e));
  return els.map(el => {
    const rec = { tag: el.tagName.toLowerCase(), styles: {} };
    for (const p of [null, '::before', '::after']){
      const cs = win.getComputedStyle(el, p), m = {};
      for (let j = 0; j < cs.length; j++){
        const k = cs[j];
        if (!k.startsWith('--')) m[k] = norm(cs.getPropertyValue(k));
      }
      rec.styles[p || 'base'] = m;
    }
    const r = el.getBoundingClientRect();
    rec.box = [r.x, r.y, r.width, r.height].map(v => Math.round(v * 100) / 100);
    return rec;
  });
}

window.__seek = t => {
  for (const id of ['a','b'])
    for (const an of document.getElementById(id).contentWindow.document.getAnimations())
      { try { an.pause(); an.currentTime = t; } catch(e){} }
};

window.__run = () => {
  const A = document.getElementById('a'), B = document.getElementById('b');
  const a = collect(A.contentDocument, A.contentWindow);
  const b = collect(B.contentDocument, B.contentWindow);
  const out = { countA: a.length, countB: b.length, diffs: [] };
  for (let i = 0; i < Math.min(a.length, b.length); i++){
    const props = [];
    for (const k of ['base','::before','::after']){
      const ma = a[i].styles[k], mb = b[i].styles[k];
      for (const p in ma) if (ma[p] !== mb[p]) props.push({ pseudo:k, prop:p, now:ma[p], base:mb[p] });
    }
    const boxDiff = a[i].box.some((v,j) => Math.abs(v - b[i].box[j]) > 0.5);
    if (props.length || boxDiff) out.diffs.push({ i, tag:a[i].tag, box: boxDiff ? {now:a[i].box, base:b[i].box} : null, props });
  }
  return out;
};
</script>
```

Set iframe size for a breakpoint, scroll both windows to the same offset, call `__seek(600)`, then `__run()`.
If output is truncated by the tool you are using, return `diffs.length` first and drill into entries individually.

## Worked example

The PR #3 token refactor was verified this way against `main` in regression mode.
Result: zero differing properties across 321 elements, all three pseudo states and bounding boxes, holding at five breakpoints, six scroll positions and three animation timestamps, with identical document heights.
The first two runs reported diffs; both turned out to be animation sampling, which is why the seek step is not optional.
