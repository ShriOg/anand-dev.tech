const PSAuth = (function() {
  'use strict';

  const SESSION_KEY = 'ps_session_active';
  let _autoLockMinutes = 0;
  let _autoLockTimeout = null;
  let _activityTimeout = null;

  function unlock() {
    sessionStorage.setItem(SESSION_KEY, 'true');
    startActivityMonitor();
  }

  function lock() {
    sessionStorage.removeItem(SESSION_KEY);
    PSCrypto.clear();
    stopActivityMonitor();

    window.location.reload();
  }

  function isUnlocked() {
    return sessionStorage.getItem(SESSION_KEY) === 'true' && PSCrypto.isInitialized();
  }

  function setAutoLock(minutes) {
    _autoLockMinutes = minutes;
    resetAutoLockTimer();
  }

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
