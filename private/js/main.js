/**
 * ═══════════════════════════════════════════════════════════
 * PRIVATE SPACE - MAIN APPLICATION
 * Application initialization and coordination
 * ═══════════════════════════════════════════════════════════
 */

(function() {
  'use strict';

  // Lockout configuration
  const LOCKOUT_CONFIG = {
    maxAttempts: 5,
    lockoutDuration: 60000,
    storageKey: 'ps_lockout',
    attemptsKey: 'ps_attempts'
  };

  const App = {
    /**
     * Check if locked out
     */
    isLockedOut() {
      const lockoutUntil = parseInt(sessionStorage.getItem(LOCKOUT_CONFIG.storageKey) || '0', 10);
      if (lockoutUntil > Date.now()) {
        return { locked: true, remaining: Math.ceil((lockoutUntil - Date.now()) / 1000) };
      }
      if (lockoutUntil > 0) {
        sessionStorage.removeItem(LOCKOUT_CONFIG.storageKey);
        sessionStorage.removeItem(LOCKOUT_CONFIG.attemptsKey);
      }
      return { locked: false, remaining: 0 };
    },

    /**
     * Get failed attempts count
     */
    getFailedAttempts() {
      return parseInt(sessionStorage.getItem(LOCKOUT_CONFIG.attemptsKey) || '0', 10);
    },

    /**
     * Increment failed attempts
     */
    incrementFailedAttempts() {
      const attempts = this.getFailedAttempts() + 1;
      sessionStorage.setItem(LOCKOUT_CONFIG.attemptsKey, attempts.toString());
      if (attempts >= LOCKOUT_CONFIG.maxAttempts) {
        sessionStorage.setItem(LOCKOUT_CONFIG.storageKey, (Date.now() + LOCKOUT_CONFIG.lockoutDuration).toString());
      }
      return attempts;
    },

    /**
     * Reset failed attempts
     */
    resetFailedAttempts() {
      sessionStorage.removeItem(LOCKOUT_CONFIG.attemptsKey);
      sessionStorage.removeItem(LOCKOUT_CONFIG.storageKey);
    },

    /**
     * Initialize application
     */
    async init() {
      this.showLockScreen();
      this.setupEventListeners();
      this.updateLockoutUI();
    },

    /**
     * Show lock screen
     */
    showLockScreen() {
      const lockScreen = document.getElementById('lockScreen');
      const mainApp = document.getElementById('mainApp');
      
      if (lockScreen) lockScreen.classList.add('active');
      if (mainApp) mainApp.classList.remove('active');

      setTimeout(() => {
        document.getElementById('passwordInput')?.focus();
      }, 100);
    },

    /**
     * Hide lock screen and show real dashboard
     */
    showApp() {
      const lockScreen = document.getElementById('lockScreen');
      const mainApp = document.getElementById('mainApp');
      
      if (lockScreen) lockScreen.classList.remove('active');
      if (mainApp) mainApp.classList.add('active');
    },

    /**
     * Update lockout UI state
     */
    updateLockoutUI() {
      const lockout = this.isLockedOut();
      const input = document.getElementById('passwordInput');
      const unlockBtn = document.getElementById('unlockBtn');
      const errorEl = document.getElementById('lockError');
      
      if (lockout.locked) {
        if (input) input.disabled = true;
        if (unlockBtn) unlockBtn.disabled = true;
        if (errorEl) {
          errorEl.textContent = `Too many attempts. Try again in ${lockout.remaining}s`;
          errorEl.style.display = 'block';
        }
        setTimeout(() => this.updateLockoutUI(), 1000);
      } else {
        if (input) input.disabled = false;
        if (unlockBtn) unlockBtn.disabled = false;
        if (errorEl && errorEl.textContent.includes('Too many')) {
          errorEl.style.display = 'none';
        }
      }
    },

    /**
     * Attempt unlock - SINGLE DETERMINISTIC PATH
     */
    async unlock() {
      const lockout = this.isLockedOut();
      if (lockout.locked) {
        this.updateLockoutUI();
        return;
      }

      const input = document.getElementById('passwordInput');
      const unlockBtn = document.getElementById('unlockBtn');
      const password = input?.value?.trim();
      const errorEl = document.getElementById('lockError');

      // Clear previous errors
      if (errorEl) {
        errorEl.style.display = 'none';
        errorEl.textContent = '';
      }

      // Empty password check
      if (!password) {
        this.shakeInput(input);
        this.showError(errorEl, 'Please enter password');
        return;
      }

      // Show loading state
      if (unlockBtn) {
        unlockBtn.disabled = true;
        unlockBtn.innerHTML = '<svg class="spin" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10" stroke-dasharray="32" stroke-dashoffset="12"/></svg>';
      }

      // STEP 1: Verify password hash
      let isValid = false;
      try {
        isValid = await PSCrypto.verify(password);
      } catch (e) {
        isValid = false;
      }

      // STEP 2: WRONG PASSWORD - show error and return immediately
      if (!isValid) {
        const attempts = this.incrementFailedAttempts();
        
        if (attempts >= LOCKOUT_CONFIG.maxAttempts) {
          this.updateLockoutUI();
        } else {
          this.shakeInput(input);
          this.showError(errorEl, 'Incorrect password');
        }
        
        input.value = '';
        input.focus();
        this.resetButton(unlockBtn);
        return; // EXIT - wrong password
      }

      // STEP 3: CORRECT PASSWORD - unlock real dashboard
      this.resetFailedAttempts();
      
      try {
        await PSCrypto.init(password);
        await PSStorage.init();
        await PSSettings.loadSettings();
        await this.initializeModules();
        PSAuth.unlock();

        const autoLock = PSSettings.get('autoLock');
        if (autoLock > 0) {
          PSAuth.setAutoLock(autoLock);
        }
      } catch (initError) {
        // Module init failed but password was correct - still unlock
        console.warn('Module initialization warning:', initError);
      }

      // Show real dashboard
      this.showApp();
      
      try {
        PSUI.navigateTo('chat');
      } catch (e) {
        // Navigation failed - dashboard still shows
      }
      
      input.value = '';
      this.resetButton(unlockBtn);
      return; // EXIT - correct password
    },

    /**
     * Reset unlock button state
     */
    resetButton(btn) {
      if (btn) {
        btn.disabled = false;
        btn.innerHTML = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="9 18 15 12 9 6"/></svg>';
      }
    },

    /**
     * Show error message
     */
    showError(el, message) {
      if (el) {
        el.textContent = message;
        el.style.display = 'block';
      }
    },

    /**
     * Initialize all modules
     */
    async initializeModules() {
      // Initialize UI
      PSUI.init();

      // Initialize sync
      await PSSync.init();

      // Initialize memory
      await PSMemory.init();

      // Initialize Master Control Center modules
      try {
        // Initialize IndexedDB
        await PSDatabase.init();
        console.log('[Private Space] Database initialized');

        // Initialize AI System (Dual Mode)
        if (typeof PSAISystem !== 'undefined') {
          await PSAISystem.init();
          console.log('[Private Space] AI System initialized');
        }

        // Initialize Projects Manager
        if (typeof ProjectsManager !== 'undefined') {
          await ProjectsManager.init();
          console.log('[Private Space] Projects Manager initialized');
        }

        // Initialize Navigation Manager
        if (typeof NavigationManager !== 'undefined') {
          await NavigationManager.init();
          console.log('[Private Space] Navigation Manager initialized');
        }

        // Initialize Pages Manager
        if (typeof PagesManager !== 'undefined') {
          await PagesManager.init();
          console.log('[Private Space] Pages Manager initialized');
        }

        // Initialize Settings Manager
        if (typeof SettingsManager !== 'undefined') {
          await SettingsManager.init();
          console.log('[Private Space] Settings Manager initialized');
        }

      } catch (e) {
        console.warn('[Private Space] Master Control module init:', e);
      }

      console.log('[Private Space] All modules initialized');
    },

    /**
     * Shake input for error feedback
     */
    shakeInput(input) {
      if (!input) return;
      
      input.classList.add('shake');
      setTimeout(() => {
        input.classList.remove('shake');
      }, 500);
    },

    /**
     * Check existing session
     */
    async checkSession() {
      // Private space always requires unlock on refresh
    },

    /**
     * Setup global event listeners
     */
    setupEventListeners() {
      // Password input enter key
      document.getElementById('passwordInput')?.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') {
          this.unlock();
        }
      });

      // Unlock button
      document.getElementById('unlockBtn')?.addEventListener('click', () => {
        this.unlock();
      });

      // Visibility change (lock on tab hide - optional)
      document.addEventListener('visibilitychange', () => {
        if (document.hidden && PSAuth.isUnlocked()) {
          // Optional: auto-lock on tab hide
          // PSAuth.lock();
        }
      });

      // Before unload
      window.addEventListener('beforeunload', () => {
        PSAuth.lock();
      });

      // Global keyboard shortcuts
      document.addEventListener('keydown', (e) => {
        if (!PSAuth.isUnlocked()) return;

        // Ctrl/Cmd + K - Quick search/command
        if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
          e.preventDefault();
          this.showCommandPalette();
        }

        // Ctrl/Cmd + L - Lock
        if ((e.ctrlKey || e.metaKey) && e.key === 'l') {
          e.preventDefault();
          PSAuth.lock();
        }

        // Ctrl/Cmd + F - Toggle focus mode
        if ((e.ctrlKey || e.metaKey) && e.key === 'f' && e.shiftKey) {
          e.preventDefault();
          PSUI.toggleFocusMode();
        }

        // Ctrl/Cmd + 1-9 - Quick navigation
        if ((e.ctrlKey || e.metaKey) && e.key >= '1' && e.key <= '9') {
          e.preventDefault();
          const sections = ['chat', 'pro-chat', 'notes', 'log', 'memory', 'projects', 'navigation', 'pages', 'site-settings'];
          const idx = parseInt(e.key) - 1;
          if (sections[idx]) {
            PSUI.navigateTo(sections[idx]);
          }
        }
      });
    },

    /**
     * Show command palette
     */
    showCommandPalette() {
      const commands = [
        { name: 'Go to Her Mode', action: () => PSUI.navigateTo('chat') },
        { name: 'Go to Pro Mode', action: () => PSUI.navigateTo('pro-chat') },
        { name: 'Go to Notes', action: () => PSUI.navigateTo('notes') },
        { name: 'Go to Images', action: () => PSUI.navigateTo('images') },
        { name: 'Go to Daily Log', action: () => PSUI.navigateTo('log') },
        { name: 'Go to Memory', action: () => PSUI.navigateTo('memory') },
        { name: 'Go to Projects Manager', action: () => PSUI.navigateTo('projects') },
        { name: 'Go to Navigation Manager', action: () => PSUI.navigateTo('navigation') },
        { name: 'Go to Pages Manager', action: () => PSUI.navigateTo('pages') },
        { name: 'Go to Site Settings', action: () => PSUI.navigateTo('site-settings') },
        { name: 'Go to Private Settings', action: () => PSUI.navigateTo('settings') },
        { name: 'Toggle Focus Mode', action: () => PSUI.toggleFocusMode() },
        { name: 'Toggle AI Panel', action: () => PSUI.toggleAI() },
        { name: 'New Note', action: () => { PSUI.navigateTo('notes'); PSNotes.create(); } },
        { name: 'New Project', action: () => { PSUI.navigateTo('projects'); ProjectsManager?.openEditor(); } },
        { name: 'Sync to Public Site', action: () => { 
          ProjectsManager?.syncToPublicSite();
          NavigationManager?.syncToPublicSite();
          PagesManager?.syncToPublicSite();
          SettingsManager?.syncToPublicSite();
          Toast?.show('Synced to public site', 'success');
        } },
        { name: 'Lock', action: () => PSAuth.lock() },
        { name: 'Export Data', action: () => PSSettings.exportData() }
      ];

      PSUI.showModal(
        '<h3>Command Palette</h3>',
        `
          <div class="ps-command-palette">
            <input type="text" 
                   class="ps-input" 
                   id="commandSearch"
                   placeholder="Search commands..."
                   oninput="App.filterCommands(this.value)">
            <div class="ps-command-list" id="commandList">
              ${commands.map((cmd, i) => `
                <button class="ps-command-item" data-index="${i}" onclick="App.runCommand(${i})">
                  ${cmd.name}
                </button>
              `).join('')}
            </div>
          </div>
        `
      );

      // Store commands reference
      this._commands = commands;

      // Focus search
      setTimeout(() => {
        document.getElementById('commandSearch')?.focus();
      }, 100);
    },

    /**
     * Filter commands
     */
    filterCommands(query) {
      const list = document.getElementById('commandList');
      if (!list || !this._commands) return;

      const filtered = this._commands.filter(cmd => 
        cmd.name.toLowerCase().includes(query.toLowerCase())
      );

      list.innerHTML = filtered.map((cmd, i) => `
        <button class="ps-command-item" onclick="App.runCommand(${this._commands.indexOf(cmd)})">
          ${cmd.name}
        </button>
      `).join('');
    },

    /**
     * Run command
     */
    runCommand(index) {
      if (!this._commands || !this._commands[index]) return;
      PSUI.hideModal();
      this._commands[index].action();
    }
  };

  // Make App globally available
  window.App = App;

  // Initialize on DOM ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => App.init());
  } else {
    App.init();
  }
})();
