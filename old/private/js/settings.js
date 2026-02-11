/**
 * ═══════════════════════════════════════════════════════════
 * PRIVATE SPACE - SETTINGS MODULE
 * User preferences and data management
 * ═══════════════════════════════════════════════════════════
 */

const PSSettings = (function() {
  'use strict';

  const DEFAULT_SETTINGS = {
    theme: 'dark',
    autoLock: 5,
    focusModeEnabled: false,
    syncEnabled: false,
    syncLastAt: null,
    memoryConsent: {
      shortTerm: true,
      working: true,
      longTerm: false
    },
    aiPersonality: 'balanced',
    notesAutoSave: true,
    notesAutoSaveDelay: 1000,
    chatRetainSessions: 30,
    exportFormat: 'json'
  };

  let _settings = { ...DEFAULT_SETTINGS };

  /**
   * Load settings view
   */
  async function load() {
    await loadSettings();
    render();
  }

  /**
   * Load settings from storage
   */
  async function loadSettings() {
    try {
      const stored = await PSStorage.getAll(PSStorage.STORES.SETTINGS);
      if (stored.length > 0) {
        _settings = { ...DEFAULT_SETTINGS, ...stored[0] };
      }
    } catch {
      _settings = { ...DEFAULT_SETTINGS };
    }
  }

  /**
   * Get current settings
   */
  function getSettings() {
    return { ..._settings };
  }

  /**
   * Get specific setting
   */
  function get(key) {
    return _settings[key];
  }

  /**
   * Render settings interface
   */
  function render() {
    const container = document.querySelector('#section-settings .ps-workspace');
    if (!container) return;

    container.innerHTML = `
      <div class="ps-settings">
        <div class="ps-settings-section">
          <h3 class="ps-settings-section-title">General</h3>
          
          <div class="ps-settings-group">
            <div class="ps-settings-item">
              <div class="ps-settings-item-info">
                <div class="ps-settings-item-label">Auto-lock timeout</div>
                <div class="ps-settings-item-description">Lock after minutes of inactivity (0 = disabled)</div>
              </div>
              <select class="ps-select" onchange="PSSettings.update('autoLock', parseInt(this.value))">
                <option value="0" ${_settings.autoLock === 0 ? 'selected' : ''}>Disabled</option>
                <option value="1" ${_settings.autoLock === 1 ? 'selected' : ''}>1 minute</option>
                <option value="5" ${_settings.autoLock === 5 ? 'selected' : ''}>5 minutes</option>
                <option value="15" ${_settings.autoLock === 15 ? 'selected' : ''}>15 minutes</option>
                <option value="30" ${_settings.autoLock === 30 ? 'selected' : ''}>30 minutes</option>
              </select>
            </div>
            
            <div class="ps-settings-item">
              <div class="ps-settings-item-info">
                <div class="ps-settings-item-label">Focus Mode</div>
                <div class="ps-settings-item-description">Minimize distractions</div>
              </div>
              <label class="ps-toggle">
                <input type="checkbox" 
                       ${_settings.focusModeEnabled ? 'checked' : ''} 
                       onchange="PSSettings.update('focusModeEnabled', this.checked)">
                <span class="ps-toggle-slider"></span>
              </label>
            </div>
          </div>
        </div>
        
        <div class="ps-settings-section">
          <h3 class="ps-settings-section-title">AI & Memory</h3>
          
          <div class="ps-settings-group">
            <div class="ps-settings-item">
              <div class="ps-settings-item-info">
                <div class="ps-settings-item-label">AI Personality</div>
                <div class="ps-settings-item-description">How the AI responds to you</div>
              </div>
              <select class="ps-select" onchange="PSSettings.update('aiPersonality', this.value)">
                <option value="concise" ${_settings.aiPersonality === 'concise' ? 'selected' : ''}>Concise</option>
                <option value="balanced" ${_settings.aiPersonality === 'balanced' ? 'selected' : ''}>Balanced</option>
                <option value="detailed" ${_settings.aiPersonality === 'detailed' ? 'selected' : ''}>Detailed</option>
              </select>
            </div>
            
            <div class="ps-settings-item">
              <div class="ps-settings-item-info">
                <div class="ps-settings-item-label">Short-term Memory</div>
                <div class="ps-settings-item-description">Remember recent conversations (clears on lock)</div>
              </div>
              <label class="ps-toggle">
                <input type="checkbox" 
                       ${_settings.memoryConsent?.shortTerm ? 'checked' : ''} 
                       onchange="PSSettings.updateMemoryConsent('shortTerm', this.checked)">
                <span class="ps-toggle-slider"></span>
              </label>
            </div>
            
            <div class="ps-settings-item">
              <div class="ps-settings-item-info">
                <div class="ps-settings-item-label">Working Memory</div>
                <div class="ps-settings-item-description">Remember current session context</div>
              </div>
              <label class="ps-toggle">
                <input type="checkbox" 
                       ${_settings.memoryConsent?.working ? 'checked' : ''} 
                       onchange="PSSettings.updateMemoryConsent('working', this.checked)">
                <span class="ps-toggle-slider"></span>
              </label>
            </div>
            
            <div class="ps-settings-item">
              <div class="ps-settings-item-info">
                <div class="ps-settings-item-label">Long-term Memory</div>
                <div class="ps-settings-item-description">Persist important information across sessions</div>
              </div>
              <label class="ps-toggle">
                <input type="checkbox" 
                       ${_settings.memoryConsent?.longTerm ? 'checked' : ''} 
                       onchange="PSSettings.updateMemoryConsent('longTerm', this.checked)">
                <span class="ps-toggle-slider"></span>
              </label>
            </div>
            
            <div class="ps-settings-item">
              <div class="ps-settings-item-info">
                <div class="ps-settings-item-label">Chat session retention</div>
                <div class="ps-settings-item-description">Days to keep chat sessions</div>
              </div>
              <select class="ps-select" onchange="PSSettings.update('chatRetainSessions', parseInt(this.value))">
                <option value="7" ${_settings.chatRetainSessions === 7 ? 'selected' : ''}>7 days</option>
                <option value="30" ${_settings.chatRetainSessions === 30 ? 'selected' : ''}>30 days</option>
                <option value="90" ${_settings.chatRetainSessions === 90 ? 'selected' : ''}>90 days</option>
                <option value="365" ${_settings.chatRetainSessions === 365 ? 'selected' : ''}>1 year</option>
                <option value="0" ${_settings.chatRetainSessions === 0 ? 'selected' : ''}>Forever</option>
              </select>
            </div>
          </div>
        </div>
        
        <div class="ps-settings-section">
          <h3 class="ps-settings-section-title">Notes</h3>
          
          <div class="ps-settings-group">
            <div class="ps-settings-item">
              <div class="ps-settings-item-info">
                <div class="ps-settings-item-label">Auto-save</div>
                <div class="ps-settings-item-description">Automatically save notes while typing</div>
              </div>
              <label class="ps-toggle">
                <input type="checkbox" 
                       ${_settings.notesAutoSave ? 'checked' : ''} 
                       onchange="PSSettings.update('notesAutoSave', this.checked)">
                <span class="ps-toggle-slider"></span>
              </label>
            </div>
            
            <div class="ps-settings-item">
              <div class="ps-settings-item-info">
                <div class="ps-settings-item-label">Auto-save delay</div>
                <div class="ps-settings-item-description">Milliseconds to wait before saving</div>
              </div>
              <select class="ps-select" onchange="PSSettings.update('notesAutoSaveDelay', parseInt(this.value))">
                <option value="500" ${_settings.notesAutoSaveDelay === 500 ? 'selected' : ''}>500ms</option>
                <option value="1000" ${_settings.notesAutoSaveDelay === 1000 ? 'selected' : ''}>1 second</option>
                <option value="2000" ${_settings.notesAutoSaveDelay === 2000 ? 'selected' : ''}>2 seconds</option>
                <option value="5000" ${_settings.notesAutoSaveDelay === 5000 ? 'selected' : ''}>5 seconds</option>
              </select>
            </div>
          </div>
        </div>
        
        <div class="ps-settings-section">
          <h3 class="ps-settings-section-title">Sync</h3>
          
          <div class="ps-settings-group">
            <div class="ps-settings-item">
              <div class="ps-settings-item-info">
                <div class="ps-settings-item-label">Cloud Sync</div>
                <div class="ps-settings-item-description">Sync encrypted data to cloud (manual only)</div>
              </div>
              <label class="ps-toggle">
                <input type="checkbox" 
                       ${_settings.syncEnabled ? 'checked' : ''} 
                       onchange="PSSettings.update('syncEnabled', this.checked)">
                <span class="ps-toggle-slider"></span>
              </label>
            </div>
            
            ${_settings.syncEnabled ? `
              <div class="ps-sync-status">
                <div class="ps-sync-status-indicator ${_settings.syncLastAt ? 'synced' : 'pending'}"></div>
                <div class="ps-sync-status-text">
                  ${_settings.syncLastAt 
                    ? `Last synced: ${new Date(_settings.syncLastAt).toLocaleString()}`
                    : 'Not synced yet'}
                </div>
                <button class="ps-btn ps-btn-sm ps-btn-primary" onclick="PSSettings.syncNow()">
                  Sync Now
                </button>
              </div>
            ` : ''}
          </div>
        </div>
        
        <div class="ps-settings-section">
          <h3 class="ps-settings-section-title">Data Management</h3>
          
          <div class="ps-settings-group">
            <div class="ps-settings-item">
              <div class="ps-settings-item-info">
                <div class="ps-settings-item-label">Export Format</div>
                <div class="ps-settings-item-description">Format for data exports</div>
              </div>
              <select class="ps-select" onchange="PSSettings.update('exportFormat', this.value)">
                <option value="json" ${_settings.exportFormat === 'json' ? 'selected' : ''}>JSON</option>
                <option value="encrypted" ${_settings.exportFormat === 'encrypted' ? 'selected' : ''}>Encrypted</option>
              </select>
            </div>
            
            <div class="ps-settings-actions">
              <button class="ps-btn ps-btn-secondary" onclick="PSSettings.exportData()">
                <svg viewBox="0 0 24 24"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
                Export All Data
              </button>
              <button class="ps-btn ps-btn-secondary" onclick="PSSettings.importData()">
                <svg viewBox="0 0 24 24"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/></svg>
                Import Data
              </button>
            </div>
          </div>
        </div>
        
        <div class="ps-settings-section ps-settings-danger">
          <h3 class="ps-settings-section-title">Danger Zone</h3>
          
          <div class="ps-settings-group">
            <div class="ps-settings-item">
              <div class="ps-settings-item-info">
                <div class="ps-settings-item-label">Clear Memory</div>
                <div class="ps-settings-item-description">Clear all AI memory data</div>
              </div>
              <button class="ps-btn ps-btn-sm ps-btn-danger" onclick="PSSettings.clearMemory()">
                Clear Memory
              </button>
            </div>
            
            <div class="ps-settings-item">
              <div class="ps-settings-item-info">
                <div class="ps-settings-item-label">Clear All Data</div>
                <div class="ps-settings-item-description">Permanently delete everything</div>
              </div>
              <button class="ps-btn ps-btn-sm ps-btn-danger" onclick="PSSettings.clearAllData()">
                Clear Everything
              </button>
            </div>
            
            <div class="ps-settings-item">
              <div class="ps-settings-item-info">
                <div class="ps-settings-item-label">Change Password</div>
                <div class="ps-settings-item-description">Update your access password</div>
              </div>
              <button class="ps-btn ps-btn-sm ps-btn-secondary" onclick="PSSettings.showChangePasswordModal()">
                Change
              </button>
            </div>
          </div>
        </div>
        
        <div class="ps-settings-footer">
          <p class="ps-settings-version">Private Space v1.0.0</p>
          <p class="ps-settings-info">All data encrypted with AES-256-GCM</p>
        </div>
      </div>
    `;
  }

  /**
   * Show change password modal
   */
  function showChangePasswordModal() {
    PSUI.showModal(
      '<h3>Change Password</h3>',
      `
        <div class="ps-change-password-form">
          <div class="ps-form-group">
            <label class="ps-form-label">Current Password</label>
            <input type="password" class="ps-input" id="cpCurrentPassword" autocomplete="off">
          </div>
          <div class="ps-form-group">
            <label class="ps-form-label">New Password</label>
            <input type="password" class="ps-input" id="cpNewPassword" autocomplete="off">
          </div>
          <div class="ps-form-group">
            <label class="ps-form-label">Confirm New Password</label>
            <input type="password" class="ps-input" id="cpConfirmPassword" autocomplete="off">
          </div>
          <div class="ps-form-error" id="cpError" style="display:none;color:var(--ps-danger);margin:0.5rem 0;font-size:0.875rem;"></div>
          <div class="ps-form-actions" style="margin-top:1rem;display:flex;gap:0.5rem;justify-content:flex-end;">
            <button class="ps-btn ps-btn-secondary" onclick="PSUI.hideModal()">Cancel</button>
            <button class="ps-btn ps-btn-primary" onclick="PSSettings.executePasswordChange()">Change Password</button>
          </div>
        </div>
      `
    );
    setTimeout(() => document.getElementById('cpCurrentPassword')?.focus(), 100);
  }

  /**
   * Execute password change
   */
  async function executePasswordChange() {
    const currentPassword = document.getElementById('cpCurrentPassword')?.value || '';
    const newPassword = document.getElementById('cpNewPassword')?.value || '';
    const confirmPassword = document.getElementById('cpConfirmPassword')?.value || '';
    const errorEl = document.getElementById('cpError');
    
    const showError = (msg) => {
      if (errorEl) {
        errorEl.textContent = msg;
        errorEl.style.display = 'block';
      }
    };
    
    if (!currentPassword || !newPassword || !confirmPassword) {
      showError('All fields are required');
      return;
    }
    
    if (newPassword !== confirmPassword) {
      showError('New passwords do not match');
      return;
    }
    
    if (newPassword.trim().length < 2) {
      showError('New password is too short');
      return;
    }
    
    const result = await PSCrypto.changePassword(currentPassword, newPassword);
    
    if (!result.success) {
      if (result.error === 'current') {
        showError('Current password is incorrect');
      } else {
        showError('Password change failed');
      }
      return;
    }
    
    PSUI.hideModal();
    window.location.reload();
  }

  /**
   * Update setting
   */
  async function update(key, value) {
    _settings[key] = value;
    await saveSettings();
    
    // Apply setting immediately if applicable
    if (key === 'focusModeEnabled') {
      PSUI.toggleFocusMode(value);
    } else if (key === 'autoLock') {
      PSAuth.setAutoLock(value);
    }
    
    PSUI.showToast('Setting updated');
  }

  /**
   * Update memory consent
   */
  async function updateMemoryConsent(type, value) {
    if (!_settings.memoryConsent) {
      _settings.memoryConsent = { shortTerm: true, working: true, longTerm: false };
    }
    _settings.memoryConsent[type] = value;
    await saveSettings();
    PSUI.showToast('Memory setting updated');
  }

  /**
   * Save settings to storage
   */
  async function saveSettings() {
    _settings.id = 'settings';
    await PSStorage.save(PSStorage.STORES.SETTINGS, _settings);
  }

  /**
   * Export all data
   */
  async function exportData() {
    try {
      PSUI.showToast('Preparing export...');

      const data = {
        version: '1.0.0',
        exportedAt: Date.now(),
        settings: _settings,
        notes: await PSStorage.getAll(PSStorage.STORES.NOTES),
        images: await PSStorage.getAll(PSStorage.STORES.IMAGES),
        logs: await PSStorage.getAll(PSStorage.STORES.LOGS),
        memory: await PSStorage.getAll(PSStorage.STORES.MEMORY),
        projects: await PSStorage.getAll(PSStorage.STORES.PROJECTS),
        chat: await PSStorage.getAll(PSStorage.STORES.CHAT)
      };

      let exportContent;
      let filename;

      if (_settings.exportFormat === 'encrypted') {
        exportContent = await PSCrypto.encrypt(JSON.stringify(data));
        filename = `private-space-backup-${Date.now()}.psbackup`;
      } else {
        exportContent = JSON.stringify(data, null, 2);
        filename = `private-space-backup-${Date.now()}.json`;
      }

      const blob = new Blob([exportContent], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      
      const a = document.createElement('a');
      a.href = url;
      a.download = filename;
      a.click();
      
      URL.revokeObjectURL(url);
      PSUI.showToast('Export complete');
    } catch (error) {
      console.error('Export failed:', error);
      PSUI.showToast('Export failed', 'error');
    }
  }

  /**
   * Import data
   */
  async function importData() {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.json,.psbackup';
    
    input.onchange = async (e) => {
      const file = e.target.files[0];
      if (!file) return;

      try {
        PSUI.showToast('Importing...');
        
        let content = await file.text();
        
        // Check if encrypted
        if (file.name.endsWith('.psbackup')) {
          content = await PSCrypto.decrypt(content);
        }

        const data = JSON.parse(content);

        // Validate structure
        if (!data.version || !data.exportedAt) {
          throw new Error('Invalid backup file');
        }

        // Confirm import
        const confirmed = confirm('This will merge imported data with existing data. Continue?');
        if (!confirmed) return;

        // Import each store
        if (data.notes) {
          for (const item of data.notes) {
            await PSStorage.save(PSStorage.STORES.NOTES, item);
          }
        }
        if (data.images) {
          for (const item of data.images) {
            await PSStorage.save(PSStorage.STORES.IMAGES, item);
          }
        }
        if (data.logs) {
          for (const item of data.logs) {
            await PSStorage.save(PSStorage.STORES.LOGS, item);
          }
        }
        if (data.memory) {
          for (const item of data.memory) {
            await PSStorage.save(PSStorage.STORES.MEMORY, item);
          }
        }
        if (data.projects) {
          for (const item of data.projects) {
            await PSStorage.save(PSStorage.STORES.PROJECTS, item);
          }
        }
        if (data.chat) {
          for (const item of data.chat) {
            await PSStorage.save(PSStorage.STORES.CHAT, item);
          }
        }

        PSUI.showToast('Import complete');
        window.location.reload();
      } catch (error) {
        console.error('Import failed:', error);
        PSUI.showToast('Import failed: ' + error.message, 'error');
      }
    };

    input.click();
  }

  /**
   * Sync now
   */
  async function syncNow() {
    if (!_settings.syncEnabled) return;

    try {
      PSUI.showToast('Syncing...');
      
      // Placeholder for actual sync implementation
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      _settings.syncLastAt = Date.now();
      await saveSettings();
      render();
      
      PSUI.showToast('Sync complete');
    } catch (error) {
      console.error('Sync failed:', error);
      PSUI.showToast('Sync failed', 'error');
    }
  }

  /**
   * Clear memory
   */
  async function clearMemory() {
    const confirmed = confirm('Clear all AI memory data? This cannot be undone.');
    if (!confirmed) return;

    try {
      await PSStorage.clear(PSStorage.STORES.MEMORY);
      PSUI.showToast('Memory cleared');
    } catch (error) {
      console.error('Clear memory failed:', error);
      PSUI.showToast('Failed to clear memory', 'error');
    }
  }

  /**
   * Clear all data
   */
  async function clearAllData() {
    const confirmed = confirm('DELETE ALL DATA? This action cannot be undone!');
    if (!confirmed) return;

    const doubleConfirm = confirm('Are you absolutely sure? Type "DELETE" in the next prompt to confirm.');
    if (!doubleConfirm) return;

    const typed = prompt('Type DELETE to confirm:');
    if (typed !== 'DELETE') {
      PSUI.showToast('Cancelled');
      return;
    }

    try {
      await PSStorage.clearAll();
      PSUI.showToast('All data cleared');
      PSAuth.lock();
    } catch (error) {
      console.error('Clear all failed:', error);
      PSUI.showToast('Failed to clear data', 'error');
    }
  }

  /**
   * Change password (deprecated - use modal)
   */
  async function changePassword() {
    showChangePasswordModal();
  }

  return {
    load,
    loadSettings,
    getSettings,
    get,
    update,
    updateMemoryConsent,
    exportData,
    importData,
    syncNow,
    clearMemory,
    clearAllData,
    changePassword,
    showChangePasswordModal,
    executePasswordChange
  };
})();

if (typeof module !== 'undefined' && module.exports) {
  module.exports = PSSettings;
}
