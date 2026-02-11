/**
 * ═══════════════════════════════════════════════════════════════════════════════
 * PERSONAL RITUALS SYSTEM
 * ═══════════════════════════════════════════════════════════════════════════════
 * 
 * Daily Entry (Journal), Mood Tracking, and Intentional Memory
 * 
 * These are personal rituals — quiet, unhurried spaces for reflection.
 * No analytics. No pressure. Just you.
 * ═══════════════════════════════════════════════════════════════════════════════
 */

// ═══════════════════════════════════════════════════════════════════════════════
// DAILY ENTRY (JOURNAL)
// ═══════════════════════════════════════════════════════════════════════════════

const PSJournal = {
  currentDate: new Date(),
  autoSaveTimeout: null,
  lastSavedContent: '',
  
  async load() {
    this.currentDate = new Date();
    this.updateDateDisplay();
    await this.loadEntry();
    this.setupAutoSave();
  },
  
  updateDateDisplay() {
    const display = document.getElementById('journalDateDisplay');
    if (!display) return;
    
    const today = new Date();
    const isToday = this.isSameDay(this.currentDate, today);
    const isYesterday = this.isSameDay(this.currentDate, new Date(today.setDate(today.getDate() - 1)));
    
    if (isToday) {
      display.textContent = 'Today';
    } else if (isYesterday) {
      display.textContent = 'Yesterday';
    } else {
      display.textContent = this.currentDate.toLocaleDateString('en-US', { 
        weekday: 'long',
        month: 'long', 
        day: 'numeric',
        year: this.currentDate.getFullYear() !== new Date().getFullYear() ? 'numeric' : undefined
      });
    }
    
    // Show/hide today button
    const todayBtn = document.querySelector('.ps-journal-date-today');
    if (todayBtn) {
      todayBtn.style.display = this.isSameDay(this.currentDate, new Date()) ? 'none' : 'block';
    }
  },
  
  isSameDay(date1, date2) {
    return date1.toDateString() === date2.toDateString();
  },
  
  getDateKey(date = this.currentDate) {
    return date.toISOString().split('T')[0]; // YYYY-MM-DD
  },
  
  async loadEntry() {
    const textarea = document.getElementById('journalTextarea');
    if (!textarea) return;
    
    try {
      const key = this.getDateKey();
      const entry = await PSDatabase.get('journal', key);
      textarea.value = entry?.content || '';
      this.lastSavedContent = textarea.value;
      this.updateStatus('');
    } catch (error) {
      console.error('Failed to load journal entry:', error);
      textarea.value = '';
      this.lastSavedContent = '';
    }
  },
  
  async saveEntry() {
    const textarea = document.getElementById('journalTextarea');
    if (!textarea) return;
    
    const content = textarea.value.trim();
    const key = this.getDateKey();
    
    // Don't save if content hasn't changed
    if (content === this.lastSavedContent) {
      return;
    }
    
    try {
      if (content) {
        await PSDatabase.put('journal', {
          id: key,
          content: content,
          date: this.currentDate.toISOString(),
          updatedAt: new Date().toISOString()
        });
      } else {
        // If content is empty, delete the entry
        await PSDatabase.delete('journal', key);
      }
      
      this.lastSavedContent = content;
      this.updateStatus('Saved');
      
      // Clear the "Saved" message after a moment
      setTimeout(() => {
        if (document.getElementById('journalStatus')?.textContent === 'Saved') {
          this.updateStatus('');
        }
      }, 2000);
      
    } catch (error) {
      console.error('Failed to save journal entry:', error);
      this.updateStatus('Failed to save');
    }
  },
  
  handleInput() {
    // Clear existing timeout
    if (this.autoSaveTimeout) {
      clearTimeout(this.autoSaveTimeout);
    }
    
    // Show "Saving..." indicator
    this.updateStatus('...');
    
    // Set new timeout for auto-save (1.5 seconds of inactivity)
    this.autoSaveTimeout = setTimeout(() => {
      this.saveEntry();
    }, 1500);
  },
  
  setupAutoSave() {
    // Also save when leaving the section
    window.addEventListener('beforeunload', () => {
      if (this.autoSaveTimeout) {
        clearTimeout(this.autoSaveTimeout);
        this.saveEntry();
      }
    });
  },
  
  updateStatus(message) {
    const status = document.getElementById('journalStatus');
    if (status) {
      status.querySelector('span').textContent = message;
      status.classList.toggle('visible', !!message);
    }
  },
  
  previousDay() {
    this.currentDate = new Date(this.currentDate);
    this.currentDate.setDate(this.currentDate.getDate() - 1);
    this.updateDateDisplay();
    this.loadEntry();
  },
  
  nextDay() {
    const tomorrow = new Date(this.currentDate);
    tomorrow.setDate(tomorrow.getDate() + 1);
    
    // Don't go past today
    if (tomorrow <= new Date()) {
      this.currentDate = tomorrow;
      this.updateDateDisplay();
      this.loadEntry();
    }
  },
  
  goToToday() {
    this.currentDate = new Date();
    this.updateDateDisplay();
    this.loadEntry();
  }
};


