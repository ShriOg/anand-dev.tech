/**
 * TRANSITIONS
 * Card-to-page zoom transition system
 * Handles: position capture, clone animation, expand/contract
 * Mobile-first with desktop enhancements
 */

const Transitions = (function() {
  'use strict';

  // State
  let activeTransition = null;
  let scrollPosition = 0;
  
  // Settings
  const config = {
    duration: {
      desktop: 450,
      mobile: 350
    },
    easing: 'cubic-bezier(0.32, 0.72, 0, 1)',
    backdropOpacity: 0.92,
    mobileBreakpoint: 768,
    reducedMotion: false
  };

  // Check for reduced motion preference
  function checkReducedMotion() {
    config.reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  }

  // Is mobile device
  function isMobile() {
    return window.innerWidth <= config.mobileBreakpoint;
  }

  // Get duration based on device
  function getDuration() {
    if (config.reducedMotion) return 0;
    return isMobile() ? config.duration.mobile : config.duration.desktop;
  }

  /**
   * Capture card position and dimensions
   */
  function captureCardRect(card) {
    const rect = card.getBoundingClientRect();
    const style = window.getComputedStyle(card);
    
    return {
      top: rect.top,
      left: rect.left,
      width: rect.width,
      height: rect.height,
      borderRadius: style.borderRadius || '16px',
      centerX: rect.left + rect.width / 2,
      centerY: rect.top + rect.height / 2
    };
  }

  /**
   * Create a clone of the card for animation
   */
  function createCardClone(card, rect) {
    const clone = card.cloneNode(true);
    clone.className = 'zoom-transition-clone';
    clone.removeAttribute('id');
    clone.removeAttribute('data-focus-id');
    
    // Remove template content from clone
    const template = clone.querySelector('template');
    if (template) template.remove();

    // Position clone exactly over original card
    Object.assign(clone.style, {
      position: 'fixed',
      top: `${rect.top}px`,
      left: `${rect.left}px`,
      width: `${rect.width}px`,
      height: `${rect.height}px`,
      margin: '0',
      zIndex: '10000',
      pointerEvents: 'none',
      willChange: 'transform, opacity, border-radius',
      transformOrigin: 'center center',
      borderRadius: rect.borderRadius
    });

    return clone;
  }

  /**
   * Create backdrop overlay
   */
  function createBackdrop() {
    let backdrop = document.getElementById('zoom-transition-backdrop');
    
    if (!backdrop) {
      backdrop = document.createElement('div');
      backdrop.id = 'zoom-transition-backdrop';
      backdrop.className = 'zoom-transition-backdrop';
      document.body.appendChild(backdrop);
    }

    return backdrop;
  }

  /**
   * Calculate target state for zoom animation
   */
  function calculateTargetState(rect) {
    const viewportWidth = window.innerWidth;
    const viewportHeight = window.innerHeight;
    const mobile = isMobile();

    // Target dimensions
    const targetWidth = mobile ? viewportWidth : Math.min(viewportWidth * 0.9, 900);
    const targetHeight = mobile ? viewportHeight : viewportHeight * 0.9;

    // Target position (centered)
    const targetLeft = (viewportWidth - targetWidth) / 2;
    const targetTop = mobile ? 0 : (viewportHeight - targetHeight) / 2;

    // Calculate scale and translation
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
      targetLeft,
      targetTop,
      borderRadius: mobile ? '0' : '24px'
    };
  }

  /**
   * Open transition - Card zooms to full page
   */
  function zoomIn(card, onComplete) {
    if (activeTransition) return;

    checkReducedMotion();
    
    // Capture original card state
    const rect = captureCardRect(card);
    
    // Store scroll position
    scrollPosition = window.scrollY;

    // Create transition elements
    const clone = createCardClone(card, rect);
    const backdrop = createBackdrop();

    // Calculate target state
    const target = calculateTargetState(rect);

    // Add clone to DOM
    document.body.appendChild(clone);

    // Hide original card
    card.style.visibility = 'hidden';

    // Trigger reflow
    clone.offsetHeight;

    // Animate backdrop
    backdrop.classList.add('zoom-transition-backdrop--active');

    // Apply transition
    const duration = getDuration();
    
    clone.style.transition = `
      transform ${duration}ms ${config.easing},
      border-radius ${duration}ms ${config.easing}
    `;

    // Animate to target
    requestAnimationFrame(() => {
      clone.style.transform = `translate(${target.translateX}px, ${target.translateY}px) scale(${target.scale})`;
      clone.style.borderRadius = target.borderRadius;
    });

    // Store active transition
    activeTransition = {
      card,
      clone,
      backdrop,
      rect,
      target,
      scrollPosition
    };

    // Complete transition
    setTimeout(() => {
      if (onComplete) onComplete();
    }, duration);
  }

  /**
   * Close transition - Page contracts back to card
   */
  function zoomOut(onComplete) {
    if (!activeTransition) {
      if (onComplete) onComplete();
      return;
    }

    const { card, clone, backdrop, rect } = activeTransition;
    const duration = getDuration();

    // Animate clone back to original position
    clone.style.transition = `
      transform ${duration}ms ${config.easing},
      border-radius ${duration}ms ${config.easing}
    `;

    requestAnimationFrame(() => {
      clone.style.transform = 'translate(0, 0) scale(1)';
      clone.style.borderRadius = rect.borderRadius;
    });

    // Fade out backdrop
    backdrop.classList.remove('zoom-transition-backdrop--active');

    // Complete transition
    setTimeout(() => {
      // Show original card
      if (card) {
        card.style.visibility = '';
      }

      // Remove clone
      if (clone && clone.parentNode) {
        clone.parentNode.removeChild(clone);
      }

      // Reset state
      activeTransition = null;

      if (onComplete) onComplete();
    }, duration);
  }

  /**
   * Instant close (no animation)
   */
  function closeInstant() {
    if (!activeTransition) return;

    const { card, clone, backdrop } = activeTransition;

    // Show original card
    if (card) {
      card.style.visibility = '';
    }

    // Remove clone
    if (clone && clone.parentNode) {
      clone.parentNode.removeChild(clone);
    }

    // Hide backdrop
    if (backdrop) {
      backdrop.classList.remove('zoom-transition-backdrop--active');
    }

    activeTransition = null;
  }

  /**
   * Check if transition is active
   */
  function isActive() {
    return activeTransition !== null;
  }

  /**
   * Get stored scroll position
   */
  function getScrollPosition() {
    return scrollPosition;
  }

  /**
   * Update config
   */
  function configure(options) {
    Object.assign(config, options);
  }

  // Initialize
  checkReducedMotion();
  window.matchMedia('(prefers-reduced-motion: reduce)').addEventListener('change', checkReducedMotion);

  // Public API
  return {
    zoomIn,
    zoomOut,
    closeInstant,
    isActive,
    getScrollPosition,
    configure,
    isMobile,
    captureCardRect
  };
})();

// Export for module systems
if (typeof module !== 'undefined' && module.exports) {
  module.exports = Transitions;
}
