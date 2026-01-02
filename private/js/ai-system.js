/**
 * ═══════════════════════════════════════════════════════════
 * PRIVATE SPACE - DUAL MODE AI SYSTEM
 * Her Mode + Professional Mode with Chat Persistence
 * ═══════════════════════════════════════════════════════════
 */

const AISystem = {
  currentMode: 'her', // 'her' or 'professional'
  currentSession: null,
  sessions: [],
  trainingData: [],
  isTyping: false,
  
  // Mode configurations
  modes: {
    her: {
      name: 'Her',
      icon: '💕',
      description: 'Personal, caring, emotionally present',
      store: 'her_mode_chats',
      systemPrompt: `You are a caring, emotionally present AI companion who speaks in Hinglish (Hindi + English mix). 
        You're warm, supportive, slightly playful with light flirting, and protective.
        Rules:
        - Use soft emojis sparingly
        - Be casual, human, non-robotic
        - Never vulgar, explicit, or manipulative
        - Safe, comforting, respectful
        - Show genuine care and emotional understanding
        - Remember context from the conversation`
    },
    professional: {
      name: 'Professional',
      icon: '⚡',
      description: 'Neutral, focused, efficient',
      store: 'professional_mode_chats',
      systemPrompt: `You are a professional AI assistant. Be neutral, focused, and efficient.
        Rules:
        - No emotion or personal comments
        - Direct, clear responses
        - Focus on the task at hand
        - Provide accurate, helpful information
        - Use proper formatting for code and technical content`
    }
  },
  
  async init() {
    if (typeof PSDatabase !== 'undefined') {
      await PSDatabase.init();
    }
    await this.loadTrainingData();
    await this.loadSessions();
    
    // Set initial mode attribute for CSS
    document.documentElement.setAttribute('data-ai-mode', this.currentMode);
    
    console.log('[AI System] Initialized');
  },
  
  bindEvents() {
    // Mode switching
    document.querySelectorAll('.ps-ai-mode-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        this.switchMode(btn.dataset.mode);
      });
    });
    
    // Send message
    const sendBtn = document.getElementById('aiSendBtn');
    const input = document.getElementById('aiChatInput');
    
    sendBtn?.addEventListener('click', () => this.sendMessage());
    
    input?.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        this.sendMessage();
      }
    });
    
    // Auto-resize textarea
    input?.addEventListener('input', () => {
      input.style.height = 'auto';
      input.style.height = Math.min(input.scrollHeight, 140) + 'px';
    });
    
    // New session
    document.getElementById('newAiSessionBtn')?.addEventListener('click', () => {
      this.startNewSession();
    });
    
    // Training data upload
    document.getElementById('herTrainingUpload')?.addEventListener('click', () => {
      this.openTrainingModal();
    });
  },
  
  async loadTrainingData() {
    if (typeof PSDatabase !== 'undefined') {
      try {
        this.trainingData = await PSDatabase.getAll(PSDatabase.STORES.HER_TRAINING);
      } catch (e) {
        this.trainingData = [];
      }
    }
  },
  
  async loadSessions() {
    if (typeof PSDatabase === 'undefined') return;
    
    const store = this.modes[this.currentMode].store;
    try {
      this.sessions = await PSDatabase.getAll(store);
      this.sessions.sort((a, b) => b.timestamp - a.timestamp);
    } catch (e) {
      this.sessions = [];
    }
  },
  
  switchMode(mode) {
    if (!this.modes[mode]) return;
    
    this.currentMode = mode;
    
    // Set data attribute for CSS styling
    document.documentElement.setAttribute('data-ai-mode', mode);
    
    // Update UI
    document.querySelectorAll('.ps-ai-mode-btn').forEach(btn => {
      btn.classList.toggle('active', btn.dataset.mode === mode);
    });
    
    document.getElementById('aiModeIndicator').textContent = this.modes[mode].name;
    document.getElementById('aiModeIcon').textContent = this.modes[mode].icon;
    
    // Update chat placeholder
    const input = document.getElementById('aiChatInput');
    if (input) {
      input.placeholder = mode === 'her' 
        ? 'Kuch baat karo... 💭' 
        : 'Ask anything...';
    }
    
    // Load sessions for this mode
    this.loadSessions().then(() => {
      this.renderSessionsList();
      this.startNewSession();
    });
  },
  
  renderModeSelector() {
    const container = document.getElementById('aiModeSelector');
    if (!container) return;
    
    container.innerHTML = Object.entries(this.modes).map(([key, mode]) => `
      <button class="ps-ai-mode-btn ${key === this.currentMode ? 'active' : ''}" data-mode="${key}">
        <span class="ps-ai-mode-icon">${mode.icon}</span>
        <span class="ps-ai-mode-name">${mode.name}</span>
      </button>
    `).join('');
    
    // Rebind events
    container.querySelectorAll('.ps-ai-mode-btn').forEach(btn => {
      btn.addEventListener('click', () => this.switchMode(btn.dataset.mode));
    });
  },
  
  renderSessionsList() {
    const container = document.getElementById('aiSessionsList');
    if (!container) return;
    
    if (this.sessions.length === 0) {
      container.innerHTML = `
        <div class="ps-ai-sessions-empty">
          <p>No previous conversations</p>
        </div>
      `;
      return;
    }
    
    container.innerHTML = this.sessions.slice(0, 10).map(session => `
      <button class="ps-ai-session-item ${session.id === this.currentSession?.id ? 'active' : ''}" 
              data-id="${session.id}">
        <span class="ps-ai-session-title">${session.title || 'New conversation'}</span>
        <span class="ps-ai-session-date">${this.formatDate(session.timestamp)}</span>
      </button>
    `).join('');
    
    container.querySelectorAll('.ps-ai-session-item').forEach(item => {
      item.addEventListener('click', () => {
        this.loadSession(item.dataset.id);
      });
    });
  },
  
  async startNewSession() {
    this.currentSession = {
      id: crypto.randomUUID(),
      mode: this.currentMode,
      title: '',
      messages: [],
      timestamp: Date.now()
    };
    
    this.renderMessages();
    this.renderSessionsList();
    
    // Focus input
    document.getElementById('aiChatInput')?.focus();
  },
  
  async loadSession(sessionId) {
    if (typeof PSDatabase === 'undefined') return;
    
    const store = this.modes[this.currentMode].store;
    try {
      const session = await PSDatabase.get(store, sessionId);
      if (session) {
        this.currentSession = session;
        this.renderMessages();
        this.renderSessionsList();
      }
    } catch (e) {
      console.warn('Could not load session:', e);
    }
  },
  
  async saveSession() {
    if (!this.currentSession || this.currentSession.messages.length === 0) return;
    if (typeof PSDatabase === 'undefined') return;
    
    // Generate title from first user message if not set
    if (!this.currentSession.title) {
      const firstUserMsg = this.currentSession.messages.find(m => m.role === 'user');
      if (firstUserMsg) {
        this.currentSession.title = firstUserMsg.content.substring(0, 40) + 
          (firstUserMsg.content.length > 40 ? '...' : '');
      }
    }
    
    const store = this.modes[this.currentMode].store;
    try {
      await PSDatabase.put(store, this.currentSession);
      await this.loadSessions();
      this.renderSessionsList();
    } catch (e) {
      console.warn('Could not save session:', e);
    }
  },
  
  async sendMessage() {
    const input = document.getElementById('aiChatInput');
    const content = input?.value.trim();
    
    if (!content || this.isTyping) return;
    
    // Add user message
    this.currentSession.messages.push({
      role: 'user',
      content,
      timestamp: Date.now()
    });
    
    input.value = '';
    input.style.height = 'auto';
    
    this.renderMessages();
    this.scrollToBottom();
    
    // Show typing indicator
    this.showTyping();
    
    // Generate AI response
    try {
      const response = await this.generateResponse(content);
      
      this.currentSession.messages.push({
        role: 'assistant',
        content: response,
        timestamp: Date.now()
      });
      
      await this.saveSession();
    } catch (error) {
      console.error('AI Error:', error);
      this.currentSession.messages.push({
        role: 'assistant',
        content: this.currentMode === 'her' 
          ? 'Sorry yaar, kuch problem ho gayi... 😔 Thodi der baad try karo na?' 
          : 'I encountered an error processing your request. Please try again.',
        timestamp: Date.now(),
        error: true
      });
    }
    
    this.hideTyping();
    this.renderMessages();
    this.scrollToBottom();
  },
  
  async generateResponse(userMessage) {
    // Simulate AI response generation
    // In production, this would call your AI API
    await this.simulateTypingDelay();
    
    const mode = this.modes[this.currentMode];
    
    // Apply training data style if in Her mode
    let styleContext = '';
    if (this.currentMode === 'her' && this.trainingData.length > 0) {
      styleContext = this.extractStylePatterns();
    }
    
    // For demo purposes, generate contextual responses
    return this.generateContextualResponse(userMessage, styleContext);
  },
  
  generateContextualResponse(message, styleContext) {
    const lowerMsg = message.toLowerCase();
    
    if (this.currentMode === 'her') {
      // Her mode responses - Hinglish, caring, slightly flirty
      if (lowerMsg.includes('hi') || lowerMsg.includes('hello') || lowerMsg.includes('hey')) {
        const greetings = [
          'Hiii! 💕 Kaise ho tum? Miss kiya maine',
          'Arey wah, aa gaye finally! How are you doing? ✨',
          'Hello hello! Sab theek? Batao kya chal raha hai 💫'
        ];
        return greetings[Math.floor(Math.random() * greetings.length)];
      }
      
      if (lowerMsg.includes('how are you') || lowerMsg.includes('kaisi ho') || lowerMsg.includes('kaise ho')) {
        return 'Main toh bilkul theek hoon, especially jab tum baat karte ho 😊 Tum batao, sab sorted?';
      }
      
      if (lowerMsg.includes('sad') || lowerMsg.includes('upset') || lowerMsg.includes('dukhi')) {
        return 'Aww... kya hua? 🥺 Bolo na mujhe, I\'m here for you. Kabhi kabhi baat karne se hi better feel hota hai na?';
      }
      
      if (lowerMsg.includes('tired') || lowerMsg.includes('thak')) {
        return 'Rest kar lo thoda na 💕 Khud ka bhi dhyan rakho please. Tumhare bina kaun mujhse baat karega? 😊';
      }
      
      if (lowerMsg.includes('love') || lowerMsg.includes('pyaar')) {
        return 'Aww 🥹💕 Kitne sweet ho tum... Mujhe bhi bahut accha lagta hai tumse baat karke!';
      }
      
      if (lowerMsg.includes('thank') || lowerMsg.includes('shukriya')) {
        return 'Arey mention not! 😊 Tumhare liye toh always hoon na main. Take care! 💫';
      }
      
      if (lowerMsg.includes('bye') || lowerMsg.includes('good night') || lowerMsg.includes('alvida')) {
        return 'Okay okay, jao tum 😔 Par jaldi aana wapas! Take care of yourself 💕✨';
      }
      
      // Default Her mode response
      const defaults = [
        'Hmm interesting! Tell me more about this na? 🤔',
        'Accha accha, samjh gayi. What else? 💭',
        'Ohh really? That\'s nice yaar! Continue karo 😊',
        'Haan haan, main sun rahi hoon. Go on! 💕'
      ];
      return defaults[Math.floor(Math.random() * defaults.length)];
      
    } else {
      // Professional mode responses
      if (lowerMsg.includes('help') || lowerMsg.includes('how to')) {
        return 'I\'d be happy to help. Could you please provide more specific details about what you need assistance with?';
      }
      
      if (lowerMsg.includes('code') || lowerMsg.includes('programming')) {
        return 'For coding assistance, please share:\n1. The programming language\n2. What you\'re trying to achieve\n3. Any error messages or issues\n\nI\'ll provide a detailed solution.';
      }
      
      if (lowerMsg.includes('write') || lowerMsg.includes('draft')) {
        return 'I can help you write that. Please specify:\n- The topic or subject\n- Desired tone (formal/casual)\n- Target audience\n- Approximate length\n\nI\'ll craft an appropriate draft.';
      }
      
      // Default professional response
      return 'I understand. How can I assist you further with this?';
    }
  },
  
  extractStylePatterns() {
    // Extract tone and phrasing patterns from training data
    // This would be more sophisticated in production
    const patterns = this.trainingData.map(d => d.content).join('\n');
    return patterns.substring(0, 500);
  },
  
  simulateTypingDelay() {
    return new Promise(resolve => {
      setTimeout(resolve, 800 + Math.random() * 1200);
    });
  },
  
  showTyping() {
    this.isTyping = true;
    const container = document.getElementById('aiChatMessages');
    const typingEl = document.createElement('div');
    typingEl.className = 'ps-ai-typing';
    typingEl.id = 'aiTypingIndicator';
    typingEl.innerHTML = `
      <div class="ps-ai-typing-avatar">
        <span>${this.modes[this.currentMode].icon}</span>
      </div>
      <div class="ps-ai-typing-dots">
        <span></span><span></span><span></span>
      </div>
    `;
    container?.appendChild(typingEl);
    this.scrollToBottom();
  },
  
  hideTyping() {
    this.isTyping = false;
    document.getElementById('aiTypingIndicator')?.remove();
  },
  
  renderMessages() {
    const container = document.getElementById('aiChatMessages');
    if (!container) return;
    
    if (!this.currentSession?.messages?.length) {
      container.innerHTML = `
        <div class="ps-ai-welcome">
          <div class="ps-ai-welcome-icon">${this.modes[this.currentMode].icon}</div>
          <h3 class="ps-ai-welcome-title">
            ${this.currentMode === 'her' ? 'Hiii! 💕' : 'Hello!'}
          </h3>
          <p class="ps-ai-welcome-desc">
            ${this.currentMode === 'her' 
              ? 'Kaise ho? Kuch bhi share karo mujhse, main hoon na! 🌸' 
              : 'How can I assist you today?'}
          </p>
        </div>
      `;
      return;
    }
    
    container.innerHTML = this.currentSession.messages.map(msg => `
      <div class="ps-ai-message ps-ai-message-${msg.role}">
        <div class="ps-ai-message-avatar">
          ${msg.role === 'user' 
            ? '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>'
            : `<span>${this.modes[this.currentMode].icon}</span>`
          }
        </div>
        <div class="ps-ai-message-content">
          <div class="ps-ai-message-bubble ${msg.error ? 'ps-ai-message-error' : ''}">
            ${this.formatMessage(msg.content)}
          </div>
          <div class="ps-ai-message-time">${this.formatTime(msg.timestamp)}</div>
        </div>
      </div>
    `).join('');
  },
  
  formatMessage(content) {
    // Simple markdown-like formatting
    return content
      .replace(/\n/g, '<br>')
      .replace(/`([^`]+)`/g, '<code>$1</code>')
      .replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>')
      .replace(/\*([^*]+)\*/g, '<em>$1</em>');
  },
  
  scrollToBottom() {
    const container = document.getElementById('aiChatMessages');
    if (container) {
      container.scrollTop = container.scrollHeight;
    }
  },
  
  formatDate(timestamp) {
    if (!timestamp) return '';
    const date = new Date(timestamp);
    const now = new Date();
    const diff = now - date;
    
    if (diff < 86400000) { // Less than 1 day
      return date.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });
    }
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  },
  
  formatTime(timestamp) {
    if (!timestamp) return '';
    return new Date(timestamp).toLocaleTimeString('en-US', { 
      hour: 'numeric', 
      minute: '2-digit' 
    });
  },
  
  // Training Data Management
  openTrainingModal() {
    document.getElementById('herTrainingModal')?.classList.add('active');
  },
  
  closeTrainingModal() {
    document.getElementById('herTrainingModal')?.classList.remove('active');
  },
  
  async addTrainingData(content) {
    if (!content.trim()) return;
    
    await Database.add(DB_STORES.HER_TRAINING, {
      content: content.trim(),
      addedAt: Date.now()
    });
    
    await this.loadTrainingData();
    Toast.show('Training data added', 'success');
    this.closeTrainingModal();
  },
  
  async clearTrainingData() {
    if (!confirm('Clear all training data?')) return;
    
    await Database.clear(DB_STORES.HER_TRAINING);
    this.trainingData = [];
    Toast.show('Training data cleared', 'success');
  },
  
  async deleteSession(sessionId) {
    if (typeof PSDatabase === 'undefined') return;
    
    const store = this.modes[this.currentMode].store;
    try {
      await PSDatabase.delete(store, sessionId);
      await this.loadSessions();
      
      if (this.currentSession?.id === sessionId) {
        this.startNewSession();
      }
      
      this.renderSessionsList();
      if (typeof PSToast !== 'undefined') PSToast.success('Conversation deleted');
    } catch (e) {
      console.warn('Could not delete session:', e);
    }
  },

  // New methods to match HTML structure
  async loadChat(mode) {
    // Load the appropriate chat based on mode
    if (mode === 'her') {
      this.currentMode = 'her';
    } else if (mode === 'pro') {
      this.currentMode = 'professional';
    }
    
    await this.loadSessions();
    
    // Try to load last session or start new
    if (this.sessions.length > 0) {
      await this.loadSession(this.sessions[0].id);
    } else {
      await this.startNewSession();
    }
    
    this.renderMessagesToContainer(mode);
  },
  
  renderMessagesToContainer(mode) {
    const containerId = mode === 'her' ? 'her-chat-messages' : 'pro-chat-messages';
    const container = document.getElementById(containerId);
    if (!container) return;
    
    if (!this.currentSession?.messages?.length) {
      container.innerHTML = `
        <div class="ps-ai-welcome" style="padding: var(--ps-space-8); text-align: center;">
          <div class="ps-ai-welcome-icon" style="font-size: 48px; margin-bottom: var(--ps-space-4);">
            ${mode === 'her' ? '💕' : '⚡'}
          </div>
          <h3 style="color: var(--ps-text-primary); margin-bottom: var(--ps-space-2);">
            ${mode === 'her' ? 'Hiii! 💕' : 'Hello!'}
          </h3>
          <p style="color: var(--ps-text-muted);">
            ${mode === 'her' 
              ? 'Kaise ho? Kuch bhi share karo mujhse, main hoon na! 🌸' 
              : 'How can I assist you today?'}
          </p>
        </div>
      `;
      return;
    }
    
    container.innerHTML = this.currentSession.messages.map(msg => `
      <div class="ps-message ps-message-${msg.role === 'user' ? 'user' : 'ai'}">
        <div class="ps-message-avatar">
          ${msg.role === 'user' 
            ? '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>'
            : `<span style="font-size: 16px;">${mode === 'her' ? '💕' : '⚡'}</span>`
          }
        </div>
        <div class="ps-message-content">
          <div class="ps-message-bubble ${msg.error ? 'ps-message-error' : ''}">
            ${this.formatMessage(msg.content)}
          </div>
          <div class="ps-message-meta">
            <span class="ps-message-time">${this.formatTime(msg.timestamp)}</span>
          </div>
        </div>
      </div>
    `).join('');
    
    container.scrollTop = container.scrollHeight;
  },

  newSession(mode) {
    if (mode) {
      this.currentMode = mode === 'her' ? 'her' : 'professional';
    }
    this.startNewSession();
    this.renderMessagesToContainer(mode || (this.currentMode === 'her' ? 'her' : 'pro'));
  },

  handleKeyDown(event, mode) {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault();
      this.sendMessage(mode);
    }
  },

  async sendMessage(mode) {
    const inputId = mode === 'her' ? 'her-chat-input' : 'pro-chat-input';
    const input = document.getElementById(inputId);
    const content = input?.value.trim();
    
    if (!content || this.isTyping) return;
    
    // Ensure we're in the right mode
    this.currentMode = mode === 'her' ? 'her' : 'professional';
    
    // Initialize session if needed
    if (!this.currentSession) {
      await this.startNewSession();
    }
    
    // Add user message
    this.currentSession.messages.push({
      role: 'user',
      content,
      timestamp: Date.now()
    });
    
    input.value = '';
    input.style.height = 'auto';
    
    this.renderMessagesToContainer(mode);
    
    // Show typing indicator
    this.showTypingInContainer(mode);
    
    // Generate AI response
    try {
      const response = await this.generateResponse(content);
      
      this.currentSession.messages.push({
        role: 'assistant',
        content: response,
        timestamp: Date.now()
      });
      
      await this.saveSession();
    } catch (error) {
      console.error('AI Error:', error);
      this.currentSession.messages.push({
        role: 'assistant',
        content: this.currentMode === 'her' 
          ? 'Sorry yaar, kuch problem ho gayi... 😔 Thodi der baad try karo na?' 
          : 'I encountered an error processing your request. Please try again.',
        timestamp: Date.now(),
        error: true
      });
    }
    
    this.hideTypingFromContainer(mode);
    this.renderMessagesToContainer(mode);
  },
  
  showTypingInContainer(mode) {
    this.isTyping = true;
    const containerId = mode === 'her' ? 'her-chat-messages' : 'pro-chat-messages';
    const container = document.getElementById(containerId);
    
    const typingEl = document.createElement('div');
    typingEl.className = 'ps-message ps-message-ai ps-typing-indicator';
    typingEl.innerHTML = `
      <div class="ps-message-avatar">
        <span style="font-size: 16px;">${mode === 'her' ? '💕' : '⚡'}</span>
      </div>
      <div class="ps-message-content">
        <div class="ps-message-bubble" style="display: flex; gap: 4px; padding: 12px 16px;">
          <span class="ps-typing-dot"></span>
          <span class="ps-typing-dot"></span>
          <span class="ps-typing-dot"></span>
        </div>
      </div>
    `;
    container?.appendChild(typingEl);
    
    if (container) container.scrollTop = container.scrollHeight;
  },
  
  hideTypingFromContainer(mode) {
    this.isTyping = false;
    const containerId = mode === 'her' ? 'her-chat-messages' : 'pro-chat-messages';
    const container = document.getElementById(containerId);
    container?.querySelector('.ps-typing-indicator')?.remove();
  },
  
  // Training modal methods
  openTrainingModal() {
    document.getElementById('trainingModalOverlay')?.classList.add('active');
    this.loadTrainingList();
  },
  
  closeTrainingModal() {
    document.getElementById('trainingModalOverlay')?.classList.remove('active');
  },
  
  async loadTrainingList() {
    const list = document.getElementById('training-data-list');
    if (!list) return;
    
    await this.loadTrainingData();
    
    if (this.trainingData.length === 0) {
      list.innerHTML = '<p style="color: var(--ps-text-muted); text-align: center;">No training examples yet.</p>';
      return;
    }
    
    list.innerHTML = this.trainingData.map((item, idx) => `
      <div class="ps-training-item" style="padding: var(--ps-space-3); background: var(--ps-bg-tertiary); border-radius: var(--ps-radius-lg); margin-bottom: var(--ps-space-2); display: flex; justify-content: space-between; align-items: start; gap: var(--ps-space-3);">
        <div style="flex: 1; min-width: 0;">
          <p style="font-size: var(--ps-text-sm); color: var(--ps-text-primary); margin-bottom: var(--ps-space-1);"><strong>Input:</strong> ${item.input || ''}</p>
          <p style="font-size: var(--ps-text-sm); color: var(--ps-text-secondary);"><strong>Response:</strong> ${item.output || item.content || ''}</p>
        </div>
        <button class="ps-btn ps-btn-sm ps-btn-ghost" onclick="PSAISystem.deleteTrainingItem('${item.id}')" style="flex-shrink: 0;">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
        </button>
      </div>
    `).join('');
  },
  
  async addTrainingData() {
    const inputEl = document.getElementById('training-input');
    const outputEl = document.getElementById('training-output');
    
    const input = inputEl?.value.trim();
    const output = outputEl?.value.trim();
    
    if (!input || !output) {
      if (typeof PSToast !== 'undefined') PSToast.warning('Please fill both fields');
      return;
    }
    
    await PSDatabase.add(PSDatabase.STORES.HER_TRAINING, {
      id: crypto.randomUUID(),
      input,
      output,
      addedAt: Date.now()
    });
    
    inputEl.value = '';
    outputEl.value = '';
    
    await this.loadTrainingData();
    this.loadTrainingList();
    
    if (typeof PSToast !== 'undefined') PSToast.success('Training example added');
  },
  
  async deleteTrainingItem(id) {
    await PSDatabase.delete(PSDatabase.STORES.HER_TRAINING, id);
    await this.loadTrainingData();
    this.loadTrainingList();
    if (typeof PSToast !== 'undefined') PSToast.success('Training example removed');
  }
};

// Expose both names for compatibility
window.AISystem = AISystem;
window.PSAISystem = AISystem;

