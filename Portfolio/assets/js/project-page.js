(function() {
  'use strict';

  const config = {
    swipeThreshold: 100,
    velocityThreshold: 0.5,
    resistance: 0.4,
    mobileBreakpoint: 768
  };

  function isMobile() {
    return window.innerWidth <= config.mobileBreakpoint;
  }

  function isProjectPage() {
    const path = window.location.pathname;

    const mainPages = ['projects', 'lab', 'hire', 'contact', 'dev-os', 'hidden'];
    const pathSegments = path.split('/').filter(Boolean);

    if (!path.includes('/pages/')) return false;

    const pagesIndex = pathSegments.indexOf('pages');
    const pageName = pathSegments[pagesIndex + 1];

    return pageName && !mainPages.includes(pageName);
  }

  function getBackUrl() {

    const referrer = document.referrer;
    if (referrer && referrer.includes(window.location.host)) {

      if (referrer.includes('/projects') || referrer.endsWith('/') || !referrer.includes('/pages/')) {
        return referrer;
      }
    }

    const isInPages = window.location.pathname.includes('/pages/');
    return isInPages ? '../projects/' : 'pages/projects/';
  }

  function createBackButton() {
    if (document.querySelector('.page-back-btn')) return;

    const btn = document.createElement('a');
    btn.className = 'page-back-btn';
    btn.href = getBackUrl();
    btn.setAttribute('aria-label', 'Go back to projects');
    btn.innerHTML = `
      <svg class="page-back-btn__icon" viewBox="0 0 24 24" aria-hidden="true">
        <polyline points="15 18 9 12 15 6"></polyline>
      </svg>
      <span class="page-back-btn__text">Back</span>
    `;

    btn.addEventListener('click', (e) => {

      if (typeof PageZoomTransition !== 'undefined') {

      }
    });

    document.body.appendChild(btn);
  }

  function createSwipeIndicator() {
    if (!isMobile()) return;
    if (document.querySelector('.swipe-indicator')) return;

    const indicator = document.createElement('div');
    indicator.className = 'swipe-indicator swipe-indicator--visible';
    document.body.appendChild(indicator);

    setTimeout(() => {
      indicator.classList.remove('swipe-indicator--visible');
    }, 2000);
  }

  function initSwipeToClose() {
    if (!isMobile()) return;

    let startY = 0;
    let startTime = 0;
    let currentY = 0;
    let isDragging = false;
    let pageContent = document.querySelector('main, .page-content, body');

    function handleTouchStart(e) {

      if (window.scrollY > 10) return;

      if (e.target.closest('a, button, input, select, textarea')) return;

      startY = e.touches[0].clientY;
      startTime = Date.now();
      currentY = startY;
      isDragging = false;
    }

    function handleTouchMove(e) {
      if (window.scrollY > 10) {
        isDragging = false;
        return;
      }

      currentY = e.touches[0].clientY;
      const deltaY = currentY - startY;

      if (deltaY < 20) {
        isDragging = false;
        return;
      }

      isDragging = true;

      const resistedDelta = deltaY * config.resistance;

      if (pageContent) {
        pageContent.style.transform = `translateY(${resistedDelta}px)`;
        pageContent.style.transition = 'none';
        pageContent.style.opacity = Math.max(1 - (deltaY / 500), 0.5);
      }

      const indicator = document.querySelector('.swipe-indicator');
      if (indicator) {
        indicator.classList.add('swipe-indicator--visible');
      }

      if (resistedDelta > 10) {
        e.preventDefault();
      }
    }

    function handleTouchEnd(e) {
      if (!isDragging) return;

      const deltaY = currentY - startY;
      const deltaTime = Date.now() - startTime;
      const velocity = deltaY / deltaTime;

      if (pageContent) {
        pageContent.style.transition = 'transform 300ms ease, opacity 300ms ease';
        pageContent.style.transform = '';
        pageContent.style.opacity = '';
      }

      const indicator = document.querySelector('.swipe-indicator');
      if (indicator) {
        indicator.classList.remove('swipe-indicator--visible');
      }

      if (deltaY > config.swipeThreshold || velocity > config.velocityThreshold) {
        navigateBack();
      }

      isDragging = false;
    }

    function navigateBack() {
      const backUrl = getBackUrl();

      if (pageContent) {
        pageContent.style.transition = 'transform 250ms ease, opacity 250ms ease';
        pageContent.style.transform = 'translateY(100px)';
        pageContent.style.opacity = '0';
      }

      setTimeout(() => {
        window.location.href = backUrl;
      }, 200);
    }

    document.addEventListener('touchstart', handleTouchStart, { passive: true });
    document.addEventListener('touchmove', handleTouchMove, { passive: false });
    document.addEventListener('touchend', handleTouchEnd, { passive: true });
  }

  function initKeyboardNav() {
    document.addEventListener('keydown', (e) => {

      if (e.key === 'Escape') {
        e.preventDefault();
        window.location.href = getBackUrl();
      }
    });
  }

  function playEntryAnimation() {
    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (prefersReducedMotion) return;

    const main = document.querySelector('main, .page-content');
    if (!main) return;

    if (typeof PageZoomTransition !== 'undefined' && PageZoomTransition.getTransitionState()) {

      return;
    }

    main.style.opacity = '0';
    main.style.transform = 'translateY(20px)';

    requestAnimationFrame(() => {
      main.style.transition = 'opacity 400ms ease, transform 400ms ease';
      main.style.opacity = '1';
      main.style.transform = 'translateY(0)';

      setTimeout(() => {
        main.style.transition = '';
        main.style.opacity = '';
        main.style.transform = '';
      }, 450);
    });
  }

  function init() {
    if (!isProjectPage()) return;

    createBackButton();
    createSwipeIndicator();
    initSwipeToClose();
    initKeyboardNav();

    if (document.readyState === 'complete') {
      playEntryAnimation();
    } else {
      window.addEventListener('load', playEntryAnimation);
    }
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

})();
