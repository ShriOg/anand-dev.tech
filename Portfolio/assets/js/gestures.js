const Gestures = (function() {
  'use strict';

  const SWIPE_THRESHOLD = 80;
  const VELOCITY_THRESHOLD = 0.4;
  const TAP_THRESHOLD = 10;
  const TOUCH_TARGET_MIN = 44;

  let touchState = {
    startX: 0,
    startY: 0,
    currentX: 0,
    currentY: 0,
    startTime: 0,
    isDragging: false,
    target: null
  };

  let registeredHandlers = new Map();

  function calculateSwipe(startX, startY, endX, endY, deltaTime) {
    const deltaX = endX - startX;
    const deltaY = endY - startY;
    const velocityX = deltaX / deltaTime;
    const velocityY = deltaY / deltaTime;
    const absX = Math.abs(deltaX);
    const absY = Math.abs(deltaY);

    let direction = null;
    if (absX > absY && absX > TAP_THRESHOLD) {
      direction = deltaX > 0 ? 'right' : 'left';
    } else if (absY > absX && absY > TAP_THRESHOLD) {
      direction = deltaY > 0 ? 'down' : 'up';
    }

    return {
      direction,
      deltaX,
      deltaY,
      velocityX,
      velocityY,
      absX,
      absY,
      isSwipe: direction !== null && (
        absX > SWIPE_THRESHOLD ||
        absY > SWIPE_THRESHOLD ||
        Math.abs(velocityX) > VELOCITY_THRESHOLD ||
        Math.abs(velocityY) > VELOCITY_THRESHOLD
      ),
      isTap: absX < TAP_THRESHOLD && absY < TAP_THRESHOLD
    };
  }

  function enableDragToDismiss(element, options = {}) {
    const {
      direction = 'down',
      threshold = SWIPE_THRESHOLD,
      onDragStart = null,
      onDragMove = null,
      onDragEnd = null,
      onDismiss = null,
      resistance = 0.5
    } = options;

    let isDragging = false;
    let startY = 0;
    let startScrollTop = 0;

    function handleTouchStart(e) {

      if (direction === 'down' && element.scrollTop > 0) {
        return;
      }

      startY = e.touches[0].clientY;
      startScrollTop = element.scrollTop;
      isDragging = false;

      if (onDragStart) onDragStart();
    }

    function handleTouchMove(e) {
      const currentY = e.touches[0].clientY;
      const deltaY = currentY - startY;

      if (direction === 'down') {
        if (element.scrollTop > 0) {
          return;
        }
        if (deltaY < 0) {
          return;
        }
      }

      if (!isDragging && Math.abs(deltaY) > 10) {
        isDragging = true;
      }

      if (isDragging && deltaY > 0) {
        e.preventDefault();

        const resistedDelta = deltaY * resistance;
        element.style.transform = `translateY(${resistedDelta}px)`;
        element.style.transition = 'none';

        const progress = Math.min(resistedDelta / (threshold * 2), 1);

        if (onDragMove) {
          onDragMove({ deltaY: resistedDelta, progress });
        }
      }
    }

    function handleTouchEnd(e) {
      if (!isDragging) return;

      const currentY = e.changedTouches[0].clientY;
      const deltaY = currentY - startY;
      const resistedDelta = deltaY * resistance;

      element.style.transition = '';
      element.style.transform = '';

      if (onDragEnd) {
        onDragEnd({ deltaY: resistedDelta });
      }

      if (resistedDelta > threshold) {
        if (onDismiss) onDismiss();
      }

      isDragging = false;
    }

    element.addEventListener('touchstart', handleTouchStart, { passive: true });
    element.addEventListener('touchmove', handleTouchMove, { passive: false });
    element.addEventListener('touchend', handleTouchEnd, { passive: true });

    return function cleanup() {
      element.removeEventListener('touchstart', handleTouchStart);
      element.removeEventListener('touchmove', handleTouchMove);
      element.removeEventListener('touchend', handleTouchEnd);
    };
  }

  function enableTapOutside(element, callback) {
    function handleTap(e) {

      if (!element.contains(e.target)) {
        callback(e);
      }
    }

    document.addEventListener('click', handleTap);

    return function cleanup() {
      document.removeEventListener('click', handleTap);
    };
  }

  function onSwipe(element, direction, callback) {
    let startX, startY, startTime;

    function handleStart(e) {
      const point = e.touches ? e.touches[0] : e;
      startX = point.clientX;
      startY = point.clientY;
      startTime = Date.now();
    }

    function handleEnd(e) {
      const point = e.changedTouches ? e.changedTouches[0] : e;
      const deltaTime = Date.now() - startTime;
      const swipe = calculateSwipe(startX, startY, point.clientX, point.clientY, deltaTime);

      if (swipe.isSwipe && swipe.direction === direction) {
        callback(swipe);
      }
    }

    element.addEventListener('touchstart', handleStart, { passive: true });
    element.addEventListener('touchend', handleEnd, { passive: true });
    element.addEventListener('mousedown', handleStart);
    element.addEventListener('mouseup', handleEnd);

    const cleanup = () => {
      element.removeEventListener('touchstart', handleStart);
      element.removeEventListener('touchend', handleEnd);
      element.removeEventListener('mousedown', handleStart);
      element.removeEventListener('mouseup', handleEnd);
    };

    registeredHandlers.set(element, cleanup);
    return cleanup;
  }

  function checkTouchTarget(element) {
    const rect = element.getBoundingClientRect();
    return {
      meetsMinimum: rect.width >= TOUCH_TARGET_MIN && rect.height >= TOUCH_TARGET_MIN,
      width: rect.width,
      height: rect.height,
      recommended: TOUCH_TARGET_MIN
    };
  }

  function preventScroll() {
    document.body.style.overflow = 'hidden';
    document.body.style.touchAction = 'none';
  }

  function restoreScroll() {
    document.body.style.overflow = '';
    document.body.style.touchAction = '';
  }

  function cleanup() {
    registeredHandlers.forEach((cleanupFn) => cleanupFn());
    registeredHandlers.clear();
  }

  return {
    enableDragToDismiss,
    enableTapOutside,
    onSwipe,
    calculateSwipe,
    checkTouchTarget,
    preventScroll,
    restoreScroll,
    cleanup,
    SWIPE_THRESHOLD,
    VELOCITY_THRESHOLD,
    TOUCH_TARGET_MIN
  };
})();

if (typeof module !== 'undefined' && module.exports) {
  module.exports = Gestures;
}
