const App = (function() {
  'use strict';

  let isInitialized = false;
  let currentOverlay = null;
  let focusSystem = null;

  const isMobile = () => window.innerWidth <= 768;

  const usePageNavigation = () => {

    return typeof PageZoomTransition !== 'undefined';
  };

  async function init() {
    if (isInitialized) return;

    if (isMobile()) {
      console.log('[App] Mobile detected, deferring to mobile.js');
      isInitialized = true;
      return;
    }

    console.log('[App] Initializing...');

    Router.init();

    const { projects, siteConfig } = await DataLoader.loadAll();

    if (!projects || !siteConfig) {
      console.error('[App] Failed to load data');
      return;
    }

    const route = Router.getCurrentRoute();

    await renderPage(route, projects, siteConfig);

    if (!usePageNavigation()) {
      initializeInteractions();
      handleDeepLink(route);
    }

    isInitialized = true;
    console.log('[App] Initialized');
  }

  async function renderPage(route, projects, siteConfig) {
    const isFromPages = route.isSubPage;

    if (route.pageName === 'projects') {
      await renderProjectsPage(projects, siteConfig, isFromPages);
    } else if (route.pageName === 'index' || route.pageName === '') {
      await renderHomePage(projects, siteConfig);
    }
  }

  async function renderProjectsPage(projects, siteConfig, isFromPages) {
    const container = document.querySelector('.focus-cards-grid');

    if (container) {

      const existingCards = container.querySelectorAll('.focus-card');

      if (existingCards.length === 0) {

        Renderer.renderProjectCards(projects, container, { isFromPages });
      }

      if (!usePageNavigation()) {
        initCardFocusSystem();
      }
    }
  }

  async function renderHomePage(projects, siteConfig) {
    const container = document.querySelector('.featured-projects .focus-cards-grid, .featured-grid');

    if (container) {

      const existingCards = container.querySelectorAll('.focus-card');

      if (existingCards.length === 0) {

        const featuredProjects = projects.filter(p => p.featured);
        Renderer.renderProjectCards(featuredProjects, container, { isFromPages: false });
      }

      if (!usePageNavigation()) {
        initCardFocusSystem();
      }
    }
  }

  function initCardFocusSystem() {

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

  function handleCardOpen(card, index) {
    const projectId = card.dataset.projectId || card.dataset.focusId || card.id;
    console.log('[App] Card opened:', projectId);

    Router.setHash(projectId);
  }

  function handleCardClose(card, index) {
    console.log('[App] Card closed');

    Router.clearHash();
  }

  function handleDeepLink(route) {
    if (route.hash && focusSystem) {

      const cards = document.querySelectorAll('.focus-card');
      const cardIndex = Array.from(cards).findIndex(card => {
        const id = card.dataset.projectId || card.dataset.focusId || card.id;
        return id === route.hash;
      });

      if (cardIndex !== -1) {

        setTimeout(() => {
          if (focusSystem.open) {
            focusSystem.open(cardIndex, false);
          }
        }, 100);
      }
    }
  }

  function initializeInteractions() {

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

    initPreviewCanvases();
  }

  function initPreviewCanvases() {
    document.querySelectorAll('[data-preview]').forEach(canvas => {
      if (typeof initProjectPreview === 'function') {
        initProjectPreview(canvas, canvas.dataset.preview);
      }
    });
  }

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

      if (!document.getElementById(this.options.backdropId)) {
        const backdrop = document.createElement('div');
        backdrop.id = this.options.backdropId;
        backdrop.className = 'focus-overlay-backdrop';
        backdrop.setAttribute('aria-hidden', 'true');
        document.body.appendChild(backdrop);

        backdrop.addEventListener('click', () => this.close());
      }

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

        overlay.querySelector('.focus-overlay__close').addEventListener('click', () => this.close());

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

      if (typeof Transitions !== 'undefined' && !Transitions.isMobile()) {
        Transitions.zoomIn(card, () => {
          this.showOverlay(card, index, contentTemplate, updateHash);
        });
      } else {
        this.showOverlay(card, index, contentTemplate, updateHash);
      }
    }

    async showOverlay(card, index, contentTemplate, updateHash) {

      this.scrollPosition = window.scrollY;
      document.body.classList.add('focus-overlay-open');
      document.body.style.top = `-${this.scrollPosition}px`;

      this.currentCardIndex = index;
      this.isOpen = true;

      this.cards.forEach((c, i) => {
        c.setAttribute('aria-expanded', i === index ? 'true' : 'false');
      });

      const contentSrc = card.dataset.contentSrc;

      if (contentSrc) {

        this.content.innerHTML = contentTemplate.innerHTML;

        try {
          const content = await this.fetchExternalContent(contentSrc);
          if (content && this.isOpen && this.currentCardIndex === index) {
            this.content.innerHTML = content;
          }
        } catch (err) {
          console.error('[App] Failed to load external content:', err);

        }
      } else {

        this.content.innerHTML = contentTemplate.innerHTML;
      }

      this.backdrop.classList.add('focus-overlay-backdrop--active');
      this.overlay.classList.add('focus-overlay--active');
      this.overlay.setAttribute('aria-hidden', 'false');
      this.backdrop.setAttribute('aria-hidden', 'false');

      setTimeout(() => {
        const closeBtn = this.overlay.querySelector('.focus-overlay__close');
        closeBtn?.focus();
      }, 100);

      if (this.options.onOpen) {
        this.options.onOpen(card, index);
      }
    }

    async fetchExternalContent(src) {

      if (!this._contentCache) this._contentCache = new Map();

      if (this._contentCache.has(src)) {
        return this._contentCache.get(src);
      }

      const response = await fetch(src);
      if (!response.ok) {
        throw new Error(`Failed to fetch ${src}: ${response.status}`);
      }

      const html = await response.text();

      const parser = new DOMParser();
      const doc = parser.parseFromString(html, 'text/html');

      const main = doc.querySelector('main');
      if (!main) {
        throw new Error('No <main> element found in external content');
      }

      const content = main.cloneNode(true);

      content.querySelectorAll('.back-link, .navbar, script').forEach(el => el.remove());

      content.querySelectorAll('[id]').forEach(el => {
        el.id = `overlay-${el.id}`;
      });

      const wrapper = document.createElement('div');
      wrapper.className = 'focus-overlay__external-content';
      wrapper.innerHTML = content.innerHTML;

      const finalHTML = wrapper.outerHTML;

      this._contentCache.set(src, finalHTML);

      return finalHTML;
    }

    close(updateHash = true) {
      if (!this.isOpen) return;

      const card = this.cards[this.currentCardIndex];

      if (typeof Transitions !== 'undefined' && Transitions.isActive()) {
        Transitions.zoomOut(() => {
          this.hideOverlay(updateHash);
        });
      } else {
        this.hideOverlay(updateHash);
      }

      if (this.options.onClose) {
        this.options.onClose(card, this.currentCardIndex);
      }
    }

    hideOverlay(updateHash) {

      this.backdrop.classList.remove('focus-overlay-backdrop--active');
      this.overlay.classList.remove('focus-overlay--active');
      this.overlay.setAttribute('aria-hidden', 'true');
      this.backdrop.setAttribute('aria-hidden', 'true');

      this.cards.forEach(c => {
        c.setAttribute('aria-expanded', 'false');
      });

      document.body.classList.remove('focus-overlay-open');
      document.body.style.top = '';
      window.scrollTo(0, this.scrollPosition);

      if (this.currentCardIndex >= 0 && this.cards[this.currentCardIndex]) {
        this.cards[this.currentCardIndex].focus();
      }

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

  return {
    init,
    EnhancedCardFocusSystem
  };
})();

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => App.init());
} else {
  App.init();
}

if (typeof module !== 'undefined' && module.exports) {
  module.exports = App;
}
