/**
 * ═══════════════════════════════════════════════════════════
 * IMPORTED CHATS VIEWER - WhatsApp & Instagram
 * Advanced chat viewer with search, timeline scrubbing, 
 * per-chat locking, and emotion heatmap
 * ═══════════════════════════════════════════════════════════
 * 
 * MANDATORY SCROLL & LAYOUT REQUIREMENTS
 * ═══════════════════════════════════════════════════════════
 * 
 * LAYOUT SEPARATION (Non-negotiable):
 * - LEFT SIDEBAR (Chat List): Fixed, independent scroll
 * - RIGHT CHAT VIEWER (Messages): Independent scroll
 * - No shared scroll container
 * - No layout shift when messages load
 * 
 * CHAT START POSITION (Critical):
 * - Chat MUST start at LATEST message (bottom)
 * - Chat MUST NOT start at the top
 * - User immediately sees most recent messages
 * 
 * UPWARD LAZY LOADING (Mandatory):
 * - Older messages load ONLY when scrolling UP
 * - Load triggers BEFORE reaching absolute top (threshold)
 * - NOT when scrollTop === 0
 * 
 * SCROLL POSITION STABILITY (Non-negotiable):
 * - Capture scrollHeight BEFORE loading older messages
 * - Restore scrollTop so visible message stays in place
 * - No scroll jumps, no stuck states
 * 
 * LOADING STATE MANAGEMENT:
 * - Loading flag MUST reset after messages added OR no more exist
 * - Never permanently block upward loading
 * - "X older messages" indicator MUST disappear once loading begins
 * 
 * FINAL RULE: Behavior must match WhatsApp Web / Instagram DM
 * ═══════════════════════════════════════════════════════════
 */

