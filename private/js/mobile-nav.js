/**
 * ═══════════════════════════════════════════════════════════════════════════
 * MOBILE SIDE NAVIGATION - UNIFIED SYSTEM (LOCKED)
 * ═══════════════════════════════════════════════════════════════════════════
 * 
 * MANDATORY STRATEGY:
 * - Mobile uses the SAME SIDE NAV structure as desktop
 * - NO bottom navigation bar (STRICTLY FORBIDDEN)
 * - Left side nav, collapsible, icon-only when collapsed
 * - Same sections, same order, same logic
 * 
 * NAV CONTENT (MUST MATCH DESKTOP):
 * 
 * CONNECT:
 * - Her AI
 * - Imported Chats
 * 
 * GALLERY:
 * - She Gallery
 * - Photos
 * - Videos
 * 
 * RITUALS:
 * - Daily Entry
 * - Mood
 * - Memories
 * 
 * - "Back to Dashboard" at bottom
 * 
 * BEHAVIOR:
 * - Swipe from left OR tap hamburger to expand
 * - Tap outside to collapse
 * - Smooth slide animation
 * 
 * ═══════════════════════════════════════════════════════════════════════════
 */

const MobileSideNav = {
  // State
  expanded: false,
  currentSection: null,
  touchStartX: 0,
  touchStartY: 0,
  touchCurrentX: 0,
  swipeThreshold: 50,
  edgeSwipeZone: 30,
  
  // NAV CONFIGURATION - MUST MATCH DESKTOP EXACTLY
  config: {
    sections: [
      {
        label: 'Connect',
        items: [
          {
            id: 'chat',
            label: 'Her AI',
            href: '/private/she/ai-chat.html',
            icon: '<svg viewBox="0 0 24 24"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>'
          },
          {
            id: 'imported',
            label: 'Imported Chats',
            href: '/private/she/chats.html',
            icon: '<svg viewBox="0 0 24 24"><path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z"/></svg>'
          }
        ]
      },
      {
        label: 'Gallery',
        items: [
          {
            id: 'gallery',
            label: 'She Gallery',
            href: '/private/she/index.html',
            icon: '<svg viewBox="0 0 24 24"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/></svg>'
          },
          {
            id: 'photos',
            label: 'Photos',
            href: '/private/__/images.html',
            icon: '<svg viewBox="0 0 24 24"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"/><circle cx="8.5" cy="8.5" r="1.5"/><polyline points="21 15 16 10 5 21"/></svg>'
          },
          {
            id: 'videos',
            label: 'Videos',
            href: '/private/__/videos.html',
            icon: '<svg viewBox="0 0 24 24"><polygon points="23 7 16 12 23 17 23 7"/><rect x="1" y="5" width="15" height="14" rx="2" ry="2"/></svg>'
          }
        ]
      },
      {
        label: 'Rituals',
        items: [
          {
            id: 'daily',
            label: 'Daily Entry',
            href: '/private/__/daily.html',
            icon: '<svg viewBox="0 0 24 24"><path d="M12 20h9"/><path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"/></svg>'
          },
          {
            id: 'mood',
            label: 'Mood',
            href: '/private/__/mood.html',
            icon: '<svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="10"/><path d="M8 14s1.5 2 4 2 4-2 4-2"/><line x1="9" y1="9" x2="9.01" y2="9"/><line x1="15" y1="9" x2="15.01" y2="9"/></svg>'
          },
          {
            id: 'memories',
            label: 'Memories',
            href: '/private/__/memories.html',
            icon: '<svg viewBox="0 0 24 24"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/></svg>'
          }
        ]
      }
    ],
    footer: {
      id: 'back',
      label: 'Back to Dashboard',
      href: '/private/index.html',
      icon: '<svg viewBox="0 0 24 24"><polyline points="15 18 9 12 15 6"/></svg>'
    }
  },
  
  /**
   * Initialize mobile side nav
   * @param {string} activeSection - ID of current active section
   */
  init(activeSection) {
    // Only init on mobile
    if (!this.isMobile()) {
      console.log('[MobileSideNav] Desktop detected, skipping init');
      return;
    }
    
    this.currentSection = activeSection;
    this.render();
    this.bindEvents();
    console.log('[MobileSideNav] Initialized with active section:', activeSection);
  },
  
  /**
   * Check if mobile viewport
   */
  isMobile() {
    return window.innerWidth <= 768;
  },
  
  /**
   * Render the mobile side nav
   */
  render() {
    // Remove any existing nav
    const existingNav = document.getElementById('mobileSideNav');
    const existingBackdrop = document.getElementById('mobileNavBackdrop');
    const existingToggle = document.getElementById('mobileNavToggle');
    
    if (existingNav) existingNav.remove();
    if (existingBackdrop) existingBackdrop.remove();
    if (existingToggle) existingToggle.remove();
    
    // Create backdrop
    const backdrop = document.createElement('div');
    backdrop.className = 'mobile-nav-backdrop';
    backdrop.id = 'mobileNavBackdrop';
    
    // Create side nav
    const nav = document.createElement('nav');
    nav.className = 'mobile-side-nav';
    nav.id = 'mobileSideNav';
    nav.setAttribute('role', 'navigation');
    nav.setAttribute('aria-label', 'Main navigation');
    
    // Header with logo
    nav.innerHTML = `
      <div class="mobile-side-nav-header">
        <a href="/private/personal.html" class="mobile-nav-logo">
          <span class="mobile-nav-logo-icon">💖</span>
          <span class="mobile-nav-logo-text">Her Space</span>
        </a>
      </div>
      <div class="mobile-side-nav-content" id="mobileSideNavContent"></div>
      <div class="mobile-side-nav-footer" id="mobileSideNavFooter"></div>
    `;
    
    // Render nav sections
    const content = nav.querySelector('#mobileSideNavContent');
    this.config.sections.forEach(section => {
      const sectionEl = this.createSection(section);
      content.appendChild(sectionEl);
    });
    
    // Render footer
    const footer = nav.querySelector('#mobileSideNavFooter');
    const backItem = this.createNavItem(this.config.footer, true);
    footer.appendChild(backItem);
    
    // Create hamburger toggle button
    const toggle = document.createElement('button');
    toggle.className = 'mobile-nav-toggle';
    toggle.id = 'mobileNavToggle';
    toggle.setAttribute('aria-label', 'Toggle navigation');
    toggle.setAttribute('aria-expanded', 'false');
    toggle.innerHTML = `
      <svg viewBox="0 0 24 24">
        <line x1="3" y1="6" x2="21" y2="6"/>
        <line x1="3" y1="12" x2="21" y2="12"/>
        <line x1="3" y1="18" x2="21" y2="18"/>
      </svg>
    `;
    
    // Append to body
    document.body.appendChild(backdrop);
    document.body.appendChild(nav);
    document.body.appendChild(toggle);
  },
  
  /**
   * Create a nav section
   */
  createSection(section) {
    const sectionEl = document.createElement('div');
    sectionEl.className = 'mobile-nav-section';
    
    // Section label
    const label = document.createElement('div');
    label.className = 'mobile-nav-section-label';
    label.textContent = section.label;
    sectionEl.appendChild(label);
    
    // Section items
    section.items.forEach(item => {
      const navItem = this.createNavItem(item);
      sectionEl.appendChild(navItem);
    });
    
    return sectionEl;
  },
  
  /**
   * Create a nav item
   */
  createNavItem(item, isBack = false) {
    const isActive = this.currentSection === item.id;
    
    const link = document.createElement('a');
    link.className = `mobile-nav-item${isActive ? ' active' : ''}${isBack ? ' back-item' : ''}`;
    link.href = item.href;
    link.setAttribute('aria-label', item.label);
    link.setAttribute('aria-current', isActive ? 'page' : 'false');
    
    link.innerHTML = `
      <span class="mobile-nav-item-icon">${item.icon}</span>
      <span class="mobile-nav-item-label">${item.label}</span>
    `;
    
    // Close nav on click
    link.addEventListener('click', (e) => {
      // Allow natural navigation, just close the nav
      this.collapse();
    });
    
    return link;
  },
  
  /**
   * Bind event listeners
   */
  bindEvents() {
    const nav = document.getElementById('mobileSideNav');
    const backdrop = document.getElementById('mobileNavBackdrop');
    const toggle = document.getElementById('mobileNavToggle');
    
    // Toggle button click
    if (toggle) {
      toggle.addEventListener('click', () => this.toggle());
    }
    
    // Backdrop click to close
    if (backdrop) {
      backdrop.addEventListener('click', () => this.collapse());
    }
    
    // Escape key to close
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && this.expanded) {
        this.collapse();
      }
    });
    
    // Touch events for swipe gestures
    document.addEventListener('touchstart', (e) => this.handleTouchStart(e), { passive: true });
    document.addEventListener('touchmove', (e) => this.handleTouchMove(e), { passive: false });
    document.addEventListener('touchend', (e) => this.handleTouchEnd(e), { passive: true });
    
    // Handle resize
    window.addEventListener('resize', () => {
      if (!this.isMobile()) {
        this.collapse();
      }
    });
  },
  
  /**
   * Handle touch start
   */
  handleTouchStart(e) {
    this.touchStartX = e.touches[0].clientX;
    this.touchStartY = e.touches[0].clientY;
    this.touchCurrentX = this.touchStartX;
  },
  
  /**
   * Handle touch move
   */
  handleTouchMove(e) {
    if (!e.touches.length) return;
    
    this.touchCurrentX = e.touches[0].clientX;
    const touchCurrentY = e.touches[0].clientY;
    
    const deltaX = this.touchCurrentX - this.touchStartX;
    const deltaY = Math.abs(touchCurrentY - this.touchStartY);
    
    // Only handle horizontal swipes
    if (deltaY > Math.abs(deltaX)) return;
    
    // Edge swipe to open (from left edge)
    if (!this.expanded && this.touchStartX <= this.edgeSwipeZone && deltaX > 0) {
      // Prevent scroll during swipe
      e.preventDefault();
    }
    
    // Swipe left to close (when expanded)
    if (this.expanded && deltaX < -10) {
      e.preventDefault();
    }
  },
  
  /**
   * Handle touch end
   */
  handleTouchEnd(e) {
    const deltaX = this.touchCurrentX - this.touchStartX;
    
    // Edge swipe to open
    if (!this.expanded && this.touchStartX <= this.edgeSwipeZone && deltaX > this.swipeThreshold) {
      this.expand();
      return;
    }
    
    // Swipe left to close
    if (this.expanded && deltaX < -this.swipeThreshold) {
      this.collapse();
      return;
    }
    
    // Reset
    this.touchStartX = 0;
    this.touchStartY = 0;
    this.touchCurrentX = 0;
  },
  
  /**
   * Toggle nav
   */
  toggle() {
    if (this.expanded) {
      this.collapse();
    } else {
      this.expand();
    }
  },
  
  /**
   * Expand nav
   */
  expand() {
    const nav = document.getElementById('mobileSideNav');
    const backdrop = document.getElementById('mobileNavBackdrop');
    const toggle = document.getElementById('mobileNavToggle');
    
    if (nav) nav.classList.add('expanded');
    if (backdrop) backdrop.classList.add('visible');
    if (toggle) toggle.setAttribute('aria-expanded', 'true');
    
    this.expanded = true;
    
    // Prevent body scroll
    document.body.style.overflow = 'hidden';
    
    console.log('[MobileSideNav] Expanded');
  },
  
  /**
   * Collapse nav
   */
  collapse() {
    const nav = document.getElementById('mobileSideNav');
    const backdrop = document.getElementById('mobileNavBackdrop');
    const toggle = document.getElementById('mobileNavToggle');
    
    if (nav) nav.classList.remove('expanded');
    if (backdrop) backdrop.classList.remove('visible');
    if (toggle) toggle.setAttribute('aria-expanded', 'false');
    
    this.expanded = false;
    
    // Restore body scroll
    document.body.style.overflow = '';
    
    console.log('[MobileSideNav] Collapsed');
  },
  
  /**
   * Set active section
   */
  setActive(sectionId) {
    this.currentSection = sectionId;
    
    // Update nav items
    document.querySelectorAll('.mobile-nav-item').forEach(item => {
      const href = item.getAttribute('href');
      let isActive = false;
      
      // Check all sections for matching item
      this.config.sections.forEach(section => {
        section.items.forEach(navItem => {
          if (navItem.href === href && navItem.id === sectionId) {
            isActive = true;
          }
        });
      });
      
      item.classList.toggle('active', isActive);
      item.setAttribute('aria-current', isActive ? 'page' : 'false');
    });
  },
  
  /**
   * Destroy nav
   */
  destroy() {
    const nav = document.getElementById('mobileSideNav');
    const backdrop = document.getElementById('mobileNavBackdrop');
    const toggle = document.getElementById('mobileNavToggle');
    
    if (nav) nav.remove();
    if (backdrop) backdrop.remove();
    if (toggle) toggle.remove();
    
    document.body.style.overflow = '';
  }
};

// Auto-initialize if data attribute present
document.addEventListener('DOMContentLoaded', () => {
  const navInit = document.body.getAttribute('data-mobile-nav');
  if (navInit) {
    MobileSideNav.init(navInit);
  }
});

// Export for module use
if (typeof module !== 'undefined' && module.exports) {
  module.exports = MobileSideNav;
}

// Also expose globally for compatibility
window.MobileSideNav = MobileSideNav;

// Deprecation notice for old MobileNav
window.MobileNav = {
  init: function(activeSection) {
    console.warn('[MobileNav] DEPRECATED: Bottom navigation is no longer supported. Using MobileSideNav instead.');
    MobileSideNav.init(activeSection);
  }
};
