(function () {
  'use strict';

  async function loadMenu() {
    const menuRoot = document.getElementById('menu-root');
    if (!menuRoot) {
      return;
    }

    menuRoot.textContent = 'Loading menu...';

    try {
      const data = await window.RestaurantApi.request('menu');
      menuRoot.textContent = typeof data === 'string' ? data : JSON.stringify(data, null, 2);
    } catch (error) {
      menuRoot.textContent = 'Menu unavailable: ' + error.message;
    }
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', loadMenu);
  } else {
    loadMenu();
  }
})();