// ═══════════════════════════════════════════════════════════════════════════════
// MOOD TRACKING
// ═══════════════════════════════════════════════════════════════════════════════

const PSMood = {
  moods: {
    peaceful: { emoji: '😌', label: 'Peaceful', color: '#88c0a8' },
    happy: { emoji: '😊', label: 'Happy', color: '#f4d35e' },
    neutral: { emoji: '😐', label: 'Neutral', color: '#9ca3af' },
    tired: { emoji: '😔', label: 'Tired', color: '#7c8db0' },
    stressed: { emoji: '😰', label: 'Stressed', color: '#e88a8a' }
  },
  
  todaysMood: null,
  
  async load() {
    await this.loadTodaysMood();
    await this.loadHistory();
    this.setupMoodSelector();
  },
  
  getDateKey(date = new Date()) {
    return date.toISOString().split('T')[0];
  },
  
  async loadTodaysMood() {
    try {
      const key = this.getDateKey();
      const entry = await PSDatabase.get('mood', key);
      
      const todayEl = document.getElementById('moodToday');
      const iconEl = document.getElementById('moodTodayIcon');
      const selector = document.getElementById('moodSelector');
      
      if (entry && entry.mood) {
        this.todaysMood = entry.mood;
        
        if (todayEl && iconEl) {
          iconEl.textContent = this.moods[entry.mood]?.emoji || '';
          todayEl.style.display = 'flex';
        }
        
        // Highlight selected mood
        if (selector) {
          selector.querySelectorAll('.ps-mood-option').forEach(btn => {
            btn.classList.toggle('selected', btn.dataset.mood === entry.mood);
          });
        }
        
        // Set note if exists
        const noteInput = document.getElementById('moodNoteInput');
        if (noteInput && entry.note) {
          noteInput.value = entry.note;
        }
      } else {
        this.todaysMood = null;
        if (todayEl) todayEl.style.display = 'none';
        if (selector) {
          selector.querySelectorAll('.ps-mood-option').forEach(btn => {
            btn.classList.remove('selected');
          });
        }
      }
    } catch (error) {
      console.error('Failed to load today\'s mood:', error);
    }
  },
  
  async loadHistory() {
    try {
      const entries = await PSDatabase.getAll('mood');
      const list = document.getElementById('moodHistoryList');
      
      if (!list) return;
      
      // Sort by date descending, limit to last 7 days
      const sorted = entries
        .sort((a, b) => new Date(b.date) - new Date(a.date))
        .slice(0, 7);
      
      if (sorted.length === 0) {
        list.innerHTML = '<div class="ps-mood-history-empty">No mood history yet</div>';
        return;
      }
      
      list.innerHTML = sorted.map(entry => {
        const date = new Date(entry.date);
        const mood = this.moods[entry.mood];
        const isToday = this.getDateKey(date) === this.getDateKey();
        
        return `
          <div class="ps-mood-history-item ${isToday ? 'today' : ''}">
            <span class="ps-mood-history-emoji">${mood?.emoji || '?'}</span>
            <span class="ps-mood-history-date">${isToday ? 'Today' : date.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}</span>
            ${entry.note ? `<span class="ps-mood-history-note">${entry.note}</span>` : ''}
          </div>
        `;
      }).join('');
    } catch (error) {
      console.error('Failed to load mood history:', error);
    }
  },
  
  setupMoodSelector() {
    const selector = document.getElementById('moodSelector');
    if (!selector) return;
    
    selector.querySelectorAll('.ps-mood-option').forEach(btn => {
      btn.addEventListener('click', () => this.selectMood(btn.dataset.mood));
    });
  },
  
  async selectMood(mood) {
    if (!this.moods[mood]) return;
    
    const key = this.getDateKey();
    const noteInput = document.getElementById('moodNoteInput');
    const note = noteInput?.value?.trim() || '';
    
    try {
      await PSDatabase.put('mood', {
        id: key,
        mood: mood,
        note: note,
        date: new Date().toISOString()
      });
      
      this.todaysMood = mood;
      
      // Update UI
      const todayEl = document.getElementById('moodToday');
      const iconEl = document.getElementById('moodTodayIcon');
      
      if (todayEl && iconEl) {
        iconEl.textContent = this.moods[mood].emoji;
        todayEl.style.display = 'flex';
        todayEl.classList.add('ps-mood-just-set');
        setTimeout(() => todayEl.classList.remove('ps-mood-just-set'), 600);
      }
      
      // Update selector
      document.querySelectorAll('.ps-mood-option').forEach(btn => {
        btn.classList.toggle('selected', btn.dataset.mood === mood);
      });
      
      // Reload history
      await this.loadHistory();
      
      // Gentle feedback
      if (window.PSToast) {
        PSToast.show(`Feeling ${this.moods[mood].label.toLowerCase()} today`, 'success');
      }
      
      // Notify AI system of mood change
      if (window.PSAISystem) {
        PSAISystem.onMoodUpdate(mood);
      }
      
    } catch (error) {
      console.error('Failed to save mood:', error);
    }
  },
  
  async saveNote() {
    if (!this.todaysMood) {
      if (window.PSToast) {
        PSToast.show('Select a mood first', 'info');
      }
      return;
    }
    
    const noteInput = document.getElementById('moodNoteInput');
    const note = noteInput?.value?.trim() || '';
    
    try {
      const key = this.getDateKey();
      const existing = await PSDatabase.get('mood', key);
      
      if (existing) {
        existing.note = note;
        await PSDatabase.put('mood', existing);
        await this.loadHistory();
        
        if (window.PSToast) {
          PSToast.show('Note saved', 'success');
        }
      }
    } catch (error) {
      console.error('Failed to save mood note:', error);
    }
  },
  
  // For AI system to read current mood
  getTodaysMood() {
    return this.todaysMood ? this.moods[this.todaysMood] : null;
  }
};


