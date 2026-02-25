// Shared configuration — load this script before any other webos JS
(function () {
  if (window.WEBOS_CONFIG) return; // already loaded
  window.WEBOS_BASE = '/webos';
  window.API_BASE_URL = 'https://anand-os-backend.onrender.com';
  window.WEBOS_CONFIG = true;
})();
