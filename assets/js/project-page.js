/**
 * PROJECT PAGE ENHANCEMENTS
 * Swipe-to-close, back navigation, and smooth transitions
 * For individual project pages like ai-assistant.html
 */

(function() {
  'use strict';

  // ════════════════════════════════════════════════════════════════════════════
  // CONFIGURATION
  // ════════════════════════════════════════════════════════════════════════════

  const config = {
    swipeThreshold: 100,
    velocityThreshold: 0.5,
    resistance: 0.4,
    mobileBreakpoint: 768
  };

  // ════════════════════════════════════════════════════════════════════════════
  // UTILITIES
  // ════════════════════════════════════════════════════════════════════════════

  function isMobile() {
    return window.innerWidth <= config.mobileBreakpoint;
  }

  function isProjectPage() {
    const path = window.location.pathname;
    // Check if we're on a project detail page (not the projects list)
    return path.includes('/pages/') && 
           !path.includes('projects.html') && 
           !path.includes('lab.html') &&
           !path.includes('hire.html') &&
           !path.includes('contact.html') &&
           !path.includes('dev-os.html');
  }

  function getBackUrl() {
    // Try to get referrer first
    const referrer = document.referrer;
    if (referrer && referrer.includes(window.location.host)) {
      // Check if referrer is projects page
      if (referrer.includes('projects.html') || referrer.includes('index.html') || !referrer.includes('/pages/')) {
        return referrer;
      }
    }
    
    // Default to projects page
    const isInPages = window.location.pathname.includes('/pages/');
    return isInPages ? 'projects.html' : 'pages/projects.html';
  }

  // ════════════════════════════════════════════════════════════════════════════
  // BACK BUTTON
  // ════════════════════════════════════════════════════════════════════════════

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

    // Handle click with optional animation
    btn.addEventListener('click', (e) => {
      // Let page-zoom.js handle the transition if available
      if (typeof PageZoomTransition !== 'undefined') {
        // Navigation will happen normally, page-zoom handles animation
      }
    });

    document.body.appendChild(btn);
  }

  // ════════════════════════════════════════════════════════════════════════════
  // SWIPE INDICATOR
  // ════════════════════════════════════════════════════════════════════════════

  function createSwipeIndicator() {
    if (!isMobile()) return;
    if (document.querySelector('.swipe-indicator')) return;

    const indicator = document.createElement('div');
    indicator.className = 'swipe-indicator swipe-indicator--visible';
    document.body.appendChild(indicator);

    // Hide after a delay
    setTimeout(() => {
      indicator.classList.remove('swipe-indicator--visible');
    }, 2000);
  }

  // ════════════════════════════════════════════════════════════════════════════
  // SWIPE TO CLOSE
  // ════════════════════════════════════════════════════════════════════════════

  function initSwipeToClose() {
    if (!isMobile()) return;

    let startY = 0;
    let startTime = 0;
    let currentY = 0;
    let isDragging = false;
    let pageContent = document.querySelector('main, .page-content, body');

    function handleTouchStart(e) {
      // Only handle if at top of page
      if (window.scrollY > 10) return;
      
      // Don't interfere with interactive elements
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

      // Only track downward movement
      if (deltaY < 20) {
        isDragging = false;
        return;
      }

      isDragging = true;

      // Apply resistance and visual feedback
      const resistedDelta = deltaY * config.resistance;
      
      if (pageContent) {
        pageContent.style.transform = `translateY(${resistedDelta}px)`;
        pageContent.style.transition = 'none';
        pageContent.style.opacity = Math.max(1 - (deltaY / 500), 0.5);
      }

      // Show swipe indicator
      const indicator = document.querySelector('.swipe-indicator');
      if (indicator) {
        indicator.classList.add('swipe-indicator--visible');
      }

      // Prevent scroll if dragging
      if (resistedDelta > 10) {
        e.preventDefault();
      }
    }

    function handleTouchEnd(e) {
      if (!isDragging) return;

      const deltaY = currentY - startY;
      const deltaTime = Date.now() - startTime;
      const velocity = deltaY / deltaTime;

      // Reset styles
      if (pageContent) {
        pageContent.style.transition = 'transform 300ms ease, opacity 300ms ease';
        pageContent.style.transform = '';
        pageContent.style.opacity = '';
      }

      // Hide indicator
      const indicator = document.querySelector('.swipe-indicator');
      if (indicator) {
        indicator.classList.remove('swipe-indicator--visible');
      }

      // Check if should navigate back
      if (deltaY > config.swipeThreshold || velocity > config.velocityThreshold) {
        navigateBack();
      }

      isDragging = false;
    }

    function navigateBack() {
      const backUrl = getBackUrl();
      
      // Animate out before navigation
      if (pageContent) {
        pageContent.style.transition = 'transform 250ms ease, opacity 250ms ease';
        pageContent.style.transform = 'translateY(100px)';
        pageContent.style.opacity = '0';
      }

      setTimeout(() => {
        window.location.href = backUrl;
      }, 200);
    }

    // Bind events
    document.addEventListener('touchstart', handleTouchStart, { passive: true });
    document.addEventListener('touchmove', handleTouchMove, { passive: false });
    document.addEventListener('touchend', handleTouchEnd, { passive: true });
  }

  // ════════════════════════════════════════════════════════════════════════════
  // KEYBOARD NAVIGATION
  // ════════════════════════════════════════════════════════════════════════════

  function initKeyboardNav() {
    document.addEventListener('keydown', (e) => {
      // ESC to go back
      if (e.key === 'Escape') {
        e.preventDefault();
        window.location.href = getBackUrl();
      }
    });
  }

  // ════════════════════════════════════════════════════════════════════════════
  // PAGE ENTRY ANIMATION
  // ════════════════════════════════════════════════════════════════════════════

  function playEntryAnimation() {
    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (prefersReducedMotion) return;

    const main = document.querySelector('main, .page-content');
    if (!main) return;

    // Check if coming from zoom transition
    if (typeof PageZoomTransition !== 'undefined' && PageZoomTransition.getTransitionState()) {
      // Let page-zoom.js handle the animation
      return;
    }

    // Default fade-in animation
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

  // ════════════════════════════════════════════════════════════════════════════
  // INITIALIZE
  // ════════════════════════════════════════════════════════════════════════════

  function init() {
    if (!isProjectPage()) return;

    createBackButton();
    createSwipeIndicator();
    initSwipeToClose();
    initKeyboardNav();
    
    // Play entry animation after DOM is ready
    if (document.readyState === 'complete') {
      playEntryAnimation();
    } else {
      window.addEventListener('load', playEntryAnimation);
    }
  }

  // Run initialization
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

})();
