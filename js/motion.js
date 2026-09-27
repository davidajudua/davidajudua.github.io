/* davidajudua.com motion pass (ADR 0006).
   Runs only when the inline head script in index.html marked html.mo:
   scripts on and no reduced-motion preference. It owns the entrances,
   the pointer light and the scroll links; main.js keeps video, menu,
   modal and focus exactly as they are and talks to this file through
   three explicit hooks:
     - main.js skips its generic reveal when window.motionPass exists;
     - main.js dispatches modal:open and modal:close on .work-modal;
     - main.js scrolls through window.motionPass.glideTo(top).
   Load this file before main.js so its DOMContentLoaded handler runs first.
   Every move rests on today's pixels once it finishes. */
(() => {
  const html = document.documentElement;
  const active = () => html.classList.contains('mo');
  if (!active()) return;
  /* Tell the head script the layer loaded, so it keeps html.mo. */
  document.dispatchEvent(new Event('motionpass:ready'));

  const reduce = matchMedia('(prefers-reduced-motion: reduce)');
  const EASE = 'cubic-bezier(0.16, 1, 0.3, 1)';
  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => [...r.querySelectorAll(s)];
  const clamp = (v, a, b) => Math.min(b, Math.max(a, v));
  const wait = ms => new Promise(r => setTimeout(r, ms));
  const mouse = e => e.pointerType === 'mouse' || e.pointerType === 'pen';
  const done = a => a.finished.then(() => {}, () => {});
  const settle = list => Promise.allSettled(list.flat().filter(Boolean));
  const shuffle = a => { for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; };
  const easeInOutQuart = p => (p < 0.5 ? 8 * p ** 4 : 1 - (-2 * p + 2) ** 4 / 2);
  const bfKey = CSS.supports('backdrop-filter', 'none') ? 'backdropFilter' : 'webkitBackdropFilter';
  const bf = v => ({[bfKey]: v});
  const alpha0 = c => {
    const m = /rgba?\(([^)]+)\)/.exec(c || '');
    if (!m) return 'rgba(0, 0, 0, 0)';
    const [r, g, b] = m[1].split(/[\s,/]+/);
    return `rgba(${r}, ${g}, ${b}, 0)`;
  };
  let tokens = {};

  /* ---------- Split text so it can move, then give the text back ---------- */
  /* Glyph or word boxes are nudged onto the exact x positions the shaped
     text had (kerning included), so restoring the text node is invisible. */
  function split(el, mode) {
    if (!el) return null;
    if (el.__mo) return el.__mo;
    el.normalize();
    if (el.childNodes.length !== 1 || el.firstChild.nodeType !== 3) return null;
    const node = el.firstChild, text = node.data;
    const list = [];
    if (mode === 'glyph') for (let i = 0; i < text.length; i++) list.push({t: text[i], start: i, ws: /\s/.test(text[i])});
    else { const re = /\S+|\s+/g; let m; while ((m = re.exec(text))) list.push({t: m[0], start: m.index, ws: /^\s/.test(m[0])}); }
    const range = document.createRange();
    for (const k of list) {
      if (k.ws) continue;
      range.setStart(node, k.start);
      range.setEnd(node, k.start + 1);
      const r = range.getClientRects()[0];
      if (r) k.target = {x: r.left, y: r.top + r.height / 2};
    }
    const sr = document.createElement('span');
    sr.className = 'mo-sr';
    sr.textContent = text;
    const wrap = document.createElement('span');
    wrap.className = 'mo-split';
    wrap.setAttribute('aria-hidden', 'true');
    const segs = [];
    let word = null;
    for (const k of list) {
      if (k.ws) { word = null; wrap.append(mode === 'glyph' ? k.t : ' '); continue; }
      const s = document.createElement('span');
      s.className = 'mo-seg';
      s.textContent = k.t;
      k.el = s;
      /* glyph boxes of one word stay together, so lines break only where the text did */
      if (mode === 'glyph') {
        if (!word) { word = document.createElement('span'); word.className = 'mo-word'; wrap.append(word); }
        word.append(s);
      } else wrap.append(s);
      segs.push(s);
    }
    el.replaceChildren(sr, wrap);
    const placed = list.filter(k => k.el && k.target);
    compensate(el, placed);
    if (!sameLines(placed)) { el.replaceChildren(node); return null; }
    const api = {
      segs,
      restore() { if (el.__mo === api) { el.replaceChildren(node); el.__mo = null; } },
    };
    el.__mo = api;
    return api;
  }
  /* Every box must sit on the line its character sat on, or the split is abandoned. */
  function sameLines(ks) {
    const lineOf = vals => { const u = [...new Set(vals.map(v => Math.round(v)))].sort((a, b) => a - b); return v => u.indexOf(Math.round(v)); };
    const tLine = lineOf(ks.map(k => k.target.y));
    const segY = ks.map(k => { const r = k.el.getBoundingClientRect(); return r.top + r.height / 2; });
    const sLine = lineOf(segY);
    return ks.every((k, i) => tLine(k.target.y) === sLine(segY[i]));
  }
  function compensate(el, ks) {
    if (!ks.length) return;
    const centered = /center/.test(getComputedStyle(el).textAlign);
    for (let pass = 0; pass < 4; pass++) {
      const errs = ks.map(k => k.target.x - k.el.getBoundingClientRect().left);
      if (Math.max(...errs.map(Math.abs)) < 0.15) return;
      ks.forEach((k, i) => {
        const prev = ks[i - 1];
        const sameLine = prev && Math.abs(prev.target.y - k.target.y) < 2;
        const delta = sameLine ? errs[i] - errs[i - 1] : (centered ? 2 : 1) * errs[i];
        k.m = (k.m || 0) + delta;
      });
      ks.forEach(k => { k.el.style.marginLeft = k.m.toFixed(3) + 'px'; });
    }
  }

  /* ---------- Small animation vocabulary ---------- */
  /* A stylesheet transition outranks a script animation in the cascade, so a
     base-style change made in the same task as an animation (unhiding a
     button, giving a card its frost back) would let the transition own the
     property for its first frames. Make such changes with transitions off,
     and switch them back on once a frame has been styled without them. */
  let quietSet = null;
  function quiet(el, change) {
    if (!quietSet) {
      quietSet = new Map();
      requestAnimationFrame(() => requestAnimationFrame(() => {
        quietSet.forEach((was, e) => { if (was) e.style.transition = was; else e.style.removeProperty('transition'); });
        quietSet = null;
      }));
    }
    if (!quietSet.has(el)) quietSet.set(el, el.style.transition);
    el.style.transition = 'none';
    change();
  }
  const hide = (...els) => els.forEach(e => { if (e) { e.style.opacity = '0'; e.__moHidden = true; } });
  const unhide = (...els) => els.forEach(e => {
    if (e && e.__moHidden) quiet(e, () => { e.style.removeProperty('opacity'); e.__moHidden = false; });
  });
  const FROST_PROPS = ['background-color', 'border-color', 'backdrop-filter', '-webkit-backdrop-filter'];
  function frostPre(el) {
    if (!el) return;
    el.style.setProperty('background-color', 'transparent');
    el.style.setProperty('border-color', 'transparent');
    el.style.setProperty('backdrop-filter', 'none');
    el.style.setProperty('-webkit-backdrop-filter', 'none');
  }
  const frostClear = el => el && FROST_PROPS.forEach(p => el.style.removeProperty(p));
  /* F1 Frost forms: the panel condenses out of the city (blur, tint, rim). */
  function frostIn(el, delay = 0) {
    let bg, rim, blur;
    quiet(el, () => {
      frostClear(el);
      const cs = getComputedStyle(el);
      bg = cs.backgroundColor;
      rim = cs.borderTopColor;
      blur = cs.backdropFilter || cs.webkitBackdropFilter || 'none';
    });
    return done(el.animate([
      {backgroundColor: alpha0(bg), borderColor: alpha0(rim), ...bf('blur(0px) saturate(1)'), transform: 'translateY(18px) scale(0.985)', opacity: 0},
      {opacity: 1, offset: 0.18},
      {backgroundColor: bg, borderColor: rim, ...bf(blur), transform: 'none', opacity: 1},
    ], {duration: 1050, delay, easing: EASE, fill: 'backwards'}));
  }
  /* F2 Words rise: the vocabulary for copy (words), labels and actions. */
  function rise(els, {delay = 0, stagger = 0, dist = '0.5em', blur = 6, duration = 760} = {}) {
    return els.filter(Boolean).map((e, i) => {
      unhide(e);
      return done(e.animate([
        {opacity: 0, transform: `translateY(${dist})`, filter: `blur(${blur}px)`},
        {opacity: 1, transform: 'none', filter: 'blur(0px)'},
      ], {duration, delay: delay + i * stagger, easing: EASE, fill: 'backwards'}));
    });
  }
  function words(el, delay, stagger, opts = {}) {
    if (!el) return [];
    const sp = split(el, 'word');
    unhide(el);
    if (!sp) return rise([el], {delay});
    const all = rise(sp.segs, {delay, stagger, dist: '0.45em', blur: 7, duration: 700, ...opts});
    return [Promise.allSettled(all).then(() => sp.restore())];
  }

  /* F4 Departures board: mono labels resolve out of scrambled characters. */
  const BOARD = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  function decode(el, delay = 0) {
    if (!el) return null;
    const original = [...el.childNodes];
    const text = el.textContent;
    const chars = [...text];
    const fixed = c => !/[A-Za-z0-9]/.test(c);
    const at = chars.map((c, i) => (fixed(c) ? 0 : 80 + i * 26 + Math.random() * 170));
    const end = Math.max(...at) + 30;
    const sr = document.createElement('span');
    sr.className = 'mo-sr';
    sr.textContent = text;
    const vis = document.createElement('span');
    vis.setAttribute('aria-hidden', 'true');
    return new Promise(resolve => {
      let t0 = 0, last = 0, noise = chars;
      const finish = () => { if (el.contains(vis)) el.replaceChildren(...original); resolve(); };
      const tick = now => {
        if (!active() || !el.isConnected) return finish();
        if (!t0) t0 = now + delay;
        if (now < t0) return requestAnimationFrame(tick);
        if (!el.contains(vis)) {
          el.replaceChildren(sr, vis);
          unhide(el);
          el.animate([{opacity: 0}, {opacity: 1}], {duration: 180, easing: 'ease-out'});
        }
        const t = now - t0;
        if (now - last > 55) {
          last = now;
          noise = chars.map(c => (fixed(c) ? c : BOARD[Math.floor(Math.random() * BOARD.length)]));
        }
        vis.textContent = chars.map((c, i) => (t >= at[i] ? c : noise[i])).join('');
        if (t >= end) return finish();
        requestAnimationFrame(tick);
      };
      requestAnimationFrame(tick);
    });
  }

  /* ---------- N1 Lights up: the opening ---------- */
  let overtureRun = 0;
  async function overture() {
    const name = $('.hero__name'), role = $('.hero__role');
    if (!name) return;
    const run = ++overtureRun;
    await Promise.race([document.fonts ? document.fonts.ready : null, wait(1200)]);
    if (run !== overtureRun || !active()) return;
    const sp = split(name, 'glyph');
    name.classList.add('mo-lit');
    const list = [];
    const cs = getComputedStyle(name);
    const base = cs.textShadow, bright = cs.color;
    const glow = `${base}, rgba(230, 194, 132, 0.7) 0px 0px 28px`;
    /* glyphs rise from the center outward; the whole name stands in if it could not be split */
    const glyphs = sp ? sp.segs : [name];
    const box = name.getBoundingClientRect(), mid = box.left + box.width / 2;
    const offset = g => { const r = g.getBoundingClientRect(); return Math.abs(r.left + r.width / 2 - mid); };
    const half = Math.max(1, ...glyphs.map(offset));
    glyphs.forEach(g => {
      const reach = offset(g) / half;
      list.push(done(g.animate([
        {opacity: 0, transform: 'translateY(0.3em) scale(0.97)', filter: 'blur(16px)', color: tokens.warm, textShadow: glow},
        {opacity: 1, filter: 'blur(1.5px)', color: tokens.warm, offset: 0.45},
        {opacity: 1, transform: 'none', filter: 'blur(0px)', color: bright, textShadow: base},
      ], {duration: 1300, delay: 150 + reach * 360, easing: EASE, fill: 'backwards'})));
    });
    if (role) {
      role.classList.add('mo-lit');
      const rs = getComputedStyle(role);
      list.push(done(role.animate([
        {opacity: 0, transform: 'translateY(12px) scale(0.94)', backgroundColor: alpha0(rs.backgroundColor), borderColor: alpha0(rs.borderTopColor), ...bf('blur(0px) saturate(1)')},
        {opacity: 1, offset: 0.22},
        {opacity: 1, transform: 'none', backgroundColor: rs.backgroundColor, borderColor: rs.borderTopColor, ...bf(rs.backdropFilter || rs.webkitBackdropFilter)},
      ], {duration: 1050, delay: 820, easing: EASE, fill: 'backwards'})));
      list.push(...rise($$(':scope > span', role), {delay: 1000, stagger: 120, dist: '8px', blur: 6, duration: 760}));
    }
    await settle(list);
    if (run === overtureRun) sp?.restore();
  }

  /* ---------- N2 Steer the shine: an amber light follows the pointer across the names ---------- */
  function setupGlow() {
    const pairs = [['.hero', '.hero__name'], ['.contact', '.contact__name']];
    for (const [zoneSel, nameSel] of pairs) {
      const zone = $(zoneSel), name = $(nameSel);
      if (!zone || !name) continue;
      let tx = 0, ty = 0, x = 0, y = 0, raf = 0, live = false;
      const frame = () => {
        x += (tx - x) * 0.16;
        y += (ty - y) * 0.16;
        name.style.setProperty('--mo-gx', x.toFixed(1) + 'px');
        name.style.setProperty('--mo-gy', y.toFixed(1) + 'px');
        raf = Math.abs(tx - x) + Math.abs(ty - y) > 0.3 ? requestAnimationFrame(frame) : 0;
      };
      zone.addEventListener('pointermove', e => {
        if (!active() || !mouse(e)) return;
        const r = name.getBoundingClientRect();
        tx = e.clientX - r.left;
        ty = e.clientY - r.top;
        if (!live) { live = true; x = tx; y = ty; }
        const near = e.clientY > r.top - r.height * 1.2 && e.clientY < r.bottom + r.height * 1.2;
        name.style.setProperty('--mo-go', near ? '1' : '0');
        name.style.setProperty('--mo-gr', Math.round(r.height * 1.9) + 'px');
        if (!raf) raf = requestAnimationFrame(frame);
      });
      zone.addEventListener('pointerleave', () => { live = false; name.style.setProperty('--mo-go', '0'); });
    }
  }

  /* ---------- N4 Sign-on: the sign-off name lights like a sign warming up ---------- */
  function signOn(el, delay = 0) {
    unhide(el);
    const sp = split(el, 'glyph');
    if (!sp) return [];
    const cs = getComputedStyle(el);
    const base = cs.textShadow, bright = cs.color, warm = tokens.warm;
    const glow = `${base}, rgba(230, 194, 132, 0.75) 0px 0px 26px`;
    const S = 'steps(1, end)';
    const patterns = [
      [[0, 0, S], [0.06, 0.9, S], [0.11, 0.12, S], [0.16, 1]],
      [[0, 0, S], [0.08, 1, S], [0.13, 0.3, S], [0.17, 0.85, S], [0.22, 0.25, S], [0.28, 1]],
      [[0, 0], [0.14, 1]],
      [[0, 0, S], [0.1, 0.7, S], [0.15, 0.1], [0.24, 1]],
    ];
    const order = shuffle(sp.segs.map((_, i) => i));
    const list = sp.segs.map((g, i) => {
      const steps = patterns[Math.floor(Math.random() * patterns.length)];
      const kf = steps.map(([offset, opacity, easing]) => ({offset, opacity, color: warm, textShadow: glow, ...(easing ? {easing} : {})}));
      kf.push({offset: 0.52, opacity: 1, color: warm, textShadow: glow});
      kf.push({offset: 1, opacity: 1, color: bright, textShadow: base});
      return done(g.animate(kf, {duration: 1250, delay: delay + order[i] * 58 + Math.random() * 50, easing: 'linear', fill: 'backwards'}));
    });
    return [Promise.allSettled(list).then(() => sp.restore())];
  }

  /* ---------- F3 Typing: the intro arrives like a text ---------- */
  function typing(panel, lead, showAt, hideAt) {
    const b = document.createElement('span');
    b.className = 'mo-typing';
    b.setAttribute('aria-hidden', 'true');
    b.innerHTML = '<i></i><i></i><i></i>';
    panel.append(b);
    const lh = parseFloat(getComputedStyle(lead).lineHeight) || 30;
    b.style.left = lead.offsetLeft + lead.offsetWidth / 2 + 'px';
    b.style.top = lead.offsetTop + (lh - b.offsetHeight) / 2 + 'px';
    b.animate([{opacity: 0, transform: 'translateX(-50%) scale(0.5)'}, {opacity: 1, transform: 'translateX(-50%) scale(1)'}],
      {duration: 320, delay: showAt, easing: 'cubic-bezier(0.34, 1.56, 0.64, 1)', fill: 'both'});
    return done(b.animate([{opacity: 1, transform: 'translateX(-50%) scale(1)'}, {opacity: 0, transform: 'translateX(-50%) translateY(-6px) scale(0.8)'}],
      {duration: 220, delay: hideAt, easing: 'ease-in', fill: 'forwards'})).then(() => b.remove());
  }

  /* ---------- Scenes: what enters, in what order, when scrolled in ---------- */
  /* Each scene hides its parts when armed below the fold, plays once when it
     scrolls in, and rests on the stylesheet look. F1, F2, F3 and F4 live here. */
  function sceneAbout() {
    const panel = $('.about__content'), eyebrow = $('.about .eyebrow'), lead = $('.about__lead'), sub = $('.about__sub');
    return {
      root: panel,
      prepare() { frostPre(panel); hide(eyebrow, lead, sub); },
      play() {
        const out = [frostIn(panel, 0), decode(eyebrow, 160)];
        let t = 240;
        out.push(typing(panel, lead, t, t + 820));
        t += 880;
        out.push(...words(lead, t, 22, {dist: '0.3em', blur: 5, duration: 600}));
        out.push(...words(sub, t + 260, 9));
        return settle(out);
      },
      reset() { frostClear(panel); unhide(eyebrow, lead, sub); },
    };
  }
  function sceneWorkHead() {
    const root = $('.work__head'), eyebrow = $('.eyebrow', root), heading = $('.section-heading', root), grad = $('.grad', root);
    return {
      root,
      prepare() { hide(eyebrow, heading); },
      play() {
        const out = [decode(eyebrow, 0)];
        unhide(heading);
        const sp = split(grad, 'glyph');
        if (sp) {
          const list = rise(sp.segs, {delay: 140, stagger: 42, dist: '0.42em', blur: 12, duration: 900});
          out.push(Promise.allSettled(list).then(() => sp.restore()));
        } else out.push(...rise([heading], {delay: 140}));
        return settle(out);
      },
      reset() { unhide(eyebrow, heading); },
    };
  }
  function sceneCard(card) {
    const title = $('.work-card__title', card), cat = $('.work-card__cat', card);
    const tags = $$('.work-card__body > .work-card__tags > span', card), desc = $('.work-card__body > .work-card__desc', card);
    const actions = $$('.work-card__actions > *', card);
    return {
      root: card,
      prepare() { frostPre(card); hide(title, cat, desc, ...tags, ...actions); },
      play() {
        const t = 140;
        return settle([
          frostIn(card, 0),
          rise([title], {delay: t, dist: '0.35em', blur: 8, duration: 800}),
          rise(tags, {delay: t + 160, stagger: 45, dist: '6px', blur: 3, duration: 600}),
          words(desc, t + 220, 8),
          rise(actions, {delay: t + 380, stagger: 80, dist: '10px', blur: 4, duration: 700}),
          decode(cat, t + 90),
        ]);
      },
      reset() { frostClear(card); unhide(title, cat, desc, ...tags, ...actions); },
    };
  }
  function sceneCta(card) {
    const parts = $$('.work-card__cta-inner > *', card);
    return {
      root: card,
      prepare() { hide(...parts); },
      play() { return settle(rise(parts, {stagger: 90, dist: '12px', blur: 5})); },
      reset() { unhide(...parts); },
    };
  }
  function sceneContactName() {
    const name = $('.contact__name');
    return {
      root: name,
      prepare() { hide(name); },
      play() { return settle(signOn(name, 60)); },
      reset() { unhide(name); },
    };
  }
  function sceneContactCols() {
    const cols = $('.contact__cols');
    const labels = $$('.contact__label', cols);
    const rest = $$('.contact__col > *', cols).filter(e => !e.classList.contains('contact__label'));
    return {
      root: cols,
      prepare() { frostPre(cols); hide(...labels, ...rest); },
      play() {
        const t = 160;
        return settle([
          frostIn(cols, 0),
          labels.map((l, i) => decode(l, t + i * 120)),
          rise(rest, {delay: t + 120, stagger: 45, dist: '10px', blur: 5, duration: 700}),
        ]);
      },
      reset() { frostClear(cols); unhide(...labels, ...rest); },
    };
  }

  let scenes = [];
  let io;
  function setupScenes() {
    scenes = [sceneAbout(), sceneWorkHead(),
      ...$$('.work-card').map(c => (c.classList.contains('work-card--cta') ? sceneCta(c) : sceneCard(c))),
      sceneContactName(), sceneContactCols()].filter(s => s.root);
    io = new IntersectionObserver(entries => {
      entries.forEach(({target, isIntersecting}) => {
        if (!isIntersecting) return;
        const s = scenes.find(x => x.root === target);
        io.unobserve(target);
        if (s && s.state === 'pending') playScene(s);
      });
    }, {rootMargin: '0px 0px -12% 0px'});
    scenes.forEach(s => {
      const r = s.root.getBoundingClientRect();
      /* whatever is already on screen at load stays exactly as it is */
      if (r.top < innerHeight * 0.88 && r.bottom > 0) { s.state = 'done'; return; }
      s.reset();
      s.prepare();
      s.state = 'pending';
      io.observe(s.root);
    });
  }
  function playScene(s) {
    s.state = 'playing';
    Promise.resolve(s.play()).then(() => { if (s.state === 'playing') s.state = 'done'; });
  }

  /* ---------- Scroll-linked: N3 lift off and S2 lighting cues ---------- */
  /* Scroll may trigger or steer a move, but nothing here has a resting state
     that looks unfinished: wherever the page stops, the name looks finished. */
  let geo = null;
  const light = document.createElement('div');
  light.className = 'mo-light';
  light.setAttribute('aria-hidden', 'true');
  let cueNow = 0, cueRaf = 0;

  function measure() {
    const name = $('.hero__name');
    if (!name) return;
    const saved = name.style.translate;
    name.style.removeProperty('translate');
    const box = name.getBoundingClientRect();
    if (saved) name.style.translate = saved;
    geo = {
      name,
      parked: false,
      navB: $('.topnav')?.getBoundingClientRect().bottom || 0,
      top: box.top + scrollY,
      bottom: box.bottom + scrollY,
      sections: ['#top', '#about', '#work', '#contact'].map(sel => {
        const el = $(sel);
        if (!el) return null;
        const r = el.getBoundingClientRect();
        return {sel, top: r.top + scrollY, bottom: r.bottom + scrollY};
      }).filter(Boolean),
    };
  }
  function clearHero() {
    const name = geo?.name;
    if (!name) return;
    geo.parked = false;
    ['translate', 'will-change', 'mask-image', '-webkit-mask-image'].forEach(p => name.style.removeProperty(p));
  }
  /* N3: the name rises a little faster than the page and dissolves only along
     a fixed band under the nav. The name itself is never blurred or half-faded. */
  function updateHero(y) {
    if (!geo) return;
    const name = geo.name;
    if (y <= 0) return clearHero();
    const ty = -Math.min(y, innerHeight * 0.7) * 0.22;
    /* once the name has left through the top, leave it be until it can come back */
    const gone = geo.bottom - y + ty < 0;
    if (gone && geo.parked) return;
    geo.parked = gone;
    const edge = geo.navB - (geo.top - y + ty);
    name.style.translate = `0 ${ty.toFixed(2)}px`;
    name.style.willChange = 'translate';
    const mask = edge + 64 > 0 ? `linear-gradient(to bottom, transparent ${(edge + 4).toFixed(1)}px, #000 ${(edge + 64).toFixed(1)}px)` : '';
    name.style.setProperty('mask-image', mask);
    name.style.setProperty('-webkit-mask-image', mask);
  }
  /* S2: open for the name and the sign-off, a touch dimmer for reading. */
  const LEVELS = {'#top': 0, '#about': 0.75, '#work': 1, '#contact': 0.4};
  function cueTarget(y) {
    if (!geo) return 0;
    const vh = innerHeight;
    let sum = 0, w = 0;
    for (const s of geo.sections) {
      const vis = Math.max(0, Math.min(s.bottom, y + vh) - Math.max(s.top, y));
      sum += vis * LEVELS[s.sel];
      w += vis;
    }
    return w ? sum / w : 0;
  }
  function cueFrame() {
    const target = cueTarget(scrollY);
    cueNow += (target - cueNow) * 0.07;
    if (Math.abs(target - cueNow) < 0.002) cueNow = target;
    light.style.opacity = cueNow.toFixed(3);
    cueRaf = cueNow === target ? 0 : requestAnimationFrame(cueFrame);
  }
  let scrollRaf = 0;
  function updateScroll() {
    scrollRaf = 0;
    updateHero(scrollY);
    if (!cueRaf) cueRaf = requestAnimationFrame(cueFrame);
  }
  const onScroll = () => { if (!scrollRaf) scrollRaf = requestAnimationFrame(updateScroll); };

  /* ---------- C1 Glass catches light and C2 Lean (hover) ---------- */
  function setupGlass() {
    for (const p of $$('.about__content, .work-card:not(.work-card--cta), .contact__cols')) {
      const fx = document.createElement('span');
      fx.className = 'mo-fx';
      fx.setAttribute('aria-hidden', 'true');
      p.append(fx);
      const tiltable = p.classList.contains('work-card');
      let rect = null, px = 0, py = 0, raf = 0, leaveTimer = 0;
      const apply = () => {
        raf = 0;
        if (!rect) return;
        const x = px - rect.left, y = py - rect.top;
        fx.style.setProperty('--mo-mx', x.toFixed(1) + 'px');
        fx.style.setProperty('--mo-my', y.toFixed(1) + 'px');
        fx.classList.add('is-hot');
        if (!tiltable) return;
        clearTimeout(leaveTimer);
        p.style.setProperty('--mo-ry', ((x / rect.width - 0.5) * 2.4).toFixed(2) + 'deg');
        p.style.setProperty('--mo-rx', ((0.5 - y / rect.height) * 2.4).toFixed(2) + 'deg');
        p.classList.add('mo-tilt');
      };
      p.addEventListener('pointerenter', e => { if (mouse(e)) rect = p.getBoundingClientRect(); });
      p.addEventListener('pointermove', e => {
        if (!active() || !mouse(e)) return;
        if (!rect) rect = p.getBoundingClientRect();
        px = e.clientX;
        py = e.clientY;
        if (!raf) raf = requestAnimationFrame(apply);
      });
      p.addEventListener('pointerleave', () => {
        rect = null;
        fx.classList.remove('is-hot');
        if (!p.classList.contains('mo-tilt')) return;
        p.style.setProperty('--mo-rx', '0deg');
        p.style.setProperty('--mo-ry', '0deg');
        leaveTimer = setTimeout(() => {
          p.classList.remove('mo-tilt');
          p.style.removeProperty('--mo-rx');
          p.style.removeProperty('--mo-ry');
        }, 650);
      });
    }
  }

  /* ---------- C4 Magnetic pills (hover) ---------- */
  function setupMagnet() {
    for (const b of $$('.pill-btn, .btn')) {
      let rect = null;
      b.addEventListener('pointerenter', e => { if (mouse(e)) rect = b.getBoundingClientRect(); });
      b.addEventListener('pointermove', e => {
        if (!active() || !mouse(e)) return;
        if (!rect) rect = b.getBoundingClientRect();
        const dx = e.clientX - (rect.left + rect.width / 2), dy = e.clientY - (rect.top + rect.height / 2);
        b.style.setProperty('--mo-mgx', clamp(dx * 0.2, -7, 7).toFixed(1) + 'px');
        b.style.setProperty('--mo-mgy', clamp(dy * 0.3, -5, 5).toFixed(1) + 'px');
      });
      b.addEventListener('pointerleave', () => {
        rect = null;
        b.style.removeProperty('--mo-mgx');
        b.style.removeProperty('--mo-mgy');
      });
    }
  }

  /* ---------- C5 Arrow flight: tag each arrow with its direction ---------- */
  function setupArrows() {
    const dirs = {'↗': 'ne', '→': 'e', '↓': 's'};
    for (const s of $$('.pill-btn > span[aria-hidden], .contact__social > span[aria-hidden], .hero__hint > span[aria-hidden]')) {
      const d = dirs[s.textContent.trim()];
      if (d) s.dataset.moArrow = d;
    }
  }

  /* ---------- C3 Lift into reading: the card becomes the Reading Panel ---------- */
  function textRect(el) {
    const n = [...el.childNodes].find(c => c.nodeType === 3 && c.data.trim());
    if (!n) return el.getBoundingClientRect();
    const r = document.createRange();
    r.selectNodeContents(n);
    return r.getBoundingClientRect();
  }
  function textLines(el) {
    const n = [...el.childNodes].find(c => c.nodeType === 3 && c.data.trim());
    if (!n) return 0;
    const r = document.createRange();
    r.selectNodeContents(n);
    return new Set([...r.getClientRects()].map(x => Math.round(x.top))).size;
  }
  function setupLift() {
    const modal = $('.work-modal');
    if (!modal) return;
    const panel = $('.work-modal__panel', modal), backdrop = $('.work-modal__backdrop', modal);
    let panelRect = null;
    modal.addEventListener('modal:open', e => { if (active() && e.detail?.card) liftOpen(e.detail.card); });
    modal.addEventListener('modal:close', e => { if (active() && e.detail?.card) liftClose(e.detail.card); });

    function liftOpen(card) {
      const from = card.getBoundingClientRect(), to = panel.getBoundingClientRect();
      panelRect = to;
      const cc = getComputedStyle(card), pc = getComputedStyle(panel);
      const D = 540, curve = 'cubic-bezier(0.2, 0.9, 0.25, 1)';
      const ghost = document.createElement('div');
      ghost.className = 'mo-ghost';
      ghost.setAttribute('aria-hidden', 'true');
      modal.insertBefore(ghost, panel);
      const g = ghost.animate([
        {left: from.left + 'px', top: from.top + 'px', width: from.width + 'px', height: from.height + 'px',
          borderRadius: cc.borderTopLeftRadius, backgroundColor: cc.backgroundColor, borderColor: cc.borderTopColor, boxShadow: '0 0 0 rgba(0, 0, 0, 0)'},
        {left: to.left + 'px', top: to.top + 'px', width: to.width + 'px', height: to.height + 'px',
          borderRadius: pc.borderTopLeftRadius, backgroundColor: pc.backgroundColor, borderColor: pc.borderTopColor, boxShadow: pc.boxShadow},
      ], {duration: D, easing: curve, fill: 'forwards'});
      backdrop.animate([{opacity: 0}, {opacity: 1}], {duration: 380, easing: 'ease-out'});
      const pa = panel.animate([{opacity: 0}, {opacity: 0, offset: 0.7}, {opacity: 1}], {duration: D + 140, easing: 'linear'});
      /* the title flies from the card into the reading panel */
      const src = $('.work-card__title', card), dst = $('.work-modal__title', modal);
      const sr = textRect(src), dr = textRect(dst);
      const oneLine = el => el.getClientRects().length && textLines(el) === 1;
      let clone = null, fades = [];
      if (sr.width && dr.width && oneLine(src) && oneLine(dst)) {
        clone = document.createElement('div');
        clone.className = 'mo-ghost-title';
        clone.setAttribute('aria-hidden', 'true');
        clone.textContent = src.textContent.trim();
        const sc = getComputedStyle(src);
        for (const p of ['fontFamily', 'fontSize', 'fontWeight', 'letterSpacing', 'lineHeight', 'color']) clone.style[p] = sc[p];
        clone.style.left = sr.left + 'px';
        clone.style.top = sr.top + 'px';
        modal.append(clone);
        const cr = textRect(clone);
        clone.style.left = sr.left + (sr.left - cr.left) + 'px';
        clone.style.top = sr.top + (sr.top - cr.top) + 'px';
        const s = dr.width / sr.width;
        clone.animate([{transform: 'none'}, {transform: `translate(${dr.left - sr.left}px, ${dr.top - sr.top}px) scale(${s})`}],
          {duration: D, easing: curve, fill: 'forwards'});
        fades = [
          clone.animate([{opacity: 1}, {opacity: 1, offset: 0.78}, {opacity: 0}], {duration: D + 90, fill: 'forwards'}),
          dst.animate([{opacity: 0}, {opacity: 0, offset: 0.76}, {opacity: 1}], {duration: D + 90, fill: 'backwards'}),
        ];
      }
      const items = [...(clone ? [] : [dst]), ...$$('.work-modal__body > *', modal).flatMap(e => (e.matches('ul') ? [...e.children] : [e]))];
      items.forEach((it, i) => it.animate([
        {opacity: 0, transform: 'translateY(10px)', filter: 'blur(4px)'},
        {opacity: 1, transform: 'none', filter: 'blur(0px)'},
      ], {duration: 560, delay: D * 0.66 + i * 40, easing: EASE, fill: 'backwards'}));
      Promise.all([done(g), done(pa)]).then(() => ghost.remove());
      if (clone) Promise.all(fades.map(done)).then(() => clone.remove());
    }
    function liftClose(card) {
      if (!panelRect) return;
      const to = card.getBoundingClientRect(), cc = getComputedStyle(card);
      const scrim = document.createElement('div');
      scrim.className = 'mo-ghost mo-ghost--scrim';
      const surf = document.createElement('div');
      surf.className = 'mo-ghost mo-ghost--surface-out';
      [scrim, surf].forEach(e => { e.setAttribute('aria-hidden', 'true'); document.body.append(e); });
      const p = panelRect;
      const a = surf.animate([
        {left: p.left + 'px', top: p.top + 'px', width: p.width + 'px', height: p.height + 'px', borderRadius: '20px', opacity: 1},
        {opacity: 1, offset: 0.55},
        {left: to.left + 'px', top: to.top + 'px', width: to.width + 'px', height: to.height + 'px',
          borderRadius: cc.borderTopLeftRadius, backgroundColor: cc.backgroundColor, opacity: 0},
      ], {duration: 440, easing: 'cubic-bezier(0.4, 0, 0.2, 1)', fill: 'forwards'});
      scrim.animate([{opacity: 1}, {opacity: 0}], {duration: 380, easing: 'ease-out', fill: 'forwards'});
      done(a).then(() => { scrim.remove(); surf.remove(); });
      panelRect = null;
    }
  }

  /* ---------- C7 Glide: anchor jumps get a longer, eased glide ---------- */
  /* main.js asks for page scrolls through window.motionPass.glideTo; any
     wheel, touch or key hands the page straight back to the visitor. */
  let glideRaf = 0;
  const cancelGlide = () => { if (glideRaf) cancelAnimationFrame(glideRaf); glideRaf = 0; };
  function glideTo(y) {
    const max = document.documentElement.scrollHeight - innerHeight;
    const y0 = scrollY, dist = clamp(y, 0, max) - y0;
    cancelGlide();
    if (Math.abs(dist) < 2) return Promise.resolve();
    const dur = clamp(460 + Math.abs(dist) * 0.3, 700, 1500);
    return new Promise(resolve => {
      const t0 = performance.now();
      const step = now => {
        const p = Math.min(1, (now - t0) / dur);
        scrollTo({top: y0 + dist * easeInOutQuart(p), behavior: 'instant'});
        if (p < 1) glideRaf = requestAnimationFrame(step);
        else { glideRaf = 0; resolve(); }
      };
      glideRaf = requestAnimationFrame(step);
    });
  }
  ['wheel', 'touchstart', 'keydown'].forEach(t => addEventListener(t, cancelGlide, {passive: true}));

  /* ---------- Reduced motion switched on mid-visit: stand everything down ---------- */
  /* Switching it off again leaves the pass off until reload, on purpose. */
  function standDown() {
    overtureRun++;
    cancelGlide();
    html.classList.remove('mo');
    delete window.motionPass;
    clearHero();
    scenes.forEach(s => { io?.unobserve(s.root); s.reset(); });
    $$('.mo-split').forEach(w => w.parentElement?.__mo?.restore());
    $$('.mo-fx, .mo-typing, .mo-ghost, .mo-ghost-title').forEach(e => e.remove());
    light.remove();
    $$('.mo-lit').forEach(e => e.classList.remove('mo-lit'));
    $$('.mo-tilt').forEach(e => { e.classList.remove('mo-tilt'); e.style.removeProperty('--mo-rx'); e.style.removeProperty('--mo-ry'); });
  }

  function init() {
    window.motionPass = {glideTo};
    tokens = {warm: getComputedStyle(document.body).getPropertyValue('--amber-300').trim() || '#e6c284'};
    $('.bg-overlay')?.after(light);
    setupArrows();
    setupGlass();
    setupMagnet();
    setupGlow();
    setupLift();
    setupScenes();
    measure();
    updateScroll();
    addEventListener('scroll', onScroll, {passive: true});
    addEventListener('resize', () => { measure(); updateScroll(); });
    document.fonts?.ready.then(() => { measure(); updateScroll(); });
    reduce.addEventListener('change', () => { if (reduce.matches) standDown(); });
    overture();
  }
  document.addEventListener('DOMContentLoaded', init);
})();
