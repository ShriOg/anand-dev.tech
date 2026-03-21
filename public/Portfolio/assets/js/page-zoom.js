const PageZoomTransition = (function() {
  'use strict';

  const config = {
    duration: {
      desktop: 450,
      mobile: 350
    },
    easing: 'cubic-bezier(0.32, 0.72, 0, 1)',
    backdropOpacity: 0.95,
    mobileBreakpoint: 768,
    storageKey: 'pageZoomTransition',
    cardSelector: '.focus-card',
    pageUrlAttribute: 'data-page-url',
    projectIdAttribute: 'data-focus-id'
  };

  let isAnimating = false;
  let reducedMotion = false;

  function isMobile() {
    return window.innerWidth <= config.mobileBreakpoint;
  }

  function checkReducedMotion() {
    reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  }

  function getDuration() {
    if (reducedMotion) return 0;
    return isMobile() ? config.duration.mobile : config.duration.desktop;
  }

  function getScrollPosition() {
    return window.scrollY || document.documentElement.scrollTop;
  }

  function captureCardRect(card) {
    const rect = card.getBoundingClientRect();
    const style = window.getComputedStyle(card);

    return {
      top: rect.top,
      left: rect.left,
      width: rect.width,
      height: rect.height,
      bottom: rect.bottom,
      right: rect.right,
      borderRadius: style.borderRadius || '16px',
      centerX: rect.left + rect.width / 2,
      centerY: rect.top + rect.height / 2,
      scrollY: getScrollPosition()
    };
  }

  function saveTransitionState(cardId, rect, sourceUrl) {
    const state = {
      cardId,
      rect,
      sourceUrl,
      timestamp: Date.now()
    };

    try {
      sessionStorage.setItem(config.storageKey, JSON.stringify(state));
    } catch (e) {
      console.warn('[PageZoom] Could not save state:', e);
    }
  }

  function getTransitionState() {
    try {
      const data = sessionStorage.getItem(config.storageKey);
      if (data) {
        const state = JSON.parse(data);

        if (Date.now() - state.timestamp < 10000) {
          return state;
        }
      }
    } catch (e) {
      console.warn('[PageZoom] Could not read state:', e);
    }
    return null;
  }

  function clearTransitionState() {
    try {
      sessionStorage.removeItem(config.storageKey);
    } catch (e) {

    }
  }

  function createBackdrop() {
    let backdrop = document.getElementById('page-zoom-backdrop');

    if (!backdrop) {
      backdrop = document.createElement('div');
      backdrop.id = 'page-zoom-backdrop';
      backdrop.className = 'page-zoom-backdrop';
      document.body.appendChild(backdrop);
    }

    return backdrop;
  }

  function createClone(card, rect) {
    const clone = card.cloneNode(true);
    clone.className = 'page-zoom-clone';
    clone.removeAttribute('id');
    clone.removeAttribute('tabindex');
    clone.removeAttribute('role');

    clone.querySelectorAll('a, button, template').forEach(el => el.remove());

    Object.assign(clone.style, {
      position: 'fixed',
      top: `${rect.top}px`,
      left: `${rect.left}px`,
      width: `${rect.width}px`,
      height: `${rect.height}px`,
      margin: '0',
      padding: '0',
      zIndex: '10001',
      pointerEvents: 'none',
      willChange: 'transform, opacity, border-radius',
      transformOrigin: 'center center',
      borderRadius: rect.borderRadius,
      overflow: 'hidden',
      boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)'
    });

    return clone;
  }

  function calculateTargetState(rect) {
    const vw = window.innerWidth;
    const vh = window.innerHeight;
    const mobile = isMobile();

    const targetWidth = mobile ? vw : vw;
    const targetHeight = mobile ? vh : vh;
    const targetLeft = 0;
    const targetTop = 0;

    const scaleX = targetWidth / rect.width;
    const scaleY = targetHeight / rect.height;
    const scale = Math.max(scaleX, scaleY);

    const translateX = targetLeft + targetWidth / 2 - rect.centerX;
    const translateY = targetTop + targetHeight / 2 - rect.centerY;

    return {
      translateX,
      translateY,
      scale,
      targetWidth,
      targetHeight,
      borderRadius: '0px'
    };
  }

  function zoomToPage(card, pageUrl) {
    if (isAnimating) return;
    isAnimating = true;

    checkReducedMotion();

    const cardId = card.id || card.dataset.focusId || card.dataset.projectId;
    const rect = captureCardRect(card);
    const duration = getDuration();

    saveTransitionState(cardId, rect, window.location.href);

    if (reducedMotion) {
      window.location.href = pageUrl;
      return;
    }

    const backdrop = createBackdrop();
    const clone = createClone(card, rect);
    const target = calculateTargetState(rect);

    document.body.appendChild(clone);

    card.style.visibility = 'hidden';

    document.body.style.overflow = 'hidden';

    void clone.offsetHeight;

    backdrop.classList.add('page-zoom-backdrop--active');

    clone.style.transition = `
      transform ${duration}ms ${config.easing},
      border-radius ${duration}ms ${config.easing},
      opacity ${duration * 0.5}ms ${config.easing} ${duration * 0.5}ms
    `;

    requestAnimationFrame(() => {
      clone.style.transform = `translate(${target.translateX}px, ${target.translateY}px) scale(${target.scale})`;
      clone.style.borderRadius = target.borderRadius;
    });

    setTimeout(() => {

      clone.style.opacity = '0';

      setTimeout(() => {
        window.location.href = pageUrl;
      }, 100);
    }, duration);
  }

  function zoomFromPage() {
    const state = getTransitionState();

    if (!state) return false;

    checkReducedMotion();

    if (reducedMotion) {
      clearTransitionState();
      return false;
    }

    const duration = getDuration();

    const backdrop = createBackdrop();
    backdrop.classList.add('page-zoom-backdrop--active');

    const overlay = document.createElement('div');
    overlay.className = 'page-zoom-reverse-overlay';
    overlay.style.cssText = `
      position: fixed;
      inset: 0;
      background: var(--bg-primary, #0a0a0b);
      z-index: 10001;
      will-change: transform, opacity, border-radius;
      transform-origin: center center;
    `;
    document.body.appendChild(overlay);

    const rect = state.rect;
    const vw = window.innerWidth;
    const vh = window.innerHeight;

    const scaleX = rect.width / vw;
    const scaleY = rect.height / vh;
    const scale = Math.max(scaleX, scaleY);

    const translateX = rect.centerX - vw / 2;
    const translateY = rect.centerY - vh / 2;

    void overlay.offsetHeight;

    overlay.style.transition = `
      transform ${duration}ms ${config.easing},
      border-radius ${duration}ms ${config.easing},
      opacity ${duration * 0.3}ms ${config.easing} ${duration * 0.7}ms
    `;

    requestAnimationFrame(() => {
      overlay.style.transform = `translate(${translateX}px, ${translateY}px) scale(${scale})`;
      overlay.style.borderRadius = rect.borderRadius;
      overlay.style.opacity = '0';
    });

    setTimeout(() => {
      backdrop.classList.remove('page-zoom-backdrop--active');
    }, duration * 0.5);

    setTimeout(() => {
      overlay.remove();
      backdrop.remove();
      clearTransitionState();

      if (typeof rect.scrollY === 'number') {
        window.scrollTo(0, rect.scrollY);
      }

      const card = document.querySelector(`#${state.cardId}, [data-focus-id="${state.cardId}"]`);
      if (card) {
        card.style.visibility = '';
      }
    }, duration + 100);

    return true;
  }

  function playPageEntryAnimation() {
    const state = getTransitionState();

    if (!state) return;

    checkReducedMotion();
    clearTransitionState();

    if (reducedMotion) return;

    const duration = getDuration();
    const pageContent = document.querySelector('main, .page-content, body');

    if (pageContent) {
      pageContent.style.opacity = '0';
      pageContent.style.transform = 'translateY(20px)';

      void pageContent.offsetHeight;

      pageContent.style.transition = `
        opacity ${duration}ms ${config.easing},
        transform ${duration}ms ${config.easing}
      `;

      requestAnimationFrame(() => {
        pageContent.style.opacity = '1';
        pageContent.style.transform = 'translateY(0)';
      });

      setTimeout(() => {
        pageContent.style.transition = '';
        pageContent.style.opacity = '';
        pageContent.style.transform = '';
      }, duration + 50);
    }
  }

  function initCards() {
    const cards = document.querySelectorAll(config.cardSelector);

    cards.forEach(card => {

      let pageUrl = card.dataset.pageUrl;

      if (!pageUrl) {
        const projectId = card.id || card.dataset.focusId || card.dataset.projectId;
        if (projectId) {

          const isInPages = window.location.pathname.includes('/pages/');
          const basePath = isInPages ? '' : 'pages/';

          pageUrl = `${basePath}${getPageUrlFromId(projectId)}`;
        }
      }

      if (pageUrl) {

        card.addEventListener('click', (e) => {

          if (e.target.closest('.action-btn, .focus-card__actions a, a[href]')) {
            return;
          }

          e.preventDefault();
          zoomToPage(card, pageUrl);
        });

        card.addEventListener('keydown', (e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            if (e.target.closest('.action-btn')) return;
            e.preventDefault();
            zoomToPage(card, pageUrl);
          }
        });

        if (!card.hasAttribute('tabindex')) {
          card.setAttribute('tabindex', '0');
        }
        card.setAttribute('role', 'link');
        card.style.cursor = 'pointer';
      }
    });
  }

  function getPageUrlFromId(projectId) {

    const pageMap = {
      'ai-desktop-assistant': 'ai-assistant/',
      'ai-assistant': 'ai-assistant/',
      'particle-system-gestures': 'particle-system-gestures/',
      'particle-system': 'particle-system-gestures/',
      'grades': 'grades/',
      'case-study': 'case-study/'
    };

    return pageMap[projectId] || `${projectId}/`;
  }

  function handleBackNavigation() {
    window.addEventListener('pageshow', (e) => {
      if (e.persisted) {

        const state = getTransitionState();
        if (state) {
          zoomFromPage();
        }
      }
    });

    window.addEventListener('popstate', () => {
      isAnimating = false;
    });
  }

  function init() {
    checkReducedMotion();

    window.matchMedia('(prefers-reduced-motion: reduce)')
      .addEventListener('change', checkReducedMotion);

    initCards();

    if (document.readyState === 'complete') {
      playPageEntryAnimation();
    } else {
      window.addEventListener('load', playPageEntryAnimation);
    }

    handleBackNavigation();

    console.log('[PageZoom] Initialized');
  }

  return {
    init,
    zoomToPage,
    zoomFromPage,
    getTransitionState,
    clearTransitionState,
    config
  };
})();

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => PageZoomTransition.init());
} else {

  PageZoomTransition.init();
  setTimeout(() => PageZoomTransition.init(), 100);
}

if (typeof module !== 'undefined' && module.exports) {
  module.exports = PageZoomTransition;
}
