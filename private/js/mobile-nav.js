const MobileSideNav = {

  expanded: false,
  currentSection: null,
  touchStartX: 0,
  touchStartY: 0,
  touchCurrentX: 0,
  swipeThreshold: 50,
  edgeSwipeZone: 30,

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

  init(activeSection) {

    if (!this.isMobile()) {
      console.log('[MobileSideNav] Desktop detected, skipping init');
      return;
    }

    this.currentSection = activeSection;
    this.render();
    this.bindEvents();
    console.log('[MobileSideNav] Initialized with active section:', activeSection);
  },

  isMobile() {
    return window.innerWidth <= 768;
  },

  render() {

    const existingNav = document.getElementById('mobileSideNav');
    const existingBackdrop = document.getElementById('mobileNavBackdrop');
    const existingToggle = document.getElementById('mobileNavToggle');

    if (existingNav) existingNav.remove();
    if (existingBackdrop) existingBackdrop.remove();
    if (existingToggle) existingToggle.remove();

    const backdrop = document.createElement('div');
    backdrop.className = 'mobile-nav-backdrop';
    backdrop.id = 'mobileNavBackdrop';

    const nav = document.createElement('nav');
    nav.className = 'mobile-side-nav';
    nav.id = 'mobileSideNav';
    nav.setAttribute('role', 'navigation');
    nav.setAttribute('aria-label', 'Main navigation');

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

    const content = nav.querySelector('#mobileSideNavContent');
    this.config.sections.forEach(section => {
      const sectionEl = this.createSection(section);
      content.appendChild(sectionEl);
    });

    const footer = nav.querySelector('#mobileSideNavFooter');
    const backItem = this.createNavItem(this.config.footer, true);
    footer.appendChild(backItem);

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

    document.body.appendChild(backdrop);
    document.body.appendChild(nav);
    document.body.appendChild(toggle);
  },

  createSection(section) {
    const sectionEl = document.createElement('div');
    sectionEl.className = 'mobile-nav-section';

    const label = document.createElement('div');
    label.className = 'mobile-nav-section-label';
    label.textContent = section.label;
    sectionEl.appendChild(label);

    section.items.forEach(item => {
      const navItem = this.createNavItem(item);
      sectionEl.appendChild(navItem);
    });

    return sectionEl;
  },

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

    link.addEventListener('click', (e) => {

      this.collapse();
    });

    return link;
  },

  bindEvents() {
    const nav = document.getElementById('mobileSideNav');
    const backdrop = document.getElementById('mobileNavBackdrop');
    const toggle = document.getElementById('mobileNavToggle');

    if (toggle) {
      toggle.addEventListener('click', () => this.toggle());
    }

    if (backdrop) {
      backdrop.addEventListener('click', () => this.collapse());
    }

    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && this.expanded) {
        this.collapse();
      }
    });

    document.addEventListener('touchstart', (e) => this.handleTouchStart(e), { passive: true });
    document.addEventListener('touchmove', (e) => this.handleTouchMove(e), { passive: false });
    document.addEventListener('touchend', (e) => this.handleTouchEnd(e), { passive: true });

    window.addEventListener('resize', () => {
      if (!this.isMobile()) {
        this.collapse();
      }
    });
  },

  handleTouchStart(e) {
    this.touchStartX = e.touches[0].clientX;
    this.touchStartY = e.touches[0].clientY;
    this.touchCurrentX = this.touchStartX;
  },

  handleTouchMove(e) {
    if (!e.touches.length) return;

    this.touchCurrentX = e.touches[0].clientX;
    const touchCurrentY = e.touches[0].clientY;

    const deltaX = this.touchCurrentX - this.touchStartX;
    const deltaY = Math.abs(touchCurrentY - this.touchStartY);

    if (deltaY > Math.abs(deltaX)) return;

    if (!this.expanded && this.touchStartX <= this.edgeSwipeZone && deltaX > 0) {

      e.preventDefault();
    }

    if (this.expanded && deltaX < -10) {
      e.preventDefault();
    }
  },

  handleTouchEnd(e) {
    const deltaX = this.touchCurrentX - this.touchStartX;

    if (!this.expanded && this.touchStartX <= this.edgeSwipeZone && deltaX > this.swipeThreshold) {
      this.expand();
      return;
    }

    if (this.expanded && deltaX < -this.swipeThreshold) {
      this.collapse();
      return;
    }

    this.touchStartX = 0;
    this.touchStartY = 0;
    this.touchCurrentX = 0;
  },

  toggle() {
    if (this.expanded) {
      this.collapse();
    } else {
      this.expand();
    }
  },

  expand() {
    const nav = document.getElementById('mobileSideNav');
    const backdrop = document.getElementById('mobileNavBackdrop');
    const toggle = document.getElementById('mobileNavToggle');

    if (nav) nav.classList.add('expanded');
    if (backdrop) backdrop.classList.add('visible');
    if (toggle) toggle.setAttribute('aria-expanded', 'true');

    this.expanded = true;

    document.body.style.overflow = 'hidden';

    console.log('[MobileSideNav] Expanded');
  },

  collapse() {
    const nav = document.getElementById('mobileSideNav');
    const backdrop = document.getElementById('mobileNavBackdrop');
    const toggle = document.getElementById('mobileNavToggle');

    if (nav) nav.classList.remove('expanded');
    if (backdrop) backdrop.classList.remove('visible');
    if (toggle) toggle.setAttribute('aria-expanded', 'false');

    this.expanded = false;

    document.body.style.overflow = '';

    console.log('[MobileSideNav] Collapsed');
  },

  setActive(sectionId) {
    this.currentSection = sectionId;

    document.querySelectorAll('.mobile-nav-item').forEach(item => {
      const href = item.getAttribute('href');
      let isActive = false;

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

document.addEventListener('DOMContentLoaded', () => {
  const navInit = document.body.getAttribute('data-mobile-nav');
  if (navInit) {
    MobileSideNav.init(navInit);
  }
});

if (typeof module !== 'undefined' && module.exports) {
  module.exports = MobileSideNav;
}

window.MobileSideNav = MobileSideNav;

window.MobileNav = {
  init: function(activeSection) {
    console.warn('[MobileNav] DEPRECATED: Bottom navigation is no longer supported. Using MobileSideNav instead.');
    MobileSideNav.init(activeSection);
  }
};
