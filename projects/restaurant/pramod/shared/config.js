(function () {
  'use strict';

  const htmlApiBase = document.documentElement.getAttribute('data-api-base-url') || '';
  const runtimeApiBase = window.__RESTAURANT_API_BASE_URL__ || localStorage.getItem('restaurant_api_base_url') || '';
  const apiBaseUrl = String(runtimeApiBase || htmlApiBase).trim().replace(/\/+$/, '');

  const config = Object.freeze({
    restaurantId: 'pramod',
    restaurantName: 'Pramod',
    apiBaseUrl,
    requestTimeoutMs: 10000,
    socketPath: '/socket.io'
  });

  window.RestaurantConfig = config;
})();
