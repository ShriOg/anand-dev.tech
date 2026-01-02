/**
 * ═══════════════════════════════════════════════════════════
 * PRIVATE SPACE - NOTES MODULE
 * Markdown editor with folders, tags, and auto-save
 * ═══════════════════════════════════════════════════════════
 */

const PSNotes = (function() {
  'use strict';

  let _notes = [];
  let _folders = ['General', 'Ideas', 'Archive'];
  let _currentNote = null;
  let _saveTimeout = null;
  let _searchQuery = '';

  /**
   * Load notes view
   */
  async function load() {
    await loadNotes();
    render();
  }

  /**
   * Load all notes from storage
   */
  async function loadNotes() {
    try {
      _notes = await PSStorage.getAll(PSStorage.STORES.NOTES);
      _notes.sort((a, b) => (b.updatedAt || 0) - (a.updatedAt || 0));
      
      // Extract unique folders
      const folderSet = new Set(_folders);
      _notes.forEach(note => {
        if (note.folder) folderSet.add(note.folder);
      });
      _folders = Array.from(folderSet);
    } catch {
      _notes = [];
    }
  }

  /**
   * Render notes interface
   */
  function render() {
    const container = document.querySelector('#section-notes .ps-workspace');
    if (!container) return;

    container.innerHTML = `
      <div class="ps-notes">
        <div class="ps-notes-sidebar">
          <div class="ps-notes-sidebar-header">
            <input type="text" class="ps-input ps-input-search ps-notes-search" 
                   placeholder="Search notes..." 
                   value="${escapeHtml(_searchQuery)}"
                   oninput="PSNotes.search(this.value)">
            <div class="ps-notes-actions">
              <button class="ps-btn ps-btn-primary ps-btn-sm" onclick="PSNotes.createNote()">
                <svg class="icon-sm" viewBox="0 0 24 24"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
                New Note
              </button>
            </div>
          </div>
          <div class="ps-notes-tree">
            ${renderFolders()}
          </div>
        </div>
        
        <div class="ps-notes-editor">
          ${_currentNote ? renderEditor() : renderEmptyState()}
        </div>
      </div>
    `;

    if (_currentNote) {
      setupEditor();
    }
  }

  /**
   * Render folder structure
   */
  function renderFolders() {
    return _folders.map(folder => {
      const folderNotes = filterNotes().filter(n => (n.folder || 'General') === folder);
      
      return `
        <div class="ps-folder open">
          <div class="ps-folder-header" onclick="this.parentElement.classList.toggle('open')">
            <svg class="ps-folder-icon icon-sm" viewBox="0 0 24 24"><polyline points="9 18 15 12 9 6"/></svg>
            <span class="ps-folder-name">${escapeHtml(folder)}</span>
            <span class="ps-folder-count">${folderNotes.length}</span>
          </div>
          <div class="ps-folder-items">
            ${folderNotes.map(note => `
              <div class="ps-note-item ${note.id === _currentNote?.id ? 'active' : ''}" 
                   onclick="PSNotes.selectNote('${note.id}')">
                <svg class="ps-note-icon icon-sm" viewBox="0 0 24 24">
                  <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
                  <polyline points="14 2 14 8 20 8"/>
                </svg>
                <div class="ps-note-info">
                  <div class="ps-note-title">${escapeHtml(note.title || 'Untitled')}</div>
                  <div class="ps-note-preview">${escapeHtml((note.content || '').substring(0, 40))}</div>
                </div>
                <span class="ps-note-date">${formatDate(note.updatedAt)}</span>
              </div>
            `).join('')}
          </div>
        </div>
      `;
    }).join('');
  }

  /**
   * Filter notes based on search
   */
  function filterNotes() {
    if (!_searchQuery) return _notes;
    
    const query = _searchQuery.toLowerCase();
    return _notes.filter(note => 
      (note.title || '').toLowerCase().includes(query) ||
      (note.content || '').toLowerCase().includes(query) ||
      (note.tags || []).some(tag => tag.toLowerCase().includes(query))
    );
  }

  /**
   * Render editor
   */
  function renderEditor() {
    return `
      <div class="ps-editor-header">
        <input type="text" class="ps-editor-title-input" 
               id="noteTitle"
               value="${escapeHtml(_currentNote.title || '')}" 
               placeholder="Untitled"
               oninput="PSNotes.updateTitle(this.value)">
        <div class="ps-editor-actions">
          <div class="ps-save-status" id="saveStatus">
            <svg class="ps-save-status-icon icon-sm" viewBox="0 0 24 24"><polyline points="20 6 9 17 4 12"/></svg>
            <span>Saved</span>
          </div>
          <button class="ps-btn ps-btn-ghost ps-btn-icon" onclick="PSNotes.deleteNote()" title="Delete">
            <svg class="icon" viewBox="0 0 24 24"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg>
          </button>
        </div>
      </div>
      
      <div class="ps-editor-meta">
        <div class="ps-editor-folder-select">
          <svg class="icon-sm" viewBox="0 0 24 24"><path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"/></svg>
          <select class="ps-select" id="noteFolder" onchange="PSNotes.updateFolder(this.value)">
            ${_folders.map(f => `
              <option value="${f}" ${f === (_currentNote.folder || 'General') ? 'selected' : ''}>${f}</option>
            `).join('')}
          </select>
        </div>
        <div class="ps-editor-tags">
          <span class="ps-editor-tags-label">Tags:</span>
          <div class="ps-editor-tags-list" id="noteTags">
            ${(_currentNote.tags || []).map(tag => `
              <span class="ps-tag ps-tag-accent">
                ${escapeHtml(tag)}
                <button class="ps-tag-remove" onclick="PSNotes.removeTag('${escapeHtml(tag)}')">×</button>
              </span>
            `).join('')}
          </div>
          <input type="text" class="ps-editor-tag-input" 
                 id="tagInput"
                 placeholder="Add tag..." 
                 onkeydown="PSNotes.handleTagInput(event)">
        </div>
      </div>
      
      <div class="ps-editor-content">
        <textarea class="ps-markdown-editor" 
                  id="noteContent"
                  placeholder="Start writing..."
                  oninput="PSNotes.updateContent(this.value)">${escapeHtml(_currentNote.content || '')}</textarea>
      </div>
      
      <div class="ps-note-ai-actions">
        <button class="ps-note-ai-btn" onclick="PSNotes.aiAction('summarize')">
          <svg viewBox="0 0 24 24"><line x1="21" y1="10" x2="3" y2="10"/><line x1="21" y1="6" x2="3" y2="6"/><line x1="21" y1="14" x2="3" y2="14"/><line x1="21" y1="18" x2="3" y2="18"/></svg>
          Summarize
        </button>
        <button class="ps-note-ai-btn" onclick="PSNotes.aiAction('expand')">
          <svg viewBox="0 0 24 24"><path d="M12 2L2 7l10 5 10-5-10-5z"/><path d="M2 17l10 5 10-5"/><path d="M2 12l10 5 10-5"/></svg>
          Expand
        </button>
        <button class="ps-note-ai-btn" onclick="PSNotes.aiAction('related')">
          <svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="16"/><line x1="8" y1="12" x2="16" y2="12"/></svg>
          Find Related
        </button>
      </div>
    `;
  }

  /**
   * Render empty state
   */
  function renderEmptyState() {
    return `
      <div class="ps-empty">
        <svg class="ps-empty-icon icon" viewBox="0 0 24 24">
          <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
          <polyline points="14 2 14 8 20 8"/>
        </svg>
        <h4 class="ps-empty-title">No note selected</h4>
        <p class="ps-empty-description">Select a note from the sidebar or create a new one.</p>
        <button class="ps-btn ps-btn-primary" onclick="PSNotes.createNote()" style="margin-top: 16px;">
          Create Note
        </button>
      </div>
    `;
  }

  /**
   * Setup editor event listeners
   */
  function setupEditor() {
    const content = document.getElementById('noteContent');
    if (content) {
      content.focus();
    }
  }

  /**
   * Create new note
   */
  async function createNote(folder = 'General') {
    const note = {
      id: PSCrypto.generateId(),
      title: '',
      content: '',
      folder,
      tags: [],
      createdAt: Date.now(),
      updatedAt: Date.now()
    };

    await PSStorage.save(PSStorage.STORES.NOTES, note);
    _notes.unshift(note);
    _currentNote = note;
    render();
  }

  /**
   * Select note
   */
  async function selectNote(noteId) {
    const note = _notes.find(n => n.id === noteId);
    if (note) {
      _currentNote = note;
      render();
    }
  }

  /**
   * Update note title
   */
  function updateTitle(title) {
    if (_currentNote) {
      _currentNote.title = title;
      queueSave();
    }
  }

  /**
   * Update note content
   */
  function updateContent(content) {
    if (_currentNote) {
      _currentNote.content = content;
      queueSave();
    }
  }

  /**
   * Update note folder
   */
  function updateFolder(folder) {
    if (_currentNote) {
      _currentNote.folder = folder;
      queueSave();
    }
  }

  /**
   * Handle tag input
   */
  function handleTagInput(event) {
    if (event.key === 'Enter' || event.key === ',') {
      event.preventDefault();
      const input = event.target;
      const tag = input.value.trim().replace(',', '');
      
      if (tag && _currentNote) {
        if (!_currentNote.tags) _currentNote.tags = [];
        if (!_currentNote.tags.includes(tag)) {
          _currentNote.tags.push(tag);
          queueSave();
          render();
        }
      }
      input.value = '';
    }
  }

  /**
   * Remove tag
   */
  function removeTag(tag) {
    if (_currentNote && _currentNote.tags) {
      _currentNote.tags = _currentNote.tags.filter(t => t !== tag);
      queueSave();
      render();
    }
  }

  /**
   * Queue save with debounce
   */
  function queueSave() {
    if (_saveTimeout) {
      clearTimeout(_saveTimeout);
    }

    updateSaveStatus('saving');

    _saveTimeout = setTimeout(async () => {
      await saveNote();
      updateSaveStatus('saved');
    }, 500);
  }

  /**
   * Save current note
   */
  async function saveNote() {
    if (!_currentNote) return;

    _currentNote.updatedAt = Date.now();
    await PSStorage.save(PSStorage.STORES.NOTES, _currentNote);

    // Update notes list
    const index = _notes.findIndex(n => n.id === _currentNote.id);
    if (index !== -1) {
      _notes[index] = _currentNote;
    }
    
    // Re-sort
    _notes.sort((a, b) => (b.updatedAt || 0) - (a.updatedAt || 0));
  }

  /**
   * Update save status indicator
   */
  function updateSaveStatus(status) {
    const el = document.getElementById('saveStatus');
    if (!el) return;

    el.className = 'ps-save-status ' + status;
    
    if (status === 'saving') {
      el.innerHTML = `
        <svg class="ps-save-status-icon icon-sm" viewBox="0 0 24 24"><circle cx="12" cy="12" r="10"/><path d="M12 6v6l4 2"/></svg>
        <span>Saving...</span>
      `;
    } else {
      el.innerHTML = `
        <svg class="ps-save-status-icon icon-sm" viewBox="0 0 24 24"><polyline points="20 6 9 17 4 12"/></svg>
        <span>Saved</span>
      `;
    }
  }

  /**
   * Delete note
   */
  function deleteNote() {
    if (!_currentNote) return;

    PSUI.confirm('Are you sure you want to delete this note?', async () => {
      await PSStorage.remove(PSStorage.STORES.NOTES, _currentNote.id);
      _notes = _notes.filter(n => n.id !== _currentNote.id);
      _currentNote = null;
      PSUI.toast('Note deleted', 'success');
      render();
    });
  }

  /**
   * Search notes
   */
  function search(query) {
    _searchQuery = query;
    render();
  }

  /**
   * AI actions
   */
  async function aiAction(action) {
    if (!_currentNote || !_currentNote.content) {
      PSUI.toast('Note is empty', 'warning');
      return;
    }

    PSUI.toast(`${action === 'summarize' ? 'Summarizing' : action === 'expand' ? 'Expanding' : 'Finding related notes'}...`, 'info');

    // Simulate AI processing
    await new Promise(resolve => setTimeout(resolve, 1000));

    switch (action) {
      case 'summarize':
        const summary = _currentNote.content.substring(0, 200) + '...';
        PSUI.modal({
          title: 'Summary',
          content: `<p style="line-height: 1.6;">${escapeHtml(summary)}</p>`,
          actions: [
            { label: 'Close' },
            { label: 'Copy', primary: true, onClick: () => navigator.clipboard.writeText(summary) }
          ]
        });
        break;

      case 'expand':
        PSUI.modal({
          title: 'Expanded Ideas',
          content: `<p style="line-height: 1.6;">Based on your note, here are some areas to explore:</p>
            <ul style="margin-top: 12px; padding-left: 20px; line-height: 1.8;">
              <li>Consider the implications of the main concept</li>
              <li>What are potential applications?</li>
              <li>How does this connect to other ideas?</li>
            </ul>`,
          actions: [{ label: 'Close' }]
        });
        break;

      case 'related':
        const related = _notes.filter(n => n.id !== _currentNote.id).slice(0, 3);
        PSUI.modal({
          title: 'Related Notes',
          content: related.length > 0
            ? related.map(n => `
                <div class="ps-note-item" style="padding: 8px; cursor: pointer;" onclick="PSNotes.selectNote('${n.id}'); document.querySelector('.ps-modal-overlay').remove();">
                  <div class="ps-note-title">${escapeHtml(n.title || 'Untitled')}</div>
                  <div class="ps-note-preview">${escapeHtml((n.content || '').substring(0, 50))}</div>
                </div>
              `).join('')
            : '<p>No related notes found.</p>',
          actions: [{ label: 'Close' }]
        });
        break;
    }
  }

  /**
   * Format date
   */
  function formatDate(timestamp) {
    if (!timestamp) return '';
    const date = new Date(timestamp);
    const now = new Date();
    const diff = now - date;

    if (diff < 60000) return 'Just now';
    if (diff < 3600000) return `${Math.floor(diff / 60000)}m`;
    if (diff < 86400000) return `${Math.floor(diff / 3600000)}h`;
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

  /**
   * Get all notes (for external access)
   */
  function getAllNotes() {
    return _notes;
  }

  return {
    load,
    createNote,
    selectNote,
    updateTitle,
    updateContent,
    updateFolder,
    handleTagInput,
    removeTag,
    deleteNote,
    search,
    aiAction,
    getAllNotes
  };
})();

if (typeof module !== 'undefined' && module.exports) {
  module.exports = PSNotes;
}
