/* ============================================
   DAVID AJUDUA — Portfolio Scripts v7
   Kinetic type · Lenis smooth-scroll · GSAP
   Progressive enhancement: works with or without
   the CDN libraries and honors reduced-motion.
   ============================================ */

document.addEventListener('DOMContentLoaded', () => {

  const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const hasGSAP  = typeof window.gsap !== 'undefined';
  const hasST    = hasGSAP && typeof window.ScrollTrigger !== 'undefined';
  const hasLenis = typeof window.Lenis !== 'undefined';
  const animate  = !prefersReducedMotion;

  if (hasST) gsap.registerPlugin(ScrollTrigger);

  /* ==========================================
     1. LOADING ENTRANCE
     ========================================== */
  const loader = document.querySelector('.site-loader');
  if (loader) {
    setTimeout(() => {
      loader.classList.add('done');
      document.body.classList.add('page-transition');
    }, prefersReducedMotion ? 0 : 400);
  }

  /* ==========================================
     2. LENIS SMOOTH SCROLL (+ ScrollTrigger bridge)
     ========================================== */
  let lenis = null;
  if (hasLenis && animate) {
    lenis = new Lenis({
      duration: 1.1,
      easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
      smoothWheel: true,
      wheelMultiplier: 1,
      touchMultiplier: 1.8,
    });
    // Lenis owns scrolling — disable native smooth so they don't fight.
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

  // Unified scroll helpers (use Lenis if present, else native).
  const getScrollY = () => (lenis ? lenis.scroll : window.scrollY);
  const scrollToTarget = (target) => {
    if (lenis) lenis.scrollTo(target, { offset: 0 });
    else target.scrollIntoView({ behavior: prefersReducedMotion ? 'auto' : 'smooth', block: 'start' });
  };
  const scrollToTop = () => {
    if (lenis) lenis.scrollTo(0);
    else window.scrollTo({ top: 0, behavior: 'smooth' });
  };
  const onScroll = (fn) => {
    if (lenis) lenis.on('scroll', fn);
    else window.addEventListener('scroll', fn, { passive: true });
    fn();
  };

  /* ==========================================
     3. SPLIT TEXT — wrap words/chars for reveals
     ========================================== */
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

  /* ==========================================
     4. HERO / HEADER CHAR REVEAL (on load)
     ========================================== */
  const splitTargets = document.querySelectorAll('[data-split]');
  splitTargets.forEach((el) => {
    if (hasGSAP && animate) {
      const chars = splitText(el);
      gsap.set(el, { opacity: 1 });
      gsap.from(chars, {
        opacity: 0,
        y: 30,
        filter: 'blur(12px)',
        duration: 0.85,
        ease: 'power3.out',
        stagger: 0.022,
        delay: 0.12,
      });
    } else {
      // No GSAP or reduced motion: just make sure it's visible.
      el.style.opacity = '1';
    }
  });

  /* ==========================================
     5. HERO ROLE-SWAP LOOP
     ========================================== */
  const swap = document.querySelector('.hero__role-word');
  if (swap && hasGSAP && animate) {
    const phrases = ['things that matter.', 'AI tools.', 'secure systems.', 'things people use.'];
    let idx = 0;
    const cycle = () => {
      const tl = gsap.timeline({ onComplete: cycle });
      tl.to(swap, { opacity: 0, filter: 'blur(8px)', y: -10, duration: 0.4, ease: 'power2.in', delay: 2 })
        .add(() => { idx = (idx + 1) % phrases.length; swap.textContent = phrases[idx]; })
        .fromTo(swap,
          { opacity: 0, filter: 'blur(8px)', y: 10 },
          { opacity: 1, filter: 'blur(0px)', y: 0, duration: 0.55, ease: 'power2.out' });
    };
    cycle();
  }

  /* ==========================================
     6. HERO SCROLL PARALLAX (fade + lift)
     ========================================== */
  if (animate) {
    const heroContent = document.querySelectorAll('.hero__eyebrow, .hero__title, .hero__role, .hero__cta');
    if (heroContent.length && hasST) {
      gsap.to(heroContent, {
        yPercent: -14,
        opacity: 0,
        ease: 'none',
        stagger: 0.04,
        scrollTrigger: { trigger: '.hero', start: 'top top', end: 'bottom top', scrub: true },
      });
    }
  }

  /* ==========================================
     7. SCROLL-TRIGGERED REVEALS
     GSAP if available, else IntersectionObserver,
     else show everything.
     ========================================== */
  const reveals = document.querySelectorAll('.reveal');
  if (hasST && animate) {
    reveals.forEach((el) => {
      gsap.fromTo(el,
        { opacity: 0, y: 42 },
        {
          opacity: 1, y: 0, duration: 0.9, ease: 'power3.out',
          scrollTrigger: { trigger: el, start: 'top 88%', once: true },
        });
    });
  } else if (animate && 'IntersectionObserver' in window) {
    const revealObserver = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add('visible');
          revealObserver.unobserve(entry.target);
        }
      });
    }, { threshold: 0.06, rootMargin: '0px 0px -50px 0px' });
    reveals.forEach((el) => revealObserver.observe(el));
  } else {
    reveals.forEach((el) => el.classList.add('visible'));
  }

  /* ==========================================
     8. NAV scrolled state
     ========================================== */
  const nav = document.querySelector('.nav');
  if (nav) {
    onScroll(() => nav.classList.toggle('scrolled', getScrollY() > 80));
  }

  /* ==========================================
     9. MOBILE MENU + BACKDROP
     ========================================== */
  const toggle = document.querySelector('.nav__toggle');
  const navLinks = document.querySelector('.nav__links');
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
    navLinks.querySelectorAll('.nav__link').forEach((link) => {
      link.addEventListener('click', closeMobileMenu);
    });
  }
  backdrop?.addEventListener('click', closeMobileMenu);

  /* ==========================================
     10. WRITING ACCORDIONS + KEYBOARD
     ========================================== */
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
    // Recalculate ScrollTrigger positions after the panel expands/collapses.
    if (hasST) setTimeout(() => ScrollTrigger.refresh(), 650);
  }

  document.querySelectorAll('.writing-piece__header').forEach((header) => {
    header.addEventListener('click', () => toggleWritingPiece(header.closest('.writing-piece')));
    header.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        toggleWritingPiece(header.closest('.writing-piece'));
      }
    });
  });

  /* ==========================================
     11. AUTO-OPEN FROM HASH
     ========================================== */
  function openFromHash() {
    const hash = window.location.hash;
    if (hash) {
      const target = document.querySelector(hash);
      if (target?.classList.contains('writing-piece')) {
        setTimeout(() => {
          toggleWritingPiece(target);
          scrollToTarget(target);
        }, prefersReducedMotion ? 100 : 600);
      }
    }
  }
  openFromHash();
  window.addEventListener('hashchange', openFromHash);

  /* ==========================================
     12. ACTIVE NAV LINK
     ========================================== */
  const path = window.location.pathname.replace(/\/index\.html$/, '').replace(/\/$/, '') || '/';
  document.querySelectorAll('.nav__link').forEach((link) => {
    const href = link.getAttribute('href');
    if (href === path || (path === '' && href === '/')) {
      link.classList.add('active');
    }
  });

  /* ==========================================
     13. SMOOTH ANCHOR SCROLLING
     ========================================== */
  document.querySelectorAll('a[href^="#"]').forEach((anchor) => {
    anchor.addEventListener('click', (e) => {
      const target = document.querySelector(anchor.getAttribute('href'));
      if (target) {
        e.preventDefault();
        scrollToTarget(target);
      }
    });
  });

  /* ==========================================
     14. PAGE TRANSITIONS (fallback)
     ========================================== */
  if (!document.startViewTransition) {
    document.querySelectorAll('a').forEach((link) => {
      const href = link.getAttribute('href');
      if (!href || href.startsWith('#') || href.startsWith('http') || href.startsWith('mailto:')) return;
      link.addEventListener('click', (e) => {
        e.preventDefault();
        document.body.classList.remove('page-transition');
        document.body.classList.add('page-transition-out');
        setTimeout(() => { window.location.href = href; }, 220);
      });
    });
  }

  /* ==========================================
     15. CUSTOM CURSOR (desktop, motion on)
     ========================================== */
  const cursorDot = document.querySelector('.cursor-dot');
  const cursorRing = document.querySelector('.cursor-ring');

  if (cursorDot && cursorRing && window.matchMedia('(hover: hover) and (pointer: fine)').matches && !prefersReducedMotion) {
    let mouseX = 0, mouseY = 0, ringX = 0, ringY = 0;

    document.addEventListener('mousemove', (e) => {
      mouseX = e.clientX;
      mouseY = e.clientY;
      cursorDot.style.left = mouseX + 'px';
      cursorDot.style.top = mouseY + 'px';
    });

    function animateRing() {
      ringX += (mouseX - ringX) * 0.15;
      ringY += (mouseY - ringY) * 0.15;
      cursorRing.style.left = ringX + 'px';
      cursorRing.style.top = ringY + 'px';
      requestAnimationFrame(animateRing);
    }
    animateRing();

    const hoverTargets = 'a, button, [role="button"], input, textarea, .card, .project-card, .writing-piece__header, .btn, .nav__toggle';

    document.addEventListener('mouseover', (e) => {
      if (e.target.closest(hoverTargets)) {
        cursorDot.classList.add('hovering');
        cursorRing.classList.add('hovering');
      }
    });
    document.addEventListener('mouseout', (e) => {
      if (e.target.closest(hoverTargets)) {
        cursorDot.classList.remove('hovering');
        cursorRing.classList.remove('hovering');
      }
    });

    document.addEventListener('mouseleave', () => {
      cursorDot.style.opacity = '0';
      cursorRing.style.opacity = '0';
    });
    document.addEventListener('mouseenter', () => {
      cursorDot.style.opacity = '1';
      cursorRing.style.opacity = '1';
    });
  }

  /* ==========================================
     16. BACK TO TOP
     ========================================== */
  const backToTop = document.querySelector('.back-to-top');
  if (backToTop) {
    onScroll(() => backToTop.classList.toggle('visible', getScrollY() > 600));
    backToTop.addEventListener('click', scrollToTop);
  }

});