// ═══════════════════════════════════════════════════════════════════════════════
// INTENTIONAL MEMORY (Rituals Version)
// ═══════════════════════════════════════════════════════════════════════════════

const PSMemoryRituals = {
  currentType: 'thought',
  
  types: {
    thought: { emoji: '💭', label: 'Thought', color: 'var(--ps-text-secondary)' },
    feeling: { emoji: '💕', label: 'Feeling', color: '#e88aaa' },
    moment: { emoji: '✨', label: 'Moment', color: '#f4d35e' },
    preference: { emoji: '⚙️', label: 'Preference', color: '#88c0d0' }
  },
  
  async load() {
    this.setupTypeSelector();
    await this.loadMemories();
  },
  
  setupTypeSelector() {
    const selector = document.getElementById('memoryTypeSelector');
    if (!selector) return;
    
    selector.querySelectorAll('.ps-memory-type-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        this.currentType = btn.dataset.type;
        
        // Update active state
        selector.querySelectorAll('.ps-memory-type-btn').forEach(b => {
          b.classList.toggle('active', b.dataset.type === this.currentType);
        });
        
        // Update placeholder
        const input = document.getElementById('memoryInput');
        if (input) {
          const placeholders = {
            thought: 'What\'s on your mind?',
            feeling: 'How are you feeling about something?',
            moment: 'What moment do you want to remember?',
            preference: 'What preference should I remember?'
          };
          input.placeholder = placeholders[this.currentType] || 'What would you like to remember?';
        }
      });
    });
  },
  
  async loadMemories() {
    try {
      const memories = await PSDatabase.getAll('memories');
      const list = document.getElementById('memoryList');
      
      if (!list) return;
      
      if (memories.length === 0) {
        list.innerHTML = `
          <div class="ps-memory-empty">
            <p>No memories saved yet.</p>
            <p class="ps-memory-empty-hint">When you save thoughts, feelings, moments, or preferences, they'll appear here.</p>
          </div>
        `;
        return;
      }
      
      // Sort by date descending
      const sorted = memories.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
      
      list.innerHTML = sorted.map(memory => {
        const type = this.types[memory.type] || this.types.thought;
        const date = new Date(memory.createdAt);
        const timeAgo = this.getTimeAgo(date);
        
        return `
          <div class="ps-memory-item" data-id="${memory.id}">
            <div class="ps-memory-item-header">
              <span class="ps-memory-item-type" title="${type.label}">${type.emoji}</span>
              <span class="ps-memory-item-time">${timeAgo}</span>
            </div>
            <div class="ps-memory-item-content">${this.escapeHtml(memory.content)}</div>
            <div class="ps-memory-item-actions">
              <button class="ps-memory-item-edit" onclick="PSMemoryRituals.edit('${memory.id}')" title="Edit">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
                  <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
                </svg>
              </button>
              <button class="ps-memory-item-delete" onclick="PSMemoryRituals.delete('${memory.id}')" title="Delete">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <polyline points="3 6 5 6 21 6"/>
                  <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/>
                </svg>
              </button>
            </div>
          </div>
        `;
      }).join('');
    } catch (error) {
      console.error('Failed to load memories:', error);
    }
  },
  
  async save() {
    const input = document.getElementById('memoryInput');
    const content = input?.value?.trim();
    
    if (!content) {
      if (window.PSToast) {
        PSToast.show('Write something to remember', 'info');
      }
      return;
    }
    
    try {
      const memory = {
        id: 'mem_' + Date.now(),
        type: this.currentType,
        content: content,
        createdAt: new Date().toISOString()
      };
      
      await PSDatabase.put('memories', memory);
      
      // Clear input
      input.value = '';
      
      // Reload list with animation
      await this.loadMemories();
      
      // Gentle feedback
      const type = this.types[this.currentType];
      if (window.PSToast) {
        PSToast.show(`${type.label} saved`, 'success');
      }
      
    } catch (error) {
      console.error('Failed to save memory:', error);
      if (window.PSToast) {
        PSToast.show('Failed to save', 'error');
      }
    }
  },
  
  async edit(id) {
    try {
      const memory = await PSDatabase.get('memories', id);
      if (!memory) return;
      
      const newContent = prompt('Edit memory:', memory.content);
      if (newContent === null) return; // Cancelled
      
      if (newContent.trim()) {
        memory.content = newContent.trim();
        memory.updatedAt = new Date().toISOString();
        await PSDatabase.put('memories', memory);
        await this.loadMemories();
        
        if (window.PSToast) {
          PSToast.show('Memory updated', 'success');
        }
      } else {
        // If cleared, delete
        await this.delete(id);
      }
    } catch (error) {
      console.error('Failed to edit memory:', error);
    }
  },
  
  async delete(id) {
    if (!confirm('Delete this memory?')) return;
    
    try {
      await PSDatabase.delete('memories', id);
      await this.loadMemories();
      
      if (window.PSToast) {
        PSToast.show('Memory deleted', 'success');
      }
    } catch (error) {
      console.error('Failed to delete memory:', error);
    }
  },
  
  getTimeAgo(date) {
    const now = new Date();
    const diff = now - date;
    const seconds = Math.floor(diff / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);
    
    if (days > 30) {
      return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    } else if (days > 0) {
      return `${days}d ago`;
    } else if (hours > 0) {
      return `${hours}h ago`;
    } else if (minutes > 0) {
      return `${minutes}m ago`;
    } else {
      return 'Just now';
    }
  },
  
  escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  },
  
  // For AI system to read memories
  async getAllMemories() {
    try {
      return await PSDatabase.getAll('memories');
    } catch {
      return [];
    }
  },
  
  async getMemoriesByType(type) {
    try {
      const all = await PSDatabase.getAll('memories');
      return all.filter(m => m.type === type);
    } catch {
      return [];
    }
  }
};


