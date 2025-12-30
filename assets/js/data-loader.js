/**
 * DATA LOADER
 * Fetches and caches JSON data for the portfolio system
 * Handles: projects, pages, site config
 */

const DataLoader = (function() {
  'use strict';

  // Cache for loaded data
  const cache = {
    projects: null,
    pages: null,
    siteConfig: null
  };

  // Base path detection for GitHub Pages
  const getBasePath = () => {
    const path = window.location.pathname;
    // Check if we're in /pages/ subdirectory
    if (path.includes('/pages/')) {
      return '../';
    }
    return './';
  };

  /**
   * Fetch JSON with error handling and caching
   */
  async function fetchJSON(url) {
    try {
      const response = await fetch(url);
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
      return await response.json();
    } catch (error) {
      console.error(`[DataLoader] Failed to fetch ${url}:`, error);
      return null;
    }
  }

  /**
   * Load projects data
   */
  async function loadProjects(forceRefresh = false) {
    if (cache.projects && !forceRefresh) {
      return cache.projects;
    }

    const basePath = getBasePath();
    const data = await fetchJSON(`${basePath}data/projects.json`);
    
    if (data && data.projects) {
      // Sort by order field
      data.projects.sort((a, b) => (a.order || 999) - (b.order || 999));
      cache.projects = data.projects;
      return cache.projects;
    }
    
    return [];
  }

  /**
   * Load pages configuration
   */
  async function loadPages(forceRefresh = false) {
    if (cache.pages && !forceRefresh) {
      return cache.pages;
    }

    const basePath = getBasePath();
    const data = await fetchJSON(`${basePath}data/pages.json`);
    
    if (data) {
      cache.pages = data;
      return cache.pages;
    }
    
    return null;
  }

  /**
   * Load site configuration
   */
  async function loadSiteConfig(forceRefresh = false) {
    if (cache.siteConfig && !forceRefresh) {
      return cache.siteConfig;
    }

    const basePath = getBasePath();
    const data = await fetchJSON(`${basePath}data/site-config.json`);
    
    if (data) {
      cache.siteConfig = data;
      return cache.siteConfig;
    }
    
    return null;
  }

  /**
   * Load all data in parallel
   */
  async function loadAll(forceRefresh = false) {
    const [projects, pages, siteConfig] = await Promise.all([
      loadProjects(forceRefresh),
      loadPages(forceRefresh),
      loadSiteConfig(forceRefresh)
    ]);

    return { projects, pages, siteConfig };
  }

  /**
   * Get a single project by ID
   */
  async function getProject(id) {
    const projects = await loadProjects();
    return projects.find(p => p.id === id) || null;
  }

  /**
   * Get featured projects only
   */
  async function getFeaturedProjects() {
    const projects = await loadProjects();
    return projects.filter(p => p.featured);
  }

  /**
   * Get page config by ID or path
   */
  async function getPageConfig(idOrPath) {
    const pagesData = await loadPages();
    if (!pagesData) return null;

    // Try direct page lookup
    if (pagesData.pages[idOrPath]) {
      return pagesData.pages[idOrPath];
    }

    // Try route map lookup
    if (pagesData.routeMap[idOrPath]) {
      const pageId = pagesData.routeMap[idOrPath];
      return pagesData.pages[pageId];
    }

    return null;
  }

  /**
   * Clear all cached data
   */
  function clearCache() {
    cache.projects = null;
    cache.pages = null;
    cache.siteConfig = null;
  }

  // Public API
  return {
    loadProjects,
    loadPages,
    loadSiteConfig,
    loadAll,
    getProject,
    getFeaturedProjects,
    getPageConfig,
    clearCache,
    getBasePath
  };
})();

// Export for module systems
if (typeof module !== 'undefined' && module.exports) {
  module.exports = DataLoader;
}
