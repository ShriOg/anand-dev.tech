/**
 * ROUTER
 * GitHub Pages compatible routing system
 * Handles: hash-based navigation, history, deep links
 */

const Router = (function() {
  'use strict';

  // State
  let currentRoute = null;
  let routeHandlers = new Map();
  let beforeNavigate = null;
  let afterNavigate = null;

  /**
   * Parse current URL into route info
   */
  function parseRoute() {
    const path = window.location.pathname;
    const hash = window.location.hash.slice(1); // Remove #
    const search = window.location.search;

    // Extract page from path
    const pathParts = path.split('/').filter(Boolean);
    const fileName = pathParts[pathParts.length - 1] || 'index.html';
    const pageName = fileName.replace('.html', '');

    // Check if we're in /pages/ directory
    const isSubPage = path.includes('/pages/');

    return {
      path,
      hash,
      search,
      pageName,
      fileName,
      isSubPage,
      fullUrl: window.location.href
    };
  }

  /**
   * Get base URL for the site
   */
  function getBaseUrl() {
    const path = window.location.pathname;
    if (path.includes('/pages/')) {
      return path.substring(0, path.indexOf('/pages/'));
    }
    return path.substring(0, path.lastIndexOf('/')) || '';
  }

  /**
   * Navigate to a URL
   */
  function navigate(url, options = {}) {
    const { replace = false, silent = false, state = null } = options;

    if (beforeNavigate) {
      const shouldContinue = beforeNavigate(url, currentRoute);
      if (shouldContinue === false) return;
    }

    if (replace) {
      history.replaceState(state, '', url);
    } else {
      history.pushState(state, '', url);
    }

    if (!silent) {
      handleRouteChange();
    }
  }

  /**
   * Navigate to a project page via hash
   */
  function navigateToProject(projectId) {
    const hash = `#${projectId}`;
    navigate(hash);
  }

  /**
   * Update hash without triggering full navigation
   */
  function setHash(hash, options = {}) {
    const { replace = false } = options;
    const newUrl = hash ? `#${hash}` : window.location.pathname + window.location.search;
    
    if (replace) {
      history.replaceState(null, '', newUrl);
    } else {
      history.pushState(null, '', newUrl);
    }
  }

  /**
   * Clear hash from URL
   */
  function clearHash() {
    history.pushState(null, '', window.location.pathname + window.location.search);
  }

  /**
   * Go back in history
   */
  function back() {
    history.back();
  }

  /**
   * Handle route changes
   */
  function handleRouteChange() {
    const route = parseRoute();
    currentRoute = route;

    // Find and execute matching handler
    const handler = routeHandlers.get(route.pageName) || routeHandlers.get('*');
    
    if (handler) {
      handler(route);
    }

    if (afterNavigate) {
      afterNavigate(route);
    }

    // Dispatch custom event
    window.dispatchEvent(new CustomEvent('routechange', { detail: route }));
  }

  /**
   * Handle hash changes specifically
   */
  function handleHashChange() {
    const hash = window.location.hash.slice(1);
    
    window.dispatchEvent(new CustomEvent('hashchange-custom', { 
      detail: { 
        hash,
        route: currentRoute 
      } 
    }));
  }

  /**
   * Register a route handler
   */
  function on(pageName, handler) {
    routeHandlers.set(pageName, handler);
  }

  /**
   * Set before navigate callback
   */
  function setBeforeNavigate(callback) {
    beforeNavigate = callback;
  }

  /**
   * Set after navigate callback
   */
  function setAfterNavigate(callback) {
    afterNavigate = callback;
  }

  /**
   * Get current route
   */
  function getCurrentRoute() {
    return currentRoute || parseRoute();
  }

  /**
   * Check if URL is a project deep link
   */
  function isProjectDeepLink() {
    const route = getCurrentRoute();
    return route.hash && !route.hash.startsWith('section-');
  }

  /**
   * Build URL to a project
   */
  function buildProjectUrl(projectId, options = {}) {
    const { absolute = false } = options;
    const route = getCurrentRoute();
    
    // If on projects page, use hash
    if (route.pageName === 'projects') {
      return `#${projectId}`;
    }
    
    // Otherwise, build full URL
    const base = absolute ? window.location.origin + getBaseUrl() : '';
    return `${base}/pages/projects.html#${projectId}`;
  }

  /**
   * Initialize router
   */
  function init() {
    // Parse initial route
    currentRoute = parseRoute();

    // Listen for popstate (back/forward)
    window.addEventListener('popstate', () => {
      handleRouteChange();
    });

    // Listen for hash changes
    window.addEventListener('hashchange', handleHashChange);

    // Handle initial hash if present
    if (currentRoute.hash) {
      requestAnimationFrame(handleHashChange);
    }
  }

  /**
   * Check if current page matches
   */
  function isPage(pageName) {
    const route = getCurrentRoute();
    return route.pageName === pageName;
  }

  /**
   * Get relative path based on current location
   */
  function getRelativePath(targetPath) {
    const route = getCurrentRoute();
    
    if (route.isSubPage && !targetPath.startsWith('../')) {
      return '../' + targetPath;
    }
    
    return targetPath;
  }

  // Public API
  return {
    init,
    navigate,
    navigateToProject,
    setHash,
    clearHash,
    back,
    on,
    setBeforeNavigate,
    setAfterNavigate,
    getCurrentRoute,
    parseRoute,
    getBaseUrl,
    isProjectDeepLink,
    buildProjectUrl,
    isPage,
    getRelativePath
  };
})();

// Export for module systems
if (typeof module !== 'undefined' && module.exports) {
  module.exports = Router;
}
