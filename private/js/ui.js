/**
 * ═══════════════════════════════════════════════════════════
 * PRIVATE SPACE - UI MODULE
 * Core UI state management and interactions
 * ═══════════════════════════════════════════════════════════
 */

const PSUI = (function() {
  'use strict';

  let _currentSection = 'chat';
  let _sidebarCollapsed = false;
  let _aiPanelCollapsed = true;
  let _focusMode = false;
  let _focusLongPressTimer = null;

  const SECTIONS = [
    'chat', 'pro-chat', 'notes', 'images', 'log', 'memory', 
    'projects', 'navigation', 'pages', 'site-settings', 'settings'
  ];

  /**
   * Initialize UI
   */
  function init() {
    bindEvents();
    renderSidebar();
    navigateTo('chat');
  }

  /**
   * Bind UI events
   */
  function bindEvents() {
    // Sidebar toggle
    document.getElementById('sidebarToggle')?.addEventListener('click', toggleSidebar);
    
    // Navigation items
    document.querySelectorAll('[data-nav]').forEach(item => {
      item.addEventListener('click', (e) => {
        const section = e.currentTarget.dataset.nav;
        navigateTo(section);
      });
    });

    // Mobile navigation
    document.querySelectorAll('.ps-mobile-nav-item').forEach(item => {
      item.addEventListener('click', (e) => {
        const section = e.currentTarget.dataset.nav;
        navigateTo(section);
      });
    });

    // AI Panel toggle
    document.getElementById('aiPanelToggle')?.addEventListener('click', toggleAIPanel);
    document.getElementById('aiPanelClose')?.addEventListener('click', () => toggleAIPanel(false));

    // Focus mode
    document.getElementById('focusModeToggle')?.addEventListener('click', toggleFocusMode);
    document.querySelector('.ps-focus-exit')?.addEventListener('click', () => toggleFocusMode(false));

    // Keyboard shortcuts
    document.addEventListener('keydown', handleKeyboard);

    // Mobile long press for focus mode exit
    document.addEventListener('touchstart', handleTouchStart);
    document.addEventListener('touchend', handleTouchEnd);

    // Window events for lock on close
    window.addEventListener('beforeunload', () => {
      PSAuth.lock();
    });

    // Activity tracker for auto-lock
    ['click', 'keydown', 'scroll', 'touchstart'].forEach(event => {
      document.addEventListener(event, () => {
        if (PSAuth.resetAutoLock) PSAuth.resetAutoLock();
      }, { passive: true });
    });
  }

  /**
   * Navigate to section
   */
  function navigateTo(section) {
    if (!SECTIONS.includes(section)) return;

    _currentSection = section;

    // Update sidebar nav items
    document.querySelectorAll('.ps-nav-item[data-section]').forEach(item => {
      item.classList.toggle('active', item.dataset.section === section);
    });

    // Update mobile nav items
    document.querySelectorAll('.ps-mobile-nav-item[data-section]').forEach(item => {
      item.classList.toggle('active', item.dataset.section === section);
    });

    // Update sections
    document.querySelectorAll('.ps-section').forEach(sec => {
      sec.classList.toggle('active', sec.id === `section-${section}`);
    });

    // Update page title
    const titles = {
      'chat': 'Her Mode 💕',
      'pro-chat': 'Professional Mode ⚡',
      notes: 'Notes',
      images: 'Images',
      log: 'Daily Log',
      memory: 'Memory',
      projects: 'Projects Manager',
      navigation: 'Navigation Manager',
      pages: 'Pages Manager',
      'site-settings': 'Site Settings',
      settings: 'Private Settings'
    };
    const pageTitle = document.querySelector('.ps-page-title');
    if (pageTitle) pageTitle.textContent = titles[section] || section;

    // Load section data
    loadSection(section);
  }

  /**
   * Load section content
   */
  async function loadSection(section) {
    switch (section) {
      case 'chat':
        if (typeof PSAISystem !== 'undefined') {
          await PSAISystem.loadChat('her');
        } else if (typeof PSChat !== 'undefined') {
          await PSChat.load();
        }
        break;
      case 'pro-chat':
        if (typeof PSAISystem !== 'undefined') {
          await PSAISystem.loadChat('pro');
        }
        break;
      case 'notes':
        if (typeof PSNotes !== 'undefined') await PSNotes.load();
        break;
      case 'images':
        if (typeof PSImages !== 'undefined') await PSImages.load();
        break;
      case 'log':
        if (typeof PSLog !== 'undefined') await PSLog.load();
        break;
      case 'memory':
        if (typeof PSMemory !== 'undefined') await PSMemory.load();
        break;
      case 'projects':
        if (typeof ProjectsManager !== 'undefined') {
          await ProjectsManager.loadProjects();
          ProjectsManager.render();
        } else if (typeof PSProjects !== 'undefined') {
          await PSProjects.load();
        }
        break;
      case 'navigation':
        if (typeof NavigationManager !== 'undefined') {
          await NavigationManager.loadLinks();
          NavigationManager.render();
        }
        break;
      case 'pages':
        if (typeof PagesManager !== 'undefined') {
          await PagesManager.loadPages();
          PagesManager.render();
        }
        break;
      case 'site-settings':
        if (typeof SettingsManager !== 'undefined') {
          await SettingsManager.loadSettings();
          SettingsManager.render();
        }
        break;
      case 'settings':
        if (typeof PSSettings !== 'undefined') await PSSettings.load();
        break;
    }
  }

  /**
   * Toggle sidebar
   */
  function toggleSidebar(collapsed) {
    const sidebar = document.querySelector('.ps-sidebar');
    _sidebarCollapsed = typeof collapsed === 'boolean' ? collapsed : !_sidebarCollapsed;
    sidebar.classList.toggle('collapsed', _sidebarCollapsed);
  }

  /**
   * Toggle AI panel
   */
  function toggleAIPanel(show) {
    const panel = document.querySelector('.ps-ai-panel');
    _aiPanelCollapsed = typeof show === 'boolean' ? !show : !_aiPanelCollapsed;
    panel.classList.toggle('collapsed', _aiPanelCollapsed);
    panel.classList.toggle('active', !_aiPanelCollapsed);
  }

  /**
   * Toggle focus mode
   */
  function toggleFocusMode(enabled) {
    _focusMode = typeof enabled === 'boolean' ? enabled : !_focusMode;
    document.body.setAttribute('data-focus-mode', _focusMode);
    
    if (_focusMode) {
      // Show exit hint briefly
      const exitBtn = document.querySelector('.ps-focus-exit');
      exitBtn.style.opacity = '0.5';
      setTimeout(() => {
        exitBtn.style.opacity = '0';
      }, 2000);
    }
  }

  /**
   * Handle keyboard shortcuts
   */
  function handleKeyboard(e) {
    // Escape exits focus mode
    if (e.key === 'Escape' && _focusMode) {
      toggleFocusMode(false);
      return;
    }

    // Ctrl/Cmd + Shift + F toggles focus mode
    if ((e.ctrlKey || e.metaKey) && e.shiftKey && e.key === 'F') {
      e.preventDefault();
      toggleFocusMode();
      return;
    }

    // Ctrl/Cmd + K opens AI panel
    if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
      e.preventDefault();
      toggleAIPanel(true);
      return;
    }

    // Number keys for navigation (1-7)
    if ((e.ctrlKey || e.metaKey) && e.key >= '1' && e.key <= '7') {
      e.preventDefault();
      const index = parseInt(e.key) - 1;
      if (SECTIONS[index]) {
        navigateTo(SECTIONS[index]);
      }
    }
  }

  /**
   * Handle touch start for long press
   */
  function handleTouchStart(e) {
    if (!_focusMode) return;
    
    _focusLongPressTimer = setTimeout(() => {
      toggleFocusMode(false);
    }, 800);
  }

  /**
   * Handle touch end
   */
  function handleTouchEnd() {
    if (_focusLongPressTimer) {
      clearTimeout(_focusLongPressTimer);
      _focusLongPressTimer = null;
    }
  }

  /**
   * Render sidebar
   */
  function renderSidebar() {
    const nav = document.querySelector('.ps-sidebar-nav');
    if (!nav) return;

    nav.innerHTML = `
      <div class="ps-nav-section">
        <div class="ps-nav-section-title">Workspace</div>
        <div class="ps-nav-item" data-nav="chat">
          <svg class="icon" viewBox="0 0 24 24"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>
          <span class="ps-nav-item-text">AI Chat</span>
        </div>
        <div class="ps-nav-item" data-nav="notes">
          <svg class="icon" viewBox="0 0 24 24"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/><polyline points="10 9 9 9 8 9"/></svg>
          <span class="ps-nav-item-text">Notes</span>
        </div>
        <div class="ps-nav-item" data-nav="images">
          <svg class="icon" viewBox="0 0 24 24"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"/><circle cx="8.5" cy="8.5" r="1.5"/><polyline points="21 15 16 10 5 21"/></svg>
          <span class="ps-nav-item-text">Images</span>
        </div>
        <div class="ps-nav-item" data-nav="log">
          <svg class="icon" viewBox="0 0 24 24"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>
          <span class="ps-nav-item-text">Daily Log</span>
        </div>
      </div>
      <div class="ps-nav-section">
        <div class="ps-nav-section-title">Intelligence</div>
        <div class="ps-nav-item" data-nav="memory">
          <svg class="icon" viewBox="0 0 24 24"><path d="M12 2a10 10 0 1 0 10 10A10 10 0 0 0 12 2zm0 18a8 8 0 1 1 8-8 8 8 0 0 1-8 8z"/><path d="M12 6a6 6 0 0 0-6 6h2a4 4 0 0 1 4-4z"/></svg>
          <span class="ps-nav-item-text">Memory</span>
        </div>
        <div class="ps-nav-item" data-nav="projects">
          <svg class="icon" viewBox="0 0 24 24"><path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"/></svg>
          <span class="ps-nav-item-text">Projects</span>
        </div>
      </div>
      <div class="ps-nav-section">
        <div class="ps-nav-section-title">System</div>
        <div class="ps-nav-item" data-nav="settings">
          <svg class="icon" viewBox="0 0 24 24"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"/></svg>
          <span class="ps-nav-item-text">Settings</span>
        </div>
      </div>
    `;

    // Rebind nav events
    document.querySelectorAll('[data-nav]').forEach(item => {
      item.addEventListener('click', (e) => {
        navigateTo(e.currentTarget.dataset.nav);
      });
    });
  }

  /**
   * Show toast notification
   */
  function toast(message, type = 'info', duration = 3000) {
    const container = document.querySelector('.ps-toast-container') || createToastContainer();
    
    const icons = {
      success: '<svg viewBox="0 0 24 24"><polyline points="20 6 9 17 4 12"/></svg>',
      error: '<svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="10"/><line x1="15" y1="9" x2="9" y2="15"/><line x1="9" y1="9" x2="15" y2="15"/></svg>',
      warning: '<svg viewBox="0 0 24 24"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>',
      info: '<svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="10"/><line x1="12" y1="16" x2="12" y2="12"/><line x1="12" y1="8" x2="12.01" y2="8"/></svg>'
    };

    const toast = document.createElement('div');
    toast.className = `ps-toast ps-toast-${type}`;
    toast.innerHTML = `
      <div class="ps-toast-icon icon">${icons[type]}</div>
      <div class="ps-toast-content">
        <div class="ps-toast-message">${message}</div>
      </div>
      <button class="ps-toast-close">
        <svg class="icon-sm" viewBox="0 0 24 24"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
      </button>
    `;

    toast.querySelector('.ps-toast-close').addEventListener('click', () => {
      removeToast(toast);
    });

    container.appendChild(toast);

    if (duration > 0) {
      setTimeout(() => removeToast(toast), duration);
    }

    return toast;
  }

  function createToastContainer() {
    const container = document.createElement('div');
    container.className = 'ps-toast-container';
    document.body.appendChild(container);
    return container;
  }

  function removeToast(toast) {
    toast.classList.add('removing');
    setTimeout(() => toast.remove(), 200);
  }

  /**
   * Show modal
   */
  function modal(options) {
    const { title, content, actions = [], onClose } = options;

    const overlay = document.createElement('div');
    overlay.className = 'ps-modal-overlay active';
    
    overlay.innerHTML = `
      <div class="ps-modal">
        <div class="ps-modal-header">
          <h3 class="ps-modal-title">${title}</h3>
          <button class="ps-topbar-btn ps-modal-close">
            <svg class="icon" viewBox="0 0 24 24"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
          </button>
        </div>
        <div class="ps-modal-body">${content}</div>
        ${actions.length ? `<div class="ps-modal-footer"></div>` : ''}
      </div>
    `;

    const footer = overlay.querySelector('.ps-modal-footer');
    if (footer) {
      actions.forEach(action => {
        const btn = document.createElement('button');
        btn.className = `ps-btn ${action.primary ? 'ps-btn-primary' : 'ps-btn-secondary'} ${action.danger ? 'ps-btn-danger' : ''}`;
        btn.textContent = action.label;
        btn.addEventListener('click', () => {
          if (action.onClick) action.onClick();
          closeModal();
        });
        footer.appendChild(btn);
      });
    }

    function closeModal() {
      overlay.classList.remove('active');
      setTimeout(() => {
        overlay.remove();
        if (onClose) onClose();
      }, 200);
    }

    overlay.querySelector('.ps-modal-close').addEventListener('click', closeModal);
    overlay.addEventListener('click', (e) => {
      if (e.target === overlay) closeModal();
    });

    document.body.appendChild(overlay);
    return { close: closeModal, element: overlay };
  }

  /**
   * Confirm dialog
   */
  function confirm(message, onConfirm) {
    return modal({
      title: 'Confirm',
      content: `<p>${message}</p>`,
      actions: [
        { label: 'Cancel' },
        { label: 'Confirm', primary: true, onClick: onConfirm }
      ]
    });
  }

  /**
   * Show mobile menu with more options
   */
  function showMobileMenu() {
    const menuItems = [
      { icon: '📝', label: 'Notes', section: 'notes' },
      { icon: '🖼️', label: 'Images', section: 'images' },
      { icon: '📅', label: 'Daily Log', section: 'log' },
      { icon: '🧠', label: 'Memory', section: 'memory' },
      { icon: '🔗', label: 'Navigation', section: 'navigation' },
      { icon: '⚙️', label: 'Site Settings', section: 'site-settings' },
      { icon: '🔒', label: 'Private Settings', section: 'settings' },
      { icon: '🚪', label: 'Lock', action: () => PSAuth.lock() }
    ];

    modal({
      title: 'More Options',
      content: `
        <div class="ps-mobile-menu-grid" style="display: grid; grid-template-columns: repeat(2, 1fr); gap: var(--ps-space-3);">
          ${menuItems.map(item => `
            <button class="ps-mobile-menu-item" 
                    style="display: flex; flex-direction: column; align-items: center; gap: var(--ps-space-2); padding: var(--ps-space-4); background: var(--ps-bg-tertiary); border-radius: var(--ps-radius-lg); border: 1px solid var(--ps-border-subtle);"
                    ${item.section ? `data-section="${item.section}"` : ''}
                    ${item.action ? `data-action="true"` : ''}
                    onclick="${item.section ? `PSUI.navigateTo('${item.section}'); PSUI.hideModal();` : ''}">
              <span style="font-size: 24px;">${item.icon}</span>
              <span style="font-size: var(--ps-text-sm); color: var(--ps-text-primary);">${item.label}</span>
            </button>
          `).join('')}
        </div>
      `
    });

    // Handle lock action separately
    setTimeout(() => {
      const lockBtn = document.querySelector('[data-action="true"]');
      if (lockBtn) {
        lockBtn.onclick = () => {
          hideModal();
          PSAuth.lock();
        };
      }
    }, 100);
  }

  /**
   * Hide modal (utility function)
   */
  function hideModal() {
    const overlay = document.querySelector('.ps-modal-overlay.active');
    if (overlay) {
      overlay.classList.remove('active');
      setTimeout(() => overlay.remove(), 200);
    }
  }

  /**
   * Show modal (simplified for command palette etc)
   */
  function showModal(header, content) {
    const modalOverlay = document.getElementById('modalOverlay');
    const modalHeader = document.getElementById('modalHeader');
    const modalBody = document.getElementById('modalBody');
    
    if (modalOverlay && modalHeader && modalBody) {
      modalHeader.innerHTML = header;
      modalBody.innerHTML = content;
      modalOverlay.classList.add('active');
    }
  }

  /**
   * Toggle AI panel (for chat sidebar)
   */
  function toggleAI() {
    toggleAIPanel();
  }

  /**
   * Get current section
   */
  function getCurrentSection() {
    return _currentSection;
  }

  /**
   * Check if in focus mode
   */
  function isFocusMode() {
    return _focusMode;
  }

  return {
    init,
    navigateTo,
    toggleSidebar,
    toggleAIPanel,
    toggleAI,
    toggleFocusMode,
    toast,
    modal,
    confirm,
    showModal,
    hideModal,
    showMobileMenu,
    getCurrentSection,
    isFocusMode
  };
})();

if (typeof module !== 'undefined' && module.exports) {
  module.exports = PSUI;
}
