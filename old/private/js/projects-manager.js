/**
 * ═══════════════════════════════════════════════════════════
 * PRIVATE SPACE - PROJECTS MANAGER
 * Full CRUD for Website Projects
 * ═══════════════════════════════════════════════════════════
 */

const ProjectsManager = {
  currentProject: null,
  projects: [],
  
  async init() {
    await Database.init();
    await this.loadProjects();
    this.bindEvents();
    this.render();
  },
  
  async loadProjects() {
    this.projects = await Database.getAll(DB_STORES.PROJECTS);
    this.projects.sort((a, b) => (a.order || 0) - (b.order || 0));
  },
  
  bindEvents() {
    // Add project button
    document.getElementById('addProjectBtn')?.addEventListener('click', () => {
      this.openEditor();
    });
    
    // Save project
    document.getElementById('saveProjectBtn')?.addEventListener('click', () => {
      this.saveProject();
    });
    
    // Cancel edit
    document.getElementById('cancelProjectBtn')?.addEventListener('click', () => {
      this.closeEditor();
    });
    
    // AI assist button
    document.getElementById('aiAssistProjectBtn')?.addEventListener('click', () => {
      this.openAIAssist();
    });
    
    // Search
    document.getElementById('projectsSearch')?.addEventListener('input', (e) => {
      this.filterProjects(e.target.value);
    });
    
    // Status filter
    document.getElementById('projectsStatusFilter')?.addEventListener('change', (e) => {
      this.filterByStatus(e.target.value);
    });
  },
  
  render() {
    const container = document.getElementById('projectsList');
    if (!container) return;
    
    if (this.projects.length === 0) {
      container.innerHTML = `
        <div class="ps-empty">
          <svg class="ps-empty-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
            <path d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z"/>
          </svg>
          <h3 class="ps-empty-title">No projects yet</h3>
          <p class="ps-empty-description">Create your first project to get started</p>
          <button class="ps-btn ps-btn-primary" onclick="ProjectsManager.openEditor()">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M12 5v14M5 12h14"/>
            </svg>
            Add Project
          </button>
        </div>
      `;
      return;
    }
    
    container.innerHTML = this.projects.map((project, index) => this.renderProjectCard(project, index)).join('');
    this.initDragDrop();
  },
  
  renderProjectCard(project, index) {
    const statusColors = {
      published: 'var(--ps-success)',
      draft: 'var(--ps-warning)',
      hidden: 'var(--ps-text-muted)'
    };
    
    const isFeatured = project.featured || false;
    const isHidden = project.status === 'hidden';
    const isFirst = index === 0;
    const isLast = index === this.projects.length - 1;
    
    return `
      <div class="ps-project-card ${isFeatured ? 'ps-project-featured' : ''} ${isHidden ? 'ps-project-hidden' : ''}" data-id="${project.id}" draggable="true">
        <div class="ps-project-card-drag">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <circle cx="9" cy="6" r="1"/><circle cx="15" cy="6" r="1"/>
            <circle cx="9" cy="12" r="1"/><circle cx="15" cy="12" r="1"/>
            <circle cx="9" cy="18" r="1"/><circle cx="15" cy="18" r="1"/>
          </svg>
        </div>
        <div class="ps-reorder-btns">
          <button class="ps-reorder-btn" onclick="ProjectsManager.moveProject('${project.id}', -1)" ${isFirst ? 'disabled' : ''} title="Move Up">
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <polyline points="18 15 12 9 6 15"/>
            </svg>
          </button>
          <button class="ps-reorder-btn" onclick="ProjectsManager.moveProject('${project.id}', 1)" ${isLast ? 'disabled' : ''} title="Move Down">
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <polyline points="6 9 12 15 18 9"/>
            </svg>
          </button>
        </div>
        <div class="ps-project-card-thumb">
          ${project.thumbnail ? `<img src="${project.thumbnail}" alt="${project.title}">` : `
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
              <rect x="3" y="3" width="18" height="18" rx="2"/>
              <circle cx="8.5" cy="8.5" r="1.5"/>
              <path d="M21 15l-5-5L5 21"/>
            </svg>
          `}
        </div>
        <div class="ps-project-card-content">
          <div class="ps-project-card-header">
            <h3 class="ps-project-card-title">${project.title}</h3>
            ${isFeatured ? '<span class="ps-badge ps-badge-featured">★</span>' : ''}
          </div>
          <p class="ps-project-card-desc">${project.description?.substring(0, 60) || 'No description'}...</p>
          <div class="ps-project-card-meta">
            <span class="ps-project-status" style="--status-color: ${statusColors[project.status] || statusColors.draft}">
              ${project.status || 'draft'}
            </span>
            <span class="ps-project-date">${this.formatDate(project.updatedAt)}</span>
          </div>
        </div>
        <div class="ps-project-card-actions">
          <button class="ps-action-btn" onclick="ProjectsManager.toggleFeatured('${project.id}')" title="${isFeatured ? 'Unfeature' : 'Feature'}">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="${isFeatured ? 'currentColor' : 'none'}" stroke="currentColor" stroke-width="2">
              <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/>
            </svg>
          </button>
          <button class="ps-action-btn" onclick="ProjectsManager.openEditor('${project.id}')" title="Edit">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7"/>
              <path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z"/>
            </svg>
          </button>
          <button class="ps-action-btn" onclick="ProjectsManager.duplicateProject('${project.id}')" title="Duplicate">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <rect x="9" y="9" width="13" height="13" rx="2" ry="2"/>
              <path d="M5 15H4a2 2 0 01-2-2V4a2 2 0 012-2h9a2 2 0 012 2v1"/>
            </svg>
          </button>
          <button class="ps-action-btn" onclick="ProjectsManager.toggleVisibility('${project.id}')" title="${isHidden ? 'Show' : 'Hide'}">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              ${isHidden ? `
                <path d="M17.94 17.94A10.07 10.07 0 0112 20c-7 0-11-8-11-8a18.45 18.45 0 015.06-5.94M9.9 4.24A9.12 9.12 0 0112 4c7 0 11 8 11 8a18.5 18.5 0 01-2.16 3.19m-6.72-1.07a3 3 0 11-4.24-4.24"/>
                <line x1="1" y1="1" x2="23" y2="23"/>
              ` : `
                <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
                <circle cx="12" cy="12" r="3"/>
              `}
            </svg>
          </button>
          <button class="ps-action-btn ps-action-danger" onclick="ProjectsManager.deleteProject('${project.id}')" title="Delete">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <polyline points="3 6 5 6 21 6"/>
              <path d="M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2"/>
            </svg>
          </button>
        </div>
      </div>
    `;
  },
  
  openEditor(projectId = null) {
    const modal = document.getElementById('projectEditorModal');
    const form = document.getElementById('projectEditorForm');
    const title = document.getElementById('projectEditorTitle');
    
    if (projectId) {
      this.currentProject = this.projects.find(p => p.id === projectId);
      title.textContent = 'Edit Project';
      this.populateForm(this.currentProject);
    } else {
      this.currentProject = null;
      title.textContent = 'New Project';
      form.reset();
      document.getElementById('projectImages').innerHTML = '';
      document.getElementById('projectLinks').innerHTML = '';
    }
    
    modal.classList.add('active');
  },
  
  closeEditor() {
    const modal = document.getElementById('projectEditorModal');
    modal.classList.remove('active');
    this.currentProject = null;
  },
  
  populateForm(project) {
    document.getElementById('projectTitle').value = project.title || '';
    document.getElementById('projectSlug').value = project.slug || '';
    document.getElementById('projectDescription').value = project.description || '';
    document.getElementById('projectStatus').value = project.status || 'draft';
    document.getElementById('projectCategory').value = project.category || '';
    document.getElementById('projectThumbnail').value = project.thumbnail || '';
    document.getElementById('projectTech').value = (project.technologies || []).join(', ');
    
    // Render images
    const imagesContainer = document.getElementById('projectImages');
    imagesContainer.innerHTML = (project.images || []).map((img, i) => `
      <div class="ps-image-item" data-index="${i}">
        <img src="${img}" alt="Project image">
        <button type="button" class="ps-image-remove" onclick="ProjectsManager.removeImage(${i})">×</button>
      </div>
    `).join('');
    
    // Render links
    const linksContainer = document.getElementById('projectLinks');
    linksContainer.innerHTML = (project.links || []).map((link, i) => `
      <div class="ps-link-item" data-index="${i}">
        <input type="text" value="${link.label}" placeholder="Label" class="ps-input ps-input-sm">
        <input type="url" value="${link.url}" placeholder="URL" class="ps-input ps-input-sm">
        <button type="button" class="ps-btn ps-btn-ghost ps-btn-icon" onclick="ProjectsManager.removeLink(${i})">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
          </svg>
        </button>
      </div>
    `).join('');
  },
  
  async saveProject() {
    const form = document.getElementById('projectEditorForm');
    const formData = new FormData(form);
    
    const project = {
      id: this.currentProject?.id || crypto.randomUUID(),
      title: formData.get('title') || 'Untitled Project',
      slug: formData.get('slug') || this.generateSlug(formData.get('title')),
      description: formData.get('description') || '',
      status: formData.get('status') || 'draft',
      category: formData.get('category') || '',
      thumbnail: formData.get('thumbnail') || '',
      technologies: (formData.get('technologies') || '').split(',').map(t => t.trim()).filter(Boolean),
      images: this.collectImages(),
      links: this.collectLinks(),
      order: this.currentProject?.order ?? this.projects.length,
      createdAt: this.currentProject?.createdAt || Date.now()
    };
    
    await Database.put(DB_STORES.PROJECTS, project);
    await this.loadProjects();
    this.render();
    this.closeEditor();
    
    // Sync to public site
    this.syncToPublicSite();
    
    Toast.show('Project saved successfully', 'success');
  },
  
  collectImages() {
    const container = document.getElementById('projectImages');
    return Array.from(container.querySelectorAll('.ps-image-item img')).map(img => img.src);
  },
  
  collectLinks() {
    const container = document.getElementById('projectLinks');
    return Array.from(container.querySelectorAll('.ps-link-item')).map(item => {
      const inputs = item.querySelectorAll('input');
      return { label: inputs[0].value, url: inputs[1].value };
    }).filter(link => link.label && link.url);
  },
  
  addImage() {
    const url = prompt('Enter image URL:');
    if (url) {
      const container = document.getElementById('projectImages');
      const index = container.children.length;
      container.insertAdjacentHTML('beforeend', `
        <div class="ps-image-item" data-index="${index}">
          <img src="${url}" alt="Project image">
          <button type="button" class="ps-image-remove" onclick="ProjectsManager.removeImage(${index})">×</button>
        </div>
      `);
    }
  },
  
  removeImage(index) {
    const container = document.getElementById('projectImages');
    const item = container.querySelector(`[data-index="${index}"]`);
    item?.remove();
  },
  
  addLink() {
    const container = document.getElementById('projectLinks');
    const index = container.children.length;
    container.insertAdjacentHTML('beforeend', `
      <div class="ps-link-item" data-index="${index}">
        <input type="text" placeholder="Label" class="ps-input ps-input-sm">
        <input type="url" placeholder="URL" class="ps-input ps-input-sm">
        <button type="button" class="ps-btn ps-btn-ghost ps-btn-icon" onclick="ProjectsManager.removeLink(${index})">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
          </svg>
        </button>
      </div>
    `);
  },
  
  removeLink(index) {
    const container = document.getElementById('projectLinks');
    const item = container.querySelector(`[data-index="${index}"]`);
    item?.remove();
  },
  
  async deleteProject(id) {
    if (!confirm('Are you sure you want to delete this project?')) return;
    
    await Database.delete(DB_STORES.PROJECTS, id);
    await this.loadProjects();
    this.render();
    this.syncToPublicSite();
    Toast.show('Project deleted', 'success');
  },
  
  async toggleVisibility(id) {
    const project = this.projects.find(p => p.id === id);
    if (!project) return;
    
    project.status = project.status === 'hidden' ? 'published' : 'hidden';
    await Database.put(DB_STORES.PROJECTS, project);
    await this.loadProjects();
    this.render();
    this.syncToPublicSite();
  },
  
  async toggleFeatured(id) {
    const project = this.projects.find(p => p.id === id);
    if (!project) return;
    
    project.featured = !project.featured;
    project.updatedAt = Date.now();
    await Database.put(DB_STORES.PROJECTS, project);
    await this.loadProjects();
    this.render();
    this.syncToPublicSite();
    Toast.show(project.featured ? 'Project featured' : 'Project unfeatured', 'success');
  },
  
  async duplicateProject(id) {
    const project = this.projects.find(p => p.id === id);
    if (!project) return;
    
    const duplicate = {
      ...project,
      id: `project_${Date.now()}`,
      title: `${project.title} (Copy)`,
      status: 'draft',
      featured: false,
      order: this.projects.length,
      createdAt: Date.now(),
      updatedAt: Date.now()
    };
    
    await Database.put(DB_STORES.PROJECTS, duplicate);
    await this.loadProjects();
    this.render();
    Toast.show('Project duplicated', 'success');
  },
  
  async moveProject(id, direction) {
    const index = this.projects.findIndex(p => p.id === id);
    if (index === -1) return;
    
    const newIndex = index + direction;
    if (newIndex < 0 || newIndex >= this.projects.length) return;
    
    // Swap orders
    const currentProject = this.projects[index];
    const targetProject = this.projects[newIndex];
    
    const tempOrder = currentProject.order;
    currentProject.order = targetProject.order;
    targetProject.order = tempOrder;
    
    await Database.put(DB_STORES.PROJECTS, currentProject);
    await Database.put(DB_STORES.PROJECTS, targetProject);
    await this.loadProjects();
    this.render();
    this.syncToPublicSite();
  },
  
  filterProjects(query) {
    const cards = document.querySelectorAll('.ps-project-card');
    const q = query.toLowerCase();
    
    cards.forEach(card => {
      const title = card.querySelector('.ps-project-card-title')?.textContent.toLowerCase() || '';
      const desc = card.querySelector('.ps-project-card-desc')?.textContent.toLowerCase() || '';
      card.style.display = (title.includes(q) || desc.includes(q)) ? '' : 'none';
    });
  },
  
  filterByStatus(status) {
    const cards = document.querySelectorAll('.ps-project-card');
    
    cards.forEach(card => {
      if (status === 'all') {
        card.style.display = '';
        return;
      }
      const cardStatus = card.querySelector('.ps-project-status')?.textContent.trim().toLowerCase();
      card.style.display = (cardStatus === status.toLowerCase()) ? '' : 'none';
    });
  },
  
  initDragDrop() {
    const container = document.getElementById('projectsList');
    let draggedItem = null;
    
    container.querySelectorAll('.ps-project-card').forEach(card => {
      card.addEventListener('dragstart', (e) => {
        draggedItem = card;
        card.classList.add('dragging');
        e.dataTransfer.effectAllowed = 'move';
      });
      
      card.addEventListener('dragend', () => {
        card.classList.remove('dragging');
        this.updateOrder();
      });
      
      card.addEventListener('dragover', (e) => {
        e.preventDefault();
        if (draggedItem !== card) {
          const rect = card.getBoundingClientRect();
          const midY = rect.top + rect.height / 2;
          if (e.clientY < midY) {
            container.insertBefore(draggedItem, card);
          } else {
            container.insertBefore(draggedItem, card.nextSibling);
          }
        }
      });
    });
  },
  
  async updateOrder() {
    const cards = document.querySelectorAll('.ps-project-card');
    const updates = [];
    
    cards.forEach((card, index) => {
      const id = card.dataset.id;
      const project = this.projects.find(p => p.id === id);
      if (project && project.order !== index) {
        project.order = index;
        updates.push(Database.put(DB_STORES.PROJECTS, project));
      }
    });
    
    await Promise.all(updates);
    await this.loadProjects();
    this.syncToPublicSite();
  },
  
  generateSlug(title) {
    return (title || 'project')
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)/g, '');
  },
  
  formatDate(timestamp) {
    if (!timestamp) return '';
    return new Date(timestamp).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  },
  
  syncToPublicSite() {
    // Store projects for public site consumption
    const publicProjects = this.projects
      .filter(p => p.status === 'published')
      .map(({ id, title, slug, description, thumbnail, technologies, links, category }) => ({
        id, title, slug, description, thumbnail, technologies, links, category
      }));
    
    localStorage.setItem('ps_public_projects', JSON.stringify(publicProjects));
    
    // Dispatch event for live update
    window.dispatchEvent(new CustomEvent('projectsUpdated', { detail: publicProjects }));
  },
  
  // AI Assist
  openAIAssist() {
    const description = document.getElementById('projectDescription').value;
    if (!description) {
      Toast.show('Please add a description first', 'warning');
      return;
    }
    
    AIAssist.open({
      content: description,
      type: 'project_description',
      onApply: (newContent) => {
        document.getElementById('projectDescription').value = newContent;
      }
    });
  }
};

// Export
window.ProjectsManager = ProjectsManager;
