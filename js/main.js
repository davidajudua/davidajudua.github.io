/* davidajudua.com: native scrolling, optional motion, and accessible overlays. */
document.addEventListener('DOMContentLoaded', () => {
  const root = document.documentElement;
  const motion = matchMedia('(prefers-reduced-motion: reduce)');
  root.classList.add('has-js');

  /* Load only the current orientation, and no video for reduced motion. */
  const video = document.querySelector('.bg-video');
  const setToggle = document.querySelector('.set-toggle');
  const landscape = matchMedia('(orientation: landscape)');
  let userPaused = false;
  const showPoster = () => root.classList.add('video-idle');
  const updateSetControl = () => {
    if (!setToggle) return;
    const paused = userPaused || motion.matches || !video || video.paused;
    const label = paused ? 'Play background' : 'Pause background';
    setToggle.querySelector('.set-toggle__label').textContent = label;
    setToggle.setAttribute('aria-label', label);
    setToggle.setAttribute('aria-pressed', String(paused));
    setToggle.hidden = motion.matches || !video;
  };
  const playSet = () => {
    if (!video || motion.matches || userPaused || document.hidden) return;
    video.play().catch(() => { showPoster(); updateSetControl(); });
  };
  const syncSet = () => {
    if (!video) return;
    showPoster();
    if (motion.matches) {
      video.pause();
      video.removeAttribute('src');
      video.load();
    } else {
      const source = [...video.querySelectorAll('source')].find(s => !s.media || matchMedia(s.media).matches);
      if (source && video.getAttribute('src') !== source.dataset.src) {
        video.src = source.dataset.src;
        video.load();
      }
      playSet();
    }
    updateSetControl();
  };
  if (video) {
    video.addEventListener('playing', () => {
      if (motion.matches || userPaused || document.hidden) { video.pause(); return; }
      root.classList.remove('video-idle');
      updateSetControl();
    });
    video.addEventListener('pause', updateSetControl);
    video.addEventListener('error', () => { showPoster(); updateSetControl(); });
    landscape.addEventListener('change', syncSet);
    motion.addEventListener('change', syncSet);
    document.addEventListener('visibilitychange', () => {
      if (document.hidden) video.pause();
      else playSet();
    });
    setToggle?.addEventListener('click', () => {
      userPaused = !video.paused;
      if (userPaused) video.pause();
      else playSet();
      updateSetControl();
    });
    syncSet();
  }

  /* One short reveal, leaving readable HTML in place if scripts fail. */
  if ('IntersectionObserver' in window) {
    const observer = new IntersectionObserver(entries => {
      entries.forEach(({target, isIntersecting}) => {
        if (!isIntersecting) return;
        if (!motion.matches) target.animate(
          [{opacity: 0, transform: 'translateY(16px)'}, {opacity: 1, transform: 'none'}],
          {duration: 550, easing: 'cubic-bezier(0.16, 1, 0.3, 1)'}
        );
        observer.unobserve(target);
      });
    }, {threshold: 0.06});
    document.querySelectorAll('.reveal').forEach(el => observer.observe(el));
    motion.addEventListener('change', () => {
      if (motion.matches) document.getAnimations().forEach(animation => animation.cancel());
    });
  }

  document.querySelectorAll('.btn, .pill-btn, .back-to-top, .work-modal__close').forEach(el => {
    const sweep = () => {
      if (motion.matches) return;
      el.classList.remove('sweeping');
      void el.offsetWidth;
      el.classList.add('sweeping');
    };
    el.addEventListener('pointerdown', sweep);
    el.addEventListener('mouseenter', sweep);
    el.addEventListener('focus', () => { if (el.matches(':focus-visible')) sweep(); });
  });

  const main = document.querySelector('main');
  const rail = document.querySelector('.social-rail');
  const nav = document.querySelector('.topnav');
  const toggle = document.querySelector('.topnav__toggle');
  const navLinks = document.querySelector('.topnav__links');
  const backdrop = document.querySelector('.nav__backdrop');
  const mobile = matchMedia('(max-width: 768px)');
  const backToTop = document.querySelector('.back-to-top');
  let menuOpen = false;
  let modalOpen = false;

  const syncPageAccess = () => {
    if (main) main.inert = menuOpen || modalOpen;
    if (rail) rail.inert = menuOpen || modalOpen;
    if (setToggle) setToggle.inert = menuOpen || modalOpen;
    if (backToTop) backToTop.inert = menuOpen || modalOpen;
    if (nav) nav.inert = modalOpen;
    document.body.style.overflow = menuOpen || modalOpen ? 'hidden' : '';
  };
  const setMenu = (open, restoreFocus = false) => {
    menuOpen = open;
    toggle?.classList.toggle('open', open);
    navLinks?.classList.toggle('open', open);
    backdrop?.classList.toggle('visible', open);
    toggle?.setAttribute('aria-expanded', String(open));
    toggle?.setAttribute('aria-label', open ? 'Close menu' : 'Open menu');
    const logo = nav?.querySelector('.topnav__logo');
    if (logo) logo.inert = open;
    if (navLinks) navLinks.inert = mobile.matches && !open;
    syncPageAccess();
    if (open) navLinks?.querySelector('a')?.focus();
    else if (restoreFocus) toggle?.focus();
  };
  toggle?.addEventListener('click', () => setMenu(!menuOpen, menuOpen));
  backdrop?.addEventListener('click', () => setMenu(false, true));
  mobile.addEventListener('change', () => setMenu(false));
  setMenu(false);

  const modal = document.querySelector('.work-modal');
  const modalTitle = modal?.querySelector('.work-modal__title');
  const modalBody = modal?.querySelector('.work-modal__body');
  const modalClose = modal?.querySelector('.work-modal__close');
  let lastTrigger;
  const closeModal = () => {
    if (!modalOpen) return;
    modalOpen = false;
    modal.classList.remove('open');
    modal.hidden = true;
    modalBody.replaceChildren();
    syncPageAccess();
    lastTrigger?.focus();
  };
  document.querySelectorAll('.work-card__details-btn').forEach(button => {
    button.addEventListener('click', () => {
      const card = button.closest('.work-card');
      const detail = card?.querySelector('.work-card__detail');
      if (!modal || !detail) return;
      lastTrigger = button;
      modalTitle.textContent = card.querySelector('.work-card__title').textContent;
      modalBody.replaceChildren(...detail.cloneNode(true).childNodes);
      modal.hidden = false;
      modal.classList.add('open');
      modalOpen = true;
      syncPageAccess();
      modalClose.focus();
    });
  });
  modal?.querySelectorAll('[data-modal-close]').forEach(el => el.addEventListener('click', closeModal));

  document.addEventListener('keydown', event => {
    if (event.key === 'Escape') {
      if (modalOpen) closeModal();
      else if (menuOpen) setMenu(false, true);
    }
    if (event.key !== 'Tab' || (!modalOpen && !menuOpen)) return;
    const scope = modalOpen ? modal : nav;
    const controls = [...scope.querySelectorAll('a[href], button:not([disabled])')]
      .filter(el => el.getClientRects().length && !el.closest('[inert]'));
    const first = controls[0], last = controls[controls.length - 1];
    if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last.focus(); }
    else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first.focus(); }
  });

  document.querySelectorAll('[data-scroll]').forEach(link => {
    link.addEventListener('click', event => {
      const href = link.getAttribute('href');
      if (!href?.startsWith('#')) return;
      const target = document.getElementById(href.slice(1));
      if (!target) return;
      event.preventDefault();
      setMenu(false);
      history.pushState(null, '', href);
      target.scrollIntoView({behavior: motion.matches ? 'instant' : 'smooth'});
      if (!target.hasAttribute('tabindex')) target.setAttribute('tabindex', '-1');
      target.focus({preventScroll: true});
    });
  });
  /* Old essay and timeline bookmarks still land somewhere useful. */
  const resolveLegacyHash = () => {
    if (!['#writing', '#mp1', '#mp2', '#journey'].includes(location.hash)) return;
    history.replaceState(null, '', '#about');
    document.getElementById('about')?.scrollIntoView({behavior: 'instant'});
  };
  resolveLegacyHash();
  window.addEventListener('hashchange', resolveLegacyHash);

  if (backToTop) {
    const update = () => backToTop.classList.toggle('visible', scrollY > innerHeight * 1.5);
    window.addEventListener('scroll', update, {passive: true});
    update();
    backToTop.addEventListener('click', () => {
      window.scrollTo({top: 0, behavior: motion.matches ? 'instant' : 'smooth'});
      document.querySelector('.topnav__logo')?.focus({preventScroll: true});
    });
  }
});
