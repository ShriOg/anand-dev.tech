/**
 * APP
 * Main application initialization
 * Coordinates all modules: data loading, rendering, routing, transitions
 */

const App = (function() {
  'use strict';

  // State
  let isInitialized = false;
  let currentOverlay = null;
  let focusSystem = null;

  // Mobile detection
  const isMobile = () => window.innerWidth <= 768;

  // Check if page zoom navigation is enabled (cards navigate to real pages)
  const usePageNavigation = () => {
    // If PageZoomTransition is available, use page navigation instead of overlays
    return typeof PageZoomTransition !== 'undefined';
  };

  /**
   * Initialize the application
   */
  async function init() {
    if (isInitialized) return;

    // Skip initialization on mobile - mobile.js handles it
    if (isMobile()) {
      console.log('[App] Mobile detected, deferring to mobile.js');
      isInitialized = true;
      return;
    }

    console.log('[App] Initializing...');

    // Initialize router
    Router.init();

    // Load initial data
    const { projects, siteConfig } = await DataLoader.loadAll();

    if (!projects || !siteConfig) {
      console.error('[App] Failed to load data');
      return;
    }

    // Determine current page
    const route = Router.getCurrentRoute();
    
    // Render based on page type
    await renderPage(route, projects, siteConfig);

    // Initialize interactions (only if not using page navigation)
    if (!usePageNavigation()) {
      initializeInteractions();
      handleDeepLink(route);
    }

    isInitialized = true;
    console.log('[App] Initialized');
  }

  /**
   * Render page content based on route
   */
  async function renderPage(route, projects, siteConfig) {
    const isFromPages = route.isSubPage;

    // Render project cards if on projects page or home
    if (route.pageName === 'projects') {
      await renderProjectsPage(projects, siteConfig, isFromPages);
    } else if (route.pageName === 'index' || route.pageName === '') {
      await renderHomePage(projects, siteConfig);
    }
  }

  /**
   * Render projects page
   */
  async function renderProjectsPage(projects, siteConfig, isFromPages) {
    const container = document.querySelector('.focus-cards-grid');
    
    if (container) {
      // Check if cards are already rendered statically
      const existingCards = container.querySelectorAll('.focus-card');
      
      if (existingCards.length === 0) {
        // Render dynamically from data
        Renderer.renderProjectCards(projects, container, { isFromPages });
      }
      
      // Initialize the card focus system (only if not using page navigation)
      if (!usePageNavigation()) {
        initCardFocusSystem();
      }
    }
  }

  /**
   * Render home page featured projects
   */
  async function renderHomePage(projects, siteConfig) {
    const container = document.querySelector('.featured-projects .focus-cards-grid, .featured-grid');
    
    if (container) {
      // Check if cards are already rendered statically
      const existingCards = container.querySelectorAll('.focus-card');
      
      if (existingCards.length === 0) {
        // Get featured projects only
        const featuredProjects = projects.filter(p => p.featured);
        Renderer.renderProjectCards(featuredProjects, container, { isFromPages: false });
      }
      
      // Initialize the card focus system (only if not using page navigation)
      if (!usePageNavigation()) {
        initCardFocusSystem();
      }
    }
  }

  /**
   * Initialize the card focus system with zoom transitions
   */
  function initCardFocusSystem() {
    // Use existing CardFocusSystem if available, otherwise create enhanced version
    if (window.cardFocusSystem) {
      focusSystem = window.cardFocusSystem;
    } else {
      const cards = document.querySelectorAll('.focus-card');
      if (cards.length > 0) {
        focusSystem = new EnhancedCardFocusSystem({
          cardSelector: '.focus-card',
          onOpen: handleCardOpen,
          onClose: handleCardClose
        });
      }
    }
  }

  /**
   * Handle card open event
   */
  function handleCardOpen(card, index) {
    const projectId = card.dataset.projectId || card.dataset.focusId || card.id;
    console.log('[App] Card opened:', projectId);
    
    // Update URL
    Router.setHash(projectId);
  }

  /**
   * Handle card close event
   */
  function handleCardClose(card, index) {
    console.log('[App] Card closed');
    
    // Clear URL hash
    Router.clearHash();
  }

  /**
   * Handle deep link on initial load
   */
  function handleDeepLink(route) {
    if (route.hash && focusSystem) {
      // Find card with matching ID
      const cards = document.querySelectorAll('.focus-card');
      const cardIndex = Array.from(cards).findIndex(card => {
        const id = card.dataset.projectId || card.dataset.focusId || card.id;
        return id === route.hash;
      });

      if (cardIndex !== -1) {
        // Small delay to ensure everything is ready
        setTimeout(() => {
          if (focusSystem.open) {
            focusSystem.open(cardIndex, false);
          }
        }, 100);
      }
    }
  }

  /**
   * Initialize all interactions
   */
  function initializeInteractions() {
    // Listen for hash changes
    window.addEventListener('hashchange-custom', (e) => {
      const { hash } = e.detail;
      
      if (hash && focusSystem) {
        const cards = Array.from(document.querySelectorAll('.focus-card'));
        const cardIndex = cards.findIndex(card => {
          const id = card.dataset.projectId || card.dataset.focusId || card.id;
          return id === hash;
        });

        if (cardIndex !== -1 && !focusSystem.isOpen) {
          focusSystem.open(cardIndex, false);
        }
      } else if (!hash && focusSystem && focusSystem.isOpen) {
        focusSystem.close(false);
      }
    });

    // Initialize preview canvases
    initPreviewCanvases();
  }

  /**
   * Initialize preview canvases
   */
  function initPreviewCanvases() {
    document.querySelectorAll('[data-preview]').forEach(canvas => {
      if (typeof initProjectPreview === 'function') {
        initProjectPreview(canvas, canvas.dataset.preview);
      }
    });
  }

  /**
   * Enhanced Card Focus System with zoom transitions
   */
  class EnhancedCardFocusSystem {
    constructor(options = {}) {
      this.options = {
        cardSelector: '.focus-card',
        containerSelector: '.focus-cards-grid',
        overlayId: 'focus-overlay',
        backdropId: 'focus-overlay-backdrop',
        hashPrefix: options.hashPrefix || 'project',
        onOpen: options.onOpen || null,
        onClose: options.onClose || null,
        ...options
      };

      this.cards = [];
      this.currentCardIndex = -1;
      this.isOpen = false;
      this.scrollPosition = 0;
      this.dragCleanup = null;

      this.init();
    }

    init() {
      this.cards = Array.from(document.querySelectorAll(this.options.cardSelector));
      
      if (this.cards.length === 0) return;

      this.createOverlay();
      this.bindCardEvents();
      this.bindKeyboardEvents();
    }

    createOverlay() {
      // Create backdrop
      if (!document.getElementById(this.options.backdropId)) {
        const backdrop = document.createElement('div');
        backdrop.id = this.options.backdropId;
        backdrop.className = 'focus-overlay-backdrop';
        backdrop.setAttribute('aria-hidden', 'true');
        document.body.appendChild(backdrop);
        
        backdrop.addEventListener('click', () => this.close());
      }

      // Create overlay container
      if (!document.getElementById(this.options.overlayId)) {
        const overlay = document.createElement('div');
        overlay.id = this.options.overlayId;
        overlay.className = 'focus-overlay';
        overlay.setAttribute('role', 'dialog');
        overlay.setAttribute('aria-modal', 'true');
        overlay.setAttribute('aria-hidden', 'true');
        
        overlay.innerHTML = `
          <div class="focus-overlay__panel" role="document">
            <button class="focus-overlay__close" aria-label="Close overlay" type="button">
              <span aria-hidden="true">×</span>
            </button>
            <div class="focus-overlay__content"></div>
          </div>
        `;
        
        document.body.appendChild(overlay);

        // Bind close button
        overlay.querySelector('.focus-overlay__close').addEventListener('click', () => this.close());
        
        // Bind mobile gestures
        this.bindMobileGestures(overlay.querySelector('.focus-overlay__panel'));
      }

      this.backdrop = document.getElementById(this.options.backdropId);
      this.overlay = document.getElementById(this.options.overlayId);
      this.panel = this.overlay.querySelector('.focus-overlay__panel');
      this.content = this.overlay.querySelector('.focus-overlay__content');
    }

    bindCardEvents() {
      this.cards.forEach((card, index) => {
        card.setAttribute('role', 'button');
        card.setAttribute('tabindex', '0');
        card.setAttribute('aria-expanded', 'false');
        
        card.addEventListener('click', (e) => {
          if (e.target.closest('.action-btn')) return;
          e.preventDefault();
          this.open(index);
        });

        card.addEventListener('keydown', (e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            if (e.target.closest('.action-btn')) return;
            e.preventDefault();
            this.open(index);
          }
        });
      });
    }

    bindKeyboardEvents() {
      document.addEventListener('keydown', (e) => {
        if (!this.isOpen) return;

        switch (e.key) {
          case 'Escape':
            e.preventDefault();
            this.close();
            break;
          case 'ArrowLeft':
          case 'ArrowUp':
            e.preventDefault();
            this.navigatePrev();
            break;
          case 'ArrowRight':
          case 'ArrowDown':
            e.preventDefault();
            this.navigateNext();
            break;
        }
      });
    }

    bindMobileGestures(panel) {
      if (typeof Gestures !== 'undefined') {
        this.dragCleanup = Gestures.enableDragToDismiss(panel, {
          direction: 'down',
          threshold: 80,
          onDismiss: () => this.close()
        });
      }
    }

    open(index, updateHash = true) {
      if (index < 0 || index >= this.cards.length) return;
      
      const card = this.cards[index];
      const contentTemplate = card.querySelector('.focus-card__content-template');
      
      if (!contentTemplate) {
        console.warn('Card missing content template:', card);
        return;
      }

      // Use zoom transition
      if (typeof Transitions !== 'undefined' && !Transitions.isMobile()) {
        Transitions.zoomIn(card, () => {
          this.showOverlay(card, index, contentTemplate, updateHash);
        });
      } else {
        this.showOverlay(card, index, contentTemplate, updateHash);
      }
    }

    async showOverlay(card, index, contentTemplate, updateHash) {
      // Store scroll position and lock body
      this.scrollPosition = window.scrollY;
      document.body.classList.add('focus-overlay-open');
      document.body.style.top = `-${this.scrollPosition}px`;

      // Update state
      this.currentCardIndex = index;
      this.isOpen = true;

      // Update accessibility
      this.cards.forEach((c, i) => {
        c.setAttribute('aria-expanded', i === index ? 'true' : 'false');
      });

      // Check for external content source
      const contentSrc = card.dataset.contentSrc;
      
      if (contentSrc) {
        // Show loading state from template
        this.content.innerHTML = contentTemplate.innerHTML;
        
        // Fetch external content
        try {
          const content = await this.fetchExternalContent(contentSrc);
          if (content && this.isOpen && this.currentCardIndex === index) {
            this.content.innerHTML = content;
          }
        } catch (err) {
          console.error('[App] Failed to load external content:', err);
          // Keep fallback content from template
        }
      } else {
        // Populate content from inline template
        this.content.innerHTML = contentTemplate.innerHTML;
      }

      // Show overlay
      this.backdrop.classList.add('focus-overlay-backdrop--active');
      this.overlay.classList.add('focus-overlay--active');
      this.overlay.setAttribute('aria-hidden', 'false');
      this.backdrop.setAttribute('aria-hidden', 'false');

      // Focus close button
      setTimeout(() => {
        const closeBtn = this.overlay.querySelector('.focus-overlay__close');
        closeBtn?.focus();
      }, 100);

      // Callback
      if (this.options.onOpen) {
        this.options.onOpen(card, index);
      }
    }

    /**
     * Fetch and parse external HTML content
     * @param {string} src - Path to HTML file
     * @returns {Promise<string>} Parsed content HTML
     */
    async fetchExternalContent(src) {
      // Cache for loaded content
      if (!this._contentCache) this._contentCache = new Map();
      
      // Return cached content if available
      if (this._contentCache.has(src)) {
        return this._contentCache.get(src);
      }

      const response = await fetch(src);
      if (!response.ok) {
        throw new Error(`Failed to fetch ${src}: ${response.status}`);
      }

      const html = await response.text();
      
      // Parse the HTML
      const parser = new DOMParser();
      const doc = parser.parseFromString(html, 'text/html');
      
      // Extract main content (skip nav, footer, scripts)
      const main = doc.querySelector('main');
      if (!main) {
        throw new Error('No <main> element found in external content');
      }

      // Clone and process content
      const content = main.cloneNode(true);
      
      // Remove elements that shouldn't be in overlay
      content.querySelectorAll('.back-link, .navbar, script').forEach(el => el.remove());
      
      // Prefix IDs to avoid conflicts
      content.querySelectorAll('[id]').forEach(el => {
        el.id = `overlay-${el.id}`;
      });

      // Wrap in overlay-friendly structure
      const wrapper = document.createElement('div');
      wrapper.className = 'focus-overlay__external-content';
      wrapper.innerHTML = content.innerHTML;

      const finalHTML = wrapper.outerHTML;
      
      // Cache the result
      this._contentCache.set(src, finalHTML);

      return finalHTML;
    }

    close(updateHash = true) {
      if (!this.isOpen) return;

      const card = this.cards[this.currentCardIndex];

      // Use zoom transition for close
      if (typeof Transitions !== 'undefined' && Transitions.isActive()) {
        Transitions.zoomOut(() => {
          this.hideOverlay(updateHash);
        });
      } else {
        this.hideOverlay(updateHash);
      }

      // Callback
      if (this.options.onClose) {
        this.options.onClose(card, this.currentCardIndex);
      }
    }

    hideOverlay(updateHash) {
      // Hide overlay
      this.backdrop.classList.remove('focus-overlay-backdrop--active');
      this.overlay.classList.remove('focus-overlay--active');
      this.overlay.setAttribute('aria-hidden', 'true');
      this.backdrop.setAttribute('aria-hidden', 'true');

      // Update accessibility
      this.cards.forEach(c => {
        c.setAttribute('aria-expanded', 'false');
      });

      // Restore scroll position
      document.body.classList.remove('focus-overlay-open');
      document.body.style.top = '';
      window.scrollTo(0, this.scrollPosition);

      // Return focus
      if (this.currentCardIndex >= 0 && this.cards[this.currentCardIndex]) {
        this.cards[this.currentCardIndex].focus();
      }

      // Clear content after animation
      setTimeout(() => {
        this.content.innerHTML = '';
      }, 400);

      this.isOpen = false;
    }

    navigateNext() {
      if (this.currentCardIndex < this.cards.length - 1) {
        this.open(this.currentCardIndex + 1);
      }
    }

    navigatePrev() {
      if (this.currentCardIndex > 0) {
        this.open(this.currentCardIndex - 1);
      }
    }

    destroy() {
      this.close();
      if (this.dragCleanup) this.dragCleanup();
      this.backdrop?.remove();
      this.overlay?.remove();
    }
  }

  // Public API
  return {
    init,
    EnhancedCardFocusSystem
  };
})();

// Auto-initialize when DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => App.init());
} else {
  App.init();
}

// Export for module systems
if (typeof module !== 'undefined' && module.exports) {
  module.exports = App;
}
