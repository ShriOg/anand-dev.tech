/**
 * ANAND DEV OS — Mobile-Only JavaScript
 * Touch interactions, gestures, modals, scroll detection
 * No frameworks, vanilla JS only
 */

(function() {
  'use strict';

  // ════════════════════════════════════════════════════════════════════════════
  // MOBILE DETECTION
  // ════════════════════════════════════════════════════════════════════════════

  const isMobile = () => window.innerWidth <= 768;
  const isTouchDevice = () => 'ontouchstart' in window || navigator.maxTouchPoints > 0;

  if (!isMobile()) return;

  // ════════════════════════════════════════════════════════════════════════════
  // MOBILE TOP BAR — Auto-hide on Scroll
  // ════════════════════════════════════════════════════════════════════════════

  const MobileTopBar = {
    nav: null,
    lastScrollY: 0,
    ticking: false,
    threshold: 10,
    hideAfter: 100,

    init() {
      this.nav = document.querySelector('.nav');
      if (!this.nav) return;

      window.addEventListener('scroll', this.onScroll.bind(this), { passive: true });
    },

    onScroll() {
      if (this.ticking) return;
      
      requestAnimationFrame(() => {
        const currentScrollY = window.scrollY;
        const delta = currentScrollY - this.lastScrollY;

        if (currentScrollY > this.hideAfter) {
          if (delta > this.threshold) {
            this.nav.classList.add('nav--hidden');
          } else if (delta < -this.threshold) {
            this.nav.classList.remove('nav--hidden');
          }
        } else {
          this.nav.classList.remove('nav--hidden');
        }

        this.lastScrollY = currentScrollY;
        this.ticking = false;
      });

      this.ticking = true;
    }
  };

  // ════════════════════════════════════════════════════════════════════════════
  // MOBILE BOTTOM SHEET NAVIGATION
  // ════════════════════════════════════════════════════════════════════════════

  const MobileBottomSheet = {
    sheet: null,
    backdrop: null,
    isOpen: false,
    touchStartY: 0,
    touchCurrentY: 0,
    isDragging: false,

    init() {
      this.createElements();
      this.bindEvents();
    },

    createElements() {
      // Create backdrop
      this.backdrop = document.createElement('div');
      this.backdrop.className = 'mobile-bottom-sheet__backdrop';
      document.body.appendChild(this.backdrop);

      // Create sheet
      this.sheet = document.createElement('div');
      this.sheet.className = 'mobile-bottom-sheet';
      this.sheet.innerHTML = `
        <div class="mobile-bottom-sheet__handle"></div>
        <div class="mobile-bottom-sheet__content">
          <nav class="mobile-bottom-sheet__nav">
            ${this.getNavLinks()}
          </nav>
        </div>
      `;
      document.body.appendChild(this.sheet);
    },

    getNavLinks() {
      const currentPage = window.location.pathname.split('/').pop() || 'index.html';
      const links = [
        { href: 'index.html', label: 'Home', icon: this.getIcon('home') },
        { href: 'projects.html', label: 'Projects', icon: this.getIcon('projects') },
        { href: 'lab.html', label: 'Lab', icon: this.getIcon('lab') },
        { href: 'dev-os.html', label: 'Dev OS', icon: this.getIcon('devos') },
        { href: 'hire.html', label: 'Hire Me', icon: this.getIcon('contact') }
      ];

      return links.map(link => `
        <a href="${link.href}" class="mobile-bottom-sheet__link ${link.href === currentPage ? 'mobile-bottom-sheet__link--active' : ''}">
          <span class="mobile-bottom-sheet__link-icon">${link.icon}</span>
          ${link.label}
        </a>
      `).join('');
    },

    getIcon(type) {
      const icons = {
        home: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>',
        projects: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="2" y="3" width="20" height="14" rx="2" ry="2"/><line x1="8" y1="21" x2="16" y2="21"/><line x1="12" y1="17" x2="12" y2="21"/></svg>',
        lab: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M9 3h6v5.586l4.707 4.707A1 1 0 0 1 19 15.414V21a1 1 0 0 1-1 1H6a1 1 0 0 1-1-1v-5.586a1 1 0 0 1 .293-.707L10 10.586V3"/><path d="M9 3h6"/></svg>',
        devos: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="16 18 22 12 16 6"/><polyline points="8 6 2 12 8 18"/></svg>',
        contact: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><polyline points="22,6 12,13 2,6"/></svg>'
      };
      return icons[type] || '';
    },

    bindEvents() {
      // Toggle button
      const toggle = document.querySelector('.nav__toggle');
      if (toggle) {
        toggle.addEventListener('click', () => this.toggle());
      }

      // Backdrop click
      this.backdrop.addEventListener('click', () => this.close());

      // Handle drag
      const handle = this.sheet.querySelector('.mobile-bottom-sheet__handle');
      handle.addEventListener('touchstart', this.onTouchStart.bind(this), { passive: true });
      handle.addEventListener('touchmove', this.onTouchMove.bind(this), { passive: false });
      handle.addEventListener('touchend', this.onTouchEnd.bind(this), { passive: true });

      // Link clicks
      this.sheet.querySelectorAll('.mobile-bottom-sheet__link').forEach(link => {
        link.addEventListener('click', () => {
          setTimeout(() => this.close(), 150);
        });
      });
    },

    onTouchStart(e) {
      this.touchStartY = e.touches[0].clientY;
      this.touchCurrentY = this.touchStartY;
      this.isDragging = false;
      this.sheet.style.transition = 'none';
    },

    onTouchMove(e) {
      this.touchCurrentY = e.touches[0].clientY;
      const deltaY = this.touchCurrentY - this.touchStartY;

      if (deltaY > 10) {
        this.isDragging = true;
        e.preventDefault();
        const translateY = Math.min(deltaY * 0.5, 200);
        this.sheet.style.transform = `translateY(${translateY}px)`;
      }
    },

    onTouchEnd() {
      this.sheet.style.transition = '';
      this.sheet.style.transform = '';

      if (this.isDragging) {
        const deltaY = this.touchCurrentY - this.touchStartY;
        if (deltaY > 80) {
          this.close();
        }
      }

      this.isDragging = false;
    },

    toggle() {
      this.isOpen ? this.close() : this.open();
    },

    open() {
      this.isOpen = true;
      this.sheet.classList.add('mobile-bottom-sheet--open');
      this.backdrop.classList.add('mobile-bottom-sheet__backdrop--visible');
      document.body.classList.add('mobile-menu-open');
      
      const toggle = document.querySelector('.nav__toggle');
      toggle?.classList.add('nav__toggle--active');
    },

    close() {
      this.isOpen = false;
      this.sheet.classList.remove('mobile-bottom-sheet--open');
      this.backdrop.classList.remove('mobile-bottom-sheet__backdrop--visible');
      document.body.classList.remove('mobile-menu-open');
      
      const toggle = document.querySelector('.nav__toggle');
      toggle?.classList.remove('nav__toggle--active');
    }
  };

  // ════════════════════════════════════════════════════════════════════════════
  // MOBILE PROJECT MODAL — Fullscreen Expansion
  // ════════════════════════════════════════════════════════════════════════════

  const MobileProjectModal = {
    modal: null,
    currentCard: null,
    isOpen: false,
    scrollPosition: 0,
    touchStartY: 0,
    touchCurrentY: 0,
    isDragging: false,

    init() {
      this.createModal();
      this.bindEvents();
      this.checkInitialHash();
    },

    createModal() {
      this.modal = document.createElement('div');
      this.modal.className = 'mobile-project-modal';
      this.modal.innerHTML = `
        <div class="mobile-project-modal__header">
          <div class="mobile-project-modal__handle"></div>
          <span class="mobile-project-modal__title"></span>
          <button class="mobile-project-modal__close" aria-label="Close">
            <span aria-hidden="true">×</span>
          </button>
        </div>
        <div class="mobile-project-modal__content"></div>
      `;
      document.body.appendChild(this.modal);
    },

    bindEvents() {
      // Card clicks
      document.querySelectorAll('.focus-card').forEach(card => {
        card.addEventListener('click', (e) => {
          if (e.target.closest('.action-btn')) return;
          e.preventDefault();
          this.open(card);
        });
      });

      // Close button
      this.modal.querySelector('.mobile-project-modal__close').addEventListener('click', () => {
        this.close();
      });

      // Swipe to close
      const header = this.modal.querySelector('.mobile-project-modal__header');
      header.addEventListener('touchstart', this.onTouchStart.bind(this), { passive: true });
      header.addEventListener('touchmove', this.onTouchMove.bind(this), { passive: false });
      header.addEventListener('touchend', this.onTouchEnd.bind(this), { passive: true });

      // Hardware back button
      window.addEventListener('popstate', () => {
        if (this.isOpen) {
          this.close(false);
        }
      });
    },

    checkInitialHash() {
      const hash = window.location.hash.slice(1);
      if (hash) {
        const card = document.querySelector(`[data-focus-id="${hash}"], #${hash}`);
        if (card && card.classList.contains('focus-card')) {
          requestAnimationFrame(() => this.open(card, false));
        }
      }
    },

    onTouchStart(e) {
      if (this.modal.scrollTop > 0) return;
      
      this.touchStartY = e.touches[0].clientY;
      this.touchCurrentY = this.touchStartY;
      this.isDragging = false;
      this.modal.style.transition = 'none';
    },

    onTouchMove(e) {
      if (this.modal.scrollTop > 0) return;
      
      this.touchCurrentY = e.touches[0].clientY;
      const deltaY = this.touchCurrentY - this.touchStartY;

      if (deltaY > 10) {
        this.isDragging = true;
        e.preventDefault();
        const translateY = Math.min(deltaY * 0.4, 300);
        const opacity = Math.max(1 - (deltaY / 400), 0.3);
        this.modal.style.transform = `translateY(${translateY}px)`;
        this.modal.style.opacity = opacity;
      }
    },

    onTouchEnd() {
      this.modal.style.transition = '';

      if (this.isDragging) {
        const deltaY = this.touchCurrentY - this.touchStartY;
        if (deltaY > 100) {
          this.close();
        } else {
          this.modal.style.transform = '';
          this.modal.style.opacity = '';
        }
      }

      this.isDragging = false;
    },

    open(card, updateHash = true) {
      this.currentCard = card;
      this.isOpen = true;

      // Get content from template
      const template = card.querySelector('.focus-card__content-template');
      const title = card.querySelector('.focus-card__title')?.textContent || 'Project';
      
      // Update modal title
      this.modal.querySelector('.mobile-project-modal__title').textContent = title;

      // Build modal content
      const content = this.modal.querySelector('.mobile-project-modal__content');
      
      if (template) {
        content.innerHTML = this.buildMobileContent(template.innerHTML, card);
      } else {
        content.innerHTML = this.buildFallbackContent(card);
      }

      // Store scroll and lock body
      this.scrollPosition = window.scrollY;
      document.body.classList.add('mobile-modal-open');
      document.body.style.top = `-${this.scrollPosition}px`;

      // Show modal
      this.modal.classList.add('mobile-project-modal--open');

      // Update hash
      if (updateHash) {
        const hash = card.dataset.focusId || card.id;
        if (hash) {
          history.pushState({ modal: true }, '', `#${hash}`);
        }
      }
    },

    buildMobileContent(templateHTML, card) {
      // Transform desktop template to mobile-optimized structure
      const temp = document.createElement('div');
      temp.innerHTML = templateHTML;

      let html = '';

      // Header with meta
      const header = temp.querySelector('.focus-overlay__header');
      if (header) {
        const summary = header.querySelector('.focus-overlay__summary');
        if (summary) {
          html += `<div class="mobile-modal-section">
            <div class="mobile-modal-section__content">${summary.innerHTML}</div>
          </div>`;
        }
      }

      // Sections
      const sections = temp.querySelectorAll('.focus-overlay__section');
      sections.forEach(section => {
        const title = section.querySelector('.focus-overlay__section-title')?.textContent || '';
        const content = section.querySelector('.focus-overlay__section-content')?.innerHTML || '';
        
        html += `<div class="mobile-modal-section">
          <h3 class="mobile-modal-section__title">${title}</h3>
          <div class="mobile-modal-section__content">${content}</div>
        </div>`;
      });

      // Actions
      const actions = temp.querySelector('.focus-overlay__actions');
      if (actions) {
        html += this.buildActionsFromCard(card);
      } else {
        html += this.buildActionsFromCard(card);
      }

      // Tech stack
      const techStack = temp.querySelector('.focus-overlay__tech-stack');
      if (techStack) {
        html += `<div class="mobile-modal-tech">${techStack.innerHTML}</div>`;
      }

      return html;
    },

    buildActionsFromCard(card) {
      const actions = card.querySelectorAll('.action-btn');
      if (actions.length === 0) return '';

      let html = '<div class="mobile-modal-actions">';
      
      actions.forEach(btn => {
        const href = btn.getAttribute('href');
        const text = btn.textContent.trim();
        const isDisabled = btn.classList.contains('action-btn--disabled') || btn.getAttribute('aria-disabled') === 'true';
        const isPrimary = btn.classList.contains('action-btn--primary');
        
        if (isDisabled) {
          html += `<span class="mobile-modal-action mobile-modal-action--secondary mobile-modal-action--disabled">${text}</span>`;
        } else {
          const className = isPrimary ? 'mobile-modal-action--primary' : 'mobile-modal-action--secondary';
          html += `<a href="${href}" target="_blank" rel="noopener noreferrer" class="mobile-modal-action ${className}">${text}</a>`;
        }
      });

      html += '</div>';
      return html;
    },

    buildFallbackContent(card) {
      const tag = card.querySelector('.focus-card__tag')?.textContent || '';
      const title = card.querySelector('.focus-card__title')?.textContent || '';
      const description = card.querySelector('.focus-card__description')?.textContent || '';

      return `
        <div class="mobile-modal-section">
          <span class="focus-card__tag">${tag}</span>
          <div class="mobile-modal-section__content">
            <p>${description}</p>
          </div>
        </div>
        ${this.buildActionsFromCard(card)}
      `;
    },

    close(updateHash = true) {
      this.isOpen = false;
      this.modal.style.transform = '';
      this.modal.style.opacity = '';
      this.modal.classList.remove('mobile-project-modal--open');

      // Restore scroll
      document.body.classList.remove('mobile-modal-open');
      document.body.style.top = '';
      window.scrollTo(0, this.scrollPosition);

      // Update hash
      if (updateHash && window.location.hash) {
        history.pushState(null, '', window.location.pathname + window.location.search);
      }

      // Clear content after animation
      setTimeout(() => {
        this.modal.querySelector('.mobile-project-modal__content').innerHTML = '';
      }, 350);

      this.currentCard = null;
    }
  };

  // ════════════════════════════════════════════════════════════════════════════
  // TAP RIPPLE EFFECT
  // ════════════════════════════════════════════════════════════════════════════

  const TapRipple = {
    init() {
      document.querySelectorAll('.btn, .action-btn, .focus-card').forEach(el => {
        el.addEventListener('touchstart', this.createRipple.bind(this), { passive: true });
      });
    },

    createRipple(e) {
      const el = e.currentTarget;
      const rect = el.getBoundingClientRect();
      const touch = e.touches[0];
      
      const ripple = document.createElement('span');
      ripple.className = 'mobile-ripple';
      
      const size = Math.max(rect.width, rect.height);
      ripple.style.width = ripple.style.height = `${size}px`;
      ripple.style.left = `${touch.clientX - rect.left - size / 2}px`;
      ripple.style.top = `${touch.clientY - rect.top - size / 2}px`;
      
      // Ensure position relative for ripple
      if (getComputedStyle(el).position === 'static') {
        el.style.position = 'relative';
      }
      el.style.overflow = 'hidden';
      
      el.appendChild(ripple);
      
      setTimeout(() => ripple.remove(), 400);
    }
  };

  // ════════════════════════════════════════════════════════════════════════════
  // MOBILE PARTICLES — Reduced Count + Touch Interaction
  // ════════════════════════════════════════════════════════════════════════════

  const MobileParticles = {
    init() {
      const canvas = document.getElementById('particles-canvas');
      if (!canvas) return;

      // Override desktop particle count
      if (window.particleSystem) {
        // Reduce existing particles
        const reduceParticles = () => {
          if (window.particleSystem && window.particleSystem.particles) {
            const targetCount = Math.floor(window.particleSystem.particles.length * 0.3);
            window.particleSystem.particles.length = targetCount;
          }
        };
        setTimeout(reduceParticles, 100);
      }

      // Add touch interaction
      canvas.addEventListener('touchmove', (e) => {
        if (window.particleSystem) {
          const rect = canvas.getBoundingClientRect();
          const touch = e.touches[0];
          window.particleSystem.mouse = {
            x: touch.clientX - rect.left,
            y: touch.clientY - rect.top,
            radius: 100
          };
        }
      }, { passive: true });

      canvas.addEventListener('touchend', () => {
        if (window.particleSystem) {
          window.particleSystem.mouse = { x: null, y: null, radius: 100 };
        }
      }, { passive: true });
    }
  };

  // ════════════════════════════════════════════════════════════════════════════
  // DESKTOP RECOMMENDED BADGES — For Lab Items
  // ════════════════════════════════════════════════════════════════════════════

  const DesktopBadges = {
    init() {
      const isLabPage = window.location.pathname.includes('lab');
      if (!isLabPage) return;

      document.querySelectorAll('.focus-card__tag').forEach(tag => {
        if (!tag.querySelector('.mobile-desktop-badge')) {
          tag.insertAdjacentHTML('afterend', 
            '<span class="mobile-desktop-badge">Desktop Recommended</span>'
          );
        }
      });
    }
  };

  // ════════════════════════════════════════════════════════════════════════════
  // LAZY LOAD IMAGES — Performance
  // ════════════════════════════════════════════════════════════════════════════

  const LazyLoad = {
    init() {
      if ('loading' in HTMLImageElement.prototype) {
        document.querySelectorAll('img[loading="lazy"]').forEach(img => {
          img.loading = 'lazy';
        });
      } else {
        // Fallback for older browsers
        const imageObserver = new IntersectionObserver((entries) => {
          entries.forEach(entry => {
            if (entry.isIntersecting) {
              const img = entry.target;
              img.src = img.dataset.src;
              imageObserver.unobserve(img);
            }
          });
        }, { rootMargin: '50px' });

        document.querySelectorAll('img[data-src]').forEach(img => {
          imageObserver.observe(img);
        });
      }
    }
  };

  // ════════════════════════════════════════════════════════════════════════════
  // PREVENT FOCUS OVERLAY ON MOBILE — Disable Desktop System
  // ════════════════════════════════════════════════════════════════════════════

  const DisableDesktopOverlay = {
    init() {
      // Destroy desktop CardFocusSystem if it exists
      if (window.cardFocusSystem) {
        window.cardFocusSystem.destroy();
        window.cardFocusSystem = null;
      }

      // Remove any existing overlay elements
      const backdrop = document.getElementById('focus-overlay-backdrop');
      const overlay = document.getElementById('focus-overlay');
      backdrop?.remove();
      overlay?.remove();
    }
  };

  // ════════════════════════════════════════════════════════════════════════════
  // INITIALIZE
  // ════════════════════════════════════════════════════════════════════════════

  function init() {
    // Disable desktop overlays first
    DisableDesktopOverlay.init();

    // Initialize mobile components
    MobileTopBar.init();
    MobileBottomSheet.init();
    MobileProjectModal.init();
    TapRipple.init();
    MobileParticles.init();
    DesktopBadges.init();
    LazyLoad.init();
  }

  // Run on DOM ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

  // Re-init on resize (crossing breakpoint)
  let wasDesktop = !isMobile();
  window.addEventListener('resize', () => {
    const isNowMobile = isMobile();
    if (wasDesktop && isNowMobile) {
      init();
    }
    wasDesktop = !isNowMobile;
  });

})();
