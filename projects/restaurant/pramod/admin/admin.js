(function () {
  'use strict';

  function initAdmin() {
    const adminRoot = document.getElementById('admin-root');
    if (!adminRoot) {
      return;
    }

    try {
      const socket = window.SocketClient.connect();
      adminRoot.textContent = 'Admin connected to ' + socket.endpoint;
    } catch (error) {
      adminRoot.textContent = 'Admin offline: ' + error.message;
    }
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initAdmin);
  } else {
    initAdmin();
  }
})();
