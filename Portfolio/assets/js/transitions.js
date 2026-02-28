const Transitions = (function() {
  'use strict';

  let activeTransition = null;
  let scrollPosition = 0;

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

  function checkReducedMotion() {
    config.reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  }

  function isMobile() {
    return window.innerWidth <= config.mobileBreakpoint;
  }

  function getDuration() {
    if (config.reducedMotion) return 0;
    return isMobile() ? config.duration.mobile : config.duration.desktop;
  }

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

  function createCardClone(card, rect) {
    const clone = card.cloneNode(true);
    clone.className = 'zoom-transition-clone';
    clone.removeAttribute('id');
    clone.removeAttribute('data-focus-id');

    const template = clone.querySelector('template');
    if (template) template.remove();

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

  function calculateTargetState(rect) {
    const viewportWidth = window.innerWidth;
    const viewportHeight = window.innerHeight;
    const mobile = isMobile();

    const targetWidth = mobile ? viewportWidth : Math.min(viewportWidth * 0.9, 900);
    const targetHeight = mobile ? viewportHeight : viewportHeight * 0.9;

    const targetLeft = (viewportWidth - targetWidth) / 2;
    const targetTop = mobile ? 0 : (viewportHeight - targetHeight) / 2;

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

  function zoomIn(card, onComplete) {
    if (activeTransition) return;

    checkReducedMotion();

    const rect = captureCardRect(card);

    scrollPosition = window.scrollY;

    const clone = createCardClone(card, rect);
    const backdrop = createBackdrop();

    const target = calculateTargetState(rect);

    document.body.appendChild(clone);

    card.style.visibility = 'hidden';

    clone.offsetHeight;

    backdrop.classList.add('zoom-transition-backdrop--active');

    const duration = getDuration();

    clone.style.transition = `
      transform ${duration}ms ${config.easing},
      border-radius ${duration}ms ${config.easing}
    `;

    requestAnimationFrame(() => {
      clone.style.transform = `translate(${target.translateX}px, ${target.translateY}px) scale(${target.scale})`;
      clone.style.borderRadius = target.borderRadius;
    });

    activeTransition = {
      card,
      clone,
      backdrop,
      rect,
      target,
      scrollPosition
    };

    setTimeout(() => {
      if (onComplete) onComplete();
    }, duration);
  }

  function zoomOut(onComplete) {
    if (!activeTransition) {
      if (onComplete) onComplete();
      return;
    }

    const { card, clone, backdrop, rect } = activeTransition;
    const duration = getDuration();

    clone.style.transition = `
      transform ${duration}ms ${config.easing},
      border-radius ${duration}ms ${config.easing}
    `;

    requestAnimationFrame(() => {
      clone.style.transform = 'translate(0, 0) scale(1)';
      clone.style.borderRadius = rect.borderRadius;
    });

    backdrop.classList.remove('zoom-transition-backdrop--active');

    setTimeout(() => {

      if (card) {
        card.style.visibility = '';
      }

      if (clone && clone.parentNode) {
        clone.parentNode.removeChild(clone);
      }

      activeTransition = null;

      if (onComplete) onComplete();
    }, duration);
  }

  function closeInstant() {
    if (!activeTransition) return;

    const { card, clone, backdrop } = activeTransition;

    if (card) {
      card.style.visibility = '';
    }

    if (clone && clone.parentNode) {
      clone.parentNode.removeChild(clone);
    }

    if (backdrop) {
      backdrop.classList.remove('zoom-transition-backdrop--active');
    }

    activeTransition = null;
  }

  function isActive() {
    return activeTransition !== null;
  }

  function getScrollPosition() {
    return scrollPosition;
  }

  function configure(options) {
    Object.assign(config, options);
  }

  checkReducedMotion();
  window.matchMedia('(prefers-reduced-motion: reduce)').addEventListener('change', checkReducedMotion);

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

if (typeof module !== 'undefined' && module.exports) {
  module.exports = Transitions;
}
