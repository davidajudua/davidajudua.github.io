/* ============================================
   DAVID AJUDUA — Portfolio Scripts v8
   Single-page cinematic scroll · Lenis · GSAP
   Progressive enhancement + reduced-motion safe.
   ============================================ */

document.addEventListener('DOMContentLoaded', () => {

  const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const hasGSAP  = typeof window.gsap !== 'undefined';
  const hasST    = hasGSAP && typeof window.ScrollTrigger !== 'undefined';
  const hasLenis = typeof window.Lenis !== 'undefined';
  const animate  = !prefersReducedMotion;
  const isDesktop = window.matchMedia('(min-width: 769px)').matches;

  if (hasST) gsap.registerPlugin(ScrollTrigger);

  /* 1. LOADER */
  const loader = document.querySelector('.site-loader');
  if (loader) {
    setTimeout(() => {
      loader.classList.add('done');
      document.body.classList.add('page-transition');
    }, prefersReducedMotion ? 0 : 400);
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

  /* 3. LIGHT → DARK background + theme class */
  const bgLayer = document.querySelector('.bg-layer');
  const introEl = document.querySelector('.intro');
  if (hasST && animate && bgLayer) {
    gsap.to(bgLayer, {
      backgroundColor: '#0b080c',
      ease: 'none',
      scrollTrigger: { trigger: '#about', start: 'top 85%', end: 'top 35%', scrub: true },
    });
  }
  // theme class toggle (works even without GSAP — CSS handles the bg fallback)
  const themeThreshold = () => (introEl ? introEl.offsetHeight : window.innerHeight) * 0.55;
  onScroll(() => document.body.classList.toggle('is-dark', getScrollY() > themeThreshold()));

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
        scrollTrigger: hasST ? { trigger: el, start: 'top 88%', once: true } : undefined,
        delay: hasST ? 0 : 0.1,
      });
    } else {
      el.style.opacity = '1';
    }
  });

  /* 6. KINETIC WORD LOOP (About visual) */
  const kw = document.querySelector('.kinetic__word');
  if (kw) {
    const words = ['AI', 'security', 'systems', 'automation'];
    kw.textContent = words[0];
    if (hasGSAP && animate) {
      let i = 0;
      const cycle = () => {
        const tl = gsap.timeline({ onComplete: cycle });
        tl.to(kw, { opacity: 0, filter: 'blur(10px)', y: -14, duration: 0.45, ease: 'power2.in', delay: 2 })
          .add(() => { i = (i + 1) % words.length; kw.textContent = words[i]; })
          .fromTo(kw, { opacity: 0, filter: 'blur(10px)', y: 14 }, { opacity: 1, filter: 'blur(0px)', y: 0, duration: 0.55, ease: 'power2.out' });
      };
      cycle();
    }
  }

  /* 7. SCROLL REVEALS */
  const reveals = document.querySelectorAll('.reveal');
  if (hasST && animate) {
    reveals.forEach((el) => {
      gsap.fromTo(el, { opacity: 0, y: 42 },
        { opacity: 1, y: 0, duration: 0.9, ease: 'power3.out',
          scrollTrigger: { trigger: el, start: 'top 88%', once: true } });
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

  /* 9. WORK horizontal pan (desktop only) */
  const workSection = document.querySelector('.work');
  const workTrack = document.querySelector('.work__track');
  const workViewport = document.querySelector('.work__viewport');
  if (hasST && animate && isDesktop && workTrack && workViewport) {
    const distance = () => Math.max(0, workTrack.scrollWidth - workViewport.offsetWidth);
    gsap.to(workTrack, {
      x: () => -distance(),
      ease: 'none',
      scrollTrigger: {
        trigger: workSection,
        start: 'top top',
        end: () => '+=' + distance(),
        pin: true,
        scrub: 1,
        invalidateOnRefresh: true,
        anticipatePin: 1,
      },
    });
  }

  /* 10. TOP NAV scrolled border already via is-dark; mobile menu */
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

  /* 15. CUSTOM CURSOR */
  const cursorDot = document.querySelector('.cursor-dot');
  const cursorRing = document.querySelector('.cursor-ring');
  if (cursorDot && cursorRing && window.matchMedia('(hover: hover) and (pointer: fine)').matches && !prefersReducedMotion) {
    let mouseX = 0, mouseY = 0, ringX = 0, ringY = 0;
    document.addEventListener('mousemove', (e) => {
      mouseX = e.clientX; mouseY = e.clientY;
      cursorDot.style.left = mouseX + 'px';
      cursorDot.style.top = mouseY + 'px';
    });
    (function animateRing() {
      ringX += (mouseX - ringX) * 0.15;
      ringY += (mouseY - ringY) * 0.15;
      cursorRing.style.left = ringX + 'px';
      cursorRing.style.top = ringY + 'px';
      requestAnimationFrame(animateRing);
    })();
    const hoverTargets = 'a, button, [role="button"], input, textarea, .expand-card, .work-card, .writing-piece__header, .btn, .pill-btn, .intro__pill, .topnav__toggle';
    document.addEventListener('mouseover', (e) => {
      if (e.target.closest(hoverTargets)) { cursorDot.classList.add('hovering'); cursorRing.classList.add('hovering'); }
    });
    document.addEventListener('mouseout', (e) => {
      if (e.target.closest(hoverTargets)) { cursorDot.classList.remove('hovering'); cursorRing.classList.remove('hovering'); }
    });
    document.addEventListener('mouseleave', () => { cursorDot.style.opacity = '0'; cursorRing.style.opacity = '0'; });
    document.addEventListener('mouseenter', () => { cursorDot.style.opacity = '1'; cursorRing.style.opacity = '1'; });
  }

  /* 16. BACK TO TOP */
  const backToTop = document.querySelector('.back-to-top');
  if (backToTop) {
    onScroll(() => backToTop.classList.toggle('visible', getScrollY() > window.innerHeight * 1.5));
    backToTop.addEventListener('click', () => scrollToTarget(0));
  }

});
