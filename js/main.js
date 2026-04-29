/* ============================================
   DAVID AJUDUA — Portfolio Scripts v5
   Apple cinematic scroll + luxe features
   ============================================ */

document.addEventListener('DOMContentLoaded', () => {

  const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

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
     2. SCROLL-TRIGGERED REVEALS (scale + fade)
     ========================================== */
  const reveals = document.querySelectorAll('.reveal');

  if (!prefersReducedMotion) {
    const revealObserver = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add('visible');
          revealObserver.unobserve(entry.target);
        }
      });
    }, { threshold: 0.06, rootMargin: '0px 0px -50px 0px' });

    reveals.forEach(el => revealObserver.observe(el));
  } else {
    reveals.forEach(el => el.classList.add('visible'));
  }

  /* ==========================================
     3. HERO SCROLL FADE — Cinematic parallax
     Hero content fades + scales as you scroll
     ========================================== */
  if (!prefersReducedMotion) {
    const hero = document.querySelector('.hero');
    if (hero) {
      const heroContent = hero.querySelectorAll('.hero__eyebrow, .hero__title, .hero__subtitle, .hero__cta, .hero__scroll-indicator');

      window.addEventListener('scroll', () => {
        const scrolled = window.scrollY;
        const heroHeight = hero.offsetHeight;

        if (scrolled < heroHeight) {
          const progress = scrolled / heroHeight; // 0 to 1
          const opacity = 1 - progress * 1.5; // fades out faster
          const scale = 1 - progress * 0.08; // subtle scale down
          const translateY = scrolled * 0.35; // parallax drift up

          heroContent.forEach(el => {
            el.style.opacity = Math.max(0, opacity);
            el.style.transform = `translateY(${translateY}px) scale(${Math.max(0.92, scale)})`;
          });
        }
      }, { passive: true });
    }
  }

  /* ==========================================
     4. NAV
     ========================================== */
  const nav = document.querySelector('.nav');
  if (nav) {
    window.addEventListener('scroll', () => {
      nav.classList.toggle('scrolled', window.scrollY > 80);
    }, { passive: true });
  }

  /* ==========================================
     5. MOBILE MENU + BACKDROP
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
  }

  function openMobileMenu() {
    toggle?.classList.add('open');
    navLinks?.classList.add('open');
    backdrop?.classList.add('visible');
    toggle?.setAttribute('aria-expanded', 'true');
    document.body.style.overflow = 'hidden';
  }

  if (toggle && navLinks) {
    toggle.addEventListener('click', () => {
      navLinks.classList.contains('open') ? closeMobileMenu() : openMobileMenu();
    });
    navLinks.querySelectorAll('.nav__link').forEach(link => {
      link.addEventListener('click', closeMobileMenu);
    });
  }
  backdrop?.addEventListener('click', closeMobileMenu);

  /* ==========================================
     6. WRITING ACCORDIONS + KEYBOARD
     ========================================== */
  function toggleWritingPiece(piece) {
    const isOpen = piece.classList.contains('open');
    const header = piece.querySelector('.writing-piece__header');

    document.querySelectorAll('.writing-piece.open').forEach(p => {
      if (p !== piece) {
        p.classList.remove('open');
        p.querySelector('.writing-piece__header')?.setAttribute('aria-expanded', 'false');
      }
    });

    piece.classList.toggle('open', !isOpen);
    header?.setAttribute('aria-expanded', String(!isOpen));
  }

  document.querySelectorAll('.writing-piece__header').forEach(header => {
    header.addEventListener('click', () => toggleWritingPiece(header.closest('.writing-piece')));
    header.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        toggleWritingPiece(header.closest('.writing-piece'));
      }
    });
  });

  /* ==========================================
     7. AUTO-OPEN FROM HASH
     ========================================== */
  function openFromHash() {
    const hash = window.location.hash;
    if (hash) {
      const target = document.querySelector(hash);
      if (target?.classList.contains('writing-piece')) {
        setTimeout(() => {
          toggleWritingPiece(target);
          target.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }, prefersReducedMotion ? 100 : 600);
      }
    }
  }
  openFromHash();
  window.addEventListener('hashchange', openFromHash);

  /* ==========================================
     8. ACTIVE NAV LINK
     ========================================== */
  const path = window.location.pathname.replace(/\/index\.html$/, '').replace(/\/$/, '') || '/';
  document.querySelectorAll('.nav__link').forEach(link => {
    const href = link.getAttribute('href');
    if (href === path || (path === '' && href === '/')) {
      link.classList.add('active');
    }
  });

  /* ==========================================
     9. SMOOTH ANCHOR SCROLLING
     ========================================== */
  document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', (e) => {
      const target = document.querySelector(anchor.getAttribute('href'));
      if (target) {
        e.preventDefault();
        target.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    });
  });

  /* ==========================================
     10. PAGE TRANSITIONS (fallback)
     ========================================== */
  if (!document.startViewTransition) {
    document.querySelectorAll('a').forEach(link => {
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
     11. CUSTOM CURSOR
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
     12. BACK TO TOP
     ========================================== */
  const backToTop = document.querySelector('.back-to-top');
  if (backToTop) {
    window.addEventListener('scroll', () => {
      backToTop.classList.toggle('visible', window.scrollY > 600);
    }, { passive: true });

    backToTop.addEventListener('click', () => {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    });
  }

});
