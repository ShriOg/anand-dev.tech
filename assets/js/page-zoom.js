/**
 * PAGE ZOOM TRANSITIONS
 * Card-to-page zoom navigation system
 * Handles: zoom animation, page navigation, state persistence
 * Mobile-first, performance optimized
 */

const PageZoomTransition = (function() {
  'use strict';

  // ════════════════════════════════════════════════════════════════════════════
  // CONFIGURATION
  // ════════════════════════════════════════════════════════════════════════════

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

  // ════════════════════════════════════════════════════════════════════════════
  // STATE
  // ════════════════════════════════════════════════════════════════════════════

  let isAnimating = false;
  let reducedMotion = false;

  // ════════════════════════════════════════════════════════════════════════════
  // UTILITIES
  // ════════════════════════════════════════════════════════════════════════════

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

  // ════════════════════════════════════════════════════════════════════════════
  // RECT CAPTURE
  // ════════════════════════════════════════════════════════════════════════════

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

  // ════════════════════════════════════════════════════════════════════════════
  // STORAGE (for page-to-page state)
  // ════════════════════════════════════════════════════════════════════════════

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
        // Expire after 10 seconds
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
      // Ignore
    }
  }

  // ════════════════════════════════════════════════════════════════════════════
  // CREATE TRANSITION ELEMENTS
  // ════════════════════════════════════════════════════════════════════════════

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
    
    // Remove interactive elements from clone
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

  // ════════════════════════════════════════════════════════════════════════════
  // TARGET CALCULATION
  // ════════════════════════════════════════════════════════════════════════════

  function calculateTargetState(rect) {
    const vw = window.innerWidth;
    const vh = window.innerHeight;
    const mobile = isMobile();

    // Full viewport on mobile, slightly padded on desktop
    const targetWidth = mobile ? vw : vw;
    const targetHeight = mobile ? vh : vh;
    const targetLeft = 0;
    const targetTop = 0;

    // Calculate scale
    const scaleX = targetWidth / rect.width;
    const scaleY = targetHeight / rect.height;
    const scale = Math.max(scaleX, scaleY);

    // Calculate translation to center then expand
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

  // ════════════════════════════════════════════════════════════════════════════
  // ZOOM IN ANIMATION (Card → Page)
  // ════════════════════════════════════════════════════════════════════════════

  function zoomToPage(card, pageUrl) {
    if (isAnimating) return;
    isAnimating = true;

    checkReducedMotion();

    const cardId = card.id || card.dataset.focusId || card.dataset.projectId;
    const rect = captureCardRect(card);
    const duration = getDuration();

    // Save state for target page
    saveTransitionState(cardId, rect, window.location.href);

    // If reduced motion, navigate immediately
    if (reducedMotion) {
      window.location.href = pageUrl;
      return;
    }

    // Create elements
    const backdrop = createBackdrop();
    const clone = createClone(card, rect);
    const target = calculateTargetState(rect);

    // Add to DOM
    document.body.appendChild(clone);

    // Hide original card
    card.style.visibility = 'hidden';

    // Lock scroll
    document.body.style.overflow = 'hidden';

    // Trigger reflow
    void clone.offsetHeight;

    // Animate backdrop
    backdrop.classList.add('page-zoom-backdrop--active');

    // Apply animation
    clone.style.transition = `
      transform ${duration}ms ${config.easing},
      border-radius ${duration}ms ${config.easing},
      opacity ${duration * 0.5}ms ${config.easing} ${duration * 0.5}ms
    `;

    requestAnimationFrame(() => {
      clone.style.transform = `translate(${target.translateX}px, ${target.translateY}px) scale(${target.scale})`;
      clone.style.borderRadius = target.borderRadius;
    });

    // Navigate after animation
    setTimeout(() => {
      // Fade out clone before navigation for smoother transition
      clone.style.opacity = '0';
      
      setTimeout(() => {
        window.location.href = pageUrl;
      }, 100);
    }, duration);
  }

  // ════════════════════════════════════════════════════════════════════════════
  // ZOOM OUT ANIMATION (Page → Card) - On back navigation
  // ════════════════════════════════════════════════════════════════════════════

  function zoomFromPage() {
    const state = getTransitionState();
    
    if (!state) return false;

    checkReducedMotion();

    if (reducedMotion) {
      clearTransitionState();
      return false;
    }

    const duration = getDuration();

    // Create backdrop (already visible, will fade out)
    const backdrop = createBackdrop();
    backdrop.classList.add('page-zoom-backdrop--active');

    // Create a page-sized element that will shrink
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

    // Calculate reverse animation values
    const rect = state.rect;
    const vw = window.innerWidth;
    const vh = window.innerHeight;

    const scaleX = rect.width / vw;
    const scaleY = rect.height / vh;
    const scale = Math.max(scaleX, scaleY);

    const translateX = rect.centerX - vw / 2;
    const translateY = rect.centerY - vh / 2;

    // Trigger reflow
    void overlay.offsetHeight;

    // Apply reverse animation
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

    // Fade out backdrop
    setTimeout(() => {
      backdrop.classList.remove('page-zoom-backdrop--active');
    }, duration * 0.5);

    // Cleanup
    setTimeout(() => {
      overlay.remove();
      backdrop.remove();
      clearTransitionState();

      // Restore scroll position
      if (typeof rect.scrollY === 'number') {
        window.scrollTo(0, rect.scrollY);
      }

      // Show the original card
      const card = document.querySelector(`#${state.cardId}, [data-focus-id="${state.cardId}"]`);
      if (card) {
        card.style.visibility = '';
      }
    }, duration + 100);

    return true;
  }

  // ════════════════════════════════════════════════════════════════════════════
  // PAGE ENTRY ANIMATION
  // ════════════════════════════════════════════════════════════════════════════

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
      
      // Trigger reflow
      void pageContent.offsetHeight;
      
      pageContent.style.transition = `
        opacity ${duration}ms ${config.easing},
        transform ${duration}ms ${config.easing}
      `;

      requestAnimationFrame(() => {
        pageContent.style.opacity = '1';
        pageContent.style.transform = 'translateY(0)';
      });

      // Cleanup
      setTimeout(() => {
        pageContent.style.transition = '';
        pageContent.style.opacity = '';
        pageContent.style.transform = '';
      }, duration + 50);
    }
  }

  // ════════════════════════════════════════════════════════════════════════════
  // INITIALIZE CARDS
  // ════════════════════════════════════════════════════════════════════════════

  function initCards() {
    const cards = document.querySelectorAll(config.cardSelector);
    
    cards.forEach(card => {
      // Get page URL from data attribute or construct from ID
      let pageUrl = card.dataset.pageUrl;
      
      if (!pageUrl) {
        const projectId = card.id || card.dataset.focusId || card.dataset.projectId;
        if (projectId) {
          // Determine base path
          const isInPages = window.location.pathname.includes('/pages/');
          const basePath = isInPages ? '' : 'pages/';
          
          // Map project IDs to page URLs
          pageUrl = `${basePath}${getPageUrlFromId(projectId)}`;
        }
      }

      if (pageUrl) {
        // Add click handler
        card.addEventListener('click', (e) => {
          // Don't intercept action button clicks
          if (e.target.closest('.action-btn, .focus-card__actions a, a[href]')) {
            return;
          }

          e.preventDefault();
          zoomToPage(card, pageUrl);
        });

        // Add keyboard handler
        card.addEventListener('keydown', (e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            if (e.target.closest('.action-btn')) return;
            e.preventDefault();
            zoomToPage(card, pageUrl);
          }
        });

        // Make focusable
        if (!card.hasAttribute('tabindex')) {
          card.setAttribute('tabindex', '0');
        }
        card.setAttribute('role', 'link');
        card.style.cursor = 'pointer';
      }
    });
  }

  function getPageUrlFromId(projectId) {
    // Map common project IDs to their page URLs (folder-based, no .html)
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

  // ════════════════════════════════════════════════════════════════════════════
  // BACK BUTTON HANDLING
  // ════════════════════════════════════════════════════════════════════════════

  function handleBackNavigation() {
    window.addEventListener('pageshow', (e) => {
      if (e.persisted) {
        // Page was restored from bfcache
        const state = getTransitionState();
        if (state) {
          zoomFromPage();
        }
      }
    });

    // For same-page back navigation
    window.addEventListener('popstate', () => {
      isAnimating = false;
    });
  }

  // ════════════════════════════════════════════════════════════════════════════
  // INITIALIZATION
  // ════════════════════════════════════════════════════════════════════════════

  function init() {
    checkReducedMotion();
    
    // Listen for motion preference changes
    window.matchMedia('(prefers-reduced-motion: reduce)')
      .addEventListener('change', checkReducedMotion);

    // Initialize cards on current page
    initCards();

    // Handle page entry animation
    if (document.readyState === 'complete') {
      playPageEntryAnimation();
    } else {
      window.addEventListener('load', playPageEntryAnimation);
    }

    // Handle back navigation
    handleBackNavigation();

    console.log('[PageZoom] Initialized');
  }

  // ════════════════════════════════════════════════════════════════════════════
  // PUBLIC API
  // ════════════════════════════════════════════════════════════════════════════

  return {
    init,
    zoomToPage,
    zoomFromPage,
    getTransitionState,
    clearTransitionState,
    config
  };
})();

// Auto-initialize
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => PageZoomTransition.init());
} else {
  // Run immediately and also ensure we re-init after a short delay
  // to catch any cards that might be rendered dynamically
  PageZoomTransition.init();
  setTimeout(() => PageZoomTransition.init(), 100);
}

// Export
if (typeof module !== 'undefined' && module.exports) {
  module.exports = PageZoomTransition;
}
