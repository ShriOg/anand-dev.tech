/**
 * ═══════════════════════════════════════════════════════════
 * PRIVATE SPACE - DAILY LOG MODULE
 * Date-based journal entries with auto-save
 * ═══════════════════════════════════════════════════════════
 */

const PSLog = (function() {
  'use strict';

  let _logs = [];
  let _currentDate = new Date();
  let _selectedDate = new Date();
  let _saveTimeout = null;

  /**
   * Load log view
   */
  async function load() {
    await loadLogs();
    render();
  }

  /**
   * Load all logs from storage
   */
  async function loadLogs() {
    try {
      _logs = await PSStorage.getAll(PSStorage.STORES.LOGS);
      _logs.sort((a, b) => new Date(b.date) - new Date(a.date));
    } catch {
      _logs = [];
    }
  }

  /**
   * Get log for specific date
   */
  function getLogForDate(date) {
    const dateStr = formatDateKey(date);
    return _logs.find(log => log.date === dateStr);
  }

  /**
   * Render log interface
   */
  function render() {
    const container = document.querySelector('#section-log .ps-workspace');
    if (!container) return;

    const selectedLog = getLogForDate(_selectedDate);

    container.innerHTML = `
      <div class="ps-log">
        <div class="ps-log-sidebar">
          ${renderCalendar()}
          <div class="ps-log-entries">
            ${renderEntryList()}
          </div>
        </div>
        
        <div class="ps-log-editor">
          ${renderEditor(selectedLog)}
        </div>
      </div>
    `;
  }

  /**
   * Render mini calendar
   */
  function renderCalendar() {
    const year = _currentDate.getFullYear();
    const month = _currentDate.getMonth();
    const firstDay = new Date(year, month, 1).getDay();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const today = new Date();

    const monthNames = ['January', 'February', 'March', 'April', 'May', 'June',
                        'July', 'August', 'September', 'October', 'November', 'December'];
    const dayNames = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'];

    // Get days from previous month
    const prevMonthDays = new Date(year, month, 0).getDate();
    
    let days = [];
    
    // Previous month days
    for (let i = firstDay - 1; i >= 0; i--) {
      const d = new Date(year, month - 1, prevMonthDays - i);
      days.push({ date: d, isOtherMonth: true });
    }
    
    // Current month days
    for (let i = 1; i <= daysInMonth; i++) {
      days.push({ date: new Date(year, month, i), isOtherMonth: false });
    }
    
    // Next month days to fill grid
    const remaining = 42 - days.length;
    for (let i = 1; i <= remaining; i++) {
      const d = new Date(year, month + 1, i);
      days.push({ date: d, isOtherMonth: true });
    }

    return `
      <div class="ps-calendar">
        <div class="ps-calendar-header">
          <span class="ps-calendar-title">${monthNames[month]} ${year}</span>
          <div class="ps-calendar-nav">
            <button class="ps-calendar-nav-btn" onclick="PSLog.prevMonth()">
              <svg class="icon-sm" viewBox="0 0 24 24"><polyline points="15 18 9 12 15 6"/></svg>
            </button>
            <button class="ps-calendar-nav-btn" onclick="PSLog.nextMonth()">
              <svg class="icon-sm" viewBox="0 0 24 24"><polyline points="9 18 15 12 9 6"/></svg>
            </button>
          </div>
        </div>
        <div class="ps-calendar-grid">
          ${dayNames.map(d => `<div class="ps-calendar-weekday">${d}</div>`).join('')}
          ${days.map(({ date, isOtherMonth }) => {
            const isToday = isSameDay(date, today);
            const isSelected = isSameDay(date, _selectedDate);
            const hasEntry = _logs.some(log => log.date === formatDateKey(date));
            
            return `
              <div class="ps-calendar-day ${isOtherMonth ? 'other-month' : ''} ${isToday ? 'today' : ''} ${isSelected ? 'selected' : ''} ${hasEntry ? 'has-entry' : ''}"
                   onclick="PSLog.selectDate(${date.getFullYear()}, ${date.getMonth()}, ${date.getDate()})">
                ${date.getDate()}
              </div>
            `;
          }).join('')}
        </div>
      </div>
    `;
  }

  /**
   * Render entry list
   */
  function renderEntryList() {
    const recentLogs = _logs.slice(0, 10);
    
    if (recentLogs.length === 0) {
      return `
        <div class="ps-empty" style="padding: 24px;">
          <p class="ps-empty-description">No entries yet</p>
        </div>
      `;
    }

    return recentLogs.map(log => {
      const date = new Date(log.date);
      const isSelected = log.date === formatDateKey(_selectedDate);
      const preview = (log.content || '').substring(0, 60);
      const wordCount = (log.content || '').split(/\s+/).filter(w => w).length;
      
      return `
        <div class="ps-log-entry-item ${isSelected ? 'active' : ''}" 
             onclick="PSLog.selectDate(${date.getFullYear()}, ${date.getMonth()}, ${date.getDate()})">
          <div class="ps-log-entry-date">
            <div class="ps-log-entry-day">${date.getDate()}</div>
            <div class="ps-log-entry-month">${date.toLocaleDateString([], { month: 'short' })}</div>
          </div>
          <div class="ps-log-entry-content">
            <div class="ps-log-entry-preview">${escapeHtml(preview)}${preview.length >= 60 ? '...' : ''}</div>
            <div class="ps-log-entry-wordcount">${wordCount} words</div>
          </div>
        </div>
      `;
    }).join('');
  }

  /**
   * Render editor
   */
  function renderEditor(log) {
    const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    const monthNames = ['January', 'February', 'March', 'April', 'May', 'June',
                        'July', 'August', 'September', 'October', 'November', 'December'];

    return `
      <div class="ps-log-editor-header">
        <div class="ps-log-date-display">
          <span class="ps-log-date-main">${monthNames[_selectedDate.getMonth()]} ${_selectedDate.getDate()}</span>
          <span class="ps-log-date-sub">${dayNames[_selectedDate.getDay()]}, ${_selectedDate.getFullYear()}</span>
        </div>
        <div class="ps-save-status" id="logSaveStatus">
          <svg class="ps-save-status-icon icon-sm" viewBox="0 0 24 24"><polyline points="20 6 9 17 4 12"/></svg>
          <span>${log ? 'Saved' : 'New entry'}</span>
        </div>
      </div>
      
      <div class="ps-log-editor-content">
        <textarea class="ps-log-textarea" 
                  id="logContent"
                  placeholder="What's on your mind today?"
                  oninput="PSLog.updateContent(this.value)">${escapeHtml(log?.content || '')}</textarea>
      </div>
      
      <div class="ps-log-summary" id="logSummary">
        <div class="ps-log-summary-header">
          <span class="ps-log-summary-title">Weekly Summary</span>
          <button class="ps-log-summary-generate" onclick="PSLog.generateSummary()">
            <svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="10"/><path d="M12 8v4l3 3"/></svg>
            Generate
          </button>
        </div>
        <div class="ps-log-summary-content" id="summaryContent">
          ${getWeeklySummary()}
        </div>
        ${renderStats()}
      </div>
    `;
  }

  /**
   * Render stats
   */
  function renderStats() {
    const today = new Date();
    const weekAgo = new Date(today);
    weekAgo.setDate(weekAgo.getDate() - 7);
    
    const weekLogs = _logs.filter(log => {
      const logDate = new Date(log.date);
      return logDate >= weekAgo && logDate <= today;
    });

    const totalWords = weekLogs.reduce((sum, log) => {
      return sum + (log.content || '').split(/\s+/).filter(w => w).length;
    }, 0);

    const streak = calculateStreak();

    return `
      <div class="ps-log-stats">
        <div class="ps-log-stat">
          <div class="ps-log-stat-value">${weekLogs.length}</div>
          <div class="ps-log-stat-label">Entries this week</div>
        </div>
        <div class="ps-log-stat">
          <div class="ps-log-stat-value">${totalWords}</div>
          <div class="ps-log-stat-label">Words written</div>
        </div>
        <div class="ps-log-stat">
          <div class="ps-log-stat-value">${streak}</div>
          <div class="ps-log-stat-label">Day streak</div>
        </div>
      </div>
    `;
  }

  /**
   * Calculate writing streak
   */
  function calculateStreak() {
    let streak = 0;
    let checkDate = new Date();
    
    while (true) {
      const dateKey = formatDateKey(checkDate);
      const hasEntry = _logs.some(log => log.date === dateKey);
      
      if (hasEntry) {
        streak++;
        checkDate.setDate(checkDate.getDate() - 1);
      } else {
        break;
      }
    }
    
    return streak;
  }

  /**
   * Get weekly summary placeholder
   */
  function getWeeklySummary() {
    const today = new Date();
    const weekAgo = new Date(today);
    weekAgo.setDate(weekAgo.getDate() - 7);
    
    const weekLogs = _logs.filter(log => {
      const logDate = new Date(log.date);
      return logDate >= weekAgo && logDate <= today;
    });

    if (weekLogs.length === 0) {
      return '<p style="color: var(--ps-text-muted);">No entries this week to summarize.</p>';
    }

    return '<p style="color: var(--ps-text-muted);">Click "Generate" to create an AI summary of your week.</p>';
  }

  /**
   * Navigate to previous month
   */
  function prevMonth() {
    _currentDate.setMonth(_currentDate.getMonth() - 1);
    render();
  }

  /**
   * Navigate to next month
   */
  function nextMonth() {
    _currentDate.setMonth(_currentDate.getMonth() + 1);
    render();
  }

  /**
   * Select date
   */
  function selectDate(year, month, day) {
    _selectedDate = new Date(year, month, day);
    render();
    
    // Focus textarea
    setTimeout(() => {
      document.getElementById('logContent')?.focus();
    }, 100);
  }

  /**
   * Update log content
   */
  function updateContent(content) {
    if (_saveTimeout) {
      clearTimeout(_saveTimeout);
    }

    updateSaveStatus('saving');

    _saveTimeout = setTimeout(async () => {
      await saveLog(content);
      updateSaveStatus('saved');
    }, 500);
  }

  /**
   * Save log entry
   */
  async function saveLog(content) {
    const dateKey = formatDateKey(_selectedDate);
    
    let log = _logs.find(l => l.date === dateKey);
    
    if (log) {
      log.content = content;
      log.updatedAt = Date.now();
    } else {
      log = {
        id: dateKey,
        date: dateKey,
        content,
        createdAt: Date.now(),
        updatedAt: Date.now()
      };
      _logs.unshift(log);
    }

    await PSStorage.save(PSStorage.STORES.LOGS, log);
  }

  /**
   * Update save status
   */
  function updateSaveStatus(status) {
    const el = document.getElementById('logSaveStatus');
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
   * Generate weekly summary
   */
  async function generateSummary() {
    const summaryEl = document.getElementById('summaryContent');
    if (!summaryEl) return;

    summaryEl.innerHTML = '<p style="color: var(--ps-text-muted);">Generating summary...</p>';

    // Get week's logs
    const today = new Date();
    const weekAgo = new Date(today);
    weekAgo.setDate(weekAgo.getDate() - 7);
    
    const weekLogs = _logs.filter(log => {
      const logDate = new Date(log.date);
      return logDate >= weekAgo && logDate <= today;
    }).sort((a, b) => new Date(a.date) - new Date(b.date));

    // Simulate AI processing
    await new Promise(resolve => setTimeout(resolve, 1500));

    if (weekLogs.length === 0) {
      summaryEl.innerHTML = '<p style="color: var(--ps-text-muted);">No entries this week to summarize.</p>';
      return;
    }

    // Generate simple summary
    const totalWords = weekLogs.reduce((sum, log) => {
      return sum + (log.content || '').split(/\s+/).filter(w => w).length;
    }, 0);

    const summary = `
      <p>This week you wrote <strong>${weekLogs.length}</strong> journal entries with a total of <strong>${totalWords}</strong> words.</p>
      <p style="margin-top: 8px;">You were most active on ${new Date(weekLogs[weekLogs.length - 1].date).toLocaleDateString([], { weekday: 'long' })}.</p>
    `;

    summaryEl.innerHTML = summary;
  }

  /**
   * Format date to key string
   */
  function formatDateKey(date) {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }

  /**
   * Check if two dates are the same day
   */
  function isSameDay(d1, d2) {
    return d1.getFullYear() === d2.getFullYear() &&
           d1.getMonth() === d2.getMonth() &&
           d1.getDate() === d2.getDate();
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
    prevMonth,
    nextMonth,
    selectDate,
    updateContent,
    generateSummary
  };
})();

if (typeof module !== 'undefined' && module.exports) {
  module.exports = PSLog;
}
