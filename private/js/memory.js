/**
 * ═══════════════════════════════════════════════════════════
 * PRIVATE SPACE - MEMORY MODULE
 * Multi-layer AI memory system
 * ═══════════════════════════════════════════════════════════
 */

const PSMemory = (function() {
  'use strict';

  const MEMORY_TYPES = {
    SHORT_TERM: 'short-term',    // Current session only
    WORKING: 'working',          // Active projects/ideas
    LONG_TERM: 'long-term'       // Permanent, user-approved
  };

  let _shortTermMemory = [];
  let _pendingMemory = [];

  /**
   * Load memory view
   */
  async function load() {
    const container = document.querySelector('#section-memory .ps-workspace');
    if (!container) return;

    const workingMemory = await getByType(MEMORY_TYPES.WORKING);
    const longTermMemory = await getByType(MEMORY_TYPES.LONG_TERM);

    container.innerHTML = `
      <div class="ps-memory">
        <!-- Pending Memory Requests -->
        <div class="ps-memory-pending" id="memoryPending"></div>

        <!-- Short-term Memory (Session) -->
        <div class="ps-memory-section ps-memory-short-term">
          <div class="ps-memory-section-header">
            <div class="ps-memory-section-title">
              <svg class="ps-memory-section-icon icon" viewBox="0 0 24 24"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
              <span class="ps-memory-section-name">Session Context</span>
            </div>
            <span class="ps-memory-section-badge">${_shortTermMemory.length} items</span>
          </div>
          <p class="ps-memory-section-description">Temporary context for current session. Cleared on refresh.</p>
          <div class="ps-memory-section-content" id="shortTermMemory">
            ${renderMemoryItems(_shortTermMemory, MEMORY_TYPES.SHORT_TERM)}
          </div>
        </div>

        <!-- Working Memory -->
        <div class="ps-memory-section ps-memory-working">
          <div class="ps-memory-section-header">
            <div class="ps-memory-section-title">
              <svg class="ps-memory-section-icon icon" viewBox="0 0 24 24"><path d="M12 2L2 7l10 5 10-5-10-5z"/><path d="M2 17l10 5 10-5"/><path d="M2 12l10 5 10-5"/></svg>
              <span class="ps-memory-section-name">Working Memory</span>
            </div>
            <span class="ps-memory-section-badge">${workingMemory.length} items</span>
          </div>
          <p class="ps-memory-section-description">Active projects, ongoing ideas, and recent context.</p>
          <div class="ps-memory-section-content" id="workingMemory">
            ${renderMemoryItems(workingMemory, MEMORY_TYPES.WORKING)}
          </div>
          <div class="ps-memory-add-form">
            <div class="ps-memory-add-row">
              <input type="text" class="ps-input ps-memory-add-key" placeholder="Key" id="workingMemoryKey">
              <input type="text" class="ps-input ps-memory-add-value" placeholder="Value" id="workingMemoryValue">
            </div>
            <div class="ps-memory-add-actions">
              <button class="ps-btn ps-btn-secondary ps-btn-sm" onclick="PSMemory.addWorkingMemory()">Add to Working Memory</button>
            </div>
          </div>
        </div>

        <!-- Long-term Memory -->
        <div class="ps-memory-section ps-memory-long-term">
          <div class="ps-memory-section-header">
            <div class="ps-memory-section-title">
              <svg class="ps-memory-section-icon icon" viewBox="0 0 24 24"><path d="M12 2a10 10 0 1 0 10 10A10 10 0 0 0 12 2z"/><path d="M12 8v4l3 3"/></svg>
              <span class="ps-memory-section-name">Long-term Memory</span>
            </div>
            <span class="ps-memory-section-badge">${longTermMemory.length} items</span>
          </div>
          <p class="ps-memory-section-description">Permanent memories. AI will never auto-write here without your approval.</p>
          <div class="ps-memory-section-content" id="longTermMemory">
            ${renderMemoryItems(longTermMemory, MEMORY_TYPES.LONG_TERM)}
          </div>
        </div>
      </div>
    `;

    renderPendingMemory();
  }

  /**
   * Render memory items
   */
  function renderMemoryItems(items, type) {
    if (!items || items.length === 0) {
      return `
        <div class="ps-memory-empty">
          <svg class="ps-memory-empty-icon icon" viewBox="0 0 24 24"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
          <p class="ps-memory-empty-text">No memories stored</p>
        </div>
      `;
    }

    return items.map(item => `
      <div class="ps-memory-item" data-id="${item.id}">
        <div class="ps-memory-item-content">
          <div class="ps-memory-item-key">${escapeHtml(item.key)}</div>
          <div class="ps-memory-item-value">${escapeHtml(item.value)}</div>
          <div class="ps-memory-item-meta">
            <span>${formatDate(item.createdAt)}</span>
            ${item.source ? `<span>• ${item.source}</span>` : ''}
          </div>
        </div>
        <div class="ps-memory-item-actions">
          <button class="ps-memory-item-action" title="Edit" onclick="PSMemory.editMemory('${item.id}', '${type}')">
            <svg class="icon-sm" viewBox="0 0 24 24"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
          </button>
          <button class="ps-memory-item-action delete" title="Forget" onclick="PSMemory.forgetMemory('${item.id}', '${type}')">
            <svg class="icon-sm" viewBox="0 0 24 24"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg>
          </button>
        </div>
      </div>
    `).join('');
  }

  /**
   * Render pending memory requests
   */
  function renderPendingMemory() {
    const container = document.getElementById('memoryPending');
    if (!container) return;

    if (_pendingMemory.length === 0) {
      container.innerHTML = '';
      return;
    }

    container.innerHTML = _pendingMemory.map(item => `
      <div class="ps-memory-consent" data-pending-id="${item.id}">
        <div class="ps-memory-consent-header">
          <svg class="ps-memory-consent-icon icon" viewBox="0 0 24 24"><path d="M12 2a10 10 0 1 0 10 10A10 10 0 0 0 12 2z"/><path d="M12 8v4"/><path d="M12 16h.01"/></svg>
          <span class="ps-memory-consent-title">AI wants to save to long-term memory</span>
        </div>
        <p class="ps-memory-consent-content">${escapeHtml(item.reason || 'Save this information for future reference?')}</p>
        <div class="ps-memory-consent-preview">
          <div class="ps-memory-consent-key">${escapeHtml(item.key)}</div>
          <div class="ps-memory-consent-value">${escapeHtml(item.value)}</div>
        </div>
        <div class="ps-memory-consent-actions">
          <button class="ps-btn ps-btn-ghost ps-btn-sm" onclick="PSMemory.rejectPending('${item.id}')">Decline</button>
          <button class="ps-btn ps-btn-primary ps-btn-sm" onclick="PSMemory.approvePending('${item.id}')">Save</button>
        </div>
      </div>
    `).join('');
  }

  /**
   * Add to short-term memory (session only)
   */
  function addShortTerm(key, value, source = null) {
    const item = {
      id: PSCrypto.generateId(),
      key,
      value,
      source,
      createdAt: Date.now()
    };
    _shortTermMemory.push(item);
    
    // Limit short-term memory
    if (_shortTermMemory.length > 50) {
      _shortTermMemory.shift();
    }

    return item;
  }

  /**
   * Add to working memory (persistent)
   */
  async function addWorkingMemory() {
    const keyInput = document.getElementById('workingMemoryKey');
    const valueInput = document.getElementById('workingMemoryValue');
    
    const key = keyInput?.value.trim();
    const value = valueInput?.value.trim();

    if (!key || !value) {
      PSUI.toast('Please enter both key and value', 'warning');
      return;
    }

    await add(MEMORY_TYPES.WORKING, key, value);
    
    if (keyInput) keyInput.value = '';
    if (valueInput) valueInput.value = '';
    
    PSUI.toast('Added to working memory', 'success');
    load();
  }

  /**
   * Request to add to long-term memory (requires user approval)
   */
  function requestLongTerm(key, value, reason = null) {
    const item = {
      id: PSCrypto.generateId(),
      key,
      value,
      reason,
      createdAt: Date.now()
    };
    _pendingMemory.push(item);
    renderPendingMemory();
    
    PSUI.toast('AI is requesting to save a memory', 'info');
    return item.id;
  }

  /**
   * Approve pending memory request
   */
  async function approvePending(id) {
    const index = _pendingMemory.findIndex(m => m.id === id);
    if (index === -1) return;

    const item = _pendingMemory[index];
    await add(MEMORY_TYPES.LONG_TERM, item.key, item.value, 'AI suggested');
    
    _pendingMemory.splice(index, 1);
    PSUI.toast('Memory saved', 'success');
    load();
  }

  /**
   * Reject pending memory request
   */
  function rejectPending(id) {
    const index = _pendingMemory.findIndex(m => m.id === id);
    if (index !== -1) {
      _pendingMemory.splice(index, 1);
      renderPendingMemory();
      PSUI.toast('Memory request declined', 'info');
    }
  }

  /**
   * Add memory to storage
   */
  async function add(type, key, value, source = null) {
    const item = {
      id: PSCrypto.generateId(),
      type,
      key,
      value,
      source,
      createdAt: Date.now()
    };

    await PSStorage.save(PSStorage.STORES.MEMORY, item);
    return item;
  }

  /**
   * Get memories by type
   */
  async function getByType(type) {
    try {
      return await PSStorage.getByIndex(PSStorage.STORES.MEMORY, 'type', type);
    } catch {
      return [];
    }
  }

  /**
   * Get all memories (for AI context)
   */
  async function getAllForContext() {
    const working = await getByType(MEMORY_TYPES.WORKING);
    const longTerm = await getByType(MEMORY_TYPES.LONG_TERM);

    return {
      shortTerm: _shortTermMemory,
      working,
      longTerm
    };
  }

  /**
   * Edit memory
   */
  async function editMemory(id, type) {
    let items;
    if (type === MEMORY_TYPES.SHORT_TERM) {
      items = _shortTermMemory;
    } else {
      items = await getByType(type);
    }

    const item = items.find(m => m.id === id);
    if (!item) return;

    PSUI.modal({
      title: 'Edit Memory',
      content: `
        <div class="ps-input-group" style="margin-bottom: var(--ps-space-4);">
          <label class="ps-label">Key</label>
          <input type="text" class="ps-input" id="editMemoryKey" value="${escapeHtml(item.key)}">
        </div>
        <div class="ps-input-group">
          <label class="ps-label">Value</label>
          <textarea class="ps-textarea" id="editMemoryValue">${escapeHtml(item.value)}</textarea>
        </div>
      `,
      actions: [
        { label: 'Cancel' },
        {
          label: 'Save',
          primary: true,
          onClick: async () => {
            const newKey = document.getElementById('editMemoryKey').value.trim();
            const newValue = document.getElementById('editMemoryValue').value.trim();
            
            if (newKey && newValue) {
              if (type === MEMORY_TYPES.SHORT_TERM) {
                item.key = newKey;
                item.value = newValue;
              } else {
                item.key = newKey;
                item.value = newValue;
                await PSStorage.save(PSStorage.STORES.MEMORY, item);
              }
              PSUI.toast('Memory updated', 'success');
              load();
            }
          }
        }
      ]
    });
  }

  /**
   * Forget (delete) memory
   */
  async function forgetMemory(id, type) {
    PSUI.confirm('Are you sure you want to forget this memory?', async () => {
      if (type === MEMORY_TYPES.SHORT_TERM) {
        const index = _shortTermMemory.findIndex(m => m.id === id);
        if (index !== -1) {
          _shortTermMemory.splice(index, 1);
        }
      } else {
        await PSStorage.remove(PSStorage.STORES.MEMORY, id);
      }
      
      PSUI.toast('Memory forgotten', 'success');
      load();
    });
  }

  /**
   * Clear short-term memory
   */
  function clearShortTerm() {
    _shortTermMemory = [];
  }

  /**
   * Search memories
   */
  async function search(query) {
    const allMemories = await getAllForContext();
    const lowerQuery = query.toLowerCase();
    
    const results = [];

    for (const [type, items] of Object.entries(allMemories)) {
      for (const item of items) {
        if (
          item.key.toLowerCase().includes(lowerQuery) ||
          item.value.toLowerCase().includes(lowerQuery)
        ) {
          results.push({ ...item, memoryType: type });
        }
      }
    }

    return results;
  }

  /**
   * Escape HTML
   */
  function escapeHtml(str) {
    const div = document.createElement('div');
    div.textContent = str;
    return div.innerHTML;
  }

  /**
   * Format date
   */
  function formatDate(timestamp) {
    const date = new Date(timestamp);
    const now = new Date();
    const diff = now - date;

    if (diff < 60000) return 'Just now';
    if (diff < 3600000) return `${Math.floor(diff / 60000)}m ago`;
    if (diff < 86400000) return `${Math.floor(diff / 3600000)}h ago`;
    if (diff < 604800000) return `${Math.floor(diff / 86400000)}d ago`;

    return date.toLocaleDateString();
  }

  return {
    TYPES: MEMORY_TYPES,
    load,
    addShortTerm,
    addWorkingMemory,
    requestLongTerm,
    approvePending,
    rejectPending,
    add,
    getByType,
    getAllForContext,
    editMemory,
    forgetMemory,
    clearShortTerm,
    search
  };
})();

if (typeof module !== 'undefined' && module.exports) {
  module.exports = PSMemory;
}
