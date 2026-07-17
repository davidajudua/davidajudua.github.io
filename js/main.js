/* ============================================
   DAVID AJUDUA — Portfolio Scripts v9
   Ambient night · Lenis · GSAP
   The fixed video is the atmosphere; ambient
   animation belongs to the content (name, proof
   numbers, kinetic words). Chrome moves only in
   direct response to the user (hover, press).
   Progressive enhancement + reduced-motion safe.
   ============================================ */

document.addEventListener('DOMContentLoaded', () => {

  const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const hasGSAP  = typeof window.gsap !== 'undefined';
  const hasST    = hasGSAP && typeof window.ScrollTrigger !== 'undefined';
  const hasLenis = typeof window.Lenis !== 'undefined';
  const animate  = !prefersReducedMotion;

  if (hasST) gsap.registerPlugin(ScrollTrigger);

  /* 1. LOADER */
  const loader = document.querySelector('.site-loader');
  if (loader) {
    setTimeout(() => {
      loader.classList.add('done');
      document.body.classList.add('page-transition');
    }, prefersReducedMotion ? 0 : 400);
  }

  /* 1b. AMBIENT BACKDROP — respect reduced motion (poster stays, video never plays),
     and resume playback after Chrome pauses occluded/background tabs. */
  const bgVideo = document.querySelector('.bg-video');
  if (bgVideo && prefersReducedMotion) {
    bgVideo.removeAttribute('autoplay');
    bgVideo.pause();
  } else if (bgVideo) {
    document.addEventListener('visibilitychange', () => {
      if (!document.hidden && bgVideo.paused) bgVideo.play().catch(() => {});
    });
    // iOS Low Power Mode suspends autoplay (the poster shows). A play() inside
    // a user gesture is still allowed — revive the Set on the first touch.
    document.addEventListener('pointerdown', () => {
      if (bgVideo.paused) bgVideo.play().catch(() => {});
    }, { once: true, passive: true });
  }

  /* 1c. PRESS + SHEEN — reactive chrome micro-motion (see CONTEXT.md Motion Rule).
     A band of light sweeps across faced buttons and the writing headers on
     hover/press/focus; :active compression is pure CSS. */
  document.addEventListener('touchstart', () => {}, { passive: true }); // enables :active on iOS
  if (animate) {
    const sweep = (el) => {
      el.classList.remove('sweeping');
      void el.offsetWidth; // restart the animation
      el.classList.add('sweeping');
    };
    const hasHover = window.matchMedia('(hover: hover) and (pointer: fine)').matches;
    document.querySelectorAll('.btn, .pill-btn, .writing-piece__header, .back-to-top, .work-modal__close')
      .forEach((el) => {
        el.addEventListener('pointerdown', () => sweep(el));
        // keyboard only — mouse clicks already swept on pointerdown
        el.addEventListener('focus', () => {
          if (el.matches(':focus-visible')) sweep(el);
        });
        if (hasHover) el.addEventListener('mouseenter', () => sweep(el));
      });
  }

  /* 2. LENIS SMOOTH SCROLL + ScrollTrigger bridge */
  let lenis = null;
  if (hasLenis && animate) {
    lenis = new Lenis({
      duration: 1.1,
      easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
      smoothWheel: true,
      wheelMultiplier: 1,
      touchMultiplier: 1.8,
    });
    document.documentElement.style.scrollBehavior = 'auto';
    if (hasST) {
      lenis.on('scroll', ScrollTrigger.update);
      gsap.ticker.add((time) => lenis.raf(time * 1000));
      gsap.ticker.lagSmoothing(0);
    } else {
      const raf = (t) => { lenis.raf(t); requestAnimationFrame(raf); };
      requestAnimationFrame(raf);
    }
  }

  const getScrollY = () => (lenis ? lenis.scroll : window.scrollY);
  const scrollToTarget = (target) => {
    if (lenis) { lenis.scrollTo(target, { offset: 0 }); return; }
    if (typeof target === 'number') { window.scrollTo({ top: target, behavior: prefersReducedMotion ? 'auto' : 'smooth' }); return; }
    target.scrollIntoView({ behavior: prefersReducedMotion ? 'auto' : 'smooth', block: 'start' });
  };
  const onScroll = (fn) => {
    if (lenis) lenis.on('scroll', fn);
    else window.addEventListener('scroll', fn, { passive: true });
    fn();
  };

  /* 4. SPLIT TEXT helper */
  function splitText(el) {
    const original = el.textContent.trim();
    el.setAttribute('aria-label', original);
    el.textContent = '';
    const frag = document.createDocumentFragment();
    original.split(/\s+/).forEach((word, wi, words) => {
      const wordEl = document.createElement('span');
      wordEl.className = 'word';
      wordEl.setAttribute('aria-hidden', 'true');
      wordEl.style.display = 'inline-block';
      for (const ch of word) {
        const c = document.createElement('span');
        c.className = 'char';
        c.textContent = ch;
        wordEl.appendChild(c);
      }
      frag.appendChild(wordEl);
      if (wi < words.length - 1) frag.appendChild(document.createTextNode(' '));
    });
    el.appendChild(frag);
    return el.querySelectorAll('.char');
  }

  /* 5. CHAR REVEAL for [data-split] (on scroll into view) */
  document.querySelectorAll('[data-split]').forEach((el) => {
    if (hasGSAP && animate) {
      const chars = splitText(el);
      gsap.set(el, { opacity: 1 });
      gsap.from(chars, {
        opacity: 0, y: 30, filter: 'blur(12px)',
        duration: 0.8, ease: 'power3.out', stagger: 0.02,
        scrollTrigger: hasST ? { trigger: el, start: 'top 88%', toggleActions: 'play reverse play reverse' } : undefined,
        delay: hasST ? 0 : 0.1,
      });
    } else {
      el.style.opacity = '1';
    }
  });

  /* 6. KINETIC WORD LOOP (About visual) — masked roll, no empty/black frame */
  const kw = document.querySelector('.kinetic__word');
  if (kw) {
    const words = ['software', 'systems', 'platforms', 'tools'];
    const makeItem = (text) => {
      const el = document.createElement('span');
      el.className = 'kinetic__item';
      el.textContent = text;
      return el;
    };
    kw.textContent = '';
    // Hidden in-flow sizer = longest word, so the clip container keeps its width
    // (absolute items below contribute no width and would otherwise collapse it).
    const sizer = document.createElement('span');
    sizer.className = 'kinetic__sizer';
    sizer.setAttribute('aria-hidden', 'true');
    sizer.textContent = words.reduce((a, b) => (b.length > a.length ? b : a));
    kw.appendChild(sizer);
    let current = makeItem(words[0]);
    kw.appendChild(current);
    if (hasGSAP && animate) {
      let i = 0;
      const cycle = () => {
        i = (i + 1) % words.length;
        const next = makeItem(words[i]);
        gsap.set(next, { yPercent: 110, opacity: 0 });
        kw.appendChild(next);
        const outgoing = current;
        current = next;
        gsap.timeline({ delay: 3.5, onComplete: () => { outgoing.remove(); cycle(); } })
          .to(outgoing, { yPercent: -110, opacity: 0, duration: 0.6, ease: 'power3.inOut' }, 0)
          .to(next,     { yPercent: 0,   opacity: 1, duration: 0.6, ease: 'power3.inOut' }, 0);
      };
      cycle();
    }
  }

  /* 6b. GHOST TITLE — subtle scroll parallax (drift) */
  const ghost = document.querySelector('.ghost-title');
  if (ghost && hasST && animate) {
    gsap.fromTo(ghost, { x: 90 },
      { x: -90, ease: 'none',
        scrollTrigger: { trigger: '.whatido', start: 'top bottom', end: 'bottom top', scrub: true } });
  }

  /* 6c removed — the count-up is now driven inside §7 so it shares the About
     section's reveal lifecycle (keeps its value during the fade-out, then
     re-counts on return) instead of having its own over-eager trigger. */

  /* 7. SCROLL REVEALS — grouped by section so each panel fades in/out as ONE unit.
     One ScrollTrigger per panel, anchored to the panel's own bounds: scrolling
     within a section never toggles it, and tall sections (the essays) never get
     stuck hidden. The About metrics count-up rides the same lifecycle. */
  const reveals = document.querySelectorAll('.reveal');
  if (hasST && animate) {
    // Count-up helpers, one per [data-count], tagged with their containing panel.
    const counters = [];
    document.querySelectorAll('[data-count]').forEach((el) => {
      const target = parseFloat(el.getAttribute('data-count'));
      if (isNaN(target)) return; // leave literal HTML text untouched
      const prefix = el.getAttribute('data-prefix') || '';
      const suffix = el.getAttribute('data-suffix') || '';
      const render = (v) => { el.textContent = prefix + Math.round(v) + suffix; };
      const obj = { v: 0 };
      let tween, flashTimer;
      render(0);
      counters.push({
        panel: el.closest('.panel'),
        runCount: () => {
          tween?.kill(); obj.v = 0;
          clearTimeout(flashTimer);
          el.classList.remove('settled');
          tween = gsap.to(obj, {
            v: target, duration: 1.4, ease: 'power2.out',
            onUpdate: () => render(obj.v),
            onComplete: () => {
              render(target);
              // settle flash — a beat of amber as the number lands
              el.classList.add('settled');
              flashTimer = setTimeout(() => el.classList.remove('settled'), 700);
            },
          });
        },
        reset: () => { tween?.kill(); obj.v = 0; render(0); clearTimeout(flashTimer); el.classList.remove('settled'); },
      });
    });

    // Group reveal elements by their section (panel) so they animate together.
    const groups = new Map();
    reveals.forEach((el) => {
      const panel = el.closest('.panel') || el.parentElement;
      if (!groups.has(panel)) groups.set(panel, []);
      groups.get(panel).push(el);
    });

    gsap.set(reveals, { opacity: 0, y: 40 });

    groups.forEach((items, panel) => {
      const panelCounters = counters.filter((c) => c.panel === panel);
      let outTween;
      const playIn = () => {
        outTween && outTween.kill(); // cancel a pending out so its reset can't fire mid-recount
        gsap.to(items, { opacity: 1, y: 0, duration: 0.8, ease: 'power3.out', stagger: 0.06, overwrite: true });
        panelCounters.forEach((c) => c.runCount());
      };
      const playOut = () => {
        outTween = gsap.to(items, {
          opacity: 0, y: 40, duration: 0.4, ease: 'power2.in', overwrite: true,
          onComplete: () => panelCounters.forEach((c) => c.reset()), // reset value only once invisible
        });
      };
      ScrollTrigger.create({
        trigger: panel, start: 'top 80%', end: 'bottom 25%',
        onEnter: playIn, onEnterBack: playIn,
        onLeave: playOut, onLeaveBack: playOut,
        // onEnter never fires for a panel the page is ALREADY inside (deep links
        // like /#mp1, or a refresh after an accordion resize) — catch it here.
        onRefresh: (self) => { if (self.isActive) playIn(); },
      });
    });
  } else if (animate && 'IntersectionObserver' in window) {
    const ob = new IntersectionObserver((entries) => {
      entries.forEach((e) => { if (e.isIntersecting) { e.target.classList.add('visible'); ob.unobserve(e.target); } });
    }, { threshold: 0.06, rootMargin: '0px 0px -50px 0px' });
    reveals.forEach((el) => ob.observe(el));
  } else {
    reveals.forEach((el) => el.classList.add('visible'));
  }

  /* 8. TIMELINE scrub */
  const timeline = document.querySelector('.timeline');
  if (hasST && animate && timeline) {
    ScrollTrigger.create({
      trigger: timeline,
      start: 'top 70%',
      end: 'bottom 80%',
      scrub: true,
      onUpdate: (self) => timeline.style.setProperty('--progress', (self.progress * 100).toFixed(2) + '%'),
    });
  }

  /* 9. WORK DETAIL MODAL — opens a project's deep-dive overlay (desktop + mobile). */
  const workModal = document.querySelector('.work-modal');
  if (workModal) {
    const panel = workModal.querySelector('.work-modal__panel');
    const modalTitle = workModal.querySelector('.work-modal__title');
    const modalBody = workModal.querySelector('.work-modal__body');
    const modalClose = workModal.querySelector('.work-modal__close');
    let lastTrigger = null;

    const openModal = (card, trigger) => {
      const detail = card.querySelector('.work-card__detail');
      if (!detail) return;
      lastTrigger = trigger;
      modalTitle.textContent = card.querySelector('.work-card__title')?.textContent || 'Project';
      // Clone the card's own static detail markup (first-party, no user input) via safe DOM nodes.
      modalBody.replaceChildren(...detail.cloneNode(true).childNodes);
      workModal.hidden = false;
      requestAnimationFrame(() => workModal.classList.add('open'));
      document.body.style.overflow = 'hidden';
      lenis?.stop();
      modalClose.focus();
    };

    const closeModal = () => {
      if (workModal.hidden) return;
      workModal.classList.remove('open');
      document.body.style.overflow = '';
      lenis?.start();
      const finish = () => { workModal.hidden = true; modalBody.replaceChildren(); };
      prefersReducedMotion ? finish() : setTimeout(finish, 220);
      lastTrigger?.focus();
    };

    document.querySelectorAll('.work-card__details-btn').forEach((btn) => {
      btn.addEventListener('click', () => openModal(btn.closest('.work-card'), btn));
    });
    workModal.querySelectorAll('[data-modal-close]').forEach((el) => el.addEventListener('click', closeModal));
    document.addEventListener('keydown', (e) => { if (e.key === 'Escape') closeModal(); });

    // basic focus trap within the dialog
    panel.addEventListener('keydown', (e) => {
      if (e.key !== 'Tab') return;
      const f = panel.querySelectorAll('a[href], button:not([disabled])');
      if (!f.length) return;
      const first = f[0], last = f[f.length - 1];
      if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
      else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
    });
  }

  /* 10. MOBILE MENU */
  const toggle = document.querySelector('.topnav__toggle');
  const navLinks = document.querySelector('.topnav__links');
  const backdrop = document.querySelector('.nav__backdrop');
  function closeMobileMenu() {
    toggle?.classList.remove('open');
    navLinks?.classList.remove('open');
    backdrop?.classList.remove('visible');
    toggle?.setAttribute('aria-expanded', 'false');
    document.body.style.overflow = '';
    lenis?.start();
  }
  function openMobileMenu() {
    toggle?.classList.add('open');
    navLinks?.classList.add('open');
    backdrop?.classList.add('visible');
    toggle?.setAttribute('aria-expanded', 'true');
    document.body.style.overflow = 'hidden';
    lenis?.stop();
  }
  if (toggle && navLinks) {
    toggle.addEventListener('click', () => {
      navLinks.classList.contains('open') ? closeMobileMenu() : openMobileMenu();
    });
  }
  backdrop?.addEventListener('click', closeMobileMenu);

  /* 11. ANCHOR NAV (data-scroll + pill data-scroll-to) */
  document.querySelectorAll('[data-scroll]').forEach((a) => {
    a.addEventListener('click', (e) => {
      const href = a.getAttribute('href');
      if (href && href.startsWith('#')) {
        e.preventDefault();
        const target = href === '#top' ? 0 : document.querySelector(href);
        // Close the mobile menu FIRST so Lenis is restarted before we scroll.
        closeMobileMenu();
        if (target !== null) requestAnimationFrame(() => scrollToTarget(target));
      }
    });
  });
  document.querySelectorAll('[data-scroll-to]').forEach((b) => {
    b.addEventListener('click', () => {
      const target = document.querySelector(b.getAttribute('data-scroll-to'));
      if (target) scrollToTarget(target);
    });
  });

  /* 12. EXPANDABLE CARDS (What I Do) */
  function toggleExpandCard(card) {
    const isOpen = card.classList.contains('open');
    document.querySelectorAll('.expand-card.open').forEach((c) => {
      if (c !== card) { c.classList.remove('open'); c.setAttribute('aria-expanded', 'false'); }
    });
    card.classList.toggle('open', !isOpen);
    card.setAttribute('aria-expanded', String(!isOpen));
    if (hasST) setTimeout(() => ScrollTrigger.refresh(), 550);
  }
  document.querySelectorAll('.expand-card').forEach((card) => {
    card.addEventListener('click', () => toggleExpandCard(card));
    card.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); toggleExpandCard(card); }
    });
  });

  /* 13. WRITING ACCORDIONS */
  function toggleWritingPiece(piece) {
    const isOpen = piece.classList.contains('open');
    const header = piece.querySelector('.writing-piece__header');
    document.querySelectorAll('.writing-piece.open').forEach((p) => {
      if (p !== piece) {
        p.classList.remove('open');
        p.querySelector('.writing-piece__header')?.setAttribute('aria-expanded', 'false');
      }
    });
    piece.classList.toggle('open', !isOpen);
    header?.setAttribute('aria-expanded', String(!isOpen));
    if (hasST) setTimeout(() => ScrollTrigger.refresh(), 650);
  }
  document.querySelectorAll('.writing-piece__header').forEach((header) => {
    header.addEventListener('click', () => toggleWritingPiece(header.closest('.writing-piece')));
    header.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); toggleWritingPiece(header.closest('.writing-piece')); }
    });
  });

  /* 14. AUTO-OPEN writing from hash */
  function openFromHash() {
    const hash = window.location.hash;
    if (hash) {
      const target = document.querySelector(hash);
      if (target?.classList.contains('writing-piece')) {
        setTimeout(() => { toggleWritingPiece(target); scrollToTarget(target); }, prefersReducedMotion ? 100 : 600);
      }
    }
  }
  openFromHash();
  window.addEventListener('hashchange', openFromHash);

  /* 14b. HASH-JUMP RESYNC — a same-document hash change makes the browser jump
     natively, which Lenis (and therefore ScrollTrigger) never hears about,
     leaving section reveals stuck hidden. Re-sync them to the real position. */
  window.addEventListener('hashchange', () => {
    if (lenis) lenis.scrollTo(window.scrollY, { immediate: true, force: true });
    if (hasST) requestAnimationFrame(() => ScrollTrigger.update());
  });

  /* 15. BACK TO TOP */
  const backToTop = document.querySelector('.back-to-top');
  if (backToTop) {
    onScroll(() => backToTop.classList.toggle('visible', getScrollY() > window.innerHeight * 1.5));
    backToTop.addEventListener('click', () => scrollToTarget(0));
  }

});
