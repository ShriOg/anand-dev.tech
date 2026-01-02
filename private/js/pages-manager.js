/**
 * ═══════════════════════════════════════════════════════════
 * PRIVATE SPACE - PAGES MANAGER
 * Full CRUD for Website Pages
 * ═══════════════════════════════════════════════════════════
 */

const PagesManager = {
  pages: [],
  currentPage: null,
  
  async init() {
    await Database.init();
    await this.loadPages();
    this.bindEvents();
    this.render();
  },
  
  async loadPages() {
    this.pages = await Database.getAll(DB_STORES.PAGES);
    this.pages.sort((a, b) => (a.title || '').localeCompare(b.title || ''));
    
    // Initialize with existing pages if empty
    if (this.pages.length === 0) {
      const existingPages = [
        { title: 'Projects', route: '/pages/projects/', hidden: false, enabled: true },
        { title: 'Contact', route: '/pages/contact/', hidden: false, enabled: true },
        { title: 'Lab', route: '/pages/lab/', hidden: false, enabled: true },
        { title: 'Hire', route: '/pages/hire/', hidden: true, enabled: true },
        { title: 'Hidden', route: '/pages/hidden/', hidden: true, enabled: true }
      ];
      
      for (const page of existingPages) {
        await Database.add(DB_STORES.PAGES, page);
      }
      
      this.pages = await Database.getAll(DB_STORES.PAGES);
    }
  },
  
  bindEvents() {
    document.getElementById('addPageBtn')?.addEventListener('click', () => {
      this.openEditor();
    });
    
    document.getElementById('savePageBtn')?.addEventListener('click', () => {
      this.savePage();
    });
    
    document.getElementById('cancelPageBtn')?.addEventListener('click', () => {
      this.closeEditor();
    });
  },
  
  render() {
    const publicContainer = document.getElementById('publicPagesList');
    const hiddenContainer = document.getElementById('hiddenPagesList');
    
    const publicPages = this.pages.filter(p => !p.hidden);
    const hiddenPages = this.pages.filter(p => p.hidden);
    
    // Update section counts
    const publicCount = document.querySelector('#section-pages .ps-pages-count.public');
    const hiddenCount = document.querySelector('#section-pages .ps-pages-count.hidden');
    if (publicCount) publicCount.textContent = publicPages.length;
    if (hiddenCount) hiddenCount.textContent = hiddenPages.length;
    
    if (publicContainer) {
      publicContainer.innerHTML = publicPages.length ? publicPages.map(p => this.renderPageCard(p)).join('') : `
        <div class="ps-empty ps-empty-sm">
          <p class="ps-empty-description">No public pages</p>
        </div>
      `;
    }
    
    if (hiddenContainer) {
      hiddenContainer.innerHTML = hiddenPages.length ? hiddenPages.map(p => this.renderPageCard(p, true)).join('') : `
        <div class="ps-empty ps-empty-sm">
          <p class="ps-empty-description">No hidden pages</p>
        </div>
      `;
    }
  },
  
  renderPageCard(page, isHidden = false) {
    const isEnabled = page.enabled !== false;
    
    return `
      <div class="ps-page-card ${isEnabled ? '' : 'ps-page-disabled'}" data-id="${page.id}">
        <div class="ps-page-card-icon">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
            ${isHidden ? `
              <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/>
              <path d="M7 11V7a5 5 0 0110 0v4"/>
            ` : `
              <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/>
              <polyline points="14 2 14 8 20 8"/>
            `}
          </svg>
        </div>
        <div class="ps-page-card-content">
          <span class="ps-page-card-title">${page.title}</span>
          <span class="ps-page-card-route">${page.route}</span>
        </div>
        <div class="ps-page-card-badges">
          ${!isEnabled ? '<span class="ps-page-card-badge">Disabled</span>' : ''}
        </div>
        <div class="ps-page-card-actions">
          ${isHidden ? `
            <button class="ps-action-btn" onclick="PagesManager.openHiddenPage('${page.route}')" title="Open Page">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M18 13v6a2 2 0 01-2 2H5a2 2 0 01-2-2V8a2 2 0 012-2h6"/>
                <polyline points="15 3 21 3 21 9"/>
                <line x1="10" y1="14" x2="21" y2="3"/>
              </svg>
            </button>
          ` : ''}
          <button class="ps-action-btn" onclick="PagesManager.toggleEnabled('${page.id}')" title="${isEnabled ? 'Disable' : 'Enable'}">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              ${isEnabled ? `
                <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
                <circle cx="12" cy="12" r="3"/>
              ` : `
                <path d="M17.94 17.94A10.07 10.07 0 0112 20c-7 0-11-8-11-8a18.45 18.45 0 015.06-5.94M9.9 4.24A9.12 9.12 0 0112 4c7 0 11 8 11 8a18.5 18.5 0 01-2.16 3.19m-6.72-1.07a3 3 0 11-4.24-4.24"/>
                <line x1="1" y1="1" x2="23" y2="23"/>
              `}
            </svg>
          </button>
          <button class="ps-action-btn" onclick="PagesManager.duplicatePage('${page.id}')" title="Duplicate">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <rect x="9" y="9" width="13" height="13" rx="2" ry="2"/>
              <path d="M5 15H4a2 2 0 01-2-2V4a2 2 0 012-2h9a2 2 0 012 2v1"/>
            </svg>
          </button>
          <button class="ps-action-btn" onclick="PagesManager.openEditor('${page.id}')" title="Edit">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7"/>
              <path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z"/>
            </svg>
          </button>
          <button class="ps-action-btn ps-action-danger" onclick="PagesManager.deletePage('${page.id}')" title="Delete">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <polyline points="3 6 5 6 21 6"/>
              <path d="M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2"/>
            </svg>
          </button>
        </div>
      </div>
    `;
  },
  
  openEditor(pageId = null) {
    const modal = document.getElementById('pageEditorModal');
    const title = document.getElementById('pageEditorTitle');
    
    if (pageId) {
      this.currentPage = this.pages.find(p => p.id === pageId);
      title.textContent = 'Edit Page';
      document.getElementById('pageTitle').value = this.currentPage.title || '';
      document.getElementById('pageRoute').value = this.currentPage.route || '';
      document.getElementById('pageMetaTitle').value = this.currentPage.metaTitle || '';
      document.getElementById('pageMetaDesc').value = this.currentPage.metaDescription || '';
      document.getElementById('pageHidden').checked = this.currentPage.hidden || false;
      document.getElementById('pageEnabled').checked = this.currentPage.enabled ?? true;
    } else {
      this.currentPage = null;
      title.textContent = 'Add Page';
      document.getElementById('pageTitle').value = '';
      document.getElementById('pageRoute').value = '/pages/';
      document.getElementById('pageMetaTitle').value = '';
      document.getElementById('pageMetaDesc').value = '';
      document.getElementById('pageHidden').checked = false;
      document.getElementById('pageEnabled').checked = true;
    }
    
    modal.classList.add('active');
  },
  
  closeEditor() {
    document.getElementById('pageEditorModal').classList.remove('active');
    this.currentPage = null;
  },
  
  async savePage() {
    const page = {
      id: this.currentPage?.id || crypto.randomUUID(),
      title: document.getElementById('pageTitle').value || 'Untitled Page',
      route: document.getElementById('pageRoute').value || '/pages/new/',
      metaTitle: document.getElementById('pageMetaTitle').value || '',
      metaDescription: document.getElementById('pageMetaDesc').value || '',
      hidden: document.getElementById('pageHidden').checked,
      enabled: document.getElementById('pageEnabled').checked,
      createdAt: this.currentPage?.createdAt || Date.now()
    };
    
    await Database.put(DB_STORES.PAGES, page);
    await this.loadPages();
    this.render();
    this.closeEditor();
    this.syncToPublicSite();
    
    Toast.show('Page saved', 'success');
  },
  
  async deletePage(id) {
    if (!confirm('Delete this page configuration?')) return;
    
    await Database.delete(DB_STORES.PAGES, id);
    await this.loadPages();
    this.render();
    this.syncToPublicSite();
    
    Toast.show('Page deleted', 'success');
  },
  
  async toggleEnabled(id) {
    const page = this.pages.find(p => p.id === id);
    if (!page) return;
    
    page.enabled = !page.enabled;
    await Database.put(DB_STORES.PAGES, page);
    await this.loadPages();
    this.render();
    this.syncToPublicSite();
    Toast.show(page.enabled ? 'Page enabled' : 'Page disabled', 'success');
  },
  
  async duplicatePage(id) {
    const page = this.pages.find(p => p.id === id);
    if (!page) return;
    
    const duplicate = {
      ...page,
      id: crypto.randomUUID(),
      title: `${page.title} (Copy)`,
      route: `${page.route.replace(/\/$/, '')}-copy/`,
      enabled: false,
      createdAt: Date.now()
    };
    
    await Database.put(DB_STORES.PAGES, duplicate);
    await this.loadPages();
    this.render();
    Toast.show('Page duplicated', 'success');
  },
  
  openHiddenPage(route) {
    // Set trusted admin flag
    sessionStorage.setItem('trusted_admin', 'true');
    sessionStorage.setItem('trusted_admin_timestamp', Date.now().toString());
    
    // Open in new tab with trusted context
    window.open(route, '_blank');
  },
  
  syncToPublicSite() {
    const pagesConfig = this.pages
      .filter(p => p.enabled)
      .map(({ route, hidden, metaTitle, metaDescription }) => ({
        route, hidden, metaTitle, metaDescription
      }));
    
    localStorage.setItem('ps_pages_config', JSON.stringify(pagesConfig));
    window.dispatchEvent(new CustomEvent('pagesUpdated', { detail: pagesConfig }));
  }
};

window.PagesManager = PagesManager;
