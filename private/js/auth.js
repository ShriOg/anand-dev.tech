/**
 * ═══════════════════════════════════════════════════════════
 * PRIVATE SPACE - AUTH MODULE
 * Session-based authentication with sessionStorage
 * Lock state persists only for current tab session
 * ═══════════════════════════════════════════════════════════
 */

const PSAuth = (function() {
  'use strict';

  const SESSION_KEY = 'ps_session_active';
  let _autoLockMinutes = 0;
  let _autoLockTimeout = null;
  let _activityTimeout = null;

  /**
   * Mark session as unlocked (sessionStorage)
   */
  function unlock() {
    sessionStorage.setItem(SESSION_KEY, 'true');
    startActivityMonitor();
  }

  /**
   * Lock the session
   */
  function lock() {
    sessionStorage.removeItem(SESSION_KEY);
    PSCrypto.clear();
    stopActivityMonitor();
    
    // Reload page to show lock screen
    window.location.reload();
  }

  /**
   * Check if currently unlocked
   */
  function isUnlocked() {
    return sessionStorage.getItem(SESSION_KEY) === 'true' && PSCrypto.isInitialized();
  }

  /**
   * Set auto-lock timeout
   */
  function setAutoLock(minutes) {
    _autoLockMinutes = minutes;
    resetAutoLockTimer();
  }

  /**
   * Reset auto-lock timer
   */
  function resetAutoLockTimer() {
    if (_autoLockTimeout) {
      clearTimeout(_autoLockTimeout);
      _autoLockTimeout = null;
    }

    if (_autoLockMinutes > 0 && sessionStorage.getItem(SESSION_KEY) === 'true') {
      _autoLockTimeout = setTimeout(() => {
        console.log('[Private Space] Auto-lock triggered');
        lock();
      }, _autoLockMinutes * 60 * 1000);
    }
  }

  /**
   * Start activity monitor
   */
  function startActivityMonitor() {
    const events = ['mousedown', 'keydown', 'touchstart', 'scroll'];
    
    const handleActivity = () => {
      if (_activityTimeout) clearTimeout(_activityTimeout);
      _activityTimeout = setTimeout(() => {
        resetAutoLockTimer();
      }, 1000);
    };

    events.forEach(event => {
      document.addEventListener(event, handleActivity, { passive: true });
    });
  }

  /**
   * Stop activity monitor
   */
  function stopActivityMonitor() {
    if (_autoLockTimeout) {
      clearTimeout(_autoLockTimeout);
      _autoLockTimeout = null;
    }
    if (_activityTimeout) {
      clearTimeout(_activityTimeout);
      _activityTimeout = null;
    }
  }

  return {
    unlock,
    lock,
    isUnlocked,
    setAutoLock,
    resetAutoLock: resetAutoLockTimer
  };
})();

if (typeof module !== 'undefined' && module.exports) {
  module.exports = PSAuth;
}
