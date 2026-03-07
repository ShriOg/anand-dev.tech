(function () {
  'use strict';

  function getSocketUrl() {
    if (!window.RestaurantConfig || !window.RestaurantConfig.apiBaseUrl) {
      throw new Error('Missing apiBaseUrl. Configure RestaurantConfig at runtime.');
    }

    return window.RestaurantConfig.apiBaseUrl;
  }

  const SocketClient = {
    connect() {
      const endpoint = getSocketUrl();

      return {
        endpoint,
        close() {}
      };
    }
  };

  window.SocketClient = SocketClient;
})();
