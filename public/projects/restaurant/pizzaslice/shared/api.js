(function () {
  'use strict';

  function getBaseUrl() {
    if (!window.RestaurantConfig || !window.RestaurantConfig.apiBaseUrl) {
      throw new Error('Missing apiBaseUrl. Configure RestaurantConfig at runtime.');
    }

    return window.RestaurantConfig.apiBaseUrl;
  }

  async function request(path, options) {
    const baseUrl = getBaseUrl();
    const cleanPath = String(path || '').replace(/^\/+/, '');
    const url = baseUrl + '/' + cleanPath;
    const controller = new AbortController();
    const timeout = setTimeout(function () {
      controller.abort();
    }, window.RestaurantConfig.requestTimeoutMs);

    try {
      const response = await fetch(url, {
        method: 'GET',
        headers: {
          Accept: 'application/json',
          'Content-Type': 'application/json'
        },
        signal: controller.signal,
        ...options
      });

      if (!response.ok) {
        throw new Error('Request failed with status ' + response.status);
      }

      const contentType = response.headers.get('content-type') || '';
      if (contentType.includes('application/json')) {
        return response.json();
      }

      return response.text();
    } finally {
      clearTimeout(timeout);
    }
  }

  window.RestaurantApi = Object.freeze({
    request
  });
})();
