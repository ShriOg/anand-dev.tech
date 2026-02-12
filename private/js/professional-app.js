/**
 * ═══════════════════════════════════════════════════════════
 * PROFESSIONAL SPACE - APPLICATION
 * Website Control: Projects, Navigation, Pages, Settings
 * ═══════════════════════════════════════════════════════════
 */

const ProApp = {
  SESSION_KEY: 'ps_session_active',
  currentSection: 'projects',
  
  // ═══════════════════════════════════════════════════════════
  // INITIALIZATION
  // ═══════════════════════════════════════════════════════════
  async init() {
    // Auth check - redirect to lock screen if not authenticated
    if (!this.isAuthenticated()) {
      window.location.href = '/private/';
      return;
    }
    
    // Hide auth check, show app
    document.getElementById('authCheck').classList.add('hidden');
    document.getElementById('proApp').classList.add('visible');
    
    // Initialize database
    await this.initDatabase();
    
    // Bind events
    this.bindEvents();
    
    // Load initial data
    await this.loadProjects();
    await this.loadNavigation();
    await this.loadPages();
    await this.loadSettings();
    
    console.log('[Professional Space] Initialized');
  },
  
  isAuthenticated() {
    return sessionStorage.getItem(this.SESSION_KEY) === 'true';
  },
  
  async initDatabase() {
    if (typeof Database !== 'undefined') {
      await Database.init();
    }
  },
  
  // ═══════════════════════════════════════════════════════════
  // EVENT BINDING
  // ═══════════════════════════════════════════════════════════
  bindEvents() {
    // Navigation
    document.querySelectorAll('.pro-nav-item[data-section]').forEach(item => {
      item.addEventListener('click', () => this.navigateTo(item.dataset.section));
    });
    
    document.querySelectorAll('.pro-mobile-nav-item[data-section]').forEach(item => {
      item.addEventListener('click', () => this.navigateTo(item.dataset.section));
    });
    
    // Lock button
    document.getElementById('lockBtn')?.addEventListener('click', () => this.lock());
    
    // Sidebar toggle
    document.getElementById('sidebarToggle')?.addEventListener('click', () => this.toggleSidebar());
    
    // Projects
    document.getElementById('newProjectBtn')?.addEventListener('click', () => this.openProjectEditor());
    document.getElementById('syncProjectsBtn')?.addEventListener('click', () => this.syncProjects());
    document.getElementById('projectsSearch')?.addEventListener('input', (e) => this.filterProjects(e.target.value));
    document.getElementById('projectsFilter')?.addEventListener('change', (e) => this.filterByStatus(e.target.value));
    
    // Navigation
    document.getElementById('newNavBtn')?.addEventListener('click', () => this.openNavEditor());
    document.getElementById('syncNavBtn')?.addEventListener('click', () => this.syncNavigation());
    
    // Pages
    document.getElementById('newPageBtn')?.addEventListener('click', () => this.openPageEditor());
    document.getElementById('syncPagesBtn')?.addEventListener('click', () => this.syncPages());
    
    // Settings
    document.getElementById('saveSettingsBtn')?.addEventListener('click', () => this.saveSettings());
    
    // Modal
    document.getElementById('modalOverlay')?.addEventListener('click', (e) => {
      if (e.target === document.getElementById('modalOverlay')) this.closeModal();
    });
    document.getElementById('modalClose')?.addEventListener('click', () => this.closeModal());
  },
  
  // ═══════════════════════════════════════════════════════════
  // NAVIGATION
  // ═══════════════════════════════════════════════════════════
  navigateTo(section) {
    // Update active states
    document.querySelectorAll('.pro-nav-item').forEach(item => {
      item.classList.toggle('active', item.dataset.section === section);
    });
    
    document.querySelectorAll('.pro-mobile-nav-item').forEach(item => {
      item.classList.toggle('active', item.dataset.section === section);
    });
    
    // Show section
    document.querySelectorAll('.pro-section').forEach(sec => {
      sec.classList.toggle('active', sec.id === `section-${section}`);
    });
    
    this.currentSection = section;
    
    // Close sidebar on mobile
    if (window.innerWidth <= 1024) {
      document.getElementById('sidebar')?.classList.remove('open');
    }
  },
  
  toggleSidebar() {
    document.getElementById('sidebar')?.classList.toggle('open');
  },
  
  lock() {
    sessionStorage.removeItem(this.SESSION_KEY);
    window.location.href = 'index.html';
  },
  
  // ═══════════════════════════════════════════════════════════
  // PROJECTS
  // ═══════════════════════════════════════════════════════════
  projects: [],
  projectFilter: { search: '', status: 'all' },
  
  async loadProjects() {
    if (typeof Database === 'undefined') return;
    
    try {
      this.projects = await Database.getAll('projects');
      this.projects.sort((a, b) => (a.order || 0) - (b.order || 0));
      
      // Auto-import if empty
      if (this.projects.length === 0) {
        await this.syncProjects();
        return;
      }
      
      this.renderProjects();
    } catch (e) {
      console.warn('Could not load projects:', e);
      this.projects = [];
      this.renderProjects();
    }
  },
  
  renderProjects() {
    const grid = document.getElementById('projectsGrid');
    const empty = document.getElementById('projectsEmpty');
    
    if (!grid) return;
    
    let filtered = this.projects;
    
    // Apply filters
    if (this.projectFilter.search) {
      const search = this.projectFilter.search.toLowerCase();
      filtered = filtered.filter(p => 
        p.title?.toLowerCase().includes(search) ||
        p.description?.toLowerCase().includes(search)
      );
    }
    
    if (this.projectFilter.status !== 'all') {
      filtered = filtered.filter(p => p.status === this.projectFilter.status);
    }
    
    if (filtered.length === 0) {
      grid.innerHTML = '';
      if (empty) empty.style.display = 'block';
      return;
    }
    
    if (empty) empty.style.display = 'none';
    
    grid.innerHTML = filtered.map(project => `
      <div class="pro-project-card" data-id="${project.id}">
        <div class="pro-project-header">
          <h3 class="pro-project-title">${this.escapeHtml(project.title || 'Untitled')}</h3>
          <span class="pro-project-status ${project.status || 'draft'}">${project.status || 'draft'}</span>
        </div>
        <p class="pro-project-description">${this.escapeHtml(project.description || 'No description')}</p>
        <div class="pro-project-meta">
          <span>${project.tech?.slice(0, 3).join(', ') || 'No tech'}</span>
          <span>${this.formatDate(project.createdAt)}</span>
        </div>
        <div class="pro-project-actions">
          <button class="pro-btn pro-btn-ai" onclick="AIAssistant.openProjectAI('${project.id}')" title="AI Tools">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 2L2 7l10 5 10-5-10-5z"/><path d="M2 17l10 5 10-5"/><path d="M2 12l10 5 10-5"/></svg>
            AI
          </button>
          <button class="pro-btn pro-btn-secondary" onclick="ProApp.editProject('${project.id}')">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
            Edit
          </button>
          <button class="pro-btn pro-btn-danger" onclick="ProApp.deleteProject('${project.id}')">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg>
          </button>
        </div>
      </div>
    `).join('');
  },
  
  filterProjects(search) {
    this.projectFilter.search = search;
    this.renderProjects();
  },
  
  filterByStatus(status) {
    this.projectFilter.status = status;
    this.renderProjects();
  },
  
  openProjectEditor(project = null) {
    const isEdit = !!project;
    document.getElementById('modalTitle').textContent = isEdit ? 'Edit Project' : 'New Project';
    
    document.getElementById('modalBody').innerHTML = `
      <form id="projectForm" onsubmit="ProApp.saveProject(event)">
        <input type="hidden" id="projectId" value="${project?.id || ''}">
        
        <div class="pro-field">
          <label class="pro-label">Title</label>
          <input type="text" class="pro-input" id="projectTitle" value="${this.escapeHtml(project?.title || '')}" required>
        </div>
        
        <div class="pro-field">
          <label class="pro-label">Description</label>
          <textarea class="pro-textarea" id="projectDescription" rows="3">${this.escapeHtml(project?.description || '')}</textarea>
        </div>
        
        <div class="pro-field">
          <label class="pro-label">Technologies (comma-separated)</label>
          <input type="text" class="pro-input" id="projectTech" value="${(project?.tech || []).join(', ')}" placeholder="React, Node.js, MongoDB">
        </div>
        
        <div class="pro-field">
          <label class="pro-label">Live URL</label>
          <input type="url" class="pro-input" id="projectLiveUrl" value="${project?.liveUrl || ''}" placeholder="https://...">
        </div>
        
        <div class="pro-field">
          <label class="pro-label">GitHub URL</label>
          <input type="url" class="pro-input" id="projectGithubUrl" value="${project?.githubUrl || ''}" placeholder="https://github.com/...">
        </div>
        
        <div class="pro-field">
          <label class="pro-label">Status</label>
          <select class="pro-select" id="projectStatus">
            <option value="draft" ${project?.status === 'draft' ? 'selected' : ''}>Draft</option>
            <option value="published" ${project?.status === 'published' ? 'selected' : ''}>Published</option>
            <option value="hidden" ${project?.status === 'hidden' ? 'selected' : ''}>Hidden</option>
          </select>
        </div>
        
        <div class="pro-modal-actions">
          <button type="button" class="pro-btn pro-btn-secondary" onclick="ProApp.closeModal()">Cancel</button>
          <button type="submit" class="pro-btn pro-btn-primary">${isEdit ? 'Save Changes' : 'Create Project'}</button>
        </div>
      </form>
    `;
    
    this.openModal();
  },
  
  async editProject(id) {
    const project = this.projects.find(p => p.id === id);
    if (project) this.openProjectEditor(project);
  },
  
  async saveProject(e) {
    e.preventDefault();
    
    const id = document.getElementById('projectId').value;
    const project = {
      id: id || crypto.randomUUID(),
      title: document.getElementById('projectTitle').value.trim(),
      description: document.getElementById('projectDescription').value.trim(),
      tech: document.getElementById('projectTech').value.split(',').map(t => t.trim()).filter(Boolean),
      liveUrl: document.getElementById('projectLiveUrl').value.trim(),
      githubUrl: document.getElementById('projectGithubUrl').value.trim(),
      status: document.getElementById('projectStatus').value,
      order: id ? (this.projects.find(p => p.id === id)?.order || 0) : this.projects.length,
      createdAt: id ? (this.projects.find(p => p.id === id)?.createdAt || Date.now()) : Date.now()
    };
    
    try {
      await Database.put('projects', project);
      await this.loadProjects();
      this.closeModal();
      this.toast(id ? 'Project updated' : 'Project created', 'success');
    } catch (e) {
      this.toast('Failed to save project', 'error');
    }
  },
  
  async deleteProject(id) {
    if (!confirm('Delete this project?')) return;
    
    try {
      await Database.delete('projects', id);
      await this.loadProjects();
      this.toast('Project deleted', 'success');
    } catch (e) {
      this.toast('Failed to delete project', 'error');
    }
  },
  
  async syncProjects() {
    try {
      const response = await fetch('/assets/content.json');
      if (!response.ok) throw new Error('Failed to fetch content.json');
      
      const content = await response.json();
      
      if (content.projects && content.projects.length > 0) {
        // Clear existing and import from content.json
        for (const project of content.projects) {
          const projectData = {
            id: project.id,
            title: project.title,
            description: project.shortDescription || project.longDescription || '',
            tech: project.techStack || [],
            liveUrl: project.liveUrl || '',
            githubUrl: project.sourceUrl || '',
            pageUrl: project.pageUrl || '',
            status: project.status === 'active' ? 'published' : (project.status || 'draft'),
            featured: project.featured || false,
            order: project.order || 0,
            createdAt: Date.now()
          };
          await Database.put('projects', projectData);
        }
        
        await this.loadProjects();
        this.toast(`Imported ${content.projects.length} projects from site`, 'success');
      } else {
        this.toast('No projects found in content.json', 'info');
      }
    } catch (e) {
      console.error('Sync projects error:', e);
      this.toast('Failed to sync projects', 'error');
    }
  },
  
  // ═══════════════════════════════════════════════════════════
  // NAVIGATION
  // ═══════════════════════════════════════════════════════════
  navLinks: [],
  
  async loadNavigation() {
    if (typeof Database === 'undefined') return;
    
    try {
      this.navLinks = await Database.getAll('navigation');
      this.navLinks.sort((a, b) => (a.order || 0) - (b.order || 0));
      
      // Auto-import if empty
      if (this.navLinks.length === 0) {
        await this.syncNavigation();
        return;
      }
      
      this.renderNavigation();
    } catch (e) {
      this.navLinks = [];
      this.renderNavigation();
    }
  },
  
  renderNavigation() {
    const list = document.getElementById('navList');
    const empty = document.getElementById('navEmpty');
    
    if (!list) return;
    
    if (this.navLinks.length === 0) {
      list.innerHTML = '';
      if (empty) empty.style.display = 'block';
      return;
    }
    
    if (empty) empty.style.display = 'none';
    
    list.innerHTML = this.navLinks.map((link, i) => `
      <div class="pro-nav-link-item" data-id="${link.id}">
        <div class="pro-nav-link-info">
          <span class="pro-nav-link-order">${i + 1}</span>
          <div class="pro-nav-link-details">
            <h4>${this.escapeHtml(link.label || 'Untitled')}</h4>
            <span>${link.url || '#'}</span>
          </div>
        </div>
        <div class="pro-nav-link-actions">
          <button class="pro-btn pro-btn-secondary" onclick="ProApp.editNavLink('${link.id}')">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
          </button>
          <button class="pro-btn pro-btn-danger" onclick="ProApp.deleteNavLink('${link.id}')">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg>
          </button>
        </div>
      </div>
    `).join('');
  },
  
  openNavEditor(link = null) {
    const isEdit = !!link;
    document.getElementById('modalTitle').textContent = isEdit ? 'Edit Link' : 'Add Link';
    
    document.getElementById('modalBody').innerHTML = `
      <form id="navForm" onsubmit="ProApp.saveNavLink(event)">
        <input type="hidden" id="navId" value="${link?.id || ''}">
        
        <div class="pro-field">
          <label class="pro-label">Label</label>
          <input type="text" class="pro-input" id="navLabel" value="${this.escapeHtml(link?.label || '')}" required>
        </div>
        
        <div class="pro-field">
          <label class="pro-label">URL</label>
          <input type="text" class="pro-input" id="navUrl" value="${link?.url || ''}" placeholder="/page or https://..." required>
        </div>
        
        <div class="pro-modal-actions">
          <button type="button" class="pro-btn pro-btn-secondary" onclick="ProApp.closeModal()">Cancel</button>
          <button type="submit" class="pro-btn pro-btn-primary">${isEdit ? 'Save' : 'Add Link'}</button>
        </div>
      </form>
    `;
    
    this.openModal();
  },
  
  async editNavLink(id) {
    const link = this.navLinks.find(l => l.id === id);
    if (link) this.openNavEditor(link);
  },
  
  async saveNavLink(e) {
    e.preventDefault();
    
    const id = document.getElementById('navId').value;
    const link = {
      id: id || crypto.randomUUID(),
      label: document.getElementById('navLabel').value.trim(),
      url: document.getElementById('navUrl').value.trim(),
      order: id ? (this.navLinks.find(l => l.id === id)?.order || 0) : this.navLinks.length,
      visible: true
    };
    
    try {
      await Database.put('navigation', link);
      await this.loadNavigation();
      this.closeModal();
      this.toast(id ? 'Link updated' : 'Link added', 'success');
    } catch (e) {
      this.toast('Failed to save link', 'error');
    }
  },
  
  async deleteNavLink(id) {
    if (!confirm('Delete this link?')) return;
    
    try {
      await Database.delete('navigation', id);
      await this.loadNavigation();
      this.toast('Link deleted', 'success');
    } catch (e) {
      this.toast('Failed to delete link', 'error');
    }
  },
  
  async syncNavigation() {
    try {
      const response = await fetch('/assets/content.json');
      if (!response.ok) throw new Error('Failed to fetch content.json');
      
      const content = await response.json();
      
      if (content.navigation && content.navigation.length > 0) {
        for (let i = 0; i < content.navigation.length; i++) {
          const nav = content.navigation[i];
          const linkData = {
            id: nav.id || crypto.randomUUID(),
            label: nav.label,
            url: nav.href,
            order: i,
            visible: nav.status === 'active'
          };
          await Database.put('navigation', linkData);
        }
        
        await this.loadNavigation();
        this.toast(`Imported ${content.navigation.length} nav links from site`, 'success');
      } else {
        this.toast('No navigation found in content.json', 'info');
      }
    } catch (e) {
      console.error('Sync navigation error:', e);
      this.toast('Failed to sync navigation', 'error');
    }
  },
  
  // ═══════════════════════════════════════════════════════════
  // PAGES
  // ═══════════════════════════════════════════════════════════
  pages: [],
  
  async loadPages() {
    if (typeof Database === 'undefined') return;
    
    try {
      this.pages = await Database.getAll('pages');
      
      // Auto-import if empty
      if (this.pages.length === 0) {
        await this.syncPages();
        return;
      }
      
      this.renderPages();
    } catch (e) {
      this.pages = [];
      this.renderPages();
    }
  },
  
  renderPages() {
    const publicList = document.getElementById('publicPagesList');
    const hiddenList = document.getElementById('hiddenPagesList');
    const publicCount = document.getElementById('publicPagesCount');
    const hiddenCount = document.getElementById('hiddenPagesCount');
    const empty = document.getElementById('pagesEmpty');
    
    const publicPages = this.pages.filter(p => !p.hidden);
    const hiddenPages = this.pages.filter(p => p.hidden);
    
    if (publicCount) publicCount.textContent = publicPages.length;
    if (hiddenCount) hiddenCount.textContent = hiddenPages.length;
    
    if (this.pages.length === 0) {
      if (publicList) publicList.innerHTML = '<p style="padding: 1rem; color: var(--text-muted); font-size: 0.8125rem;">No public pages</p>';
      if (hiddenList) hiddenList.innerHTML = '<p style="padding: 1rem; color: var(--text-muted); font-size: 0.8125rem;">No hidden pages</p>';
      return;
    }
    
    if (empty) empty.style.display = 'none';
    
    const renderPageItem = (page) => `
      <div class="pro-page-item" data-id="${page.id}">
        <div class="pro-page-info">
          <h4>${this.escapeHtml(page.title || 'Untitled')}</h4>
          <span>${page.route || '/'}</span>
        </div>
        <div class="pro-page-actions">
          <button class="pro-btn pro-btn-secondary" onclick="ProApp.editPage('${page.id}')">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
          </button>
          <button class="pro-btn pro-btn-danger" onclick="ProApp.deletePage('${page.id}')">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg>
          </button>
        </div>
      </div>
    `;
    
    if (publicList) {
      publicList.innerHTML = publicPages.length > 0 
        ? publicPages.map(renderPageItem).join('') 
        : '<p style="padding: 1rem; color: var(--text-muted); font-size: 0.8125rem;">No public pages</p>';
    }
    
    if (hiddenList) {
      hiddenList.innerHTML = hiddenPages.length > 0 
        ? hiddenPages.map(renderPageItem).join('') 
        : '<p style="padding: 1rem; color: var(--text-muted); font-size: 0.8125rem;">No hidden pages</p>';
    }
  },
  
  openPageEditor(page = null) {
    const isEdit = !!page;
    document.getElementById('modalTitle').textContent = isEdit ? 'Edit Page' : 'Add Page';
    
    document.getElementById('modalBody').innerHTML = `
      <form id="pageForm" onsubmit="ProApp.savePage(event)">
        <input type="hidden" id="pageId" value="${page?.id || ''}">
        
        <div class="pro-field">
          <label class="pro-label">Title</label>
          <input type="text" class="pro-input" id="pageTitle" value="${this.escapeHtml(page?.title || '')}" required>
        </div>
        
        <div class="pro-field">
          <label class="pro-label">Route</label>
          <input type="text" class="pro-input" id="pageRoute" value="${page?.route || ''}" placeholder="/about" required>
        </div>
        
        <div class="pro-field">
          <label class="pro-label">
            <input type="checkbox" id="pageHidden" ${page?.hidden ? 'checked' : ''}>
            Hidden Page
          </label>
        </div>
        
        <div class="pro-modal-actions">
          <button type="button" class="pro-btn pro-btn-secondary" onclick="ProApp.closeModal()">Cancel</button>
          <button type="submit" class="pro-btn pro-btn-primary">${isEdit ? 'Save' : 'Add Page'}</button>
        </div>
      </form>
    `;
    
    this.openModal();
  },
  
  async editPage(id) {
    const page = this.pages.find(p => p.id === id);
    if (page) this.openPageEditor(page);
  },
  
  async savePage(e) {
    e.preventDefault();
    
    const id = document.getElementById('pageId').value;
    const page = {
      id: id || crypto.randomUUID(),
      title: document.getElementById('pageTitle').value.trim(),
      route: document.getElementById('pageRoute').value.trim(),
      hidden: document.getElementById('pageHidden').checked
    };
    
    try {
      await Database.put('pages', page);
      await this.loadPages();
      this.closeModal();
      this.toast(id ? 'Page updated' : 'Page added', 'success');
    } catch (e) {
      this.toast('Failed to save page', 'error');
    }
  },
  
  async deletePage(id) {
    if (!confirm('Delete this page?')) return;
    
    try {
      await Database.delete('pages', id);
      await this.loadPages();
      this.toast('Page deleted', 'success');
    } catch (e) {
      this.toast('Failed to delete page', 'error');
    }
  },
  
  async syncPages() {
    try {
      // Fetch from content.json for project pages
      const response = await fetch('/assets/content.json');
      if (!response.ok) throw new Error('Failed to fetch content.json');
      
      const content = await response.json();
      
      // Known pages from directory structure
      const knownPages = [
        { id: 'home', title: 'Home', route: '/', hidden: false },
        { id: 'projects', title: 'Projects', route: '/pages/projects/', hidden: false },
        { id: 'lab', title: 'Lab', route: '/pages/lab/', hidden: false },
        { id: 'dev-os', title: 'Dev OS', route: '/pages/dev-os/', hidden: false },
        { id: 'hire', title: 'Hire Me', route: '/pages/hire/', hidden: false },
        { id: 'contact', title: 'Contact', route: '/pages/contact/', hidden: false },
        { id: 'grades', title: 'Grades Dashboard', route: '/pages/grades/', hidden: false },
        { id: 'ai-assistant', title: 'AI Assistant', route: '/pages/ai-assistant/', hidden: false },
        { id: 'case-study', title: 'Case Study', route: '/pages/case-study/', hidden: false },
        { id: 'nowhang', title: 'NowHang', route: '/pages/nowhang/', hidden: false },
        { id: 'hidden', title: 'Hidden', route: '/pages/hidden/', hidden: true }
      ];
      
      // Add project pages from content.json
      if (content.projects) {
        content.projects.forEach(project => {
          if (project.pageUrl && !knownPages.find(p => p.route === project.pageUrl)) {
            knownPages.push({
              id: project.id + '-page',
              title: project.title,
              route: project.pageUrl,
              hidden: false
            });
          }
        });
      }
      
      // Import all pages
      for (const page of knownPages) {
        await Database.put('pages', page);
      }
      
      await this.loadPages();
      this.toast(`Imported ${knownPages.length} pages from site`, 'success');
    } catch (e) {
      console.error('Sync pages error:', e);
      this.toast('Failed to sync pages', 'error');
    }
  },
  
  // ═══════════════════════════════════════════════════════════
  // SETTINGS
  // ═══════════════════════════════════════════════════════════
  settings: {},
  
  async loadSettings() {
    if (typeof Database === 'undefined') return;
    
    try {
      const allSettings = await Database.getAll('settings');
      this.settings = {};
      allSettings.forEach(s => { this.settings[s.key] = s.value; });
      
      // If no settings, try to load from content.json
      if (Object.keys(this.settings).length === 0) {
        await this.importSettingsFromContent();
      }
      
      this.populateSettings();
    } catch (e) {
      this.settings = {};
    }
  },
  
  async importSettingsFromContent() {
    try {
      const response = await fetch('/assets/content.json');
      if (!response.ok) return;
      
      const content = await response.json();
      
      // Import site settings
      if (content.site) {
        this.settings.siteName = content.site.name || '';
        this.settings.siteTagline = content.site.tagline || '';
      }
      
      // Import author info
      if (content.author) {
        this.settings.authorBio = content.author.description || '';
        this.settings.github = content.author.github || '';
        this.settings.linkedin = content.author.linkedin || '';
        this.settings.email = content.author.email || '';
      }
      
      // Import meta
      if (content.meta) {
        this.settings.metaDescription = content.meta.description || '';
      }
      
      // Save to database
      for (const [key, value] of Object.entries(this.settings)) {
        await Database.put('settings', { key, value });
      }
    } catch (e) {
      console.warn('Could not import settings from content.json:', e);
    }
  },
  
  populateSettings() {
    const fields = {
      siteName: 'siteName',
      siteTagline: 'siteTagline',
      authorBio: 'authorBio',
      socialGithub: 'github',
      socialLinkedin: 'linkedin',
      socialTwitter: 'twitter',
      socialInstagram: 'instagram',
      socialEmail: 'email',
      accentColor: 'accentColor',
      themeMode: 'themeMode',
      metaDescription: 'metaDescription',
      metaKeywords: 'metaKeywords'
    };
    
    Object.entries(fields).forEach(([elId, key]) => {
      const el = document.getElementById(elId);
      if (el && this.settings[key] !== undefined) {
        el.value = this.settings[key];
      }
    });
  },
  
  async saveSettings() {
    const fields = {
      siteName: 'siteName',
      siteTagline: 'siteTagline',
      authorBio: 'authorBio',
      socialGithub: 'github',
      socialLinkedin: 'linkedin',
      socialTwitter: 'twitter',
      socialInstagram: 'instagram',
      socialEmail: 'email',
      accentColor: 'accentColor',
      themeMode: 'themeMode',
      metaDescription: 'metaDescription',
      metaKeywords: 'metaKeywords'
    };
    
    try {
      for (const [elId, key] of Object.entries(fields)) {
        const el = document.getElementById(elId);
        if (el) {
          await Database.put('settings', { key, value: el.value });
        }
      }
      
      this.toast('Settings saved', 'success');
    } catch (e) {
      this.toast('Failed to save settings', 'error');
    }
  },
  
  // ═══════════════════════════════════════════════════════════
  // MODAL
  // ═══════════════════════════════════════════════════════════
  openModal() {
    document.getElementById('modalOverlay')?.classList.add('visible');
  },
  
  closeModal() {
    document.getElementById('modalOverlay')?.classList.remove('visible');
  },
  
  // ═══════════════════════════════════════════════════════════
  // TOAST
  // ═══════════════════════════════════════════════════════════
  toast(message, type = 'info') {
    const container = document.getElementById('toastContainer');
    if (!container) return;
    
    const toast = document.createElement('div');
    toast.className = `pro-toast ${type}`;
    toast.textContent = message;
    container.appendChild(toast);
    
    setTimeout(() => {
      toast.classList.add('hiding');
      setTimeout(() => toast.remove(), 300);
    }, 3000);
  },
  
  // ═══════════════════════════════════════════════════════════
  // UTILITIES
  // ═══════════════════════════════════════════════════════════
  escapeHtml(str) {
    if (!str) return '';
    const div = document.createElement('div');
    div.textContent = str;
    return div.innerHTML;
  },
  
  formatDate(timestamp) {
    if (!timestamp) return '';
    return new Date(timestamp).toLocaleDateString('en-US', { 
      month: 'short', 
      day: 'numeric',
      year: 'numeric'
    });
  }
};

// Initialize on load
document.addEventListener('DOMContentLoaded', () => ProApp.init());