const ImportedChats = {
  // State
  chats: [],
  currentChat: null,
  currentMessages: [],
  filteredMessages: [],
  lockStates: {}, // { chatId: boolean }
  heatmapActive: false,
  searchActive: false,
  searchQuery: '',
  searchMatches: [],
  currentMatchIndex: 0,
  messageMetadata: {}, // { messageId: { group, date, index } }
  insightsActive: false,
  cachedInsights: null, // { chatId, stats }
  
  // ═══════════════════════════════════════════════════════════
  // VIRTUAL SCROLLING / INCREMENTAL LOADING
  // ═══════════════════════════════════════════════════════════
  // CRITICAL RULES (WhatsApp/Instagram DM style):
  // 1. Chat MUST start at LATEST message (bottom)
  // 2. Older messages load ONLY when scrolling UP
  // 3. Scroll position MUST be preserved when prepending
  // 4. Loading flag MUST reset after load completes
  // 5. "X older messages" indicator MUST disappear during load
  // ═══════════════════════════════════════════════════════════
  rendering: {
    batchSize: 50,           // Messages to render per batch
    renderedCount: 0,        // Currently rendered messages
    isLoadingMore: false,    // Prevent double-loading (MUST reset after load)
    scrollThreshold: 300,    // Pixels from top to trigger load (NOT scrollTop === 0)
    hasMoreMessages: true,   // Track if there are more messages to load
  },
  
  // ═══════════════════════════════════════════════════════════
  // AUTO-UPDATE STATE
  // ═══════════════════════════════════════════════════════════
  autoUpdate: {
    enabled: true,
    pollInterval: 5000, // 5 seconds
    pollTimer: null,
    lastWhatsAppIndexHash: null,
    lastInstaIndexHash: null,
    isUpdating: false,
  },
  
  // Sentiment keywords for basic emotion analysis
  sentimentKeywords: {
    positive: ['love', 'happy', 'great', 'good', 'amazing', 'wonderful', 'awesome', 'perfect', 'nice', 'great', 'best', 'yes', 'yay', '😊', '😍', '🥰', '😄', '💕', '✨', '🌸'],
    negative: ['hate', 'bad', 'sad', 'angry', 'hurt', 'disappointed', 'terrible', 'awful', 'worst', 'no', 'ugh', '😢', '😔', '😠', '😤', '💔', '😭'],
  },

  // ═══════════════════════════════════════════════════════════
  // REPAIR FALLBACK STATE (NOT FEEDBACK)
  // ═══════════════════════════════════════════════════════════
  // Fallback responses are for RECOVERY, not conversational replies.
  // A fallback message (error, apology, recovery notice) MUST only
  // trigger ONCE for a single failure event. After triggering,
  // normal conversation logic resumes. The fallback MUST NOT repeat.
  // ═══════════════════════════════════════════════════════════
  fallbackState: {
    triggered: false,
    lastFailureId: null,
    failureCount: 0
  },

  // ═══════════════════════════════════════════════════════════
  // REPAIR FALLBACK BEHAVIOR RULES (NOT FEEDBACK)
  // ═══════════════════════════════════════════════════════════
  // RULES:
  // - A fallback response may trigger ONLY ONCE for a single failure event
  // - After triggering fallback: system must attempt recovery, normal logic resumes
  // - Fallback message MUST NOT repeat on subsequent user messages
  // PROHIBITED BEHAVIOR:
  // - Repeating the same fallback line
  // - Treating fallback as a default reply
  // - Looping apology-style responses
  // STATE REQUIREMENT:
  // - Track fallback-triggered state
  // - Once fired, disable fallback until NEW failure detected
  // FINAL RULE: Fallbacks exist to FIX a problem, not replace real replies
  // ═══════════════════════════════════════════════════════════

  FALLBACK_MESSAGES: [
    'Something went wrong loading the chat. Retrying...',
    'Connection issue detected. Please try again.',
    'Error loading messages. Attempting recovery...'
  ],

  // Check if fallback can be triggered (prevents repetition)
  canTriggerFallback(failureId) {
    const state = this.fallbackState;
    // If same failure, don't repeat fallback
    if (state.triggered && state.lastFailureId === failureId) {
      return false;
    }
    return true;
  },

  // Trigger fallback and mark state
  triggerFallback(failureId) {
    if (!this.canTriggerFallback(failureId)) {
      // Return null to signal: don't show fallback again
      return null;
    }
    
    this.fallbackState = {
      triggered: true,
      lastFailureId: failureId,
      failureCount: (this.fallbackState?.failureCount || 0) + 1
    };
    
    // Return a fallback message (only first time for this failure)
    return this.FALLBACK_MESSAGES[Math.floor(Math.random() * this.FALLBACK_MESSAGES.length)];
  },

  // Reset fallback state (call on successful operation)
  resetFallbackState() {
    this.fallbackState = {
      triggered: false,
      lastFailureId: null,
      failureCount: 0
    };
  },

  // ═══════════════════════════════════════════════════════════
  // INITIALIZATION
  // ═══════════════════════════════════════════════════════════
  async init() {
    console.log('[Init] Starting ImportedChats...');
    
    // Load lock states from localStorage
    this.loadLockStates();
    
    // Load cached chats first for instant display
    this.loadCachedChats();
    
    // Load chats from files (will update cache)
    await this.loadChats();
    
    // Bind event listeners
    this.bindEvents();
    
    // Render chat list
    this.renderChatList();
    
    // Auto-open first chat on desktop
    if (window.innerWidth > 768 && this.chats.length > 0) {
      console.log('[Init] Auto-opening first chat on desktop');
      this.selectChat(this.chats[0].id);
    }
    
    // Start auto-update polling
    this.startAutoUpdatePolling();
  },
  
  // Load chats from localStorage cache for instant display
  loadCachedChats() {
    try {
      const cached = localStorage.getItem('importedChatsCache');
      if (cached) {
        const data = JSON.parse(cached);
        if (data.chats && Array.isArray(data.chats)) {
          this.chats = data.chats;
          console.log('[Cache] Loaded', this.chats.length, 'cached chats');
        }
      }
    } catch (e) {
      console.warn('[Cache] Failed to load cached chats:', e);
    }
  },
  
  // Save chats to localStorage cache
  saveCachedChats() {
    try {
      const data = {
        timestamp: Date.now(),
        chats: this.chats.map(c => ({
          ...c,
          messages: c.messages.slice(-100) // Cache only last 100 messages per chat
        }))
      };
      localStorage.setItem('importedChatsCache', JSON.stringify(data));
      console.log('[Cache] Saved', this.chats.length, 'chats to cache');
    } catch (e) {
      console.warn('[Cache] Failed to save chats:', e);
    }
  },

  // ═══════════════════════════════════════════════════════════
  // AUTO-UPDATE POLLING SYSTEM
  // ═══════════════════════════════════════════════════════════
  startAutoUpdatePolling() {
    if (!this.autoUpdate.enabled) return;
    
    // Clear any existing timer
    this.stopAutoUpdatePolling();
    
    console.log('[AutoUpdate] Starting polling every', this.autoUpdate.pollInterval, 'ms');
    
    this.autoUpdate.pollTimer = setInterval(() => {
      this.checkForUpdates();
    }, this.autoUpdate.pollInterval);
    
    // Also check on visibility change (when user returns to tab)
    document.addEventListener('visibilitychange', this.handleVisibilityChange.bind(this));
    
    // Cleanup on page unload
    window.addEventListener('beforeunload', () => this.stopAutoUpdatePolling());
  },

  stopAutoUpdatePolling() {
    if (this.autoUpdate.pollTimer) {
      clearInterval(this.autoUpdate.pollTimer);
      this.autoUpdate.pollTimer = null;
      console.log('[AutoUpdate] Polling stopped');
    }
  },

  setAutoUpdateInterval(ms) {
    this.autoUpdate.pollInterval = ms;
    if (this.autoUpdate.pollTimer) {
      // Restart with new interval
      this.startAutoUpdatePolling();
    }
  },

  enableAutoUpdate(enable = true) {
    this.autoUpdate.enabled = enable;
    if (enable) {
      this.startAutoUpdatePolling();
    } else {
      this.stopAutoUpdatePolling();
    }
  },

  handleVisibilityChange() {
    if (document.visibilityState === 'visible' && this.autoUpdate.enabled) {
      // Immediately check for updates when tab becomes visible
      console.log('[AutoUpdate] Tab visible - checking for updates');
      this.checkForUpdates();
    }
  },

  async checkForUpdates() {
    if (this.autoUpdate.isUpdating) return;
    
    this.autoUpdate.isUpdating = true;
    
    try {
      const whatsappChanged = await this.checkWhatsAppIndexChanged();
      const instaChanged = await this.checkInstaIndexChanged();
      
      if (whatsappChanged || instaChanged) {
        console.log('[AutoUpdate] Changes detected - WhatsApp:', whatsappChanged, 'Instagram:', instaChanged);
        await this.refreshChats(whatsappChanged, instaChanged);
      }
    } catch (error) {
      console.warn('[AutoUpdate] Check failed:', error);
    } finally {
      this.autoUpdate.isUpdating = false;
    }
  },

  async checkWhatsAppIndexChanged() {
    const basePath = '/private/she/chats/Whatsapp';
    try {
      const response = await fetch(`${basePath}/index.json?_t=${Date.now()}`).catch(() => null);
      if (!response?.ok) return false;
      
      const text = await response.text();
      const hash = this.simpleHash(text);
      
      if (this.autoUpdate.lastWhatsAppIndexHash === null) {
        this.autoUpdate.lastWhatsAppIndexHash = hash;
        return false; // First load, not a change
      }
      
      if (hash !== this.autoUpdate.lastWhatsAppIndexHash) {
        this.autoUpdate.lastWhatsAppIndexHash = hash;
        return true;
      }
      
      return false;
    } catch (e) {
      return false;
    }
  },

  async checkInstaIndexChanged() {
    const basePath = '/private/she/chats/insta';
    try {
      const response = await fetch(`${basePath}/index.json?_t=${Date.now()}`).catch(() => null);
      if (!response?.ok) return false;
      
      const text = await response.text();
      const hash = this.simpleHash(text);
      
      if (this.autoUpdate.lastInstaIndexHash === null) {
        this.autoUpdate.lastInstaIndexHash = hash;
        return false; // First load, not a change
      }
      
      if (hash !== this.autoUpdate.lastInstaIndexHash) {
        this.autoUpdate.lastInstaIndexHash = hash;
        return true;
      }
      
      return false;
    } catch (e) {
      return false;
    }
  },

  simpleHash(str) {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32bit integer
    }
    return hash.toString(36);
  },

  async refreshChats(whatsappChanged, instaChanged) {
    console.log('[AutoUpdate] Refreshing chats...');
    
    // Store current chat ID to preserve selection
    const currentChatId = this.currentChat?.id;
    const previousChats = new Map(this.chats.map(c => [c.id, c]));
    
    try {
      const newChats = [];
      
      // Fetch updated chats only for changed platforms
      if (whatsappChanged) {
        const whatsappChats = await this.discoverWhatsAppChats();
        newChats.push(...whatsappChats);
      } else {
        // Keep existing WhatsApp chats
        newChats.push(...this.chats.filter(c => c.platform === 'whatsapp'));
      }
      
      if (instaChanged) {
        const instaChats = await this.discoverInstagramChats();
        newChats.push(...instaChats);
      } else {
        // Keep existing Instagram chats
        newChats.push(...this.chats.filter(c => c.platform === 'instagram'));
      }
      
      // Sort by last message time
      newChats.sort((a, b) => {
        const aTime = a.lastMessageTime || a.importedAt || 0;
        const bTime = b.lastMessageTime || b.importedAt || 0;
        return new Date(bTime) - new Date(aTime);
      });
      
      // Smart diff update
      this.applySmartDiff(previousChats, newChats, currentChatId);
      
    } catch (error) {
      console.error('[AutoUpdate] Refresh failed:', error);
    }
  },

  applySmartDiff(previousChats, newChats, currentChatId) {
    const newChatsMap = new Map(newChats.map(c => [c.id, c]));
    
    // Find added, removed, and updated chats
    const added = [];
    const removed = [];
    const updated = [];
    
    // Check for new or updated chats
    for (const chat of newChats) {
      const prev = previousChats.get(chat.id);
      if (!prev) {
        added.push(chat);
      } else if (prev.lastMessageTime !== chat.lastMessageTime || 
                 prev.messageCount !== chat.messageCount ||
                 prev.preview !== chat.preview) {
        updated.push(chat);
      }
    }
    
    // Check for removed chats
    for (const [id, chat] of previousChats) {
      if (!newChatsMap.has(id)) {
        removed.push(chat);
      }
    }
    
    // Log changes
    if (added.length) console.log('[AutoUpdate] Added:', added.map(c => c.name));
    if (removed.length) console.log('[AutoUpdate] Removed:', removed.map(c => c.name));
    if (updated.length) console.log('[AutoUpdate] Updated:', updated.map(c => c.name));
    
    // Only update if there are changes
    if (added.length === 0 && removed.length === 0 && updated.length === 0) {
      console.log('[AutoUpdate] No effective changes');
      return;
    }
    
    // Update chats array
    this.chats = newChats;
    
    // Handle currently open chat
    if (currentChatId) {
      const currentStillExists = newChatsMap.get(currentChatId);
      
      if (currentStillExists) {
        // Update current chat data if it was updated
        if (updated.some(c => c.id === currentChatId)) {
          this.currentChat = currentStillExists;
          this.currentMessages = currentStillExists.messages || [];
          this.filteredMessages = [...this.currentMessages];
          
          // Re-render messages without scroll jump
          this.renderMessagesPreserveScroll();
        }
      } else {
        // Current chat was removed - deselect gracefully
        console.log('[AutoUpdate] Current chat was removed');
        this.currentChat = null;
        this.currentMessages = [];
        this.filteredMessages = [];
      }
    }
    
    // Update sidebar without jitter
    this.renderChatListSmooth(added, removed, updated);
    
    // Show toast notification for new chats
    if (added.length > 0) {
      this.showAutoUpdateToast(`${added.length} new chat${added.length > 1 ? 's' : ''} added`);
    }
  },

  renderChatListSmooth(added, removed, updated) {
    const grid = document.getElementById('importedChatsGrid');
    const empty = document.getElementById('importedChatsEmpty');
    
    if (!grid || !empty) return;
    
    if (!this.chats.length) {
      grid.style.display = 'none';
      empty.style.display = 'block';
      return;
    }
    
    grid.style.display = 'grid';
    empty.style.display = 'none';
    
    // Create a map of existing DOM elements
    const existingCards = new Map();
    grid.querySelectorAll('.her-imported-chat-card').forEach(card => {
      existingCards.set(card.dataset.chatId, card);
    });
    
    // Build new order
    const fragment = document.createDocumentFragment();
    
    this.chats.forEach(chat => {
      const existingCard = existingCards.get(chat.id);
      
      if (existingCard && !updated.some(u => u.id === chat.id)) {
        // Reuse existing card (just update active state)
        existingCard.classList.toggle('active', this.currentChat?.id === chat.id);
        fragment.appendChild(existingCard);
      } else {
        // Create new card or replace updated one
        const card = this.createChatCard(chat);
        card.style.animation = added.some(a => a.id === chat.id) ? 'fadeInSlide 0.3s ease' : 'none';
        fragment.appendChild(card);
      }
    });
    
    // Clear and append in one operation
    grid.innerHTML = '';
    grid.appendChild(fragment);
  },

  createChatCard(chat) {
    const platformEmoji = chat.platform === 'whatsapp' ? '💬' : '📱';
    const platformLabel = chat.platform === 'whatsapp' ? 'WhatsApp' : 'Instagram';
    const isLocked = this.lockStates[chat.id];
    const isActive = this.currentChat?.id === chat.id;
    
    const previewText = chat.preview || 'No preview available';
    const relativeTime = this.formatRelativeTime(chat.lastMessageTime || chat.previewTime);
    
    const card = document.createElement('div');
    card.className = `her-imported-chat-card${isActive ? ' active' : ''}`;
    card.dataset.chatId = chat.id;
    card.innerHTML = `
      <div class="her-chat-card-header">
        <div class="her-chat-card-info">
          <div class="her-chat-card-platform-emoji">${platformEmoji}</div>
          <div class="her-chat-card-name">${this.escapeHtml(chat.name)}</div>
          <span class="her-chat-card-platform-badge">${platformLabel}</span>
        </div>
        ${isLocked ? '<div class="her-chat-card-lock locked"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg></div>' : ''}
      </div>
      <div class="her-chat-card-preview">${this.escapeHtml(previewText)}</div>
      <div class="her-chat-card-meta">
        <span class="her-chat-card-time">${relativeTime}</span>
        <span class="her-chat-card-count">${chat.messageCount || 0} messages</span>
      </div>
    `;
    
    return card;
  },

  /**
   * ═══════════════════════════════════════════════════════════
   * RENDER MESSAGES PRESERVE SCROLL (for auto-update)
   * ═══════════════════════════════════════════════════════════
   * SCROLL POSITION STABILITY (NON-NEGOTIABLE):
   * - If user was at bottom, stay at bottom after update
   * - If user was scrolled up, preserve their position
   * - No layout shift when messages load
   * ═══════════════════════════════════════════════════════════
   */
  renderMessagesPreserveScroll() {
    const container = document.getElementById('chatMessagesContainer');
    if (!container) return;
    
    // Store scroll state BEFORE re-render
    const scrollTop = container.scrollTop;
    const scrollHeight = container.scrollHeight;
    const clientHeight = container.clientHeight;
    
    // Check if user was at/near bottom (within 50px)
    const wasAtBottom = (scrollHeight - clientHeight - scrollTop) < 50;
    
    // Re-render messages
    this.renderMessages();
    
    // Restore scroll position or stay at bottom
    requestAnimationFrame(() => {
      if (wasAtBottom) {
        // User was at bottom - keep them at bottom (show new messages)
        container.scrollTop = container.scrollHeight;
      } else {
        // User was scrolled up - try to preserve their position
        // Note: this is approximate since content may have changed
        container.scrollTop = scrollTop;
      }
    });
  },

  showAutoUpdateToast(message) {
    // Create toast element if doesn't exist
    let toast = document.getElementById('autoUpdateToast');
    if (!toast) {
      toast = document.createElement('div');
      toast.id = 'autoUpdateToast';
      toast.className = 'her-auto-update-toast';
      document.body.appendChild(toast);
    }
    
    toast.textContent = message;
    toast.classList.add('visible');
    
    setTimeout(() => {
      toast.classList.remove('visible');
    }, 3000);
  },

  // ═══════════════════════════════════════════════════════════
  // AUTO-DISCOVERY CHAT LOADING
  // Scans /private/she/chats/whatsapp/ and /private/she/chats/insta/
  // ═══════════════════════════════════════════════════════════
  async loadChats() {
    console.log('[ImportedChats] Starting auto-discovery...');
    
    try {
      // Auto-discover chats from file system
      this.chats = await this.autoDiscoverChats();
    } catch (error) {
      console.error('[ImportedChats] Error during auto-discovery:', error);
      this.chats = [];
    }

    // Sort chats by last message timestamp (newest first)
    this.chats.sort((a, b) => {
      const aTime = a.lastMessageTime || a.importedAt || 0;
      const bTime = b.lastMessageTime || b.importedAt || 0;
      return new Date(bTime) - new Date(aTime);
    });

    console.log(`[ImportedChats] Discovered ${this.chats.length} chats`);
    
    // Save to cache for instant loading next time
    this.saveCachedChats();
  },

  async autoDiscoverChats() {
    const discoveredChats = [];
    
    // Discover WhatsApp chats (.txt files)
    const whatsappChats = await this.discoverWhatsAppChats();
    discoveredChats.push(...whatsappChats);
    
    // Discover Instagram chats (folders with message_*.html)
    const instaChats = await this.discoverInstagramChats();
    discoveredChats.push(...instaChats);
    
    return discoveredChats;
  },

  // ═══════════════════════════════════════════════════════════
  // WHATSAPP CHAT DISCOVERY & PARSING
  // ═══════════════════════════════════════════════════════════
  async discoverWhatsAppChats() {
    const chats = [];
    const basePath = '/private/she/chats/Whatsapp';
    
    try {
      // Fetch directory listing via index.json
      const knownFiles = await this.fetchWhatsAppFileList(basePath);
      console.log('[WhatsApp] Found files:', knownFiles);
      
      for (const fileName of knownFiles) {
        if (!fileName.endsWith('.txt')) continue;
        
        try {
          const filePath = `${basePath}/${encodeURIComponent(fileName)}`;
          console.log('[WhatsApp] Fetching:', filePath);
          const response = await fetch(filePath).catch(() => null);
          
          if (response?.ok) {
            const content = await response.text();
            const parsed = this.parseWhatsAppChat(content, fileName);
            
            if (parsed && parsed.messages.length > 0) {
              const chatName = fileName.replace('.txt', '');
              const chat = {
                id: `whatsapp_${this.sanitizeId(chatName)}`,
                name: chatName,
                platform: 'whatsapp',
                filePath: filePath,
                messages: parsed.messages,
                messageCount: parsed.messages.length,
                preview: parsed.preview,
                previewTime: parsed.previewTime,
                lastMessageTime: parsed.lastMessageTime,
                importedAt: new Date().toISOString()
              };
              chats.push(chat);
              console.log(`[WhatsApp] Discovered: ${chatName} (${parsed.messages.length} messages)`);
            }
          } else {
            console.warn('[WhatsApp] Failed to fetch:', filePath, response?.status);
          }
        } catch (error) {
          console.warn(`[WhatsApp] Failed to parse ${fileName}:`, error);
        }
      }
    } catch (error) {
      console.error('[WhatsApp] Discovery error:', error);
    }
    
    return chats;
  },

  async fetchWhatsAppFileList(basePath) {
    const knownFiles = [];
    
    // Try to load from index.json first (required for static hosting)
    try {
      const indexResponse = await fetch(`${basePath}/index.json?_t=${Date.now()}`).catch(() => null);
      console.log('[WhatsApp] Index fetch response:', indexResponse?.status);
      if (indexResponse?.ok) {
        const text = await indexResponse.text();
        const index = JSON.parse(text);
        console.log('[WhatsApp] Index content:', index);
        
        // Store initial hash for auto-update detection
        if (this.autoUpdate.lastWhatsAppIndexHash === null) {
          this.autoUpdate.lastWhatsAppIndexHash = this.simpleHash(text);
        }
        
        if (Array.isArray(index)) {
          return index;
        }
      }
    } catch (e) {
      console.warn('[WhatsApp] No index.json found:', e);
    }
    
    // Fallback: Try known file patterns (HEAD request)
    const testNames = [
      'Abhilasha Jha.txt',
    ];
    
    for (const name of testNames) {
      try {
        const response = await fetch(`${basePath}/${encodeURIComponent(name)}`, { method: 'HEAD' }).catch(() => null);
        if (response?.ok) {
          knownFiles.push(name);
        }
      } catch (e) {}
    }
    
    return knownFiles;
  },

  parseWhatsAppChat(content, fileName) {
    const messages = [];
    const lines = content.split('\n');
    
    // WhatsApp format: DD/MM/YY, HH:MM [am/pm] - Sender: Message
    // or: DD/MM/YY, HH:MM - Sender: Message
    const msgRegex = /^(\d{1,2}\/\d{1,2}\/\d{2,4}),?\s+(\d{1,2}:\d{2}(?::\d{2})?\s*(?:am|pm)?)\s*-\s*([^:]+):\s*(.+)$/i;
    const systemMsgRegex = /^(\d{1,2}\/\d{1,2}\/\d{2,4}),?\s+(\d{1,2}:\d{2}(?::\d{2})?\s*(?:am|pm)?)\s*-\s*(.+)$/i;
    
    let currentMsg = null;
    let previewMessage = null;
    let previewTime = null;
    
    for (const line of lines) {
      const match = line.match(msgRegex);
      
      if (match) {
        // Save previous message
        if (currentMsg) {
          messages.push(currentMsg);
        }
        
        const [, dateStr, timeStr, sender, text] = match;
        const timestamp = this.parseWhatsAppDateTime(dateStr, timeStr);
        
        currentMsg = {
          timestamp: timestamp.toISOString(),
          sender: sender.trim(),
          text: text.trim(),
          isMedia: text.includes('(file attached)') || text.includes('image omitted') || text.includes('video omitted')
        };
        
        // Find first real message for preview (skip system messages)
        if (!previewMessage && !this.isSystemMessage(text)) {
          previewMessage = text.trim();
          previewTime = timestamp;
        }
      } else if (line.match(systemMsgRegex)) {
        // System message - skip for preview
        continue;
      } else if (currentMsg && line.trim()) {
        // Continuation of previous message
        currentMsg.text += '\n' + line.trim();
      }
    }
    
    // Don't forget last message
    if (currentMsg) {
      messages.push(currentMsg);
    }
    
    // Get last message time
    const lastMessageTime = messages.length > 0 
      ? messages[messages.length - 1].timestamp 
      : null;
    
    return {
      messages,
      preview: previewMessage ? this.truncatePreview(previewMessage) : 'No preview available',
      previewTime: previewTime?.toISOString(),
      lastMessageTime
    };
  },

  parseWhatsAppDateTime(dateStr, timeStr) {
    // Handle DD/MM/YY format
    const [day, month, year] = dateStr.split('/').map(n => parseInt(n, 10));
    const fullYear = year < 100 ? 2000 + year : year;
    
    // Parse time with am/pm
    let [hours, minutes] = timeStr.replace(/\s*(am|pm)/i, '').split(':').map(n => parseInt(n, 10));
    const isPM = /pm/i.test(timeStr);
    const isAM = /am/i.test(timeStr);
    
    if (isPM && hours !== 12) hours += 12;
    if (isAM && hours === 12) hours = 0;
    
    return new Date(fullYear, month - 1, day, hours, minutes || 0);
  },

  isSystemMessage(text) {
    const systemPatterns = [
      'Messages and calls are end-to-end encrypted',
      'is a contact',
      'changed their phone number',
      'created group',
      'added you',
      'left',
      'removed',
      'changed the subject',
      'changed this group',
      'disappearing messages',
      'message timer',
      'security code changed',
      'You turned off',
      'You updated'
    ];
    return systemPatterns.some(pattern => text.toLowerCase().includes(pattern.toLowerCase()));
  },

  // ═══════════════════════════════════════════════════════════
  // INSTAGRAM CHAT DISCOVERY & PARSING
  // ═══════════════════════════════════════════════════════════
  async discoverInstagramChats() {
    const chats = [];
    const basePath = '/private/she/chats/insta';
    
    try {
      const chatFolders = await this.fetchInstagramFolderList(basePath);
      console.log('[Instagram] Found folders:', chatFolders);
      
      for (const folderName of chatFolders) {
        try {
          const folderPath = `${basePath}/${encodeURIComponent(folderName)}`;
          console.log('[Instagram] Parsing folder:', folderPath);
          const parsed = await this.parseInstagramChat(folderPath, folderName);
          
          if (parsed && parsed.messages.length > 0) {
            // Extract clean name from folder name (remove the ID suffix)
            const chatName = this.extractInstagramChatName(folderName);
            
            const chat = {
              id: `instagram_${this.sanitizeId(folderName)}`,
              name: chatName,
              platform: 'instagram',
              folderPath: folderPath,
              messages: parsed.messages,
              messageCount: parsed.messages.length,
              preview: parsed.preview,
              previewTime: parsed.previewTime,
              lastMessageTime: parsed.lastMessageTime,
              importedAt: new Date().toISOString()
            };
            chats.push(chat);
            console.log(`[Instagram] Discovered: ${chatName} (${parsed.messages.length} messages)`);
          }
        } catch (error) {
          console.warn(`[Instagram] Failed to parse ${folderName}:`, error);
        }
      }
    } catch (error) {
      console.error('[Instagram] Discovery error:', error);
    }
    
    return chats;
  },

  async fetchInstagramFolderList(basePath) {
    const knownFolders = [];
    
    // Try index file first (required for static hosting)
    try {
      const indexResponse = await fetch(`${basePath}/index.json?_t=${Date.now()}`).catch(() => null);
      console.log('[Instagram] Index fetch response:', indexResponse?.status);
      if (indexResponse?.ok) {
        const text = await indexResponse.text();
        const index = JSON.parse(text);
        console.log('[Instagram] Index content:', index);
        
        // Store initial hash for auto-update detection
        if (this.autoUpdate.lastInstaIndexHash === null) {
          this.autoUpdate.lastInstaIndexHash = this.simpleHash(text);
        }
        
        if (Array.isArray(index)) {
          return index;
        }
      }
    } catch (e) {
      console.warn('[Instagram] No index.json found:', e);
    }
    
    // Fallback: Try known folder patterns
    const testFolders = [
      'Abhilasha Jha(as3_017)',
    ];
    
    for (const folder of testFolders) {
      try {
        // Check if message_1.html exists in folder
        const response = await fetch(`${basePath}/${encodeURIComponent(folder)}/message_1.html`, { method: 'HEAD' }).catch(() => null);
        if (response?.ok) {
          knownFolders.push(folder);
        }
      } catch (e) {}
    }
    
    return knownFolders;
  },

  async parseInstagramChat(folderPath, folderName) {
    const messages = [];
    let previewMessage = null;
    let previewTime = null;
    
    // Instagram exports have message_1.html, message_2.html, etc.
    let pageNum = 1;
    let hasMorePages = true;
    
    while (hasMorePages) {
      try {
        const response = await fetch(`${folderPath}/message_${pageNum}.html`).catch(() => null);
        
        if (!response?.ok) {
          hasMorePages = false;
          break;
        }
        
        const html = await response.text();
        const pageMessages = this.parseInstagramHTML(html, folderPath);
        
        if (pageMessages.length > 0) {
          messages.push(...pageMessages);
          pageNum++;
        } else {
          hasMorePages = false;
        }
      } catch (error) {
        hasMorePages = false;
      }
    }
    
    // Messages in Instagram export are newest first, reverse for chronological
    messages.reverse();
    
    // Find first non-system message for preview
    for (const msg of messages) {
      if (msg.text && !msg.text.includes('Liked a message') && msg.text.length > 1) {
        previewMessage = msg.text;
        previewTime = msg.timestamp;
        break;
      }
    }
    
    const lastMessageTime = messages.length > 0 
      ? messages[messages.length - 1].timestamp 
      : null;
    
    return {
      messages,
      preview: previewMessage ? this.truncatePreview(previewMessage) : 'No preview available',
      previewTime,
      lastMessageTime
    };
  },

  parseInstagramHTML(html, folderPath) {
    const messages = [];
    
    // Create a DOM parser
    const parser = new DOMParser();
    const doc = parser.parseFromString(html, 'text/html');
    
    // Instagram export structure: div.pam._3-95._2ph-._a6-g.uiBoxWhite.noborder
    const messageBlocks = doc.querySelectorAll('.pam._3-95._2ph-._a6-g.uiBoxWhite.noborder');
    
    messageBlocks.forEach(block => {
      try {
        // Sender is in h2._a6-h
        const senderEl = block.querySelector('h2._a6-h');
        const sender = senderEl?.textContent?.trim() || 'Unknown';
        
        // Message text is in ._a6-p div
        const contentEl = block.querySelector('._a6-p');
        let text = '';
        
        if (contentEl) {
          // Get direct text content, skip nested divs with links
          const textDiv = contentEl.querySelector('div > div:nth-child(2)');
          text = textDiv?.textContent?.trim() || contentEl.textContent?.trim() || '';
        }
        
        // Timestamp is in ._a6-o
        const timeEl = block.querySelector('._a6-o');
        const timeStr = timeEl?.textContent?.trim() || '';
        const timestamp = this.parseInstagramDateTime(timeStr);
        
        // Check for media
        const hasMedia = block.querySelector('video, img, a[href*="instagram.com"]');
        
        if (text || hasMedia) {
          messages.push({
            timestamp: timestamp.toISOString(),
            sender: sender === 'AS' ? 'Me' : sender,
            text: text || (hasMedia ? 'Shared a post' : ''),
            isMedia: !!hasMedia,
            mediaUrl: hasMedia?.src || null
          });
        }
      } catch (error) {
        // Skip malformed message blocks
      }
    });
    
    return messages;
  },

  parseInstagramDateTime(timeStr) {
    // Format: "Nov 02, 2025 2:23 am"
    try {
      const date = new Date(timeStr);
      if (!isNaN(date.getTime())) {
        return date;
      }
    } catch (e) {}
    
    return new Date();
  },

  extractInstagramChatName(folderName) {
    // Remove Instagram ID suffix like "(as3_017)"
    return folderName.replace(/\s*\([^)]+\)\s*$/, '').trim();
  },

  // ═══════════════════════════════════════════════════════════
  // HELPER UTILITIES
  // ═══════════════════════════════════════════════════════════
  sanitizeId(str) {
    return str.toLowerCase().replace(/[^a-z0-9]+/g, '_').replace(/^_|_$/g, '');
  },

  truncatePreview(text, maxLength = 60) {
    if (!text) return '';
    const clean = text.replace(/\n/g, ' ').trim();
    if (clean.length <= maxLength) return clean;
    return clean.substring(0, maxLength - 3) + '...';
  },

  formatRelativeTime(dateStr) {
    if (!dateStr) return '';
    
    const date = new Date(dateStr);
    const now = new Date();
    const diffMs = now - date;
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
    
    if (diffDays === 0) return 'Today';
    if (diffDays === 1) return 'Yesterday';
    if (diffDays < 7) return `${diffDays}d ago`;
    if (diffDays < 30) return `${Math.floor(diffDays / 7)}w ago`;
    if (diffDays < 365) {
      return date.toLocaleDateString('en-US', { month: 'short', year: undefined });
    }
    
    const years = Math.floor(diffDays / 365);
    return `${years}y ago`;
  },

  // ═══════════════════════════════════════════════════════════
  // EVENT BINDING
  // ═══════════════════════════════════════════════════════════
  bindEvents() {
    const grid = document.getElementById('importedChatsGrid');
    const viewer = document.getElementById('importedChatViewer');
    const searchInput = document.getElementById('chatSearchInput');
    const searchClear = document.getElementById('chatSearchClear');
    const toggleHeatmapBtn = document.getElementById('toggleHeatmapBtn');
    const toggleSearchBtn = document.getElementById('toggleSearchBtn');
    const toggleInsightsBtn = document.getElementById('toggleInsightsBtn');
    const toggleLockBtn = document.getElementById('toggleLockBtn');
    const unlockBtn = document.getElementById('unlockChatBtn');
    const backBtn = document.getElementById('chatViewerBack');
    const mediaViewerOverlay = document.getElementById('mediaViewerOverlay');
    const mediaViewerClose = document.getElementById('mediaViewerClose');
    const mediaViewerPrev = document.getElementById('mediaViewerPrev');
    const mediaViewerNext = document.getElementById('mediaViewerNext');

    console.log('[bindEvents] Grid element:', grid);

    // Chat card selection
    if (grid) {
      grid.addEventListener('click', (e) => {
        console.log('[Click] Target:', e.target);
        const card = e.target.closest('.her-imported-chat-card');
        console.log('[Click] Card found:', card);
        if (card) {
          console.log('[Click] Chat ID:', card.dataset.chatId);
          this.selectChat(card.dataset.chatId);
        }
      });
    }

    // Toggle search bar
    toggleSearchBtn?.addEventListener('click', () => {
      this.toggleSearch();
    });

    // Search input with debounce
    let searchTimeout;
    searchInput?.addEventListener('input', (e) => {
      clearTimeout(searchTimeout);
      searchTimeout = setTimeout(() => {
        this.performSearch(e.target.value.trim());
      }, 150);
    });

    // Search navigation
    const searchPrevBtn = document.getElementById('searchPrevBtn');
    const searchNextBtn = document.getElementById('searchNextBtn');
    
    searchPrevBtn?.addEventListener('click', () => {
      this.goToPrevMatch();
    });
    
    searchNextBtn?.addEventListener('click', () => {
      this.goToNextMatch();
    });

    searchClear?.addEventListener('click', () => {
      this.clearSearch();
    });

    // Toggles
    toggleHeatmapBtn?.addEventListener('click', () => {
      this.toggleHeatmap();
    });

    toggleInsightsBtn?.addEventListener('click', () => {
      this.toggleInsights();
    });

    toggleLockBtn?.addEventListener('click', () => {
      this.toggleChatLock();
    });

    unlockBtn?.addEventListener('click', () => {
      this.unlockChat();
    });

    // Back button (mobile)
    backBtn?.addEventListener('click', () => {
      this.deselectChat();
    });

    // Media viewer
    mediaViewerClose?.addEventListener('click', () => {
      this.closeMediaViewer();
    });

    mediaViewerPrev?.addEventListener('click', () => {
      this.prevMedia();
    });

    mediaViewerNext?.addEventListener('click', () => {
      this.nextMedia();
    });

    // Keyboard shortcuts
    document.addEventListener('keydown', (e) => {
      if (this.currentChat && this.searchActive) {
        if (e.key === 'Escape') this.clearSearch();
        if (e.key === 'Enter') this.goToNextMatch();
      }
      if (mediaViewerOverlay?.style.display !== 'none') {
        if (e.key === 'Escape') this.closeMediaViewer();
        if (e.key === 'ArrowLeft') this.prevMedia();
        if (e.key === 'ArrowRight') this.nextMedia();
      }
    });

    // Touch gestures for media viewer
    if (mediaViewerOverlay) {
      let touchStartX = 0;
      let touchEndX = 0;

      mediaViewerOverlay.addEventListener('touchstart', (e) => {
        touchStartX = e.changedTouches[0].screenX;
      }, { passive: true });

      mediaViewerOverlay.addEventListener('touchend', (e) => {
        touchEndX = e.changedTouches[0].screenX;
        const diff = touchStartX - touchEndX;
        if (Math.abs(diff) > 50) {
          if (diff > 0) {
            this.nextMedia();
          } else {
            this.prevMedia();
          }
        }
      }, { passive: true });
    }

    // Timeline scrubber
    this.initTimelineScrubber();

    // ═══════════════════════════════════════════════════════════
    // NEW FEATURE BINDINGS
    // ═══════════════════════════════════════════════════════════

    // Compare Chats button
    const compareBtn = document.getElementById('compareChatsBtn');
    compareBtn?.addEventListener('click', () => this.openComparisonModal());

    // Comparison modal controls
    const comparisonClose = document.getElementById('comparisonClose');
    const startComparisonBtn = document.getElementById('startComparisonBtn');
    const comparisonBackBtn = document.getElementById('comparisonBackBtn');
    
    comparisonClose?.addEventListener('click', () => this.closeComparisonModal());
    startComparisonBtn?.addEventListener('click', () => this.startComparison());
    comparisonBackBtn?.addEventListener('click', () => {
      document.getElementById('comparisonSelection').style.display = 'block';
      document.getElementById('comparisonView').style.display = 'none';
    });

    // Comparison view toggle
    document.querySelectorAll('.her-comparison-view-btn').forEach(btn => {
      btn.addEventListener('click', () => this.setComparisonView(btn.dataset.view));
    });

    // Reflection mode toggle
    const toggleReflectionBtn = document.getElementById('toggleReflectionBtn');
    toggleReflectionBtn?.addEventListener('click', () => this.toggleReflectionMode());

    // Reflection dismiss
    const reflectionDismiss = document.getElementById('reflectionDismiss');
    reflectionDismiss?.addEventListener('click', () => this.dismissReflection());

    // Save to Memory modal controls
    const saveMemoryClose = document.getElementById('saveMemoryClose');
    const saveMemoryCancelBtn = document.getElementById('saveMemoryCancelBtn');
    const saveMemoryConfirmBtn = document.getElementById('saveMemoryConfirmBtn');

    saveMemoryClose?.addEventListener('click', () => this.closeSaveMemoryModal());
    saveMemoryCancelBtn?.addEventListener('click', () => this.closeSaveMemoryModal());
    saveMemoryConfirmBtn?.addEventListener('click', () => this.confirmSaveMemory());

    // Close comparison modal on ESC
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') {
        const comparisonOverlay = document.getElementById('comparisonOverlay');
        const saveMemoryOverlay = document.getElementById('saveMemoryOverlay');
        
        if (comparisonOverlay?.style.display !== 'none') {
          this.closeComparisonModal();
        }
        if (saveMemoryOverlay?.style.display !== 'none') {
          this.closeSaveMemoryModal();
        }
      }
    });
  },

  // ═══════════════════════════════════════════════════════════
  // RENDER CHAT LIST WITH AUTO-GENERATED PREVIEWS
  // ═══════════════════════════════════════════════════════════
  renderChatList() {
    const grid = document.getElementById('importedChatsGrid');
    const empty = document.getElementById('importedChatsEmpty');
    
    console.log('[Render] Chats count:', this.chats.length);
    console.log('[Render] Grid element:', grid);
    console.log('[Render] Empty element:', empty);
    
    if (!grid || !empty) {
      console.error('[Render] Missing DOM elements!');
      return;
    }
    
    if (!this.chats.length) {
      grid.style.display = 'none';
      empty.style.display = 'block';
      return;
    }

    grid.style.display = 'grid';
    empty.style.display = 'none';
    grid.innerHTML = '';

    this.chats.forEach(chat => {
      const platformEmoji = chat.platform === 'whatsapp' ? '💬' : '📱';
      const platformLabel = chat.platform === 'whatsapp' ? 'WhatsApp' : 'Instagram';
      const isLocked = this.lockStates[chat.id];
      const isActive = this.currentChat?.id === chat.id;
      
      // Use auto-generated preview from parsing
      const previewText = chat.preview || 'No preview available';
      const relativeTime = this.formatRelativeTime(chat.lastMessageTime || chat.previewTime);
      
      const card = document.createElement('div');
      card.className = `her-imported-chat-card${isActive ? ' active' : ''}`;
      card.dataset.chatId = chat.id;
      card.innerHTML = `
        <div class="her-chat-card-header">
          <div class="her-chat-card-info">
            <div class="her-chat-card-platform-emoji">${platformEmoji}</div>
            <div class="her-chat-card-name">${this.escapeHtml(chat.name)}</div>
            <span class="her-chat-card-platform-badge">${platformLabel}</span>
          </div>
          ${isLocked ? '<div class="her-chat-card-lock locked"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg></div>' : ''}
        </div>
        <div class="her-chat-card-preview">${this.escapeHtml(previewText)}</div>
        <div class="her-chat-card-meta">
          <span class="her-chat-card-time">${relativeTime}</span>
          <span class="her-chat-card-count">${chat.messageCount || 0} messages</span>
        </div>
      `;
      
      grid.appendChild(card);
    });
  },

  // ═══════════════════════════════════════════════════════════
  // SELECT CHAT
  // ═══════════════════════════════════════════════════════════
  // CRITICAL: When a chat is opened:
  // - The viewer MUST start at the LATEST message (bottom)
  // - The chat MUST NOT start at the top
  // - User should immediately see the most recent messages
  // ═══════════════════════════════════════════════════════════
  selectChat(chatId) {
    console.log('[selectChat] Selecting chat:', chatId);
    const chat = this.chats.find(c => c.id === chatId);
    if (!chat) {
      console.error('[selectChat] Chat not found:', chatId);
      return;
    }

    console.log('[selectChat] Found chat:', chat.name, 'with', chat.messages?.length, 'messages');
    
    this.currentChat = chat;
    this.currentMessages = chat.messages || [];
    this.filteredMessages = [...this.currentMessages];
    this.messageMetadata = {};
    this.searchQuery = '';
    this.searchActive = false;
    this.heatmapActive = false;
    this.insightsActive = false;
    
    // CRITICAL: Reset rendering state for fresh chat open
    this.rendering.renderedCount = 0;
    this.rendering.isLoadingMore = false;
    this.rendering.hasMoreMessages = true;
    
    // Clear insights cache when switching chats
    this.clearInsightsCache();
    
    // Close insights panel if open
    const insightsPanel = document.getElementById('chatInsightsPanel');
    const insightsBtn = document.getElementById('toggleInsightsBtn');
    if (insightsPanel) insightsPanel.classList.remove('active');
    if (insightsBtn) insightsBtn.classList.remove('active');

    // Update UI
    this.updateChatViewer();
    this.renderChatList(); // Update active state
    this.showChatViewer();
    
    // Reset search
    const searchInput = document.getElementById('chatSearchInput');
    if (searchInput) searchInput.value = '';
  },

  deselectChat() {
    this.currentChat = null;
    this.currentMessages = [];
    this.filteredMessages = [];
    
    const viewer = document.getElementById('importedChatViewer');
    const viewerPanel = document.getElementById('chatViewerPanel');
    const viewerEmpty = document.getElementById('chatViewerEmpty');
    const listPanel = document.getElementById('chatListPanel');
    const grid = document.getElementById('importedChatsGrid');
    const back = document.getElementById('chatViewerBack');
    
    if (viewer) viewer.style.display = 'none';
    if (viewerEmpty) viewerEmpty.style.display = 'flex';
    
    // Mobile: restore list panel, hide viewer panel
    if (window.innerWidth <= 768) {
      if (listPanel) listPanel.classList.remove('hidden');
      if (viewerPanel) viewerPanel.classList.remove('active');
      if (grid) grid.style.display = 'flex';
      if (back) back.style.display = 'none';
    }
    
    // Update chat list to remove active state
    this.renderChatList();
  },

  // ═══════════════════════════════════════════════════════════
  // UPDATE CHAT VIEWER
  // ═══════════════════════════════════════════════════════════
  updateChatViewer() {
    if (!this.currentChat) return;

    const platformIcon = this.currentChat.platform === 'whatsapp' ? '💬' : '📱';
    const platformName = this.currentChat.platform === 'whatsapp' ? 'WhatsApp' : 'Instagram';

    document.getElementById('viewerPlatformIcon').textContent = platformIcon;
    document.getElementById('viewerChatName').textContent = this.escapeHtml(this.currentChat.name);
    document.getElementById('viewerMsgCount').textContent = `${this.currentMessages.length} messages`;

    // Update platform-specific styling
    const viewer = document.getElementById('importedChatViewer');
    viewer.className = `her-chat-viewer platform-${this.currentChat.platform}`;

    // Check lock state
    this.updateLockUI();

    // Render messages
    this.renderMessages();
    
    // Update timeline labels
    this.updateTimelineLabels();
  },

  showChatViewer() {
    const viewer = document.getElementById('importedChatViewer');
    const viewerPanel = document.getElementById('chatViewerPanel');
    const viewerEmpty = document.getElementById('chatViewerEmpty');
    const listPanel = document.getElementById('chatListPanel');
    const grid = document.getElementById('importedChatsGrid');
    const back = document.getElementById('chatViewerBack');
    
    console.log('[showChatViewer] Showing viewer');
    
    // Show the viewer, hide empty state
    if (viewer) viewer.style.display = 'flex';
    if (viewerEmpty) viewerEmpty.style.display = 'none';
    
    // Mobile: hide list panel, show viewer panel with back button
    if (window.innerWidth <= 768) {
      if (listPanel) listPanel.classList.add('hidden');
      if (viewerPanel) viewerPanel.classList.add('active');
      if (grid) grid.style.display = 'none';
      if (back) back.style.display = 'flex';
    }
  },

  // ═══════════════════════════════════════════════════════════
  // RENDER MESSAGES - INCREMENTAL LOADING (MANDATORY RULES)
  // ═══════════════════════════════════════════════════════════
  // CRITICAL: Chat MUST start at LATEST message (bottom)
  // - Initial render shows only the most recent chunk
  // - User immediately sees most recent messages
  // - Older messages load ONLY when scrolling upward
  // ═══════════════════════════════════════════════════════════
  renderMessages() {
    const container = document.getElementById('chatMessagesContainer');
    
    if (!container) {
      console.error('[renderMessages] Container not found');
      return;
    }
    
    if (!this.filteredMessages.length) {
      container.innerHTML = '<div class="her-chat-empty-messages">No messages to display</div>';
      return;
    }

    // Reset rendering state for fresh render
    this.rendering.renderedCount = 0;
    this.rendering.isLoadingMore = false;
    this.rendering.hasMoreMessages = true;
    container.innerHTML = '';
    
    // CRITICAL: Add a flexible spacer at the top to push messages to the bottom
    // This ensures messages appear at the bottom even when there aren't many
    const spacer = document.createElement('div');
    spacer.className = 'her-chat-messages-spacer';
    container.appendChild(spacer);
    
    // CRITICAL: Calculate which messages to render (LATEST messages first)
    const totalMessages = this.filteredMessages.length;
    const startIndex = Math.max(0, totalMessages - this.rendering.batchSize);
    
    console.log(`[renderMessages] Rendering messages ${startIndex} to ${totalMessages} of ${totalMessages} (showing LATEST)`);
    
    // Render initial batch (latest messages only)
    this.renderMessageBatch(startIndex, totalMessages, container, false);
    this.rendering.renderedCount = totalMessages - startIndex;
    
    // Check if there are older messages
    this.rendering.hasMoreMessages = startIndex > 0;
    
    // Show "load more" indicator if there are older messages
    if (startIndex > 0) {
      this.insertLoadMoreIndicator(container, startIndex);
    }
    
    // ═══════════════════════════════════════════════════════════
    // CRITICAL: SCROLL TO BOTTOM (MANDATORY)
    // Chat MUST start at the LATEST message (bottom)
    // Using multiple attempts to ensure it works
    // ═══════════════════════════════════════════════════════════
    this.scrollToBottom(container);
    
    // Setup scroll listener for loading older messages (upward scroll)
    this.setupScrollListener(container);
  },
  
  /**
   * Scroll container to absolute bottom - robust implementation
   * Uses multiple attempts to ensure scroll works after DOM paint
   */
  scrollToBottom(container) {
    if (!container) return;
    
    const doScroll = () => {
      container.scrollTop = container.scrollHeight;
    };
    
    // Immediate scroll
    doScroll();
    
    // After next frame (DOM updated)
    requestAnimationFrame(() => {
      doScroll();
      
      // After paint
      requestAnimationFrame(() => {
        doScroll();
      });
    });
    
    // Fallback after short delays to catch any async rendering
    setTimeout(doScroll, 50);
    setTimeout(doScroll, 100);
    setTimeout(doScroll, 200);
    
    console.log('[scrollToBottom] Initiated scroll to bottom');
  },
  
  renderMessageBatch(startIndex, endIndex, container, prepend = false) {
    const fragment = document.createDocumentFragment();
    let currentDate = null;
    let lastSender = null;
    
    // When prepending, we need to check the date of the first currently rendered message
    // to avoid duplicate date separators
    let firstExistingDate = null;
    if (prepend) {
      const firstExistingMsg = container.querySelector('.her-chat-message');
      if (firstExistingMsg) {
        const firstMsgIndex = parseInt(firstExistingMsg.dataset.messageIndex, 10);
        if (!isNaN(firstMsgIndex) && this.filteredMessages[firstMsgIndex]) {
          firstExistingDate = this.formatDate(new Date(this.filteredMessages[firstMsgIndex].timestamp));
        }
      }
    }
    
    for (let i = startIndex; i < endIndex; i++) {
      const msg = this.filteredMessages[i];
      if (!msg) continue;
      
      const msgDate = this.formatDate(new Date(msg.timestamp));
      
      // Add date separator if date changed
      // Skip if this is the last message in a prepend batch and the date matches the first existing message
      const isLastInBatch = i === endIndex - 1;
      const shouldSkipDateSeparator = prepend && isLastInBatch && msgDate === firstExistingDate;
      
      if (msgDate !== currentDate && !shouldSkipDateSeparator) {
        currentDate = msgDate;
        const separator = document.createElement('div');
        separator.className = 'her-chat-date-separator';
        separator.innerHTML = `<span>${msgDate}</span>`;
        fragment.appendChild(separator);
        lastSender = null;
      } else if (msgDate !== currentDate) {
        currentDate = msgDate;
      }
      
      // Determine if this should be a new group
      const isSameSender = msg.sender === lastSender;
      const prevMsg = this.filteredMessages[i - 1];
      const timeDiff = prevMsg ? new Date(msg.timestamp) - new Date(prevMsg.timestamp) : Infinity;
      const shouldStartNewGroup = !isSameSender || timeDiff > 5 * 60 * 1000;
      
      // Create message element
      const msgEl = this.createMessageElement(msg, i, shouldStartNewGroup);
      fragment.appendChild(msgEl);
      
      // Store metadata for timeline scrubber
      this.messageMetadata[i] = {
        date: msgDate,
        index: i,
        element: msgEl
      };
      
      lastSender = msg.sender;
    }
    
    if (prepend) {
      // Remove old "load more" indicator before prepending
      const oldIndicator = container.querySelector('.her-chat-load-more');
      if (oldIndicator) oldIndicator.remove();
      
      // Also remove duplicate date separator if present at the start of existing content
      // (if the last message in our batch shares the same date)
      if (firstExistingDate) {
        const existingSeparators = container.querySelectorAll('.her-chat-date-separator');
        if (existingSeparators.length > 0) {
          const firstSeparator = existingSeparators[0];
          const lastMsgDate = this.formatDate(new Date(this.filteredMessages[endIndex - 1]?.timestamp));
          if (firstSeparator.textContent.trim() === lastMsgDate) {
            firstSeparator.remove();
          }
        }
      }
      
      // Prepend new messages AFTER the spacer (if exists)
      const spacer = container.querySelector('.her-chat-messages-spacer');
      const firstMessage = container.querySelector('.her-chat-message, .her-chat-date-separator, .her-chat-load-more');
      
      if (firstMessage) {
        // Insert before the first actual content (after spacer)
        container.insertBefore(fragment, firstMessage);
      } else if (spacer) {
        // Only spacer exists, append after it
        container.appendChild(fragment);
      } else {
        // No spacer, insert at beginning
        container.insertBefore(fragment, container.firstChild);
      }
      
      console.log('[renderMessageBatch] Prepended messages');
    } else {
      container.appendChild(fragment);
      console.log('[renderMessageBatch] Appended messages');
    }
  },
  
  /**
   * ═══════════════════════════════════════════════════════════
   * INSERT LOAD MORE INDICATOR
   * ═══════════════════════════════════════════════════════════
   * UI RULES:
   * - "X older messages" indicator MUST disappear once loading begins
   * - Chat MUST remain scrollable at all times
   * - No frozen or dead scroll state
   * ═══════════════════════════════════════════════════════════
   */
  insertLoadMoreIndicator(container, remainingCount) {
    // Remove any existing indicator first
    const existingIndicator = container.querySelector('.her-chat-load-more');
    if (existingIndicator) existingIndicator.remove();
    
    const indicator = document.createElement('div');
    indicator.className = 'her-chat-load-more';
    indicator.dataset.remaining = remainingCount;
    indicator.innerHTML = `
      <div class="her-chat-load-more-text">
        <span class="her-chat-load-more-icon">↑</span>
        <span class="her-chat-load-more-label">${remainingCount} older message${remainingCount === 1 ? '' : 's'}</span>
      </div>
    `;
    
    // Insert after the spacer (if exists) or at the beginning
    const spacer = container.querySelector('.her-chat-messages-spacer');
    if (spacer && spacer.nextSibling) {
      container.insertBefore(indicator, spacer.nextSibling);
    } else if (spacer) {
      container.appendChild(indicator);
    } else {
      container.insertBefore(indicator, container.firstChild);
    }
  },
  
  setupScrollListener(container) {
    // Remove existing listener if any
    if (this._boundHandleScroll) {
      container.removeEventListener('scroll', this._boundHandleScroll);
    }
    
    // ═══════════════════════════════════════════════════════════
    // UPWARD LAZY LOADING (MANDATORY)
    // ═══════════════════════════════════════════════════════════
    // RULES:
    // - Messages MUST load BEFORE reaching the absolute top
    // - Use a threshold (NOT scrollTop === 0)
    // - Prevents "stuck" scroll state
    // ═══════════════════════════════════════════════════════════
    this._boundHandleScroll = () => {
      // CRITICAL: Skip if already loading to prevent double-load
      if (this.rendering.isLoadingMore) {
        return;
      }
      
      // CRITICAL: Skip if no more messages to load
      if (!this.rendering.hasMoreMessages) {
        return;
      }
      
      // CRITICAL: Trigger load BEFORE reaching absolute top (use threshold)
      // This prevents the infinite "scroll up" state
      if (container.scrollTop <= this.rendering.scrollThreshold) {
        console.log('[scroll] Near top, triggering load. scrollTop:', container.scrollTop);
        this.loadOlderMessages(container);
      }
    };
    
    container.addEventListener('scroll', this._boundHandleScroll, { passive: true });
  },
  
  /**
   * ═══════════════════════════════════════════════════════════
   * LOAD OLDER MESSAGES (UPWARD SCROLL) - MANDATORY BEHAVIOR
   * ═══════════════════════════════════════════════════════════
   * SCROLL POSITION STABILITY (NON-NEGOTIABLE):
   * 1. Capture scrollHeight BEFORE loading
   * 2. Prepend older messages
   * 3. Restore scrollTop so visible message stays in place
   * 
   * This MUST prevent:
   * - Scroll jumps
   * - Stuck "load older messages" state  
   * - Infinite "scroll up" hint without loading
   * 
   * LOADING STATE MANAGEMENT:
   * - Flag MUST reset after messages are added OR no more exist
   * - Never permanently block upward loading
   * ═══════════════════════════════════════════════════════════
   */
  loadOlderMessages(container) {
    // Calculate how many messages we've rendered so far
    const totalMessages = this.filteredMessages.length;
    const alreadyRendered = this.rendering.renderedCount;
    
    // Calculate the start index of currently rendered messages
    const currentStartIndex = totalMessages - alreadyRendered;
    
    // CRITICAL: If we've already rendered all messages, nothing more to load
    if (currentStartIndex <= 0) {
      console.log('[loadOlderMessages] All messages already loaded');
      // Remove indicator (we've reached the beginning)
      const indicator = container.querySelector('.her-chat-load-more');
      if (indicator) indicator.remove();
      
      // Mark that there are no more messages
      this.rendering.hasMoreMessages = false;
      // CRITICAL: Reset loading flag
      this.rendering.isLoadingMore = false;
      return;
    }
    
    // CRITICAL: Set loading flag BEFORE any async work
    this.rendering.isLoadingMore = true;
    
    // Calculate next batch to load
    const newEndIndex = currentStartIndex;
    const newStartIndex = Math.max(0, currentStartIndex - this.rendering.batchSize);
    const messagesToLoad = newEndIndex - newStartIndex;
    
    console.log(`[loadOlderMessages] Loading messages ${newStartIndex} to ${newEndIndex} (${messagesToLoad} messages)`);
    
    // CRITICAL: Update indicator to show loading state immediately
    // The "X older messages" indicator MUST disappear/change once loading begins
    const indicator = container.querySelector('.her-chat-load-more');
    if (indicator) {
      indicator.classList.add('loading');
      indicator.innerHTML = '<div class="her-chat-load-more-text"><span class="her-chat-load-more-icon">⏳</span><span>Loading...</span></div>';
    }
    
    // ═══════════════════════════════════════════════════════════
    // SCROLL POSITION STABILITY (NON-NEGOTIABLE)
    // Capture scroll state BEFORE prepending
    // ═══════════════════════════════════════════════════════════
    const scrollHeightBefore = container.scrollHeight;
    const scrollTopBefore = container.scrollTop;
    
    // Use requestAnimationFrame for smoother rendering
    requestAnimationFrame(() => {
      // Render the older messages (prepend to top)
      this.renderMessageBatch(newStartIndex, newEndIndex, container, true);
      
      // Update rendered count
      this.rendering.renderedCount += messagesToLoad;
      
      // ═══════════════════════════════════════════════════════════
      // RESTORE SCROLL POSITION (NON-NEGOTIABLE)
      // Calculate new scrollTop to keep visible content in place
      // ═══════════════════════════════════════════════════════════
      const scrollHeightAfter = container.scrollHeight;
      const heightDifference = scrollHeightAfter - scrollHeightBefore;
      
      // Restore scroll position: old position + added height
      container.scrollTop = scrollTopBefore + heightDifference;
      
      console.log(`[loadOlderMessages] Scroll restored: ${scrollTopBefore} -> ${container.scrollTop} (added ${heightDifference}px)`);
      
      // Add new indicator if more messages remain
      if (newStartIndex > 0) {
        this.insertLoadMoreIndicator(container, newStartIndex);
        this.rendering.hasMoreMessages = true;
      } else {
        // No more messages to load
        this.rendering.hasMoreMessages = false;
        console.log('[loadOlderMessages] Reached beginning of chat');
      }
      
      // ═══════════════════════════════════════════════════════════
      // CRITICAL: Reset loading flag AFTER everything is done
      // Use small timeout to allow browser to process DOM changes
      // This ensures the flag resets even if there's a rendering delay
      // ═══════════════════════════════════════════════════════════
      setTimeout(() => {
        this.rendering.isLoadingMore = false;
        console.log('[loadOlderMessages] Load complete, flag reset. hasMore:', this.rendering.hasMoreMessages);
      }, 100);
    });
  },

  createMessageElement(msg, index, isGroupStart) {
    const div = document.createElement('div');
    
    // Determine if this is the user's message (sent) or the other person's (received)
    // For WhatsApp, check if sender matches known user patterns
    const userPatterns = ['Me', 'You', 'Anand', 'anand'];
    const isUser = userPatterns.some(p => msg.sender?.toLowerCase().includes(p.toLowerCase()));
    const side = isUser ? 'sent' : 'received';

    div.className = `her-chat-message ${side}`;
    if (isGroupStart) div.classList.add('group-start');
    div.dataset.messageIndex = index;

    // Add sentiment-based heatmap class
    if (this.heatmapActive) {
      const sentiment = this.analyzeSentiment(msg.text || '');
      div.classList.add(`heatmap-${sentiment}`);
    }

    // Build message content
    let content = '';
    
    // Add sender name for received messages at group start
    if (!isUser && isGroupStart) {
      content += `<div class="her-chat-message-sender">${this.escapeHtml(msg.sender || 'Unknown')}</div>`;
    }
    
    if (msg.text) {
      // Highlight search matches
      let text = this.escapeHtml(msg.text);
      if (this.searchActive && this.searchQuery) {
        text = this.highlightSearchMatches(text);
      }
      content += `<div class="her-chat-message-text">${text}</div>`;
    }

    if (msg.isMedia && msg.mediaUrl) {
      const mediaType = msg.mediaType || 'image';
      const displayType = mediaType === 'video' ? 'video' : 'image';
      
      if (displayType === 'image') {
        content += `
          <div class="her-chat-message-media" onclick="ImportedChats.openMediaViewer('${this.escapeHtml(msg.mediaUrl)}', '${mediaType}', event)">
            <img src="${this.escapeHtml(msg.mediaUrl)}" alt="Image" loading="lazy">
          </div>
        `;
      } else if (displayType === 'video') {
        content += `
          <div class="her-chat-message-media">
            <video controls>
              <source src="${this.escapeHtml(msg.mediaUrl)}" type="video/mp4">
            </video>
          </div>
        `;
      }
    }

    // Add timestamp
    const time = new Date(msg.timestamp).toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit'
    });
    content += `<div class="her-chat-message-time">${time}</div>`;

    div.innerHTML = content;

    // Add context menu support for saving to memories
    // Right-click on desktop
    div.addEventListener('contextmenu', (e) => {
      e.preventDefault();
      this.showMessageContextMenu(msg, e.clientX, e.clientY);
    });

    // Long-press on mobile
    let pressTimer = null;
    div.addEventListener('touchstart', (e) => {
      pressTimer = setTimeout(() => {
        const touch = e.touches[0];
        this.showMessageContextMenu(msg, touch.clientX, touch.clientY);
      }, 500); // 500ms long press
    });
    div.addEventListener('touchend', () => {
      clearTimeout(pressTimer);
    });
    div.addEventListener('touchmove', () => {
      clearTimeout(pressTimer);
    });

    return div;
  },

  // ═══════════════════════════════════════════════════════════
  // SEARCH & FILTER
  // ═══════════════════════════════════════════════════════════
  filterMessages() {
    const searchInput = document.getElementById('chatSearchInput');
    const searchClear = document.getElementById('chatSearchClear');
    const searchCount = document.getElementById('chatSearchCount');

    if (!this.searchQuery) {
      this.searchActive = false;
      this.filteredMessages = [...this.currentMessages];
      searchClear.style.display = 'none';
      searchCount.textContent = '';
    } else {
      this.searchActive = true;
      this.filteredMessages = this.currentMessages.filter(msg =>
        (msg.text || '').toLowerCase().includes(this.searchQuery.toLowerCase())
      );
      
      searchClear.style.display = 'block';
      searchCount.textContent = `${this.filteredMessages.length} matches`;
    }

    this.searchMatches = [];
    this.currentMatchIndex = 0;
    this.renderMessages();

    // Highlight matches
    if (this.searchActive) {
      this.highlightMatches();
    }
  },

  highlightMatches() {
    const messages = document.querySelectorAll('.her-chat-msg');
    let matchCount = 0;

    messages.forEach((msg, i) => {
      if (msg.textContent.toLowerCase().includes(this.searchQuery.toLowerCase())) {
        msg.classList.add('her-chat-msg-highlighted');
        this.searchMatches.push(msg);
        
        if (matchCount === 0) {
          // Scroll to first match
          msg.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
        matchCount++;
      }
    });
  },

  highlightSearchMatches(text) {
    if (!this.searchQuery) return this.escapeHtml(text);
    
    const regex = new RegExp(`(${this.escapeRegex(this.searchQuery)})`, 'gi');
    const escaped = this.escapeHtml(text);
    return escaped.replace(regex, '<mark class="her-chat-msg-match">$1</mark>');
  },

  goToNextMatch() {
    if (!this.searchMatches.length) return;
    
    this.currentMatchIndex = (this.currentMatchIndex + 1) % this.searchMatches.length;
    const match = this.searchMatches[this.currentMatchIndex];
    match.scrollIntoView({ behavior: 'smooth', block: 'center' });
  },

  clearSearch() {
    this.searchQuery = '';
    document.getElementById('chatSearchInput').value = '';
    this.filterMessages();
  },

  // ═══════════════════════════════════════════════════════════
  // TIMELINE SCRUBBER
  // Drag to navigate through conversation history
  // ═══════════════════════════════════════════════════════════
  initTimelineScrubber() {
    const track = document.getElementById('timelineTrack');
    const progress = document.getElementById('timelineProgress');
    const thumb = document.getElementById('timelineThumb');
    const startLabel = document.getElementById('timelineStart');
    const endLabel = document.getElementById('timelineEnd');
    const messagesContainer = document.getElementById('chatMessagesContainer');

    if (!track || !thumb || !messagesContainer) {
      console.log('[Timeline] Missing elements, skipping init');
      return;
    }

    let isDragging = false;

    // Update timeline position based on scroll
    messagesContainer.addEventListener('scroll', () => {
      if (isDragging) return;
      this.updateTimelinePosition();
    });

    // Mouse events for dragging
    const startDrag = (e) => {
      isDragging = true;
      thumb.style.cursor = 'grabbing';
      document.body.style.userSelect = 'none';
      this.handleTimelineDrag(e);
    };

    const endDrag = () => {
      isDragging = false;
      thumb.style.cursor = 'grab';
      document.body.style.userSelect = '';
    };

    const onDrag = (e) => {
      if (!isDragging) return;
      this.handleTimelineDrag(e);
    };

    thumb.addEventListener('mousedown', startDrag);
    track.addEventListener('mousedown', startDrag);
    document.addEventListener('mouseup', endDrag);
    document.addEventListener('mousemove', onDrag);

    // Touch events for mobile
    thumb.addEventListener('touchstart', (e) => {
      isDragging = true;
      this.handleTimelineDrag(e.touches[0]);
    }, { passive: true });

    track.addEventListener('touchstart', (e) => {
      isDragging = true;
      this.handleTimelineDrag(e.touches[0]);
    }, { passive: true });

    document.addEventListener('touchend', endDrag);
    document.addEventListener('touchmove', (e) => {
      if (!isDragging) return;
      this.handleTimelineDrag(e.touches[0]);
    }, { passive: true });

    // Click to jump
    track.addEventListener('click', (e) => {
      this.handleTimelineDrag(e);
    });

    console.log('[Timeline] Scrubber initialized');
  },

  handleTimelineDrag(e) {
    const track = document.getElementById('timelineTrack');
    const messagesContainer = document.getElementById('chatMessagesContainer');
    
    if (!track || !messagesContainer) return;

    const rect = track.getBoundingClientRect();
    const x = (e.clientX || e.pageX) - rect.left;
    const percentage = Math.max(0, Math.min(1, x / rect.width));

    // Update visual
    this.updateTimelineVisual(percentage);

    // Scroll messages container
    const maxScroll = messagesContainer.scrollHeight - messagesContainer.clientHeight;
    messagesContainer.scrollTop = percentage * maxScroll;

    // Show date tooltip
    this.showTimelineTooltip(percentage, e);
  },

  updateTimelinePosition() {
    const messagesContainer = document.getElementById('chatMessagesContainer');
    if (!messagesContainer) return;

    const maxScroll = messagesContainer.scrollHeight - messagesContainer.clientHeight;
    if (maxScroll <= 0) return;

    const percentage = messagesContainer.scrollTop / maxScroll;
    this.updateTimelineVisual(percentage);
  },

  updateTimelineVisual(percentage) {
    const progress = document.getElementById('timelineProgress');
    const thumb = document.getElementById('timelineThumb');

    if (progress) {
      progress.style.width = `${percentage * 100}%`;
    }
    if (thumb) {
      thumb.style.left = `${percentage * 100}%`;
    }
  },

  showTimelineTooltip(percentage, event) {
    // Find message at this position
    if (!this.filteredMessages.length) return;
    
    const messageIndex = Math.floor(percentage * (this.filteredMessages.length - 1));
    const msg = this.filteredMessages[messageIndex];
    
    if (msg && msg.timestamp) {
      const date = new Date(msg.timestamp);
      const dateStr = date.toLocaleDateString('en-US', { 
        month: 'short', 
        day: 'numeric', 
        year: 'numeric' 
      });
      
      // Update tooltip or create floating one
      this.showFloatingTooltip(dateStr, event);
    }
  },

  showFloatingTooltip(text, event) {
    let tooltip = document.getElementById('timelineFloatingTooltip');
    
    if (!tooltip) {
      tooltip = document.createElement('div');
      tooltip.id = 'timelineFloatingTooltip';
      tooltip.className = 'timeline-floating-tooltip';
      document.body.appendChild(tooltip);
    }
    
    tooltip.textContent = text;
    tooltip.style.left = `${event.clientX}px`;
    tooltip.style.top = `${event.clientY - 40}px`;
    tooltip.classList.add('visible');
    
    // Hide after delay
    clearTimeout(this.tooltipTimeout);
    this.tooltipTimeout = setTimeout(() => {
      tooltip.classList.remove('visible');
    }, 1500);
  },

  updateTimelineLabels() {
    const startLabel = document.getElementById('timelineStart');
    const endLabel = document.getElementById('timelineEnd');
    
    if (!this.filteredMessages.length) return;
    
    const firstMsg = this.filteredMessages[0];
    const lastMsg = this.filteredMessages[this.filteredMessages.length - 1];
    
    if (startLabel && firstMsg?.timestamp) {
      const date = new Date(firstMsg.timestamp);
      startLabel.textContent = date.toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
    }
    
    if (endLabel && lastMsg?.timestamp) {
      const date = new Date(lastMsg.timestamp);
      endLabel.textContent = date.toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
    }
  },

  // ═══════════════════════════════════════════════════════════
  // CHAT LOCK SYSTEM
  // ═══════════════════════════════════════════════════════════
  toggleChatLock() {
    if (!this.currentChat) return;
    
    const isLocked = this.lockStates[this.currentChat.id];
    this.lockStates[this.currentChat.id] = !isLocked;
    this.saveLockStates();
    this.updateLockUI();
    this.renderChatList();
  },

  unlockChat() {
    this.lockStates[this.currentChat.id] = false;
    this.saveLockStates();
    this.updateLockUI();
  },

  updateLockUI() {
    const isLocked = this.lockStates[this.currentChat?.id];
    const overlay = document.getElementById('chatLockOverlay');
    const lockBtn = document.getElementById('toggleLockBtn');

    if (isLocked) {
      if (overlay) overlay.style.display = 'flex';
      if (lockBtn) lockBtn.classList.add('active');
    } else {
      if (overlay) overlay.style.display = 'none';
      if (lockBtn) lockBtn.classList.remove('active');
    }
  },

  loadLockStates() {
    const saved = localStorage.getItem('importedChatsLocks');
    if (saved) {
      this.lockStates = JSON.parse(saved);
    }
  },

  saveLockStates() {
    localStorage.setItem('importedChatsLocks', JSON.stringify(this.lockStates));
  },

  // ═══════════════════════════════════════════════════════════
  // SEARCH FUNCTIONALITY
  // ═══════════════════════════════════════════════════════════
  toggleSearch() {
    const searchBar = document.getElementById('chatSearchBar');
    const searchBtn = document.getElementById('toggleSearchBtn');
    const searchInput = document.getElementById('chatSearchInput');
    
    this.searchActive = !this.searchActive;
    
    if (searchBar) {
      searchBar.classList.toggle('active', this.searchActive);
    }
    if (searchBtn) {
      searchBtn.classList.toggle('active', this.searchActive);
    }
    
    if (this.searchActive && searchInput) {
      setTimeout(() => searchInput.focus(), 100);
    } else {
      this.clearSearch();
    }
  },
  
  performSearch(query) {
    this.searchQuery = query;
    this.searchMatches = [];
    this.currentMatchIndex = 0;
    
    if (!query || query.length < 2) {
      this.updateSearchUI();
      this.clearHighlights();
      return;
    }
    
    // Find all matching messages
    const queryLower = query.toLowerCase();
    this.filteredMessages.forEach((msg, index) => {
      if (msg.text && msg.text.toLowerCase().includes(queryLower)) {
        this.searchMatches.push(index);
      }
    });
    
    console.log(`[Search] Found ${this.searchMatches.length} matches for "${query}"`);
    
    // Update UI
    this.updateSearchUI();
    
    // Highlight matches in rendered messages
    this.highlightMatches();
    
    // Jump to first match
    if (this.searchMatches.length > 0) {
      this.scrollToMatch(0);
    }
  },
  
  updateSearchUI() {
    const countEl = document.getElementById('searchMatchCount');
    if (countEl) {
      if (this.searchMatches.length > 0) {
        countEl.textContent = `${this.currentMatchIndex + 1} / ${this.searchMatches.length}`;
      } else if (this.searchQuery) {
        countEl.textContent = '0 / 0';
      } else {
        countEl.textContent = '';
      }
    }
  },
  
  highlightMatches() {
    const container = document.getElementById('chatMessagesContainer');
    if (!container) return;
    
    // Clear existing highlights
    this.clearHighlights();
    
    if (!this.searchQuery || this.searchMatches.length === 0) return;
    
    // Highlight text in each matching message
    const queryLower = this.searchQuery.toLowerCase();
    const messages = container.querySelectorAll('.her-chat-message');
    
    messages.forEach(msgEl => {
      const index = parseInt(msgEl.dataset.messageIndex, 10);
      if (this.searchMatches.includes(index)) {
        msgEl.classList.add('has-match');
        
        // Highlight text within message
        const textEl = msgEl.querySelector('.her-chat-message-text');
        if (textEl) {
          const originalText = textEl.textContent;
          const regex = new RegExp(`(${this.escapeRegex(this.searchQuery)})`, 'gi');
          textEl.innerHTML = originalText.replace(regex, '<mark class="search-highlight">$1</mark>');
        }
      }
    });
  },
  
  clearHighlights() {
    const container = document.getElementById('chatMessagesContainer');
    if (!container) return;
    
    // Remove highlight classes
    container.querySelectorAll('.has-match').forEach(el => {
      el.classList.remove('has-match');
    });
    
    container.querySelectorAll('.current-match').forEach(el => {
      el.classList.remove('current-match');
    });
    
    // Remove highlight marks
    container.querySelectorAll('mark.search-highlight').forEach(mark => {
      const text = mark.textContent;
      mark.replaceWith(text);
    });
  },
  
  scrollToMatch(matchIndex) {
    if (matchIndex < 0 || matchIndex >= this.searchMatches.length) return;
    
    this.currentMatchIndex = matchIndex;
    this.updateSearchUI();
    
    const messageIndex = this.searchMatches[matchIndex];
    const container = document.getElementById('chatMessagesContainer');
    const msgEl = container?.querySelector(`[data-message-index="${messageIndex}"]`);
    
    // Remove previous current-match
    container?.querySelectorAll('.current-match').forEach(el => {
      el.classList.remove('current-match');
    });
    
    if (msgEl) {
      msgEl.classList.add('current-match');
      msgEl.scrollIntoView({ behavior: 'smooth', block: 'center' });
    } else {
      // Message not rendered yet - need to load it
      console.log(`[Search] Message ${messageIndex} not in view, loading...`);
      this.loadMessagesAroundIndex(messageIndex);
    }
  },
  
  loadMessagesAroundIndex(targetIndex) {
    // For now, re-render starting from target
    const container = document.getElementById('chatMessagesContainer');
    if (!container) return;
    
    // Calculate batch around target
    const batchStart = Math.max(0, targetIndex - 25);
    const batchEnd = Math.min(this.filteredMessages.length, targetIndex + 25);
    
    container.innerHTML = '';
    this.renderMessageBatch(batchStart, batchEnd, container, false);
    this.rendering.renderedCount = batchEnd - batchStart;
    
    // Re-highlight and scroll
    setTimeout(() => {
      this.highlightMatches();
      const msgEl = container.querySelector(`[data-message-index="${targetIndex}"]`);
      if (msgEl) {
        msgEl.classList.add('current-match');
        msgEl.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
    }, 50);
  },
  
  goToNextMatch() {
    if (this.searchMatches.length === 0) return;
    const nextIndex = (this.currentMatchIndex + 1) % this.searchMatches.length;
    this.scrollToMatch(nextIndex);
  },
  
  goToPrevMatch() {
    if (this.searchMatches.length === 0) return;
    const prevIndex = (this.currentMatchIndex - 1 + this.searchMatches.length) % this.searchMatches.length;
    this.scrollToMatch(prevIndex);
  },
  
  clearSearch() {
    this.searchQuery = '';
    this.searchMatches = [];
    this.currentMatchIndex = 0;
    
    const searchInput = document.getElementById('chatSearchInput');
    if (searchInput) searchInput.value = '';
    
    this.updateSearchUI();
    this.clearHighlights();
  },
  
  escapeRegex(string) {
    return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  },

  // ═══════════════════════════════════════════════════════════
  // EMOTION HEATMAP
  // ═══════════════════════════════════════════════════════════
  toggleHeatmap() {
    const btn = document.getElementById('toggleHeatmapBtn');
    this.heatmapActive = !this.heatmapActive;
    
    if (this.heatmapActive) {
      btn?.classList.add('active');
    } else {
      btn?.classList.remove('active');
    }

    this.renderMessages();
  },

  analyzeSentiment(text) {
    const lower = text.toLowerCase();
    
    let positiveScore = 0;
    let negativeScore = 0;

    this.sentimentKeywords.positive.forEach(word => {
      const count = (lower.match(new RegExp(word, 'g')) || []).length;
      positiveScore += count;
    });

    this.sentimentKeywords.negative.forEach(word => {
      const count = (lower.match(new RegExp(word, 'g')) || []).length;
      negativeScore += count;
    });

    if (positiveScore > negativeScore) return 'positive';
    if (negativeScore > positiveScore) return 'negative';
    return 'neutral';
  },

  // ═══════════════════════════════════════════════════════════
  // CONVERSATION INSIGHTS / STATISTICS
  // ═══════════════════════════════════════════════════════════
  toggleInsights() {
    const btn = document.getElementById('toggleInsightsBtn');
    const panel = document.getElementById('chatInsightsPanel');
    
    this.insightsActive = !this.insightsActive;
    
    if (btn) btn.classList.toggle('active', this.insightsActive);
    if (panel) panel.classList.toggle('active', this.insightsActive);
    
    if (this.insightsActive) {
      this.computeAndRenderInsights();
    }
  },
  
  computeAndRenderInsights() {
    if (!this.currentChat || !this.currentMessages.length) return;
    
    // Check cache
    if (this.cachedInsights?.chatId === this.currentChat.id) {
      this.renderInsightsPanel(this.cachedInsights.stats);
      return;
    }
    
    // Compute fresh
    const stats = this.computeConversationStats();
    this.cachedInsights = { chatId: this.currentChat.id, stats };
    this.renderInsightsPanel(stats);
  },
  
  computeConversationStats() {
    const messages = this.currentMessages;
    const yourName = 'You';
    
    // Basic counts
    const totalMessages = messages.length;
    let youCount = 0;
    let otherCount = 0;
    let mediaCount = 0;
    
    // Daily activity
    const dailyMessages = {};
    const dayOfWeekCounts = [0, 0, 0, 0, 0, 0, 0]; // Sun-Sat
    const hourCounts = new Array(24).fill(0);
    
    // For silence calculation
    const timestamps = [];
    
    // Word counts
    let yourWordCount = 0;
    let otherWordCount = 0;
    
    messages.forEach(msg => {
      // Count by sender
      if (msg.isMe) {
        youCount++;
        yourWordCount += (msg.text || '').split(/\s+/).filter(w => w).length;
      } else {
        otherCount++;
        otherWordCount += (msg.text || '').split(/\s+/).filter(w => w).length;
      }
      
      // Media count
      if (msg.isMedia) mediaCount++;
      
      // Time-based stats
      if (msg.timestamp) {
        const date = new Date(msg.timestamp);
        timestamps.push(date.getTime());
        
        // Daily count
        const dayKey = date.toISOString().split('T')[0];
        dailyMessages[dayKey] = (dailyMessages[dayKey] || 0) + 1;
        
        // Day of week
        dayOfWeekCounts[date.getDay()]++;
        
        // Hour of day
        hourCounts[date.getHours()]++;
      }
    });
    
    // Calculate date range
    const validTimestamps = timestamps.filter(t => t > 0).sort((a, b) => a - b);
    const firstDate = validTimestamps[0] ? new Date(validTimestamps[0]) : null;
    const lastDate = validTimestamps[validTimestamps.length - 1] ? new Date(validTimestamps[validTimestamps.length - 1]) : null;
    
    // Duration in days
    const durationMs = lastDate && firstDate ? lastDate - firstDate : 0;
    const durationDays = Math.ceil(durationMs / (1000 * 60 * 60 * 24)) || 1;
    
    // Average messages per day
    const avgPerDay = (totalMessages / durationDays).toFixed(1);
    
    // Most active day
    const daysOfWeek = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    const mostActiveDay = daysOfWeek[dayOfWeekCounts.indexOf(Math.max(...dayOfWeekCounts))];
    
    // Most active hour
    const mostActiveHour = hourCounts.indexOf(Math.max(...hourCounts));
    const hourLabel = mostActiveHour === 0 ? '12am' : 
                      mostActiveHour < 12 ? `${mostActiveHour}am` : 
                      mostActiveHour === 12 ? '12pm' : `${mostActiveHour - 12}pm`;
    
    // Longest silence (gap between messages)
    let longestSilence = 0;
    let longestSilenceStart = null;
    for (let i = 1; i < validTimestamps.length; i++) {
      const gap = validTimestamps[i] - validTimestamps[i-1];
      if (gap > longestSilence) {
        longestSilence = gap;
        longestSilenceStart = new Date(validTimestamps[i-1]);
      }
    }
    
    const silenceDays = Math.floor(longestSilence / (1000 * 60 * 60 * 24));
    const silenceHours = Math.floor((longestSilence % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    
    // Response balance (who initiates more)
    const youPercent = totalMessages > 0 ? Math.round((youCount / totalMessages) * 100) : 0;
    const otherPercent = 100 - youPercent;
    
    // Average message length
    const avgYourLength = youCount > 0 ? Math.round(yourWordCount / youCount) : 0;
    const avgOtherLength = otherCount > 0 ? Math.round(otherWordCount / otherCount) : 0;
    
    return {
      totalMessages,
      youCount,
      otherCount,
      youPercent,
      otherPercent,
      mediaCount,
      avgPerDay,
      mostActiveDay,
      mostActiveHour: hourLabel,
      longestSilence: {
        days: silenceDays,
        hours: silenceHours,
        startDate: longestSilenceStart
      },
      firstDate,
      lastDate,
      durationDays,
      avgYourLength,
      avgOtherLength,
      dayOfWeekCounts,
      hourCounts
    };
  },
  
  renderInsightsPanel(stats) {
    const panel = document.getElementById('chatInsightsPanel');
    if (!panel) return;
    
    const formatDate = (date) => {
      if (!date) return '—';
      return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
    };
    
    const silenceText = stats.longestSilence.days > 0 
      ? `${stats.longestSilence.days}d ${stats.longestSilence.hours}h`
      : stats.longestSilence.hours > 0 
        ? `${stats.longestSilence.hours} hours`
        : 'Less than an hour';
    
    panel.innerHTML = `
      <div class="insights-header">
        <h4>💫 Conversation Insights</h4>
        <button class="insights-close" onclick="ImportedChats.toggleInsights()">×</button>
      </div>
      
      <div class="insights-grid">
        <div class="insight-card">
          <div class="insight-value">${stats.totalMessages.toLocaleString()}</div>
          <div class="insight-label">Total Messages</div>
        </div>
        
        <div class="insight-card">
          <div class="insight-value">${stats.avgPerDay}</div>
          <div class="insight-label">Avg/Day</div>
        </div>
        
        <div class="insight-card">
          <div class="insight-value">${stats.mediaCount}</div>
          <div class="insight-label">Media Shared</div>
        </div>
        
        <div class="insight-card">
          <div class="insight-value">${stats.durationDays}</div>
          <div class="insight-label">Days of Chat</div>
        </div>
      </div>
      
      <div class="insights-section">
        <div class="insights-section-title">Message Balance</div>
        <div class="balance-bar-container">
          <div class="balance-bar">
            <div class="balance-you" style="width: ${stats.youPercent}%"></div>
            <div class="balance-other" style="width: ${stats.otherPercent}%"></div>
          </div>
          <div class="balance-labels">
            <span>You: ${stats.youPercent}%</span>
            <span>Them: ${stats.otherPercent}%</span>
          </div>
        </div>
      </div>
      
      <div class="insights-section">
        <div class="insights-section-title">Activity Patterns</div>
        <div class="activity-stats">
          <div class="activity-stat">
            <span class="stat-icon">📅</span>
            <span class="stat-text">Most active on <strong>${stats.mostActiveDay}s</strong></span>
          </div>
          <div class="activity-stat">
            <span class="stat-icon">⏰</span>
            <span class="stat-text">Peak hour: <strong>${stats.mostActiveHour}</strong></span>
          </div>
          <div class="activity-stat">
            <span class="stat-icon">🤫</span>
            <span class="stat-text">Longest silence: <strong>${silenceText}</strong></span>
          </div>
        </div>
      </div>
      
      <div class="insights-section">
        <div class="insights-section-title">Conversation Span</div>
        <div class="date-range">
          <div class="date-item">
            <span class="date-label">Started</span>
            <span class="date-value">${formatDate(stats.firstDate)}</span>
          </div>
          <div class="date-arrow">→</div>
          <div class="date-item">
            <span class="date-label">Last message</span>
            <span class="date-value">${formatDate(stats.lastDate)}</span>
          </div>
        </div>
      </div>
      
      <div class="insights-section">
        <div class="insights-section-title">Avg Words/Message</div>
        <div class="word-counts">
          <div class="word-count-item">
            <span class="word-count-label">You</span>
            <span class="word-count-value">${stats.avgYourLength}</span>
          </div>
          <div class="word-count-item">
            <span class="word-count-label">Them</span>
            <span class="word-count-value">${stats.avgOtherLength}</span>
          </div>
        </div>
      </div>
    `;
  },
  
  clearInsightsCache() {
    this.cachedInsights = null;
  },

  // ═══════════════════════════════════════════════════════════
  // MEDIA VIEWER
  // ═══════════════════════════════════════════════════════════
  currentMediaIndex: 0,
  mediaQueue: [],

  openMediaViewer(mediaUrl, mediaType) {
    const overlay = document.getElementById('mediaViewerOverlay');
    const img = document.getElementById('mediaViewerImg');
    const video = document.getElementById('mediaViewerVideo');

    // Build media queue from current chat
    this.mediaQueue = this.currentMessages
      .filter(m => m.isMedia && m.mediaUrl)
      .map(m => ({ url: m.mediaUrl, type: m.mediaType || 'image' }));

    this.currentMediaIndex = this.mediaQueue.findIndex(m => m.url === mediaUrl);
    if (this.currentMediaIndex === -1) {
      this.currentMediaIndex = 0;
    }

    overlay.style.display = 'flex';

    const media = this.mediaQueue[this.currentMediaIndex];
    if (media.type === 'image') {
      img.src = media.url;
      img.style.display = 'block';
      video.style.display = 'none';
    } else {
      video.src = media.url;
      video.style.display = 'block';
      img.style.display = 'none';
    }
  },

  closeMediaViewer() {
    const overlay = document.getElementById('mediaViewerOverlay');
    overlay.style.display = 'none';
  },

  prevMedia() {
    if (!this.mediaQueue.length) return;
    this.currentMediaIndex = (this.currentMediaIndex - 1 + this.mediaQueue.length) % this.mediaQueue.length;
    this.showMediaAtIndex();
  },

  nextMedia() {
    if (!this.mediaQueue.length) return;
    this.currentMediaIndex = (this.currentMediaIndex + 1) % this.mediaQueue.length;
    this.showMediaAtIndex();
  },

  showMediaAtIndex() {
    const media = this.mediaQueue[this.currentMediaIndex];
    if (media) {
      this.openMediaViewer(media.url, media.type);
    }
  },

  // ═══════════════════════════════════════════════════════════
  // UTILITIES
  // ═══════════════════════════════════════════════════════════
  formatDate(date) {
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    if (date.toDateString() === today.toDateString()) {
      return 'Today';
    } else if (date.toDateString() === yesterday.toDateString()) {
      return 'Yesterday';
    } else {
      return date.toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: date.getFullYear() !== today.getFullYear() ? 'numeric' : undefined
      });
    }
  },

  escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  },

  escapeRegex(str) {
    return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  },

  // ═══════════════════════════════════════════════════════════
  // TIMELINE COMPARISON
  // ═══════════════════════════════════════════════════════════
  comparisonChats: [],
  comparisonData: null,

  openComparisonModal() {
    const overlay = document.getElementById('comparisonOverlay');
    const selection = document.getElementById('comparisonSelection');
    const view = document.getElementById('comparisonView');
    
    // Reset state
    this.comparisonChats = [];
    selection.style.display = 'block';
    view.style.display = 'none';
    
    // Render chat list for selection
    this.renderComparisonChatList();
    
    overlay.style.display = 'flex';
  },

  closeComparisonModal() {
    document.getElementById('comparisonOverlay').style.display = 'none';
  },

  renderComparisonChatList() {
    const list = document.getElementById('comparisonChatList');
    list.innerHTML = '';

    this.chats.forEach(chat => {
      const item = document.createElement('div');
      item.className = 'her-comparison-chat-item';
      item.dataset.chatId = chat.id;
      
      const platformEmoji = chat.platform === 'whatsapp' ? '💬' : '📱';
      
      item.innerHTML = `
        <div class="her-comparison-chat-checkbox">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3">
            <polyline points="20 6 9 17 4 12"/>
          </svg>
        </div>
        <div class="her-comparison-chat-info">
          <div class="her-comparison-chat-name">${platformEmoji} ${this.escapeHtml(chat.name)}</div>
          <div class="her-comparison-chat-platform">${chat.messageCount || chat.messages?.length || 0} messages</div>
        </div>
      `;
      
      item.addEventListener('click', () => this.toggleComparisonChat(chat.id, item));
      list.appendChild(item);
    });
  },

  toggleComparisonChat(chatId, element) {
    const index = this.comparisonChats.indexOf(chatId);
    
    if (index > -1) {
      this.comparisonChats.splice(index, 1);
      element.classList.remove('selected');
    } else {
      this.comparisonChats.push(chatId);
      element.classList.add('selected');
    }
    
    // Enable/disable compare button
    const btn = document.getElementById('startComparisonBtn');
    btn.disabled = this.comparisonChats.length < 2;
  },

  startComparison() {
    if (this.comparisonChats.length < 2) return;
    
    // Build comparison data
    this.comparisonData = this.buildComparisonData();
    
    // Switch to comparison view
    document.getElementById('comparisonSelection').style.display = 'none';
    document.getElementById('comparisonView').style.display = 'flex';
    
    // Render timelines
    this.renderComparisonTimelines();
  },

  buildComparisonData() {
    const data = {
      chats: [],
      timeRange: { start: null, end: null }
    };
    
    this.comparisonChats.forEach(chatId => {
      const chat = this.chats.find(c => c.id === chatId);
      if (!chat || !chat.messages?.length) return;
      
      const messages = chat.messages;
      const phases = this.calculateChatPhases(messages);
      
      // Update global time range
      const chatStart = new Date(messages[0].timestamp);
      const chatEnd = new Date(messages[messages.length - 1].timestamp);
      
      if (!data.timeRange.start || chatStart < data.timeRange.start) {
        data.timeRange.start = chatStart;
      }
      if (!data.timeRange.end || chatEnd > data.timeRange.end) {
        data.timeRange.end = chatEnd;
      }
      
      data.chats.push({
        id: chat.id,
        name: chat.name,
        platform: chat.platform,
        phases: phases,
        start: chatStart,
        end: chatEnd
      });
    });
    
    return data;
  },

  calculateChatPhases(messages) {
    const phases = [];
    const weekMs = 7 * 24 * 60 * 60 * 1000;
    
    if (!messages.length) return phases;
    
    let currentPhase = {
      start: new Date(messages[0].timestamp),
      end: null,
      messageCount: 0,
      sentiment: { positive: 0, negative: 0, neutral: 0 }
    };
    
    messages.forEach((msg, i) => {
      const msgDate = new Date(msg.timestamp);
      const prevDate = i > 0 ? new Date(messages[i - 1].timestamp) : msgDate;
      
      // Check if gap is larger than a week (new phase)
      if (msgDate - prevDate > weekMs && currentPhase.messageCount > 0) {
        currentPhase.end = prevDate;
        phases.push({ ...currentPhase });
        
        currentPhase = {
          start: msgDate,
          end: null,
          messageCount: 0,
          sentiment: { positive: 0, negative: 0, neutral: 0 }
        };
      }
      
      currentPhase.messageCount++;
      currentPhase.end = msgDate;
      
      // Analyze sentiment
      const sentiment = this.analyzeSentiment(msg.text || '');
      currentPhase.sentiment[sentiment]++;
    });
    
    // Push final phase
    if (currentPhase.messageCount > 0) {
      phases.push(currentPhase);
    }
    
    return phases;
  },

  renderComparisonTimelines() {
    const container = document.getElementById('comparisonArcs');
    const timescale = document.getElementById('comparisonTimescale');
    
    if (!this.comparisonData) return;
    
    const { chats, timeRange } = this.comparisonData;
    const totalMs = timeRange.end - timeRange.start;
    
    // Render time scale
    this.renderTimescale(timescale, timeRange);
    
    // Render each chat's timeline
    container.innerHTML = '';
    
    chats.forEach(chat => {
      const arc = document.createElement('div');
      arc.className = 'her-comparison-arc';
      arc.dataset.chatId = chat.id;
      
      const platformEmoji = chat.platform === 'whatsapp' ? '💬' : '📱';
      
      arc.innerHTML = `
        <div class="her-arc-header">
          <span class="her-arc-platform-icon">${platformEmoji}</span>
          <span class="her-arc-name">${this.escapeHtml(chat.name)}</span>
        </div>
        <div class="her-arc-timeline" data-chat-id="${chat.id}">
          ${this.renderPhases(chat.phases, timeRange, totalMs)}
        </div>
      `;
      
      container.appendChild(arc);
    });
    
    // Bind phase interactions
    this.bindPhaseInteractions();
  },

  renderTimescale(container, timeRange) {
    const markers = 5;
    container.innerHTML = '';
    
    const totalMs = timeRange.end - timeRange.start;
    
    for (let i = 0; i <= markers; i++) {
      const date = new Date(timeRange.start.getTime() + (totalMs * i / markers));
      const marker = document.createElement('span');
      marker.className = 'her-timescale-marker';
      marker.textContent = date.toLocaleDateString('en-US', { month: 'short', year: '2-digit' });
      container.appendChild(marker);
    }
  },

  renderPhases(phases, timeRange, totalMs) {
    let html = '';
    
    phases.forEach((phase, i) => {
      const startPct = ((phase.start - timeRange.start) / totalMs) * 100;
      const widthPct = ((phase.end - phase.start) / totalMs) * 100;
      
      // Determine density class
      let densityClass = 'density-none';
      if (phase.messageCount > 50) densityClass = 'density-high';
      else if (phase.messageCount > 20) densityClass = 'density-medium';
      else if (phase.messageCount > 5) densityClass = 'density-low';
      
      // Determine emotion band
      const total = phase.sentiment.positive + phase.sentiment.negative + phase.sentiment.neutral;
      let emotionClass = 'cool';
      if (phase.sentiment.positive > phase.sentiment.negative * 2) emotionClass = 'warm';
      else if (phase.sentiment.negative > phase.sentiment.positive * 2) emotionClass = 'mixed';
      
      html += `
        <div class="her-arc-phase ${densityClass}" 
             data-phase-index="${i}"
             style="left: ${startPct}%; width: ${Math.max(widthPct, 1)}%;"
             title="${phase.messageCount} messages">
          <div class="her-arc-emotion-band ${emotionClass}"></div>
        </div>
      `;
    });
    
    return html;
  },

  bindPhaseInteractions() {
    const phases = document.querySelectorAll('.her-arc-phase');
    
    phases.forEach(phase => {
      phase.addEventListener('mouseenter', (e) => this.highlightCorrespondingPhases(e.target));
      phase.addEventListener('mouseleave', () => this.clearPhaseHighlights());
      phase.addEventListener('click', (e) => this.showPhaseDetails(e.target));
    });
  },

  highlightCorrespondingPhases(targetPhase) {
    const phaseIndex = targetPhase.dataset.phaseIndex;
    const allPhases = document.querySelectorAll(`.her-arc-phase[data-phase-index="${phaseIndex}"]`);
    
    allPhases.forEach(p => p.classList.add('highlighted'));
  },

  clearPhaseHighlights() {
    document.querySelectorAll('.her-arc-phase.highlighted').forEach(p => {
      p.classList.remove('highlighted');
    });
  },

  showPhaseDetails(phaseEl) {
    const chatId = phaseEl.closest('.her-arc-timeline').dataset.chatId;
    const phaseIndex = parseInt(phaseEl.dataset.phaseIndex);
    const chatData = this.comparisonData.chats.find(c => c.id === chatId);
    
    if (!chatData || !chatData.phases[phaseIndex]) return;
    
    const phase = chatData.phases[phaseIndex];
    const details = document.getElementById('comparisonPhaseDetails');
    const dateEl = document.getElementById('phaseDetailDate');
    const infoEl = document.getElementById('phaseDetailInfo');
    
    dateEl.textContent = `${this.formatDate(phase.start)} — ${this.formatDate(phase.end)}`;
    infoEl.innerHTML = `
      <p>${phase.messageCount} messages in this period</p>
      <p>From: ${chatData.name}</p>
    `;
    
    details.style.display = 'block';
  },

  setComparisonView(view) {
    const arcs = document.getElementById('comparisonArcs');
    arcs.classList.remove('stacked', 'sidebyside');
    arcs.classList.add(view);
    
    document.querySelectorAll('.her-comparison-view-btn').forEach(btn => {
      btn.classList.toggle('active', btn.dataset.view === view);
    });
  },

  // ═══════════════════════════════════════════════════════════
  // AI-ASSISTED REFLECTION
  // ═══════════════════════════════════════════════════════════
  reflectionMode: false,
  reflectionPatterns: [
    { pattern: 'longPauses', template: 'This period had some longer pauses between messages.' },
    { pattern: 'highActivity', template: 'You were quite active during this time.' },
    { pattern: 'morningPerson', template: 'Many messages were sent in the morning hours.' },
    { pattern: 'nightOwl', template: 'Late-night conversations were common here.' },
    { pattern: 'shortMessages', template: 'Messages tended to be brief during this period.' },
    { pattern: 'emojiHeavy', template: 'Lots of expressive messages in this stretch.' },
    { pattern: 'questionHeavy', template: 'This period had many questions being asked.' },
    { pattern: 'responseTime', template: 'Responses came quickly during this time.' },
  ],

  toggleReflectionMode() {
    this.reflectionMode = !this.reflectionMode;
    
    const btn = document.getElementById('toggleReflectionBtn');
    const panel = document.getElementById('reflectionPanel');
    
    if (this.reflectionMode) {
      btn?.classList.add('active');
      this.generateReflection();
    } else {
      btn?.classList.remove('active');
      panel.style.display = 'none';
    }
  },

  generateReflection() {
    if (!this.currentChat || !this.currentMessages.length) {
      this.showReflection('Select a chat to see reflections.');
      return;
    }
    
    const reflection = this.analyzeForReflection(this.currentMessages);
    this.showReflection(reflection);
  },

  analyzeForReflection(messages) {
    // Simple rule-based analysis - runs completely locally
    const observations = [];
    
    // Check for long pauses (more than 3 days)
    let maxPause = 0;
    for (let i = 1; i < messages.length; i++) {
      const pause = new Date(messages[i].timestamp) - new Date(messages[i - 1].timestamp);
      if (pause > maxPause) maxPause = pause;
    }
    if (maxPause > 3 * 24 * 60 * 60 * 1000) {
      observations.push('There were some quiet periods in this conversation.');
    }
    
    // Check message times
    const hours = messages.map(m => new Date(m.timestamp).getHours());
    const morningCount = hours.filter(h => h >= 6 && h < 12).length;
    const nightCount = hours.filter(h => h >= 22 || h < 6).length;
    
    if (morningCount > messages.length * 0.4) {
      observations.push('Many of these messages were sent in the morning.');
    } else if (nightCount > messages.length * 0.3) {
      observations.push('Late-night messages appear throughout this chat.');
    }
    
    // Check message lengths
    const avgLength = messages.reduce((sum, m) => sum + (m.text?.length || 0), 0) / messages.length;
    if (avgLength < 20) {
      observations.push('Messages here tend to be brief and quick.');
    } else if (avgLength > 100) {
      observations.push('Longer, more detailed messages appear in this chat.');
    }
    
    // Check emoji usage
    const emojiRegex = /[\u{1F300}-\u{1F9FF}]|[\u{2600}-\u{26FF}]/gu;
    const emojiCount = messages.filter(m => emojiRegex.test(m.text || '')).length;
    if (emojiCount > messages.length * 0.5) {
      observations.push('This conversation has a lot of expressive moments.');
    }
    
    // Return a random observation or default
    if (observations.length > 0) {
      return observations[Math.floor(Math.random() * observations.length)];
    }
    
    return 'Take a moment to scroll through and notice what stands out to you.';
  },

  showReflection(text) {
    const panel = document.getElementById('reflectionPanel');
    const content = document.getElementById('reflectionContent');
    
    content.textContent = text;
    panel.style.display = 'block';
  },

  dismissReflection() {
    document.getElementById('reflectionPanel').style.display = 'none';
  },

  // ═══════════════════════════════════════════════════════════
  // MEMORY BRIDGE - Save messages to Memories section
  // ═══════════════════════════════════════════════════════════
  selectedMessageForMemory: null,
  contextMenu: null,

  showMessageContextMenu(messageData, clientX, clientY) {
    // Remove existing context menu
    this.hideContextMenu();
    
    this.selectedMessageForMemory = messageData;
    
    const menu = document.createElement('div');
    menu.className = 'her-msg-context-menu';
    menu.innerHTML = `
      <button class="her-msg-context-item" data-action="save-memory">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/>
        </svg>
        Save to Memories
      </button>
      <button class="her-msg-context-item" data-action="copy">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <rect x="9" y="9" width="13" height="13" rx="2" ry="2"/>
          <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/>
        </svg>
        Copy Text
      </button>
    `;
    
    // Position menu at click/touch position
    menu.style.position = 'fixed';
    menu.style.top = `${Math.min(clientY + 8, window.innerHeight - 120)}px`;
    menu.style.left = `${Math.min(clientX, window.innerWidth - 180)}px`;
    menu.style.zIndex = '1000';
    
    // Bind actions
    menu.querySelectorAll('.her-msg-context-item').forEach(item => {
      item.addEventListener('click', () => {
        const action = item.dataset.action;
        if (action === 'save-memory') {
          this.openSaveMemoryModal(messageData);
        } else if (action === 'copy') {
          navigator.clipboard.writeText(messageData.text || '');
        }
        this.hideContextMenu();
      });
    });
    
    document.body.appendChild(menu);
    this.contextMenu = menu;
    
    // Close on outside click
    setTimeout(() => {
      document.addEventListener('click', this.hideContextMenu.bind(this), { once: true });
    }, 100);
  },

  hideContextMenu() {
    if (this.contextMenu) {
      this.contextMenu.remove();
      this.contextMenu = null;
    }
  },

  openSaveMemoryModal(messageData) {
    const overlay = document.getElementById('saveMemoryOverlay');
    const quote = document.getElementById('saveMemoryQuote');
    const source = document.getElementById('saveMemorySource');
    const titleInput = document.getElementById('saveMemoryTitle');
    const moodSelect = document.getElementById('saveMemoryMood');
    const noteInput = document.getElementById('saveMemoryNote');
    
    this.selectedMessageForMemory = messageData;
    
    // Populate preview
    quote.textContent = messageData.text || '[Media message]';
    
    const platformEmoji = this.currentChat?.platform === 'whatsapp' ? '💬' : '📱';
    const dateStr = new Date(messageData.timestamp).toLocaleDateString('en-US', {
      month: 'short', day: 'numeric', year: 'numeric'
    });
    source.innerHTML = `<span class="her-save-memory-source-icon">${platformEmoji}</span> ${this.escapeHtml(this.currentChat?.name || 'Unknown')} • ${dateStr}`;
    
    // Reset form
    titleInput.value = '';
    noteInput.value = '';
    
    // Infer mood from sentiment
    const sentiment = this.analyzeSentiment(messageData.text || '');
    if (sentiment === 'positive') {
      moodSelect.value = 'happy';
    } else if (sentiment === 'negative') {
      moodSelect.value = 'sad';
    } else {
      moodSelect.value = '';
    }
    
    overlay.style.display = 'flex';
  },

  closeSaveMemoryModal() {
    document.getElementById('saveMemoryOverlay').style.display = 'none';
    this.selectedMessageForMemory = null;
  },

  confirmSaveMemory() {
    if (!this.selectedMessageForMemory) return;
    
    const titleInput = document.getElementById('saveMemoryTitle');
    const moodSelect = document.getElementById('saveMemoryMood');
    const noteInput = document.getElementById('saveMemoryNote');
    
    const memory = {
      id: 'mem_' + Date.now(),
      title: titleInput.value || 'A moment from ' + (this.currentChat?.name || 'a chat'),
      content: this.selectedMessageForMemory.text || '',
      date: this.selectedMessageForMemory.timestamp,
      mood: moodSelect.value || null,
      note: noteInput.value || null,
      source: {
        type: 'imported-chat',
        chatId: this.currentChat?.id,
        chatName: this.currentChat?.name,
        platform: this.currentChat?.platform,
        messageTimestamp: this.selectedMessageForMemory.timestamp
      },
      createdAt: new Date().toISOString()
    };
    
    // Save to localStorage (integrate with existing memories system)
    this.saveMemoryToStorage(memory);
    
    // Close modal
    this.closeSaveMemoryModal();
    
    // Show gentle confirmation
    this.showToast('Saved to Memories');
  },

  saveMemoryToStorage(memory) {
    try {
      const existing = JSON.parse(localStorage.getItem('her_memories') || '[]');
      existing.push(memory);
      localStorage.setItem('her_memories', JSON.stringify(existing));
      
      // Dispatch event for other parts of the app
      window.dispatchEvent(new CustomEvent('memoryAdded', { detail: memory }));
    } catch (error) {
      console.error('Failed to save memory:', error);
    }
  },

  showToast(message) {
    // Use existing toast system if available
    if (typeof HerApp !== 'undefined' && HerApp.showToast) {
      HerApp.showToast(message);
      return;
    }
    
    // Fallback toast
    const toast = document.createElement('div');
    toast.className = 'her-toast';
    toast.textContent = message;
    toast.style.cssText = `
      position: fixed;
      bottom: 80px;
      left: 50%;
      transform: translateX(-50%);
      background: var(--bg-elevated);
      color: var(--text-primary);
      padding: 12px 24px;
      border-radius: 8px;
      font-size: 14px;
      z-index: 1000;
      animation: fadeIn 0.2s ease;
    `;
    document.body.appendChild(toast);
    setTimeout(() => toast.remove(), 2500);
  }
};

// Auto-init when DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => ImportedChats.init());
} else {
  ImportedChats.init();
}
