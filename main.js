

document.addEventListener('DOMContentLoaded', () => {
  const EASE_BOUNCE = 'cubic-bezier(0.34, 1.56, 0.64, 1)';
  const EASE_STD = 'cubic-bezier(0.4, 0, 0.2, 1)';
  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => Array.from(r.querySelectorAll(s));
  const setStyles = (el, styles) => Object.assign(el.style, styles);

  const menuToggle = $('.menu-toggle');
  const menuClose = $('.menu-close');
  const mobileMenuOverlay = $('.mobile-menu-overlay');
  const mobileMenuCta = $('.mobile-menu-cta');
  const headerDesktop = $('.header-desktop');
  const headerMobile = $('.header-mobile');
  const forHeaders = cb => [headerDesktop, headerMobile].forEach(h => h && cb(h));



  const openMenu = () => {
    if (!mobileMenuOverlay) return;
    mobileMenuOverlay.classList.add('active');
    forHeaders(h => h.classList.add('menu-open'));
  };

  const closeMenu = () => {
    if (!mobileMenuOverlay) return;
    mobileMenuOverlay.classList.remove('active');
    forHeaders(h => h.classList.remove('menu-open'));
  };

  if (menuToggle) menuToggle.addEventListener('click', openMenu);
  if (menuClose) menuClose.addEventListener('click', closeMenu);
  $$('.mobile-nav-menu a').forEach(link => link.addEventListener('click', closeMenu));
  if (mobileMenuCta) mobileMenuCta.addEventListener('click', closeMenu);

  if (mobileMenuOverlay) {
    mobileMenuOverlay.addEventListener('click', e => {
      if (e.target === mobileMenuOverlay) closeMenu();
    });
  }

  document.addEventListener('keydown', e => {
    if (e.key === 'Escape' && mobileMenuOverlay?.classList.contains('active')) closeMenu();
  });

  $$('.faq-item').forEach(item => {
    const answer = $('.faq-answer', item);
    if (!answer) return;

    setStyles(answer, {
      maxHeight: '0px',
      overflow: 'hidden',
      opacity: '0',
      paddingTop: '0',
      paddingBottom: '0',
      transition: `max-height .4s ${EASE_STD}, opacity .3s ease`
    });

    item.addEventListener('click', () => {
      const willOpen = !item.classList.contains('active');

      $$('.faq-item.active').forEach(openItem => {
        if (openItem === item) return;
        openItem.classList.remove('active');
        const openAnswer = $('.faq-answer', openItem);
        if (!openAnswer) return;
        setStyles(openAnswer, {
          maxHeight: '0px',
          opacity: '0',
          paddingTop: '0',
          paddingBottom: '0'
        });
      });

      item.classList.toggle('active', willOpen);
      setStyles(answer, {
        maxHeight: willOpen ? `${answer.scrollHeight}px` : '0px',
        opacity: willOpen ? '1' : '0'
      });
    });
  });

  $$('.logo, .logo-mobile, .footer-logo, .footer-m-logo, .menu-logo-text, .logo-link').forEach(logo => {
    logo.style.cursor = 'pointer';
    logo.addEventListener('click', e => {
      e.preventDefault();
      const onMainPage = !$('.doc-page');
      if (onMainPage) {
        window.scrollTo({ top: 0, behavior: 'smooth' });
        closeMenu();
        return;
      }
      document.body.style.opacity = '0';
      setTimeout(() => { window.location.href = 'index.html'; }, 300);
    });
  });

  setStyles(document.body, { opacity: '0', transition: 'opacity .4s ease-out' });
  requestAnimationFrame(() => setTimeout(() => { document.body.style.opacity = '1'; }, 50));

  $$('a').forEach(a => {
    a.addEventListener('click', e => {
      const href = a.getAttribute('href');
      if (!href || href.startsWith('#') || !href.includes('.html')) return;
      e.preventDefault();
      document.body.style.opacity = '0';
      setTimeout(() => { window.location.href = a.href; }, 250);
    });
  });

  const initCardTicker = container => {
    const cards = Array.from(container.children);
    if (cards.length < 2) return;

    const gapPx = parseFloat(getComputedStyle(container).gap) || 16;
    const visibleLimit = Math.min(4, cards.length);
    const DURATION_MS = 520;
    const APPEAR_INTERVAL_MS = 800;
    const DRAIN_INTERVAL_MS = 900;
    const FULL_PAUSE_MS = 1600;
    const CYCLE_PAUSE_MS = 2000;
    const TOP_CLEARANCE_PX = 24;
    const HIDDEN_OFFSET_PX = 28;
    const hasMojs = typeof window !== 'undefined' && window.mojs && window.mojs.Tween;
    const transition = `transform ${DURATION_MS}ms ${EASE_BOUNCE}, opacity ${DURATION_MS}ms ${EASE_BOUNCE}`;
    const floatingWrap = container.closest('.floating-social-cards');

    container.classList.add('vertical-ticker-active');
    setStyles(container, {
      overflow: 'hidden',
      display: 'block',
      gap: '0',
      maskImage: 'none',
      webkitMaskImage: 'none'
    });

    const stage = document.createElement('div');
    setStyles(stage, {
      position: 'relative',
      width: '100%',
      height: '100%'
    });

    container.innerHTML = '';
    cards.forEach(card => {
      card.classList.add('ticker-card');
      setStyles(card, {
        position: 'absolute',
        left: '0',
        bottom: '0',
        transition,
        willChange: 'transform, opacity',
        transform: 'translateY(0)',
        opacity: '0'
      });
      stage.appendChild(card);
    });
    container.appendChild(stage);

    // Static emojis removed from HTML by user

    const baseCardHeight = cards[0].getBoundingClientRect().height || 72;
    const stepY = baseCardHeight + gapPx;
    container.style.height = `${baseCardHeight * visibleLimit + gapPx * (visibleLimit - 1) + TOP_CLEARANCE_PX}px`;

    const resetHiddenCard = card => {
      card.style.opacity = '0';
      card.style.zIndex = '1';
      card.style.transform = `translateY(${HIDDEN_OFFSET_PX}px)`;
    };



    let queue = cards.slice();
    const applyFillRestState = visibleCount => {
      queue.forEach((card, i) => {
        if (i < visibleCount) {
          const y = -stepY * (visibleCount - 1 - i);
          card.style.zIndex = String(200 - i);
          card.style.opacity = '1';
          card.style.transform = `translateY(${y}px)`;
        } else {
          resetHiddenCard(card);
        }
      });
    };

    const applyDrainRestState = visibleCount => {
      queue.forEach((card, i) => {
        if (i < visibleCount) {
          // Keep the draining stack anchored near the top so every card exits on the same Y lane.
          const y = -stepY * (visibleLimit - 1 - i);
          card.style.zIndex = String(200 - i);
          card.style.opacity = '1';
          card.style.transform = `translateY(${y}px)`;
        } else {
          resetHiddenCard(card);
        }
      });
    };

    let currentVisible = 0;
    applyFillRestState(currentVisible);

    let paused = false;
    container.addEventListener('mouseenter', () => { paused = true; });
    container.addEventListener('mouseleave', () => { paused = false; });

    const scheduleWhenUnpaused = fn => {
      if (paused) {
        setTimeout(() => scheduleWhenUnpaused(fn), 180);
        return;
      }
      fn();
    };

    const fillIn = () => scheduleWhenUnpaused(() => {
      if (currentVisible >= visibleLimit) {
        setTimeout(drainStep, DRAIN_INTERVAL_MS);
        return;
      }

      const entering = queue[currentVisible];
      entering.style.transition = 'none';
      entering.style.opacity = '0';
      entering.style.transform = `translateY(${HIDDEN_OFFSET_PX + 24}px)`;
      void entering.offsetHeight;
      entering.style.transition = transition;

      currentVisible += 1;
      applyFillRestState(currentVisible);

      if (currentVisible >= visibleLimit) {
        setTimeout(drainStep, FULL_PAUSE_MS);
        return;
      }

      setTimeout(fillIn, APPEAR_INTERVAL_MS);
    });

    const drainStep = () => scheduleWhenUnpaused(() => {
      if (currentVisible <= 0) {
        setTimeout(() => {
          queue = cards.slice();
          cards.forEach(card => {
            card.style.transition = 'none';
            resetHiddenCard(card);
          });
          void container.offsetHeight;
          cards.forEach(card => {
            card.style.transition = transition;
          });
          setTimeout(fillIn, APPEAR_INTERVAL_MS);
        }, CYCLE_PAUSE_MS);
        return;
      }

      queue.forEach((card, i) => {
        if (i < currentVisible) {
          // Everyone moves one step up; the current top always reaches the same exit Y.
          const y = -stepY * (visibleLimit - i);
          card.style.zIndex = String(300 - i);
          card.style.opacity = i === 0 ? '0' : '1';
          card.style.transform = `translateY(${y}px)`;
        }
      });

      setTimeout(() => {
        const top = queue.shift();
        if (!top) return;

        top.style.transition = 'none';
        resetHiddenCard(top);
        queue.push(top);
        void top.offsetHeight;
        top.style.transition = transition;

        currentVisible -= 1;
        applyDrainRestState(currentVisible);
        setTimeout(drainStep, DRAIN_INTERVAL_MS);
      }, DURATION_MS);
    });

    setTimeout(fillIn, 500);
  };

  $$('.cards-container').forEach(initCardTicker);

  if (!$('.doc-page')) {
    const revealTargets = $$([
      'section:not(.hero-section) h1',
      'section:not(.hero-section) h2',
      'h3',
      'section:not(.hero-section) p',
      '.stat-card',
      '.test-card',
      '.check-list',
      '.faq-item',
      '.cta-image-frame',
      '.familiar-img-box',
      '.step-img',
      '.desenrola-image'
    ].join(', '));

    revealTargets.forEach(el => setStyles(el, {
      opacity: '0',
      transform: 'translateY(40px)',
      transition: `opacity .8s ${EASE_BOUNCE}, transform .8s ${EASE_BOUNCE}`
    }));

    const revealObserver = new IntersectionObserver(entries => {
      entries.forEach(entry => {
        if (!entry.isIntersecting) return;
        setStyles(entry.target, { opacity: '1', transform: 'translateY(0)' });
        entry.target.classList.add('reveal-active');
        revealObserver.unobserve(entry.target);
      });
    }, { threshold: 0.1 });

    revealTargets.forEach(el => revealObserver.observe(el));

    const bannerObserver = new IntersectionObserver(entries => {
      entries.forEach(entry => {
        if (!entry.isIntersecting) return;
        setStyles(entry.target, { opacity: '1', transform: 'translateY(0) scale(1)' });
        entry.target.classList.add('reveal-active');
        bannerObserver.unobserve(entry.target);
      });
    }, { threshold: 0, rootMargin: '0px 0px -35% 0px' });

    $$('.banner-content, .hero-image-frame').forEach(el => {
      setStyles(el, {
        opacity: '0',
        transform: 'translateY(50px) scale(.98)',
        transition: `opacity 1.2s ${EASE_BOUNCE}, transform 1.2s ${EASE_BOUNCE}`
      });
      bannerObserver.observe(el);
    });

    $$('.manda-um-oi-image').forEach((el, i) => {
      el.classList.add('float-infinite', `delay-${(i % 3) + 1}`);
    });
  }

  const headerHeight = 104;
  const exitThreshold = headerHeight + 20;
  let lastScrollY = 0;
  let peakScroll = 0;
  let ticking = false;
  let resettingTop = false;

  const updateHeader = () => {
    const y = window.scrollY;

    if (y <= 10) {
      const needsSwap = headerDesktop?.classList.contains('header--scrolled') && !resettingTop;

      if (needsSwap) {
        resettingTop = true;
        forHeaders(h => h.classList.add('header--hidden'));

        setTimeout(() => {
          resettingTop = false;
          if (window.scrollY > 50) return;

          forHeaders(h => {
            h.classList.add('no-transition');
            h.classList.remove('header--scrolled', 'header--hidden');
            h.style.transform = 'translateY(-110%)';
            void h.offsetWidth;
            h.classList.remove('no-transition');
            h.style.transform = 'translateY(0)';
            setTimeout(() => { h.style.transform = ''; }, 600);
          });
          document.body.classList.remove('header-fixed-padding');
        }, 280);
      } else if (!resettingTop) {
        forHeaders(h => {
          h.classList.add('no-transition');
          h.classList.remove('header--scrolled', 'header--hidden');
          void h.offsetWidth;
          h.classList.remove('no-transition');
          h.style.transform = '';
        });
        document.body.classList.remove('header-fixed-padding');
      }
    } else if (y <= exitThreshold) {
      if (y < lastScrollY) {
        forHeaders(h => h.classList.contains('header--scrolled') && h.classList.add('header--hidden'));
      }
    } else {
      if (!headerDesktop?.classList.contains('header--scrolled')) {
        forHeaders(h => {
          h.classList.add('no-transition', 'header--scrolled', 'header--hidden');
          void h.offsetWidth;
          h.classList.remove('no-transition');
        });
        document.body.classList.add('header-fixed-padding');
      }

      if (y > lastScrollY) {
        forHeaders(h => h.classList.add('header--hidden'));
        peakScroll = y;
      } else if (peakScroll - y > 10) {
        forHeaders(h => h.classList.remove('header--hidden'));
      }
    }

    lastScrollY = y;
    ticking = false;
  };

  window.addEventListener('scroll', () => {
    if (ticking) return;
    ticking = true;
    requestAnimationFrame(updateHeader);
  }, { passive: true });
  updateHeader();

  const magneticHover = btn => {
    if (!window.matchMedia('(pointer: fine)').matches) return;
    btn.addEventListener('mousemove', e => {
      const r = btn.getBoundingClientRect();
      const dx = (e.clientX - r.left - r.width / 2) * 0.06;
      const dy = (e.clientY - r.top - r.height / 2) * 0.06;
      btn.style.setProperty('--mx', `${dx.toFixed(2)}px`);
      btn.style.setProperty('--my', `${dy.toFixed(2)}px`);
    });
    btn.addEventListener('mouseleave', () => {
      btn.style.setProperty('--mx', '0px');
      btn.style.setProperty('--my', '0px');
    });
  };

  $$('.btn, .mobile-menu-cta').forEach(magneticHover);

  const animateCounter = el => {
    const raw = el.getAttribute('data-count');
    if (!raw) return;

    const target = parseFloat(raw);
    const prefix = el.getAttribute('data-prefix') || '';
    const suffix = el.getAttribute('data-suffix') || '';
    const duration = 1600;
    const start = performance.now();

    const tick = now => {
      const progress = Math.min((now - start) / duration, 1);
      const ease = progress === 1 ? 1 : 1 - Math.pow(2, -10 * progress);
      const value = target * ease;
      el.textContent = `${prefix}${Number.isInteger(target) ? Math.round(value) : value.toFixed(1)}${suffix}`;
      if (progress < 1) return requestAnimationFrame(tick);
      el.classList.add('is-counted');
    };

    requestAnimationFrame(tick);
  };

  const counterObserver = new IntersectionObserver(entries => {
    entries.forEach(entry => {
      if (!entry.isIntersecting) return;
      animateCounter(entry.target);
      counterObserver.unobserve(entry.target);
    });
  }, { threshold: 0.5 });

  $$('[data-count]').forEach(el => counterObserver.observe(el));

  $$('.user-card:not(.ticker-card)').forEach((card, i) => {
    card.style.animationDelay = `${i * 140}ms`;
    card.classList.add('card-enter');
  });

  $$('.cards-container').forEach(initCardTicker);

  const navLinks = $$('.nav-menu a[href^="#"]');
  const sections = navLinks.map(a => $(a.getAttribute('href'))).filter(Boolean);

  const spyObserver = new IntersectionObserver(entries => {
    entries.forEach(entry => {
      if (!entry.isIntersecting) return;
      navLinks.forEach(a => a.classList.remove('nav-active'));
      navLinks.forEach(a => {
        if (a.getAttribute('href') === `#${entry.target.id}`) a.classList.add('nav-active');
      });
    });
  }, { rootMargin: '-40% 0px -50% 0px' });

  sections.forEach(section => spyObserver.observe(section));

  const heroFrame = $('.hero-image-frame');
  if (heroFrame && window.matchMedia('(pointer: fine)').matches) {
    heroFrame.addEventListener('mousemove', e => {
      const r = heroFrame.getBoundingClientRect();
      const rx = (e.clientX - r.left) / r.width - 0.5;
      const ry = (e.clientY - r.top) / r.height - 0.5;

      // Card-specific parallax or other frame effects can go here
    });

    heroFrame.addEventListener('mouseleave', () => {
      // Reset frame effects
    });
  }



  // Realistic Confetti Effect (canvas-confetti)
  const fireRealisticConfetti = (e) => {
    if (typeof confetti !== 'function') return;

    const count = 200;
    const defaults = {
      origin: {
        x: 0.5,
        y: 0.5
      },
      zIndex: 99999
    };

    function fire(particleRatio, opts) {
      confetti({
        ...defaults,
        ...opts,
        particleCount: Math.floor(count * particleRatio),
      });
    }

    fire(0.25, { spread: 100, startVelocity: 55, colors: ['#FF2CCE', '#FFD700', '#00D4FF', '#FF6B6B', '#48D4FF'] });
    fire(0.2, { spread: 100, colors: ['#FF2CCE', '#FFD700', '#00D4FF', '#FF6B6B', '#48D4FF'] });
    fire(0.35, { spread: 100, decay: 0.91, scalar: 0.8, colors: ['#FF2CCE', '#FFD700', '#00D4FF', '#FF6B6B', '#48D4FF'] });
    fire(0.1, { spread: 120, startVelocity: 25, decay: 0.92, scalar: 1.2, colors: ['#FF2CCE', '#FFD700', '#00D4FF', '#FF6B6B', '#48D4FF'] });
    fire(0.1, { spread: 120, startVelocity: 45, colors: ['#FF2CCE', '#FFD700', '#00D4FF', '#FF6B6B', '#48D4FF'] });
  };

  const handleWhatsAppCTA = (e, url) => {
    const overlay = $('#whatsappTransition');
    if (!overlay) {
      window.open(url, '_blank');
      return;
    }

    e.preventDefault();
    e.stopPropagation();

    const logoImg = overlay.querySelector('.whatsapp-transition-logo img');
    const circle = overlay.querySelector('.whatsapp-transition-circle');

    if (logoImg) {
      logoImg.style.animation = 'none';
      logoImg.offsetHeight;
      logoImg.style.animation = 'transitionLogoGrow 1.2s cubic-bezier(0.22, 1, 0.36, 1) forwards';
    }
    if (circle) {
      circle.style.animation = 'none';
      circle.offsetHeight;
      circle.style.animation = 'transitionCircleExpand 1.2s cubic-bezier(0.22, 1, 0.36, 1) forwards';
    }

    overlay.classList.add('active');
    document.body.style.overflow = 'hidden';

    fireRealisticConfetti(e);

    setTimeout(() => {
      overlay.classList.add('fade-out');
    }, 1500);

    setTimeout(() => {
      overlay.classList.remove('active', 'fade-out');
      document.body.style.overflow = '';
      window.open(url, '_blank');
    }, 2200);
  };

  $$('.btn-whatsapp').forEach(btn => {
    btn.addEventListener('click', function (e) {
      const url = this.getAttribute('data-whatsapp') || 'https://wa.me/5551992754591';
      handleWhatsAppCTA(e, url);
    });
  });

  $$('a[href*="wa.me"], a[href*="k.kwai.com"], a[href*="kwai-video.com"]').forEach(a => {
    a.addEventListener('click', function (e) {
      handleWhatsAppCTA(e, this.href);
    });
  });

  $$('img').forEach(img => {
    img.addEventListener('contextmenu', e => e.preventDefault());
    img.addEventListener('dragstart', e => e.preventDefault());
  });

  const badge = $('.badge-yellow');
  if (badge) badge.classList.add('badge-pulse');

  $$('a[href^="#"]').forEach(a => {
    a.addEventListener('click', e => {
      const id = a.getAttribute('href');
      if (!id || id === '#') return;
      const target = $(id);
      if (!target) return;
      e.preventDefault();
      target.scrollIntoView({ behavior: 'smooth', block: 'start' });
    });
  });
});
