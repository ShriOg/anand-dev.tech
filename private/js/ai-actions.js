/**
 * ═══════════════════════════════════════════════════════════
 * PROFESSIONAL SPACE - AI ACTIONS MANAGER
 * Chat-based interface for managing projects, links, navigation
 * ═══════════════════════════════════════════════════════════
 */

const AIActions = {
  chatHistory: [],
  pendingAction: null,
  pendingData: {},
  
  // ═══════════════════════════════════════════════════════════
  // INITIALIZATION
  // ═══════════════════════════════════════════════════════════
  init() {
    this.bindEvents();
    console.log('[AI Actions] Initialized');
  },
  
  bindEvents() {
    const input = document.getElementById('aiChatInput');
    const sendBtn = document.getElementById('aiChatSend');
    
    input?.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        this.handleInput();
      }
    });
    
    sendBtn?.addEventListener('click', () => this.handleInput());
  },
  
  handleSuggestion(text) {
    const input = document.getElementById('aiChatInput');
    if (input) {
      input.value = text;
      this.handleInput();
    }
  },
  
  handleInput() {
    const input = document.getElementById('aiChatInput');
    const message = input?.value.trim();
    
    if (!message) return;
    
    // Add user message to chat
    this.addMessage('user', message);
    input.value = '';
    
    // Process the message
    this.processMessage(message);
  },
  
  // ═══════════════════════════════════════════════════════════
  // MESSAGE PROCESSING
  // ═══════════════════════════════════════════════════════════
  processMessage(message) {
    const lower = message.toLowerCase().trim();
    
    // If there's a pending action requiring input
    if (this.pendingAction) {
      this.handlePendingAction(message);
      return;
    }
    
    // Match commands
    if (this.matchCommand(lower, ['help', 'commands', 'what can you do'])) {
      this.showHelp();
    }
    // Projects
    else if (this.matchCommand(lower, ['list projects', 'show projects', 'all projects', 'list all projects'])) {
      this.listProjects();
    }
    else if (this.matchCommand(lower, ['add project', 'new project', 'create project', 'add new project'])) {
      this.startAddProject();
    }
    else if (this.matchCommand(lower, ['edit project', 'update project', 'modify project'])) {
      this.startEditProject(message);
    }
    else if (this.matchCommand(lower, ['delete project', 'remove project'])) {
      this.startDeleteProject(message);
    }
    else if (this.matchCommand(lower, ['featured projects', 'show featured'])) {
      this.listFeaturedProjects();
    }
    else if (this.matchCommand(lower, ['publish project'])) {
      this.startPublishProject(message);
    }
    else if (this.matchCommand(lower, ['hide project', 'unpublish project'])) {
      this.startHideProject(message);
    }
    // Navigation
    else if (this.matchCommand(lower, ['nav links', 'show nav', 'navigation', 'list nav', 'show nav links'])) {
      this.listNavLinks();
    }
    else if (this.matchCommand(lower, ['add nav', 'new nav link', 'add navigation', 'add nav link'])) {
      this.startAddNavLink();
    }
    else if (this.matchCommand(lower, ['edit nav', 'update nav'])) {
      this.startEditNavLink(message);
    }
    else if (this.matchCommand(lower, ['delete nav', 'remove nav'])) {
      this.startDeleteNavLink(message);
    }
    // Links
    else if (this.matchCommand(lower, ['project links', 'show links', 'list links'])) {
      this.listProjectLinks(message);
    }
    else if (this.matchCommand(lower, ['add link to'])) {
      this.startAddProjectLink(message);
    }
    else if (this.matchCommand(lower, ['edit link'])) {
      this.startEditProjectLink(message);
    }
    // Search
    else if (this.matchCommand(lower, ['search', 'find'])) {
      this.searchProjects(message);
    }
    // Stats
    else if (this.matchCommand(lower, ['stats', 'statistics', 'overview', 'summary'])) {
      this.showStats();
    }
    // Sync
    else if (this.matchCommand(lower, ['sync', 'sync projects', 'sync all'])) {
      this.syncAll();
    }
    // AI suggestions
    else if (this.matchCommand(lower, ['suggest', 'improve', 'optimize'])) {
      this.startAISuggestion(message);
    }
    else {
      // Try to understand with AI or show not understood
      this.handleUnknownCommand(message);
    }
  },
  
  matchCommand(input, commands) {
    return commands.some(cmd => input.includes(cmd));
  },
  
  // ═══════════════════════════════════════════════════════════
  // HELP & STATS
  // ═══════════════════════════════════════════════════════════
  showHelp() {
    const helpText = `
      <p><strong>Here's what I can do:</strong></p>
      <div class="ai-help-section">
        <h5>📦 Projects</h5>
        <ul>
          <li><code>list projects</code> - Show all projects</li>
          <li><code>add new project</code> - Create a project</li>
          <li><code>edit project [name]</code> - Modify a project</li>
          <li><code>delete project [name]</code> - Remove a project</li>
          <li><code>publish project [name]</code> - Make public</li>
          <li><code>hide project [name]</code> - Make private</li>
          <li><code>featured projects</code> - Show featured</li>
          <li><code>search [query]</code> - Find projects</li>
        </ul>
      </div>
      <div class="ai-help-section">
        <h5>🔗 Navigation</h5>
        <ul>
          <li><code>show nav links</code> - List nav items</li>
          <li><code>add nav link</code> - Add navigation</li>
          <li><code>edit nav [name]</code> - Modify nav link</li>
          <li><code>delete nav [name]</code> - Remove nav link</li>
        </ul>
      </div>
      <div class="ai-help-section">
        <h5>🔗 Project Links</h5>
        <ul>
          <li><code>show links [project]</code> - List project links</li>
          <li><code>add link to [project]</code> - Add a link</li>
          <li><code>edit link [project]</code> - Modify link</li>
        </ul>
      </div>
      <div class="ai-help-section">
        <h5>✨ Other</h5>
        <ul>
          <li><code>stats</code> - Show overview</li>
          <li><code>sync</code> - Sync to website</li>
          <li><code>suggest [project]</code> - AI improvements</li>
        </ul>
      </div>
    `;
    this.addMessage('bot', helpText);
  },
  
  showStats() {
    const projects = ProApp.projects || [];
    const navLinks = ProApp.navLinks || [];
    
    const published = projects.filter(p => p.status === 'published').length;
    const draft = projects.filter(p => p.status === 'draft').length;
    const hidden = projects.filter(p => p.status === 'hidden').length;
    const featured = projects.filter(p => p.featured).length;
    
    const techSet = new Set();
    projects.forEach(p => (p.tech || []).forEach(t => techSet.add(t)));
    
    const statsHtml = `
      <div class="ai-stats-grid">
        <div class="ai-stat-card">
          <span class="ai-stat-value">${projects.length}</span>
          <span class="ai-stat-label">Total Projects</span>
        </div>
        <div class="ai-stat-card">
          <span class="ai-stat-value">${published}</span>
          <span class="ai-stat-label">Published</span>
        </div>
        <div class="ai-stat-card">
          <span class="ai-stat-value">${draft}</span>
          <span class="ai-stat-label">Drafts</span>
        </div>
        <div class="ai-stat-card">
          <span class="ai-stat-value">${featured}</span>
          <span class="ai-stat-label">Featured</span>
        </div>
        <div class="ai-stat-card">
          <span class="ai-stat-value">${techSet.size}</span>
          <span class="ai-stat-label">Technologies</span>
        </div>
        <div class="ai-stat-card">
          <span class="ai-stat-value">${navLinks.length}</span>
          <span class="ai-stat-label">Nav Links</span>
        </div>
      </div>
    `;
    this.addMessage('bot', statsHtml);
  },
  
  // ═══════════════════════════════════════════════════════════
  // PROJECTS - LIST
  // ═══════════════════════════════════════════════════════════
  listProjects() {
    const projects = ProApp.projects || [];
    
    if (projects.length === 0) {
      this.addMessage('bot', `
        <p>No projects found. Would you like to add one?</p>
        <button class="ai-action-btn-inline" onclick="AIActions.startAddProject()">Add Project</button>
      `);
      return;
    }
    
    const projectsHtml = projects.map(p => `
      <div class="ai-project-item">
        <div class="ai-project-info">
          <span class="ai-project-name">${this.escapeHtml(p.title)}</span>
          <span class="ai-project-status ${p.status || 'draft'}">${p.status || 'draft'}</span>
          ${p.featured ? '<span class="ai-project-featured">★</span>' : ''}
        </div>
        <div class="ai-project-actions-inline">
          <button onclick="AIActions.quickEdit('${p.id}')" title="Edit">✏️</button>
          <button onclick="AIActions.quickToggleStatus('${p.id}')" title="Toggle Status">👁️</button>
          <button onclick="AIActions.quickDelete('${p.id}')" title="Delete">🗑️</button>
        </div>
      </div>
    `).join('');
    
    this.addMessage('bot', `
      <p><strong>${projects.length} Projects:</strong></p>
      <div class="ai-projects-list">${projectsHtml}</div>
    `);
  },
  
  listFeaturedProjects() {
    const projects = (ProApp.projects || []).filter(p => p.featured);
    
    if (projects.length === 0) {
      this.addMessage('bot', 'No featured projects. Use "edit project [name]" to feature a project.');
      return;
    }
    
    const projectsHtml = projects.map(p => `
      <div class="ai-project-item">
        <div class="ai-project-info">
          <span class="ai-project-name">${this.escapeHtml(p.title)}</span>
          <span class="ai-project-featured">★ Featured</span>
        </div>
      </div>
    `).join('');
    
    this.addMessage('bot', `
      <p><strong>${projects.length} Featured Projects:</strong></p>
      <div class="ai-projects-list">${projectsHtml}</div>
    `);
  },
  
  searchProjects(message) {
    const query = message.replace(/search|find/gi, '').trim().toLowerCase();
    
    if (!query) {
      this.addMessage('bot', 'What would you like to search for? Example: "search python"');
      return;
    }
    
    const projects = (ProApp.projects || []).filter(p => 
      p.title?.toLowerCase().includes(query) ||
      p.description?.toLowerCase().includes(query) ||
      (p.tech || []).some(t => t.toLowerCase().includes(query))
    );
    
    if (projects.length === 0) {
      this.addMessage('bot', `No projects found matching "${query}".`);
      return;
    }
    
    const projectsHtml = projects.map(p => `
      <div class="ai-project-item">
        <div class="ai-project-info">
          <span class="ai-project-name">${this.escapeHtml(p.title)}</span>
          <span class="ai-project-status ${p.status || 'draft'}">${p.status || 'draft'}</span>
        </div>
        <div class="ai-project-actions-inline">
          <button onclick="AIActions.quickEdit('${p.id}')" title="Edit">✏️</button>
        </div>
      </div>
    `).join('');
    
    this.addMessage('bot', `
      <p><strong>Found ${projects.length} project(s) matching "${query}":</strong></p>
      <div class="ai-projects-list">${projectsHtml}</div>
    `);
  },
  
  // ═══════════════════════════════════════════════════════════
  // PROJECTS - ADD
  // ═══════════════════════════════════════════════════════════
  startAddProject() {
    this.pendingAction = 'add_project_title';
    this.pendingData = {};
    this.addMessage('bot', 'Let\'s create a new project. What\'s the <strong>title</strong>?');
  },
  
  handlePendingAction(input) {
    switch(this.pendingAction) {
      // Add Project Flow
      case 'add_project_title':
        this.pendingData.title = input;
        this.pendingAction = 'add_project_description';
        this.addMessage('bot', `Great! "${input}" sounds good. Now enter a <strong>description</strong>:`);
        break;
        
      case 'add_project_description':
        this.pendingData.description = input;
        this.pendingAction = 'add_project_tech';
        this.addMessage('bot', 'What <strong>technologies</strong> are used? (comma-separated, e.g., "React, Node.js, MongoDB")');
        break;
        
      case 'add_project_tech':
        this.pendingData.tech = input.split(',').map(t => t.trim()).filter(Boolean);
        this.pendingAction = 'add_project_status';
        this.addMessage('bot', `
          What's the <strong>status</strong>?
          <div class="ai-choice-buttons">
            <button class="ai-choice-btn" onclick="AIActions.continueWithValue('published')">Published</button>
            <button class="ai-choice-btn" onclick="AIActions.continueWithValue('draft')">Draft</button>
            <button class="ai-choice-btn" onclick="AIActions.continueWithValue('hidden')">Hidden</button>
          </div>
        `);
        break;
        
      case 'add_project_status':
        this.pendingData.status = input.toLowerCase();
        this.completeAddProject();
        break;
        
      // Edit Project Flow
      case 'edit_project_select':
        this.selectProjectForEdit(input);
        break;
        
      case 'edit_project_field':
        this.selectFieldToEdit(input);
        break;
        
      case 'edit_project_value':
        this.applyProjectEdit(input);
        break;
        
      // Delete Project Flow
      case 'delete_project_select':
        this.selectProjectForDelete(input);
        break;
        
      case 'delete_project_confirm':
        this.confirmDelete(input);
        break;
        
      // Navigation Flow
      case 'add_nav_label':
        this.pendingData.label = input;
        this.pendingAction = 'add_nav_url';
        this.addMessage('bot', 'What\'s the <strong>URL</strong> or path? (e.g., "/projects" or "https://...")');
        break;
        
      case 'add_nav_url':
        this.pendingData.url = input;
        this.pendingAction = 'add_nav_icon';
        this.addMessage('bot', `
          Choose an <strong>icon</strong> (optional):
          <div class="ai-choice-buttons">
            <button class="ai-choice-btn" onclick="AIActions.continueWithValue('home')">🏠 Home</button>
            <button class="ai-choice-btn" onclick="AIActions.continueWithValue('projects')">📦 Projects</button>
            <button class="ai-choice-btn" onclick="AIActions.continueWithValue('contact')">📧 Contact</button>
            <button class="ai-choice-btn" onclick="AIActions.continueWithValue('about')">👤 About</button>
            <button class="ai-choice-btn" onclick="AIActions.continueWithValue('none')">Skip</button>
          </div>
        `);
        break;
        
      case 'add_nav_icon':
        this.pendingData.icon = input !== 'none' ? input : '';
        this.completeAddNavLink();
        break;
        
      case 'edit_nav_select':
        this.selectNavForEdit(input);
        break;
        
      case 'edit_nav_field':
        this.selectNavFieldToEdit(input);
        break;
        
      case 'edit_nav_value':
        this.applyNavEdit(input);
        break;
        
      case 'delete_nav_select':
        this.selectNavForDelete(input);
        break;
        
      case 'delete_nav_confirm':
        this.confirmNavDelete(input);
        break;
        
      // Project Links Flow
      case 'add_link_project':
        this.selectProjectForLink(input);
        break;
        
      case 'add_link_label':
        this.pendingData.linkLabel = input;
        this.pendingAction = 'add_link_url';
        this.addMessage('bot', 'What\'s the <strong>link URL</strong>?');
        break;
        
      case 'add_link_url':
        this.pendingData.linkUrl = input;
        this.completeAddProjectLink();
        break;
        
      default:
        this.pendingAction = null;
        this.pendingData = {};
        this.handleUnknownCommand(input);
    }
  },
  
  continueWithValue(value) {
    const input = document.getElementById('aiChatInput');
    if (input) {
      input.value = value;
      this.handleInput();
    }
  },
  
  async completeAddProject() {
    const project = {
      id: `project_${Date.now()}`,
      title: this.pendingData.title,
      description: this.pendingData.description,
      tech: this.pendingData.tech,
      status: this.pendingData.status || 'draft',
      slug: this.generateSlug(this.pendingData.title),
      featured: false,
      images: [],
      links: [],
      order: (ProApp.projects?.length || 0),
      createdAt: Date.now(),
      updatedAt: Date.now()
    };
    
    try {
      await Database.put('projects', project);
      await ProApp.loadProjects();
      
      this.addMessage('bot', `
        <div class="ai-success-message">
          ✅ Project "<strong>${this.escapeHtml(project.title)}</strong>" created successfully!
          <div class="ai-project-summary">
            <p>Status: ${project.status}</p>
            <p>Tech: ${project.tech.join(', ') || 'None'}</p>
          </div>
          <div class="ai-action-buttons">
            <button class="ai-action-btn-inline" onclick="AIActions.quickEdit('${project.id}')">Edit Details</button>
            <button class="ai-action-btn-inline" onclick="AIActions.addLinkToProject('${project.id}')">Add Links</button>
          </div>
        </div>
      `);
    } catch (e) {
      this.addMessage('bot', `❌ Failed to create project: ${e.message}`);
    }
    
    this.pendingAction = null;
    this.pendingData = {};
  },
  
  // ═══════════════════════════════════════════════════════════
  // PROJECTS - EDIT
  // ═══════════════════════════════════════════════════════════
  startEditProject(message) {
    const projectName = message.replace(/edit|update|modify|project/gi, '').trim();
    
    if (projectName) {
      this.selectProjectForEdit(projectName);
    } else {
      const projects = ProApp.projects || [];
      if (projects.length === 0) {
        this.addMessage('bot', 'No projects to edit. Create one first!');
        return;
      }
      
      const projectsHtml = projects.map(p => `
        <button class="ai-choice-btn-full" onclick="AIActions.quickEdit('${p.id}')">${this.escapeHtml(p.title)}</button>
      `).join('');
      
      this.pendingAction = 'edit_project_select';
      this.addMessage('bot', `
        <p>Which project would you like to edit?</p>
        <div class="ai-choice-list">${projectsHtml}</div>
      `);
    }
  },
  
  selectProjectForEdit(input) {
    const projects = ProApp.projects || [];
    const project = projects.find(p => 
      p.title?.toLowerCase().includes(input.toLowerCase()) ||
      p.id === input
    );
    
    if (!project) {
      this.addMessage('bot', `Project "${input}" not found. Try "list projects" to see all.`);
      this.pendingAction = null;
      return;
    }
    
    this.pendingData.projectId = project.id;
    this.pendingAction = 'edit_project_field';
    
    this.addMessage('bot', `
      <p>Editing "<strong>${this.escapeHtml(project.title)}</strong>". What would you like to change?</p>
      <div class="ai-choice-buttons">
        <button class="ai-choice-btn" onclick="AIActions.continueWithValue('title')">Title</button>
        <button class="ai-choice-btn" onclick="AIActions.continueWithValue('description')">Description</button>
        <button class="ai-choice-btn" onclick="AIActions.continueWithValue('tech')">Tech Stack</button>
        <button class="ai-choice-btn" onclick="AIActions.continueWithValue('status')">Status</button>
        <button class="ai-choice-btn" onclick="AIActions.continueWithValue('featured')">Featured</button>
        <button class="ai-choice-btn" onclick="AIActions.continueWithValue('cancel')">Cancel</button>
      </div>
    `);
  },
  
  selectFieldToEdit(field) {
    if (field === 'cancel') {
      this.pendingAction = null;
      this.pendingData = {};
      this.addMessage('bot', 'Edit cancelled. What else can I help with?');
      return;
    }
    
    const project = ProApp.projects.find(p => p.id === this.pendingData.projectId);
    if (!project) {
      this.addMessage('bot', 'Project not found. Please try again.');
      this.pendingAction = null;
      return;
    }
    
    this.pendingData.field = field;
    this.pendingAction = 'edit_project_value';
    
    switch(field) {
      case 'title':
        this.addMessage('bot', `Current title: "${project.title}"\n\nEnter the new <strong>title</strong>:`);
        break;
      case 'description':
        this.addMessage('bot', `Current: "${project.description?.substring(0, 100) || 'None'}..."\n\nEnter the new <strong>description</strong>:`);
        break;
      case 'tech':
        this.addMessage('bot', `Current: ${project.tech?.join(', ') || 'None'}\n\nEnter new <strong>technologies</strong> (comma-separated):`);
        break;
      case 'status':
        this.addMessage('bot', `
          Current status: ${project.status || 'draft'}
          <div class="ai-choice-buttons">
            <button class="ai-choice-btn" onclick="AIActions.continueWithValue('published')">Published</button>
            <button class="ai-choice-btn" onclick="AIActions.continueWithValue('draft')">Draft</button>
            <button class="ai-choice-btn" onclick="AIActions.continueWithValue('hidden')">Hidden</button>
          </div>
        `);
        break;
      case 'featured':
        this.addMessage('bot', `
          Currently ${project.featured ? 'featured' : 'not featured'}
          <div class="ai-choice-buttons">
            <button class="ai-choice-btn" onclick="AIActions.continueWithValue('yes')">Feature It</button>
            <button class="ai-choice-btn" onclick="AIActions.continueWithValue('no')">Unfeature</button>
          </div>
        `);
        break;
    }
  },
  
  async applyProjectEdit(value) {
    const project = ProApp.projects.find(p => p.id === this.pendingData.projectId);
    if (!project) {
      this.addMessage('bot', 'Project not found.');
      this.pendingAction = null;
      return;
    }
    
    const field = this.pendingData.field;
    
    switch(field) {
      case 'title':
        project.title = value;
        project.slug = this.generateSlug(value);
        break;
      case 'description':
        project.description = value;
        break;
      case 'tech':
        project.tech = value.split(',').map(t => t.trim()).filter(Boolean);
        break;
      case 'status':
        project.status = value.toLowerCase();
        break;
      case 'featured':
        project.featured = value.toLowerCase() === 'yes';
        break;
    }
    
    project.updatedAt = Date.now();
    
    try {
      await Database.put('projects', project);
      await ProApp.loadProjects();
      
      this.addMessage('bot', `✅ Project updated! ${field} is now "${field === 'tech' ? project.tech.join(', ') : project[field]}"`);
    } catch (e) {
      this.addMessage('bot', `❌ Failed to update: ${e.message}`);
    }
    
    this.pendingAction = null;
    this.pendingData = {};
  },
  
  quickEdit(projectId) {
    this.pendingData = { projectId };
    const project = ProApp.projects.find(p => p.id === projectId);
    if (project) {
      this.selectProjectForEdit(project.title);
    }
  },
  
  // ═══════════════════════════════════════════════════════════
  // PROJECTS - DELETE
  // ═══════════════════════════════════════════════════════════
  startDeleteProject(message) {
    const projectName = message.replace(/delete|remove|project/gi, '').trim();
    
    if (projectName) {
      this.selectProjectForDelete(projectName);
    } else {
      this.pendingAction = 'delete_project_select';
      this.addMessage('bot', 'Which project do you want to delete? Type the name or "cancel" to abort.');
    }
  },
  
  selectProjectForDelete(input) {
    if (input.toLowerCase() === 'cancel') {
      this.pendingAction = null;
      this.addMessage('bot', 'Delete cancelled.');
      return;
    }
    
    const project = ProApp.projects.find(p => 
      p.title?.toLowerCase().includes(input.toLowerCase())
    );
    
    if (!project) {
      this.addMessage('bot', `Project "${input}" not found.`);
      this.pendingAction = null;
      return;
    }
    
    this.pendingData.projectId = project.id;
    this.pendingData.projectTitle = project.title;
    this.pendingAction = 'delete_project_confirm';
    
    this.addMessage('bot', `
      <p>⚠️ Are you sure you want to delete "<strong>${this.escapeHtml(project.title)}</strong>"?</p>
      <p>This cannot be undone.</p>
      <div class="ai-choice-buttons">
        <button class="ai-choice-btn ai-choice-danger" onclick="AIActions.continueWithValue('yes')">Yes, Delete</button>
        <button class="ai-choice-btn" onclick="AIActions.continueWithValue('no')">Cancel</button>
      </div>
    `);
  },
  
  async confirmDelete(input) {
    if (input.toLowerCase() !== 'yes') {
      this.addMessage('bot', 'Delete cancelled.');
      this.pendingAction = null;
      this.pendingData = {};
      return;
    }
    
    try {
      await Database.delete('projects', this.pendingData.projectId);
      await ProApp.loadProjects();
      this.addMessage('bot', `✅ Project "${this.pendingData.projectTitle}" deleted.`);
    } catch (e) {
      this.addMessage('bot', `❌ Failed to delete: ${e.message}`);
    }
    
    this.pendingAction = null;
    this.pendingData = {};
  },
  
  async quickDelete(projectId) {
    const project = ProApp.projects.find(p => p.id === projectId);
    if (!project) return;
    
    this.pendingData = { projectId, projectTitle: project.title };
    this.pendingAction = 'delete_project_confirm';
    
    this.addMessage('bot', `
      <p>⚠️ Delete "<strong>${this.escapeHtml(project.title)}</strong>"?</p>
      <div class="ai-choice-buttons">
        <button class="ai-choice-btn ai-choice-danger" onclick="AIActions.continueWithValue('yes')">Yes, Delete</button>
        <button class="ai-choice-btn" onclick="AIActions.continueWithValue('no')">Cancel</button>
      </div>
    `);
  },
  
  async quickToggleStatus(projectId) {
    const project = ProApp.projects.find(p => p.id === projectId);
    if (!project) return;
    
    const newStatus = project.status === 'published' ? 'hidden' : 'published';
    project.status = newStatus;
    project.updatedAt = Date.now();
    
    try {
      await Database.put('projects', project);
      await ProApp.loadProjects();
      this.addMessage('bot', `✅ "${project.title}" is now ${newStatus}.`);
    } catch (e) {
      this.addMessage('bot', `❌ Failed: ${e.message}`);
    }
  },
  
  // ═══════════════════════════════════════════════════════════
  // PROJECTS - PUBLISH/HIDE
  // ═══════════════════════════════════════════════════════════
  async startPublishProject(message) {
    const projectName = message.replace(/publish|project/gi, '').trim();
    const project = ProApp.projects.find(p => 
      p.title?.toLowerCase().includes(projectName.toLowerCase())
    );
    
    if (!project) {
      this.addMessage('bot', `Project "${projectName}" not found.`);
      return;
    }
    
    project.status = 'published';
    project.updatedAt = Date.now();
    
    try {
      await Database.put('projects', project);
      await ProApp.loadProjects();
      this.addMessage('bot', `✅ "${project.title}" is now published!`);
    } catch (e) {
      this.addMessage('bot', `❌ Failed: ${e.message}`);
    }
  },
  
  async startHideProject(message) {
    const projectName = message.replace(/hide|unpublish|project/gi, '').trim();
    const project = ProApp.projects.find(p => 
      p.title?.toLowerCase().includes(projectName.toLowerCase())
    );
    
    if (!project) {
      this.addMessage('bot', `Project "${projectName}" not found.`);
      return;
    }
    
    project.status = 'hidden';
    project.updatedAt = Date.now();
    
    try {
      await Database.put('projects', project);
      await ProApp.loadProjects();
      this.addMessage('bot', `✅ "${project.title}" is now hidden.`);
    } catch (e) {
      this.addMessage('bot', `❌ Failed: ${e.message}`);
    }
  },
  
  // ═══════════════════════════════════════════════════════════
  // NAVIGATION LINKS
  // ═══════════════════════════════════════════════════════════
  listNavLinks() {
    const navLinks = ProApp.navLinks || [];
    
    if (navLinks.length === 0) {
      this.addMessage('bot', `
        <p>No navigation links configured.</p>
        <button class="ai-action-btn-inline" onclick="AIActions.startAddNavLink()">Add Nav Link</button>
      `);
      return;
    }
    
    const linksHtml = navLinks.map(link => `
      <div class="ai-nav-item">
        <div class="ai-nav-info">
          <span class="ai-nav-label">${link.icon || ''} ${this.escapeHtml(link.label)}</span>
          <span class="ai-nav-url">${this.escapeHtml(link.url)}</span>
        </div>
        <div class="ai-project-actions-inline">
          <button onclick="AIActions.startEditNavLinkById('${link.id}')" title="Edit">✏️</button>
          <button onclick="AIActions.startDeleteNavLinkById('${link.id}')" title="Delete">🗑️</button>
        </div>
      </div>
    `).join('');
    
    this.addMessage('bot', `
      <p><strong>${navLinks.length} Navigation Links:</strong></p>
      <div class="ai-nav-list">${linksHtml}</div>
      <button class="ai-action-btn-inline" onclick="AIActions.startAddNavLink()">+ Add New</button>
    `);
  },
  
  startAddNavLink() {
    this.pendingAction = 'add_nav_label';
    this.pendingData = {};
    this.addMessage('bot', 'Let\'s add a nav link. What\'s the <strong>label</strong> (text that appears)?');
  },
  
  async completeAddNavLink() {
    const navLink = {
      id: `nav_${Date.now()}`,
      label: this.pendingData.label,
      url: this.pendingData.url,
      icon: this.pendingData.icon || '',
      order: (ProApp.navLinks?.length || 0),
      createdAt: Date.now()
    };
    
    try {
      await Database.put('navigation', navLink);
      await ProApp.loadNavigation();
      
      this.addMessage('bot', `
        <div class="ai-success-message">
          ✅ Nav link "<strong>${this.escapeHtml(navLink.label)}</strong>" added!
          <p>URL: ${this.escapeHtml(navLink.url)}</p>
        </div>
      `);
    } catch (e) {
      this.addMessage('bot', `❌ Failed: ${e.message}`);
    }
    
    this.pendingAction = null;
    this.pendingData = {};
  },
  
  startEditNavLink(message) {
    const navName = message.replace(/edit|update|nav|link|navigation/gi, '').trim();
    if (navName) {
      this.selectNavForEdit(navName);
    } else {
      this.pendingAction = 'edit_nav_select';
      this.addMessage('bot', 'Which nav link do you want to edit? Type the label or "cancel".');
    }
  },
  
  startEditNavLinkById(id) {
    const navLink = (ProApp.navLinks || []).find(n => n.id === id);
    if (navLink) {
      this.selectNavForEdit(navLink.label);
    }
  },
  
  selectNavForEdit(input) {
    if (input.toLowerCase() === 'cancel') {
      this.pendingAction = null;
      this.addMessage('bot', 'Edit cancelled.');
      return;
    }
    
    const navLink = (ProApp.navLinks || []).find(n => 
      n.label?.toLowerCase().includes(input.toLowerCase()) || n.id === input
    );
    
    if (!navLink) {
      this.addMessage('bot', `Nav link "${input}" not found.`);
      this.pendingAction = null;
      return;
    }
    
    this.pendingData.navId = navLink.id;
    this.pendingAction = 'edit_nav_field';
    
    this.addMessage('bot', `
      <p>Editing "<strong>${this.escapeHtml(navLink.label)}</strong>". What to change?</p>
      <div class="ai-choice-buttons">
        <button class="ai-choice-btn" onclick="AIActions.continueWithValue('label')">Label</button>
        <button class="ai-choice-btn" onclick="AIActions.continueWithValue('url')">URL</button>
        <button class="ai-choice-btn" onclick="AIActions.continueWithValue('cancel')">Cancel</button>
      </div>
    `);
  },
  
  selectNavFieldToEdit(field) {
    if (field === 'cancel') {
      this.pendingAction = null;
      this.pendingData = {};
      this.addMessage('bot', 'Edit cancelled.');
      return;
    }
    
    const navLink = (ProApp.navLinks || []).find(n => n.id === this.pendingData.navId);
    this.pendingData.field = field;
    this.pendingAction = 'edit_nav_value';
    
    if (field === 'label') {
      this.addMessage('bot', `Current: "${navLink.label}"\nEnter new <strong>label</strong>:`);
    } else {
      this.addMessage('bot', `Current: "${navLink.url}"\nEnter new <strong>URL</strong>:`);
    }
  },
  
  async applyNavEdit(value) {
    const navLinks = ProApp.navLinks || [];
    const navLink = navLinks.find(n => n.id === this.pendingData.navId);
    
    if (!navLink) {
      this.addMessage('bot', 'Nav link not found.');
      this.pendingAction = null;
      return;
    }
    
    navLink[this.pendingData.field] = value;
    
    try {
      await Database.put('navigation', navLink);
      await ProApp.loadNavigation();
      this.addMessage('bot', `✅ Nav link updated!`);
    } catch (e) {
      this.addMessage('bot', `❌ Failed: ${e.message}`);
    }
    
    this.pendingAction = null;
    this.pendingData = {};
  },
  
  startDeleteNavLink(message) {
    const navName = message.replace(/delete|remove|nav|link|navigation/gi, '').trim();
    if (navName) {
      this.selectNavForDelete(navName);
    } else {
      this.pendingAction = 'delete_nav_select';
      this.addMessage('bot', 'Which nav link to delete? Type the label or "cancel".');
    }
  },
  
  startDeleteNavLinkById(id) {
    const navLink = (ProApp.navLinks || []).find(n => n.id === id);
    if (navLink) {
      this.selectNavForDelete(navLink.label);
    }
  },
  
  selectNavForDelete(input) {
    if (input.toLowerCase() === 'cancel') {
      this.pendingAction = null;
      this.addMessage('bot', 'Delete cancelled.');
      return;
    }
    
    const navLink = (ProApp.navLinks || []).find(n => 
      n.label?.toLowerCase().includes(input.toLowerCase())
    );
    
    if (!navLink) {
      this.addMessage('bot', `Nav link "${input}" not found.`);
      this.pendingAction = null;
      return;
    }
    
    this.pendingData.navId = navLink.id;
    this.pendingData.navLabel = navLink.label;
    this.pendingAction = 'delete_nav_confirm';
    
    this.addMessage('bot', `
      <p>⚠️ Delete nav link "<strong>${this.escapeHtml(navLink.label)}</strong>"?</p>
      <div class="ai-choice-buttons">
        <button class="ai-choice-btn ai-choice-danger" onclick="AIActions.continueWithValue('yes')">Yes, Delete</button>
        <button class="ai-choice-btn" onclick="AIActions.continueWithValue('no')">Cancel</button>
      </div>
    `);
  },
  
  async confirmNavDelete(input) {
    if (input.toLowerCase() !== 'yes') {
      this.addMessage('bot', 'Delete cancelled.');
      this.pendingAction = null;
      this.pendingData = {};
      return;
    }
    
    try {
      await Database.delete('navigation', this.pendingData.navId);
      await ProApp.loadNavigation();
      this.addMessage('bot', `✅ Nav link "${this.pendingData.navLabel}" deleted.`);
    } catch (e) {
      this.addMessage('bot', `❌ Failed: ${e.message}`);
    }
    
    this.pendingAction = null;
    this.pendingData = {};
  },
  
  // ═══════════════════════════════════════════════════════════
  // PROJECT LINKS
  // ═══════════════════════════════════════════════════════════
  listProjectLinks(message) {
    const projectName = message.replace(/project|links|show|list/gi, '').trim();
    
    if (!projectName) {
      this.addMessage('bot', 'Which project\'s links? Example: "show links AI Desktop"');
      return;
    }
    
    const project = ProApp.projects.find(p => 
      p.title?.toLowerCase().includes(projectName.toLowerCase())
    );
    
    if (!project) {
      this.addMessage('bot', `Project "${projectName}" not found.`);
      return;
    }
    
    const links = project.links || [];
    
    if (links.length === 0) {
      this.addMessage('bot', `
        <p>"${project.title}" has no links.</p>
        <button class="ai-action-btn-inline" onclick="AIActions.addLinkToProject('${project.id}')">Add Link</button>
      `);
      return;
    }
    
    const linksHtml = links.map((link, i) => `
      <div class="ai-link-item">
        <span class="ai-link-label">${this.escapeHtml(link.label)}</span>
        <a href="${link.url}" target="_blank" class="ai-link-url">${this.escapeHtml(link.url)}</a>
      </div>
    `).join('');
    
    this.addMessage('bot', `
      <p><strong>Links for "${project.title}":</strong></p>
      <div class="ai-links-list">${linksHtml}</div>
      <button class="ai-action-btn-inline" onclick="AIActions.addLinkToProject('${project.id}')">+ Add Link</button>
    `);
  },
  
  startAddProjectLink(message) {
    const projectName = message.replace(/add|link|to/gi, '').trim();
    
    if (projectName) {
      this.selectProjectForLink(projectName);
    } else {
      this.pendingAction = 'add_link_project';
      this.addMessage('bot', 'Which project should I add the link to?');
    }
  },
  
  addLinkToProject(projectId) {
    const project = ProApp.projects.find(p => p.id === projectId);
    if (!project) return;
    
    this.pendingData.projectId = projectId;
    this.pendingAction = 'add_link_label';
    this.addMessage('bot', `Adding link to "${project.title}". What's the <strong>link label</strong>? (e.g., "GitHub", "Live Demo")`);
  },
  
  selectProjectForLink(input) {
    const project = ProApp.projects.find(p => 
      p.title?.toLowerCase().includes(input.toLowerCase()) || p.id === input
    );
    
    if (!project) {
      this.addMessage('bot', `Project "${input}" not found.`);
      this.pendingAction = null;
      return;
    }
    
    this.pendingData.projectId = project.id;
    this.pendingAction = 'add_link_label';
    this.addMessage('bot', `Adding link to "${project.title}". What's the <strong>link label</strong>?`);
  },
  
  async completeAddProjectLink() {
    const project = ProApp.projects.find(p => p.id === this.pendingData.projectId);
    if (!project) {
      this.addMessage('bot', 'Project not found.');
      this.pendingAction = null;
      return;
    }
    
    if (!project.links) project.links = [];
    project.links.push({
      label: this.pendingData.linkLabel,
      url: this.pendingData.linkUrl
    });
    project.updatedAt = Date.now();
    
    try {
      await Database.put('projects', project);
      await ProApp.loadProjects();
      this.addMessage('bot', `✅ Link "${this.pendingData.linkLabel}" added to "${project.title}"!`);
    } catch (e) {
      this.addMessage('bot', `❌ Failed: ${e.message}`);
    }
    
    this.pendingAction = null;
    this.pendingData = {};
  },
  
  // ═══════════════════════════════════════════════════════════
  // SYNC & AI SUGGESTIONS
  // ═══════════════════════════════════════════════════════════
  async syncAll() {
    this.addMessage('bot', '🔄 Syncing...');
    
    try {
      if (ProApp.syncProjects) await ProApp.syncProjects();
      if (ProApp.syncNavigation) await ProApp.syncNavigation();
      await ProApp.loadProjects();
      await ProApp.loadNavigation();
      
      this.addMessage('bot', '✅ Sync complete! Data is up to date.');
    } catch (e) {
      this.addMessage('bot', `❌ Sync failed: ${e.message}`);
    }
  },
  
  async startAISuggestion(message) {
    const projectName = message.replace(/suggest|improve|optimize/gi, '').trim();
    
    if (!projectName) {
      this.addMessage('bot', 'Which project should I analyze? Example: "suggest AI Desktop"');
      return;
    }
    
    const project = ProApp.projects.find(p => 
      p.title?.toLowerCase().includes(projectName.toLowerCase())
    );
    
    if (!project) {
      this.addMessage('bot', `Project "${projectName}" not found.`);
      return;
    }
    
    // Open the AI panel with project tools
    if (AIAssistant && AIAssistant.openProjectAI) {
      AIAssistant.openProjectAI(project.id);
      this.addMessage('bot', `Opening AI tools for "${project.title}"...`);
    } else {
      this.addMessage('bot', `
        <p><strong>Quick Analysis for "${project.title}":</strong></p>
        <ul>
          ${!project.description || project.description.length < 50 ? '<li>⚠️ Description is too short</li>' : '<li>✅ Description looks good</li>'}
          ${!project.tech || project.tech.length === 0 ? '<li>⚠️ No technologies listed</li>' : '<li>✅ Has tech stack</li>'}
          ${!project.links || project.links.length === 0 ? '<li>⚠️ No links added</li>' : '<li>✅ Has project links</li>'}
          ${project.status !== 'published' ? '<li>⚠️ Not published yet</li>' : '<li>✅ Published</li>'}
        </ul>
      `);
    }
  },
  
  // ═══════════════════════════════════════════════════════════
  // UNKNOWN COMMAND HANDLER
  // ═══════════════════════════════════════════════════════════
  handleUnknownCommand(message) {
    // Try to match partial commands
    const lower = message.toLowerCase();
    
    if (lower.includes('project')) {
      this.addMessage('bot', `
        <p>I didn't quite get that. Here are project commands:</p>
        <ul>
          <li><code>list projects</code> - See all</li>
          <li><code>add project</code> - Create new</li>
          <li><code>edit project [name]</code> - Modify</li>
          <li><code>delete project [name]</code> - Remove</li>
        </ul>
      `);
    } else if (lower.includes('nav') || lower.includes('link')) {
      this.addMessage('bot', `
        <p>For navigation, try:</p>
        <ul>
          <li><code>show nav links</code> - List all</li>
          <li><code>add nav link</code> - Add new</li>
          <li><code>edit nav [name]</code> - Modify</li>
        </ul>
      `);
    } else {
      this.addMessage('bot', `
        <p>I didn't understand that. Type <strong>help</strong> to see what I can do.</p>
        <div class="ai-chat-suggestions">
          <button class="ai-suggestion-btn" onclick="AIActions.handleSuggestion('help')">Show Help</button>
          <button class="ai-suggestion-btn" onclick="AIActions.handleSuggestion('list projects')">List Projects</button>
        </div>
      `);
    }
  },
  
  // ═══════════════════════════════════════════════════════════
  // UI HELPERS
  // ═══════════════════════════════════════════════════════════
  addMessage(type, content) {
    const container = document.getElementById('aiChatMessages');
    if (!container) return;
    
    const messageDiv = document.createElement('div');
    messageDiv.className = `ai-chat-message ai-chat-${type}`;
    
    if (type === 'user') {
      messageDiv.innerHTML = `
        <div class="ai-chat-content">
          <p>${this.escapeHtml(content)}</p>
        </div>
        <div class="ai-chat-avatar ai-chat-avatar-user">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/>
            <circle cx="12" cy="7" r="4"/>
          </svg>
        </div>
      `;
    } else {
      messageDiv.innerHTML = `
        <div class="ai-chat-avatar">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M12 2L2 7l10 5 10-5-10-5z"/>
            <path d="M2 17l10 5 10-5"/>
            <path d="M2 12l10 5 10-5"/>
          </svg>
        </div>
        <div class="ai-chat-content">${content}</div>
      `;
    }
    
    container.appendChild(messageDiv);
    container.scrollTop = container.scrollHeight;
    
    this.chatHistory.push({ type, content });
  },
  
  escapeHtml(str) {
    if (!str) return '';
    const div = document.createElement('div');
    div.textContent = str;
    return div.innerHTML;
  },
  
  generateSlug(title) {
    return (title || 'project')
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)/g, '');
  }
};

// Initialize when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
  setTimeout(() => AIActions.init(), 600);
});

// Export
window.AIActions = AIActions;
