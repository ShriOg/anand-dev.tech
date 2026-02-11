/**
 * ═══════════════════════════════════════════════════════════
 * PRIVATE SPACE - NAVIGATION MANAGER
 * Full CRUD for Website Navigation
 * ═══════════════════════════════════════════════════════════
 */

const NavigationManager = {
  links: [],
  
  async init() {
    await Database.init();
    await this.loadLinks();
    this.bindEvents();
    this.render();
  },
  
  async loadLinks() {
    this.links = await Database.getAll(DB_STORES.NAVIGATION);
    this.links.sort((a, b) => (a.order || 0) - (b.order || 0));
    
    // Initialize with defaults if empty
    if (this.links.length === 0) {
      const defaults = [
        { label: 'Home', route: '/', visible: true, order: 0 },
        { label: 'Projects', route: '/pages/projects/', visible: true, order: 1 },
        { label: 'Contact', route: '/pages/contact/', visible: true, order: 2 }
      ];
      
      for (const link of defaults) {
        await Database.add(DB_STORES.NAVIGATION, link);
      }
      
      this.links = await Database.getAll(DB_STORES.NAVIGATION);
      this.links.sort((a, b) => a.order - b.order);
    }
  },
  
  bindEvents() {
    document.getElementById('addNavLinkBtn')?.addEventListener('click', () => {
      this.openEditor();
    });
    
    document.getElementById('saveNavLinkBtn')?.addEventListener('click', () => {
      this.saveLink();
    });
    
    document.getElementById('cancelNavLinkBtn')?.addEventListener('click', () => {
      this.closeEditor();
    });
  },
  
  render() {
    const container = document.getElementById('navLinksList');
    if (!container) return;
    
    // Update count
    const countEl = document.querySelector('#section-navigation .ps-nav-links-count');
    if (countEl) {
      const visibleCount = this.links.filter(l => l.visible).length;
      countEl.textContent = `${visibleCount}/${this.links.length}`;
    }
    
    if (this.links.length === 0) {
      container.innerHTML = `
        <div class="ps-empty">
          <svg class="ps-empty-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
            <path d="M4 6h16M4 12h16M4 18h16"/>
          </svg>
          <h3 class="ps-empty-title">No navigation links</h3>
          <p class="ps-empty-description">Add links to appear in the site navigation</p>
        </div>
      `;
      return;
    }
    
    container.innerHTML = this.links.map((link, index) => this.renderLinkItem(link, index)).join('');
    this.initDragDrop();
  },
  
  renderLinkItem(link, index) {
    const isVisible = link.visible !== false;
    const isExternal = link.external || link.route?.startsWith('http');
    const isFirst = index === 0;
    const isLast = index === this.links.length - 1;
    
    return `
      <div class="ps-nav-link-item ${isVisible ? '' : 'ps-nav-link-hidden'}" data-id="${link.id}" draggable="true">
        <div class="ps-nav-link-drag">
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <circle cx="9" cy="6" r="1"/><circle cx="15" cy="6" r="1"/>
            <circle cx="9" cy="12" r="1"/><circle cx="15" cy="12" r="1"/>
            <circle cx="9" cy="18" r="1"/><circle cx="15" cy="18" r="1"/>
          </svg>
        </div>
        <span class="ps-nav-link-order">${index + 1}</span>
        <div class="ps-nav-link-info">
          <span class="ps-nav-link-label">${link.label}</span>
          <span class="ps-nav-link-route">${link.route}</span>
        </div>
        <div class="ps-nav-link-badges">
          ${isExternal ? '<span class="ps-nav-link-badge external">External</span>' : ''}
          ${link.newTab ? '<span class="ps-nav-link-badge">New Tab</span>' : ''}
        </div>
        <div class="ps-nav-link-actions">
          <button class="ps-action-btn" onclick="NavigationManager.moveLink('${link.id}', -1)" ${isFirst ? 'disabled' : ''} title="Move Up">
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <polyline points="18 15 12 9 6 15"/>
            </svg>
          </button>
          <button class="ps-action-btn" onclick="NavigationManager.moveLink('${link.id}', 1)" ${isLast ? 'disabled' : ''} title="Move Down">
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <polyline points="6 9 12 15 18 9"/>
            </svg>
          </button>
          <button class="ps-action-btn" onclick="NavigationManager.toggleVisibility('${link.id}')" title="${isVisible ? 'Hide' : 'Show'}">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              ${isVisible ? `
                <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
                <circle cx="12" cy="12" r="3"/>
              ` : `
                <path d="M17.94 17.94A10.07 10.07 0 0112 20c-7 0-11-8-11-8a18.45 18.45 0 015.06-5.94M9.9 4.24A9.12 9.12 0 0112 4c7 0 11 8 11 8a18.5 18.5 0 01-2.16 3.19m-6.72-1.07a3 3 0 11-4.24-4.24"/>
                <line x1="1" y1="1" x2="23" y2="23"/>
              `}
            </svg>
          </button>
          <button class="ps-action-btn" onclick="NavigationManager.openEditor('${link.id}')" title="Edit">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7"/>
              <path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z"/>
            </svg>
          </button>
          <button class="ps-action-btn ps-action-danger" onclick="NavigationManager.deleteLink('${link.id}')" title="Delete">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <polyline points="3 6 5 6 21 6"/>
              <path d="M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2"/>
            </svg>
          </button>
        </div>
      </div>
    `;
  },
  
  currentLink: null,
  
  openEditor(linkId = null) {
    const modal = document.getElementById('navLinkEditorModal');
    const title = document.getElementById('navLinkEditorTitle');
    
    if (linkId) {
      this.currentLink = this.links.find(l => l.id === linkId);
      title.textContent = 'Edit Link';
      document.getElementById('navLinkLabel').value = this.currentLink.label || '';
      document.getElementById('navLinkRoute').value = this.currentLink.route || '';
      document.getElementById('navLinkExternal').checked = this.currentLink.external || false;
      document.getElementById('navLinkNewTab').checked = this.currentLink.newTab || false;
    } else {
      this.currentLink = null;
      title.textContent = 'Add Link';
      document.getElementById('navLinkLabel').value = '';
      document.getElementById('navLinkRoute').value = '';
      document.getElementById('navLinkExternal').checked = false;
      document.getElementById('navLinkNewTab').checked = false;
    }
    
    modal.classList.add('active');
  },
  
  closeEditor() {
    const modal = document.getElementById('navLinkEditorModal');
    modal.classList.remove('active');
    this.currentLink = null;
  },
  
  async saveLink() {
    const link = {
      id: this.currentLink?.id || crypto.randomUUID(),
      label: document.getElementById('navLinkLabel').value || 'Link',
      route: document.getElementById('navLinkRoute').value || '/',
      external: document.getElementById('navLinkExternal').checked,
      newTab: document.getElementById('navLinkNewTab').checked,
      visible: this.currentLink?.visible ?? true,
      order: this.currentLink?.order ?? this.links.length,
      createdAt: this.currentLink?.createdAt || Date.now()
    };
    
    await Database.put(DB_STORES.NAVIGATION, link);
    await this.loadLinks();
    this.render();
    this.closeEditor();
    this.syncToPublicSite();
    
    Toast.show('Navigation link saved', 'success');
  },
  
  async deleteLink(id) {
    if (!confirm('Delete this navigation link?')) return;
    
    await Database.delete(DB_STORES.NAVIGATION, id);
    await this.loadLinks();
    this.render();
    this.syncToPublicSite();
    
    Toast.show('Link deleted', 'success');
  },
  
  async toggleVisibility(id) {
    const link = this.links.find(l => l.id === id);
    if (!link) return;
    
    link.visible = !link.visible;
    await Database.put(DB_STORES.NAVIGATION, link);
    await this.loadLinks();
    this.render();
    this.syncToPublicSite();
    Toast.show(link.visible ? 'Link visible' : 'Link hidden', 'success');
  },
  
  async moveLink(id, direction) {
    const index = this.links.findIndex(l => l.id === id);
    if (index === -1) return;
    
    const newIndex = index + direction;
    if (newIndex < 0 || newIndex >= this.links.length) return;
    
    // Swap orders
    const currentLink = this.links[index];
    const targetLink = this.links[newIndex];
    
    const tempOrder = currentLink.order;
    currentLink.order = targetLink.order;
    targetLink.order = tempOrder;
    
    await Database.put(DB_STORES.NAVIGATION, currentLink);
    await Database.put(DB_STORES.NAVIGATION, targetLink);
    await this.loadLinks();
    this.render();
    this.syncToPublicSite();
  },
  
  initDragDrop() {
    const container = document.getElementById('navLinksList');
    if (!container) return;
    
    let draggedItem = null;
    
    container.querySelectorAll('.ps-nav-link-item').forEach(item => {
      item.addEventListener('dragstart', (e) => {
        draggedItem = item;
        item.classList.add('dragging');
      });
      
      item.addEventListener('dragend', () => {
        item.classList.remove('dragging');
        this.updateOrder();
      });
      
      item.addEventListener('dragover', (e) => {
        e.preventDefault();
        if (draggedItem !== item) {
          const rect = item.getBoundingClientRect();
          const midY = rect.top + rect.height / 2;
          if (e.clientY < midY) {
            container.insertBefore(draggedItem, item);
          } else {
            container.insertBefore(draggedItem, item.nextSibling);
          }
        }
      });
    });
  },
  
  async updateOrder() {
    const items = document.querySelectorAll('.ps-nav-link-item');
    const updates = [];
    
    items.forEach((item, index) => {
      const id = item.dataset.id;
      const link = this.links.find(l => l.id === id);
      if (link && link.order !== index) {
        link.order = index;
        updates.push(Database.put(DB_STORES.NAVIGATION, link));
      }
    });
    
    await Promise.all(updates);
    await this.loadLinks();
    this.syncToPublicSite();
  },
  
  syncToPublicSite() {
    const publicNav = this.links
      .filter(l => l.visible)
      .map(({ label, route, external, newTab }) => ({ label, route, external, newTab }));
    
    localStorage.setItem('ps_public_navigation', JSON.stringify(publicNav));
    window.dispatchEvent(new CustomEvent('navigationUpdated', { detail: publicNav }));
  }
};

window.NavigationManager = NavigationManager;