// ═══════════════════════════════════════════════════════════════════════════════
// DATABASE EXTENSION FOR RITUALS
// ═══════════════════════════════════════════════════════════════════════════════

// Extend PSDatabase with rituals stores if not already present
(function extendDatabase() {
  const originalInit = PSDatabase?.init;
  
  if (originalInit) {
    PSDatabase.init = async function() {
      await originalInit.call(this);
      
      // Ensure rituals stores exist
      // This will be handled by the database version upgrade
    };
  }
  
  // Add rituals stores to database schema
  if (window.PSDatabase && !PSDatabase._ritualsExtended) {
    const storeNames = ['journal', 'mood', 'memories'];
    
    // These stores should be created in database.js
    // This is a fallback check
    PSDatabase._ritualsExtended = true;
  }
})();


// ═══════════════════════════════════════════════════════════════════════════════
// INITIALIZATION
// ═══════════════════════════════════════════════════════════════════════════════

// Load rituals when their sections become active
document.addEventListener('DOMContentLoaded', () => {
  // Observer to load rituals content when sections become visible
  const observer = new MutationObserver((mutations) => {
    mutations.forEach(mutation => {
      if (mutation.attributeName === 'class') {
        const section = mutation.target;
        if (section.classList.contains('active')) {
          switch (section.id) {
            case 'section-journal':
              PSJournal.load();
              break;
            case 'section-mood':
              PSMood.load();
              break;
            case 'section-memory':
              PSMemoryRituals.load();
              break;
          }
        }
      }
    });
  });
  
  // Observe ritual sections
  const sections = ['section-journal', 'section-mood', 'section-memory'];
  sections.forEach(id => {
    const section = document.getElementById(id);
    if (section) {
      observer.observe(section, { attributes: true });
    }
  });
});

// Make rituals globally accessible
window.PSJournal = PSJournal;
window.PSMood = PSMood;
window.PSMemoryRituals = PSMemoryRituals;
