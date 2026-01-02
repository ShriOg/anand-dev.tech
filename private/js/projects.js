/**
 * ═══════════════════════════════════════════════════════════
 * PRIVATE SPACE - PROJECTS MODULE
 * Idea dumps, research notes, TODO lists
 * ═══════════════════════════════════════════════════════════
 */

const PSProjects = (function() {
  'use strict';

  let _projects = [];
  let _selectedProject = null;
  let _activeTab = 'ideas';
  let _saveTimeout = null;

  /**
   * Load projects view
   */
  async function load() {
    await loadProjects();
    render();
  }

  /**
   * Load projects from storage
   */
  async function loadProjects() {
    try {
      _projects = await PSStorage.getAll(PSStorage.STORES.PROJECTS);
      _projects.sort((a, b) => b.updatedAt - a.updatedAt);
    } catch {
      _projects = [];
    }
  }

  /**
   * Render projects interface
   */
  function render() {
    const container = document.querySelector('#section-projects .ps-workspace');
    if (!container) return;

    container.innerHTML = `
      <div class="ps-projects">
        <div class="ps-projects-sidebar">
          <div class="ps-projects-header">
            <h3 class="ps-projects-title">Projects</h3>
            <button class="ps-btn ps-btn-sm ps-btn-primary" onclick="PSProjects.create()">
              <svg viewBox="0 0 24 24"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
              New
            </button>
          </div>
          
          <!-- Pinned: NowHang -->
          <div class="ps-pinned-project">
            <a href="/pages/nowhang/" class="ps-project-item pinned" target="_blank">
              <div class="ps-project-item-color" style="background: linear-gradient(135deg, #ec4899, #f43f5e)"></div>
              <div class="ps-project-item-content">
                <div class="ps-project-item-name">
                  <span>💝</span> NowHang
                </div>
                <div class="ps-project-item-meta">
                  <span>Special Project</span>
                </div>
              </div>
              <svg class="ps-external-icon" viewBox="0 0 24 24"><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/><polyline points="15 3 21 3 21 9"/><line x1="10" y1="14" x2="21" y2="3"/></svg>
            </a>
          </div>
          
          <div class="ps-projects-divider"></div>
          
          <div class="ps-projects-list">
            ${renderProjectList()}
          </div>
        </div>
        
        <div class="ps-projects-content">
          ${_selectedProject ? renderProjectContent() : renderEmptyState()}
        </div>
      </div>
    `;
  }

  /**
   * Render project list
   */
  function renderProjectList() {
    if (_projects.length === 0) {
      return `
        <div class="ps-empty" style="padding: 24px;">
          <p class="ps-empty-description">No projects yet</p>
        </div>
      `;
    }

    return _projects.map(project => {
      const isSelected = _selectedProject?.id === project.id;
      const todoCount = (project.todos || []).filter(t => !t.completed).length;
      const ideaCount = (project.ideas || []).length;
      
      return `
        <div class="ps-project-item ${isSelected ? 'active' : ''}" 
             onclick="PSProjects.select('${project.id}')">
          <div class="ps-project-item-color" style="background: ${project.color || '#6366f1'}"></div>
          <div class="ps-project-item-content">
            <div class="ps-project-item-name">${escapeHtml(project.name)}</div>
            <div class="ps-project-item-meta">
              ${todoCount > 0 ? `<span>${todoCount} todos</span>` : ''}
              ${ideaCount > 0 ? `<span>${ideaCount} ideas</span>` : ''}
            </div>
          </div>
          <button class="ps-project-item-menu" onclick="event.stopPropagation(); PSProjects.showMenu('${project.id}')">
            <svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="1"/><circle cx="12" cy="5" r="1"/><circle cx="12" cy="19" r="1"/></svg>
          </button>
        </div>
      `;
    }).join('');
  }

  /**
   * Render empty state
   */
  function renderEmptyState() {
    return `
      <div class="ps-empty">
        <div class="ps-empty-icon">
          <svg viewBox="0 0 24 24"><path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"/></svg>
        </div>
        <h3 class="ps-empty-title">Select a project</h3>
        <p class="ps-empty-description">Choose a project from the sidebar or create a new one to get started.</p>
      </div>
    `;
  }

  /**
   * Render project content
   */
  function renderProjectContent() {
    return `
      <div class="ps-project-header">
        <div class="ps-project-title-row">
          <div class="ps-project-color-picker">
            <button class="ps-project-color-btn" style="background: ${_selectedProject.color || '#6366f1'}" onclick="PSProjects.showColorPicker()"></button>
          </div>
          <input class="ps-project-title-input" 
                 type="text" 
                 value="${escapeHtml(_selectedProject.name)}"
                 placeholder="Project name"
                 oninput="PSProjects.updateName(this.value)">
        </div>
        <textarea class="ps-project-description"
                  placeholder="Add a description..."
                  oninput="PSProjects.updateDescription(this.value)">${escapeHtml(_selectedProject.description || '')}</textarea>
      </div>
      
      <div class="ps-project-tabs">
        <button class="ps-project-tab ${_activeTab === 'ideas' ? 'active' : ''}" onclick="PSProjects.setTab('ideas')">
          <svg viewBox="0 0 24 24"><path d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z"/></svg>
          Ideas
        </button>
        <button class="ps-project-tab ${_activeTab === 'todos' ? 'active' : ''}" onclick="PSProjects.setTab('todos')">
          <svg viewBox="0 0 24 24"><polyline points="9 11 12 14 22 4"/><path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"/></svg>
          TODOs
        </button>
        <button class="ps-project-tab ${_activeTab === 'research' ? 'active' : ''}" onclick="PSProjects.setTab('research')">
          <svg viewBox="0 0 24 24"><path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z"/><path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z"/></svg>
          Research
        </button>
      </div>
      
      <div class="ps-project-tab-content">
        ${_activeTab === 'ideas' ? renderIdeas() : ''}
        ${_activeTab === 'todos' ? renderTodos() : ''}
        ${_activeTab === 'research' ? renderResearch() : ''}
      </div>
    `;
  }

  /**
   * Render ideas tab
   */
  function renderIdeas() {
    const ideas = _selectedProject.ideas || [];

    return `
      <div class="ps-ideas">
        <div class="ps-ideas-input">
          <input type="text" 
                 id="newIdeaInput"
                 class="ps-input"
                 placeholder="Quick idea dump..."
                 onkeydown="if(event.key==='Enter') PSProjects.addIdea()">
          <button class="ps-btn ps-btn-primary" onclick="PSProjects.addIdea()">Add</button>
        </div>
        
        <div class="ps-ideas-list">
          ${ideas.length === 0 ? `
            <div class="ps-empty" style="padding: 32px;">
              <p class="ps-empty-description">Dump your ideas here. No judgment.</p>
            </div>
          ` : ideas.map(idea => `
            <div class="ps-idea-card" data-id="${idea.id}">
              <div class="ps-idea-content" onclick="PSProjects.editIdea('${idea.id}')">${escapeHtml(idea.content)}</div>
              <div class="ps-idea-meta">
                <span class="ps-idea-date">${formatDate(idea.createdAt)}</span>
                <div class="ps-idea-actions">
                  <button class="ps-idea-action" onclick="PSProjects.convertToTodo('${idea.id}')" title="Convert to TODO">
                    <svg viewBox="0 0 24 24"><polyline points="9 11 12 14 22 4"/><path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"/></svg>
                  </button>
                  <button class="ps-idea-action delete" onclick="PSProjects.deleteIdea('${idea.id}')" title="Delete">
                    <svg viewBox="0 0 24 24"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg>
                  </button>
                </div>
              </div>
            </div>
          `).join('')}
        </div>
      </div>
    `;
  }

  /**
   * Render TODOs tab
   */
  function renderTodos() {
    const todos = _selectedProject.todos || [];
    const pending = todos.filter(t => !t.completed);
    const completed = todos.filter(t => t.completed);

    return `
      <div class="ps-todos">
        <div class="ps-todos-input">
          <input type="text"
                 id="newTodoInput"
                 class="ps-input"
                 placeholder="Add a task..."
                 onkeydown="if(event.key==='Enter') PSProjects.addTodo()">
          <select id="todoPriority" class="ps-select" style="width: auto;">
            <option value="low">Low</option>
            <option value="medium" selected>Medium</option>
            <option value="high">High</option>
          </select>
          <button class="ps-btn ps-btn-primary" onclick="PSProjects.addTodo()">Add</button>
        </div>
        
        <div class="ps-todos-list">
          ${pending.length === 0 && completed.length === 0 ? `
            <div class="ps-empty" style="padding: 32px;">
              <p class="ps-empty-description">No tasks yet. Add your first todo above.</p>
            </div>
          ` : ''}
          
          ${pending.map(todo => renderTodoItem(todo)).join('')}
          
          ${completed.length > 0 ? `
            <div class="ps-todos-completed-header">
              <span>Completed (${completed.length})</span>
            </div>
            ${completed.map(todo => renderTodoItem(todo)).join('')}
          ` : ''}
        </div>
      </div>
    `;
  }

  /**
   * Render single TODO item
   */
  function renderTodoItem(todo) {
    return `
      <div class="ps-todo-item ${todo.completed ? 'completed' : ''} priority-${todo.priority || 'medium'}">
        <button class="ps-todo-checkbox" onclick="PSProjects.toggleTodo('${todo.id}')">
          ${todo.completed ? '<svg viewBox="0 0 24 24"><polyline points="20 6 9 17 4 12"/></svg>' : ''}
        </button>
        <span class="ps-todo-text">${escapeHtml(todo.text)}</span>
        <span class="ps-todo-priority">${todo.priority || 'medium'}</span>
        <button class="ps-todo-delete" onclick="PSProjects.deleteTodo('${todo.id}')">
          <svg viewBox="0 0 24 24"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
        </button>
      </div>
    `;
  }

  /**
   * Render research tab
   */
  function renderResearch() {
    const research = _selectedProject.research || '';

    return `
      <div class="ps-research">
        <div class="ps-research-editor">
          <textarea class="ps-research-textarea"
                    id="researchContent"
                    placeholder="Paste links, notes, snippets, anything useful for this project..."
                    oninput="PSProjects.updateResearch(this.value)">${escapeHtml(research)}</textarea>
        </div>
        <div class="ps-research-footer">
          <span class="ps-save-status" id="researchSaveStatus">
            <svg class="ps-save-status-icon icon-sm" viewBox="0 0 24 24"><polyline points="20 6 9 17 4 12"/></svg>
            Saved
          </span>
        </div>
      </div>
    `;
  }

  /**
   * Create new project
   */
  async function create() {
    const project = {
      id: PSCrypto.generateId(),
      name: 'Untitled Project',
      description: '',
      color: getRandomColor(),
      ideas: [],
      todos: [],
      research: '',
      createdAt: Date.now(),
      updatedAt: Date.now()
    };

    await PSStorage.save(PSStorage.STORES.PROJECTS, project);
    _projects.unshift(project);
    _selectedProject = project;
    _activeTab = 'ideas';
    render();

    // Focus name input
    setTimeout(() => {
      const input = document.querySelector('.ps-project-title-input');
      if (input) {
        input.focus();
        input.select();
      }
    }, 100);
  }

  /**
   * Select project
   */
  function select(id) {
    _selectedProject = _projects.find(p => p.id === id);
    _activeTab = 'ideas';
    render();
  }

  /**
   * Set active tab
   */
  function setTab(tab) {
    _activeTab = tab;
    render();
  }

  /**
   * Update project name
   */
  function updateName(name) {
    if (!_selectedProject) return;
    _selectedProject.name = name;
    scheduleSave();
  }

  /**
   * Update project description
   */
  function updateDescription(desc) {
    if (!_selectedProject) return;
    _selectedProject.description = desc;
    scheduleSave();
  }

  /**
   * Add idea
   */
  async function addIdea() {
    if (!_selectedProject) return;
    
    const input = document.getElementById('newIdeaInput');
    const content = input?.value.trim();
    if (!content) return;

    if (!_selectedProject.ideas) _selectedProject.ideas = [];
    
    _selectedProject.ideas.unshift({
      id: PSCrypto.generateId(),
      content,
      createdAt: Date.now()
    });

    input.value = '';
    await saveProject();
    render();
  }

  /**
   * Edit idea
   */
  async function editIdea(id) {
    if (!_selectedProject) return;
    
    const idea = _selectedProject.ideas?.find(i => i.id === id);
    if (!idea) return;

    const newContent = prompt('Edit idea:', idea.content);
    if (newContent !== null && newContent.trim()) {
      idea.content = newContent.trim();
      await saveProject();
      render();
    }
  }

  /**
   * Delete idea
   */
  async function deleteIdea(id) {
    if (!_selectedProject) return;
    
    _selectedProject.ideas = (_selectedProject.ideas || []).filter(i => i.id !== id);
    await saveProject();
    render();
  }

  /**
   * Convert idea to TODO
   */
  async function convertToTodo(ideaId) {
    if (!_selectedProject) return;
    
    const idea = _selectedProject.ideas?.find(i => i.id === ideaId);
    if (!idea) return;

    if (!_selectedProject.todos) _selectedProject.todos = [];
    
    _selectedProject.todos.unshift({
      id: PSCrypto.generateId(),
      text: idea.content,
      priority: 'medium',
      completed: false,
      createdAt: Date.now()
    });

    _selectedProject.ideas = _selectedProject.ideas.filter(i => i.id !== ideaId);
    await saveProject();
    
    _activeTab = 'todos';
    render();
    
    PSUI.showToast('Idea converted to TODO');
  }

  /**
   * Add TODO
   */
  async function addTodo() {
    if (!_selectedProject) return;
    
    const input = document.getElementById('newTodoInput');
    const priority = document.getElementById('todoPriority');
    
    const text = input?.value.trim();
    if (!text) return;

    if (!_selectedProject.todos) _selectedProject.todos = [];
    
    _selectedProject.todos.unshift({
      id: PSCrypto.generateId(),
      text,
      priority: priority?.value || 'medium',
      completed: false,
      createdAt: Date.now()
    });

    input.value = '';
    await saveProject();
    render();
  }

  /**
   * Toggle TODO completion
   */
  async function toggleTodo(id) {
    if (!_selectedProject) return;
    
    const todo = _selectedProject.todos?.find(t => t.id === id);
    if (!todo) return;

    todo.completed = !todo.completed;
    todo.completedAt = todo.completed ? Date.now() : null;
    
    await saveProject();
    render();
  }

  /**
   * Delete TODO
   */
  async function deleteTodo(id) {
    if (!_selectedProject) return;
    
    _selectedProject.todos = (_selectedProject.todos || []).filter(t => t.id !== id);
    await saveProject();
    render();
  }

  /**
   * Update research notes
   */
  function updateResearch(content) {
    if (!_selectedProject) return;
    _selectedProject.research = content;
    scheduleSave();
    
    const status = document.getElementById('researchSaveStatus');
    if (status) {
      status.className = 'ps-save-status saving';
      status.innerHTML = `
        <svg class="ps-save-status-icon icon-sm" viewBox="0 0 24 24"><circle cx="12" cy="12" r="10"/><path d="M12 6v6l4 2"/></svg>
        Saving...
      `;
    }
  }

  /**
   * Schedule auto-save
   */
  function scheduleSave() {
    if (_saveTimeout) clearTimeout(_saveTimeout);
    
    _saveTimeout = setTimeout(async () => {
      await saveProject();
      
      const status = document.getElementById('researchSaveStatus');
      if (status) {
        status.className = 'ps-save-status saved';
        status.innerHTML = `
          <svg class="ps-save-status-icon icon-sm" viewBox="0 0 24 24"><polyline points="20 6 9 17 4 12"/></svg>
          Saved
        `;
      }
    }, 500);
  }

  /**
   * Save project
   */
  async function saveProject() {
    if (!_selectedProject) return;
    
    _selectedProject.updatedAt = Date.now();
    await PSStorage.save(PSStorage.STORES.PROJECTS, _selectedProject);
  }

  /**
   * Delete project
   */
  async function deleteProject(id) {
    const project = _projects.find(p => p.id === id);
    if (!project) return;

    const confirmed = confirm(`Delete "${project.name}"? This cannot be undone.`);
    if (!confirmed) return;

    await PSStorage.delete(PSStorage.STORES.PROJECTS, id);
    _projects = _projects.filter(p => p.id !== id);
    
    if (_selectedProject?.id === id) {
      _selectedProject = null;
    }
    
    render();
    PSUI.showToast('Project deleted');
  }

  /**
   * Show project menu
   */
  function showMenu(id) {
    const project = _projects.find(p => p.id === id);
    if (!project) return;

    PSUI.showModal(
      `<h3>${escapeHtml(project.name)}</h3>`,
      `
        <div class="ps-menu-options">
          <button class="ps-menu-option" onclick="PSUI.hideModal(); PSProjects.deleteProject('${id}')">
            <svg viewBox="0 0 24 24"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg>
            Delete Project
          </button>
        </div>
      `
    );
  }

  /**
   * Show color picker
   */
  function showColorPicker() {
    const colors = ['#ef4444', '#f97316', '#eab308', '#22c55e', '#14b8a6', '#06b6d4', '#3b82f6', '#6366f1', '#8b5cf6', '#ec4899'];
    
    PSUI.showModal(
      '<h3>Choose Color</h3>',
      `
        <div class="ps-color-grid">
          ${colors.map(color => `
            <button class="ps-color-option ${_selectedProject.color === color ? 'active' : ''}"
                    style="background: ${color}"
                    onclick="PSProjects.setColor('${color}')"></button>
          `).join('')}
        </div>
      `
    );
  }

  /**
   * Set project color
   */
  async function setColor(color) {
    if (!_selectedProject) return;
    
    _selectedProject.color = color;
    await saveProject();
    PSUI.hideModal();
    render();
  }

  /**
   * Get random color
   */
  function getRandomColor() {
    const colors = ['#ef4444', '#f97316', '#eab308', '#22c55e', '#14b8a6', '#06b6d4', '#3b82f6', '#6366f1', '#8b5cf6', '#ec4899'];
    return colors[Math.floor(Math.random() * colors.length)];
  }

  /**
   * Format date
   */
  function formatDate(ts) {
    const date = new Date(ts);
    return date.toLocaleDateString([], { month: 'short', day: 'numeric' });
  }

  /**
   * Escape HTML
   */
  function escapeHtml(str) {
    if (!str) return '';
    const div = document.createElement('div');
    div.textContent = str;
    return div.innerHTML;
  }

  return {
    load,
    create,
    select,
    setTab,
    updateName,
    updateDescription,
    addIdea,
    editIdea,
    deleteIdea,
    convertToTodo,
    addTodo,
    toggleTodo,
    deleteTodo,
    updateResearch,
    deleteProject,
    showMenu,
    showColorPicker,
    setColor
  };
})();

if (typeof module !== 'undefined' && module.exports) {
  module.exports = PSProjects;
}
