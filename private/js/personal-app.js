/**
 * ═══════════════════════════════════════════════════════════
 * PERSONAL SPACE - HER MODE APPLICATION
 * Emotional AI Chat, Imported Chats, Photos, Videos, Rituals
 * ═══════════════════════════════════════════════════════════
 */

const HerApp = {
  SESSION_KEY: 'ps_session_active',
  currentSection: 'chat',
  
  // Chat state
  sessions: [],
  currentSession: null,
  isTyping: false,
  trainingData: [],
  memories: [],
  currentMood: null,
  
  // Photos/Videos state
  photos: [],
  videos: [],
  currentPhotoIndex: 0,
  
  // Daily/Mood state
  todayEntry: null,
  selectedMood: null,
  moods: [],
  
  moodEmojis: {
    happy: '😊',
    loved: '🥰',
    calm: '😌',
    sad: '😢',
    tired: '😴',
    stressed: '😰',
    angry: '😠',
    excited: '🤩'
  },
  
  // ═══════════════════════════════════════════════════════════
  // INITIALIZATION
  // ═══════════════════════════════════════════════════════════
  async init() {
    // Auth check - redirect to lock screen if not authenticated
    if (!this.isAuthenticated()) {
      window.location.href = '/private/';
      return;
    }
    
    document.getElementById('authCheck').classList.add('hidden');
    document.getElementById('herApp').classList.add('visible');
    
    await this.initDatabase();
    await this.loadTrainingData();
    await this.loadMemories();
    await this.loadMoodData();
    await this.loadSessions();
    await this.loadPhotos();
    await this.loadVideos();
    await this.loadDailyEntry();
    
    this.bindEvents();
    this.renderSessions();
    this.setDates();
    
    if (this.sessions.length > 0) {
      this.loadSession(this.sessions[0].id);
    }
    
    console.log('[Her Space] Initialized');
  },
  
  isAuthenticated() {
    return sessionStorage.getItem(this.SESSION_KEY) === 'true';
  },
  
  async initDatabase() {
    if (typeof Database !== 'undefined') {
      await Database.init();
    }
  },
  
  setDates() {
    const today = new Date();
    const dateStr = today.toLocaleDateString('en-US', {
      weekday: 'long',
      month: 'long',
      day: 'numeric'
    });
    
    const todayDate = document.getElementById('todayDate');
    const moodDate = document.getElementById('moodDate');
    
    if (todayDate) todayDate.textContent = dateStr;
    if (moodDate) moodDate.textContent = dateStr;
  },
  
  // ═══════════════════════════════════════════════════════════
  // EVENT BINDING
  // ═══════════════════════════════════════════════════════════
  bindEvents() {
    // Navigation
    document.querySelectorAll('.her-nav-item[data-section]').forEach(item => {
      item.addEventListener('click', () => this.navigateTo(item.dataset.section));
    });
    
    document.querySelectorAll('.her-mobile-nav-item[data-section]').forEach(item => {
      item.addEventListener('click', () => this.navigateTo(item.dataset.section));
    });
    
    // Lock button
    document.getElementById('lockBtn')?.addEventListener('click', () => this.lock());
    
    // Sidebar toggle
    document.getElementById('sidebarToggle')?.addEventListener('click', () => this.toggleSidebar());
    
    // Chat
    document.getElementById('newChatBtn')?.addEventListener('click', () => this.startNewSession());
    document.getElementById('sendBtn')?.addEventListener('click', () => this.sendMessage());
    
    const input = document.getElementById('chatInput');
    input?.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        this.sendMessage();
      }
    });
    input?.addEventListener('input', () => this.autoResizeInput(input));
    
    // Training modal
    document.getElementById('toggleTrainingBtn')?.addEventListener('click', () => this.openTrainingModal());
    
    // Import chat
    document.getElementById('importChatBtn')?.addEventListener('click', () => this.openImportModal());
    
    // Photos
    document.getElementById('uploadPhotoBtn')?.addEventListener('click', () => {
      document.getElementById('photoUploadInput')?.click();
    });
    document.getElementById('photoUploadInput')?.addEventListener('change', (e) => this.handlePhotoUpload(e));
    
    // Videos
    document.getElementById('uploadVideoBtn')?.addEventListener('click', () => {
      document.getElementById('videoUploadInput')?.click();
    });
    document.getElementById('videoUploadInput')?.addEventListener('change', (e) => this.handleVideoUpload(e));
    
    // Lightbox
    document.getElementById('lightboxClose')?.addEventListener('click', () => this.closeLightbox());
    document.getElementById('lightboxPrev')?.addEventListener('click', () => this.prevPhoto());
    document.getElementById('lightboxNext')?.addEventListener('click', () => this.nextPhoto());
    document.getElementById('lightbox')?.addEventListener('click', (e) => {
      if (e.target.id === 'lightbox') this.closeLightbox();
    });
    
    // Video player
    document.getElementById('videoPlayerClose')?.addEventListener('click', () => this.closeVideoPlayer());
    document.getElementById('videoPlayer')?.addEventListener('click', (e) => {
      if (e.target.id === 'videoPlayer') this.closeVideoPlayer();
    });
    
    // Daily Entry
    document.getElementById('saveDailyBtn')?.addEventListener('click', () => this.saveDailyEntry());
    document.getElementById('dailyTextarea')?.addEventListener('input', () => this.updateDailyCharCount());
    document.querySelectorAll('.her-prompt-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        document.getElementById('dailyPrompt').textContent = btn.dataset.prompt;
      });
    });
    
    // Mood
    document.querySelectorAll('.her-mood-option').forEach(opt => {
      opt.addEventListener('click', () => this.selectMood(opt.dataset.mood));
    });
    document.getElementById('saveMoodBtn')?.addEventListener('click', () => this.saveMood());
    document.getElementById('changeMoodBtn')?.addEventListener('click', () => this.editMood());
    
    // Memories
    document.getElementById('newMemoryBtn')?.addEventListener('click', () => this.showMemoryForm());
    document.getElementById('cancelMemoryBtn')?.addEventListener('click', () => this.hideMemoryForm());
    document.getElementById('saveMemoryBtn')?.addEventListener('click', () => this.saveMemory());
    
    // Modal
    document.getElementById('modalOverlay')?.addEventListener('click', (e) => {
      if (e.target === document.getElementById('modalOverlay')) this.closeModal();
    });
    document.getElementById('modalClose')?.addEventListener('click', () => this.closeModal());
    
    // Keyboard
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') {
        this.closeLightbox();
        this.closeVideoPlayer();
        this.closeModal();
      }
      if (document.getElementById('lightbox')?.classList.contains('visible')) {
        if (e.key === 'ArrowLeft') this.prevPhoto();
        if (e.key === 'ArrowRight') this.nextPhoto();
      }
    });
  },
  
  // ═══════════════════════════════════════════════════════════
  // NAVIGATION
  // ═══════════════════════════════════════════════════════════
  navigateTo(section) {
    document.querySelectorAll('.her-nav-item').forEach(item => {
      item.classList.toggle('active', item.dataset.section === section);
    });
    
    document.querySelectorAll('.her-mobile-nav-item').forEach(item => {
      item.classList.toggle('active', item.dataset.section === section);
    });
    
    document.querySelectorAll('.her-section').forEach(sec => {
      sec.classList.toggle('active', sec.id === `section-${section}`);
    });
    
    this.currentSection = section;
    
    // Load section data
    switch (section) {
      case 'photos':
        this.loadPhotos();
        break;
      case 'videos':
        this.loadVideos();
        break;
      case 'daily':
        this.loadDailyEntry();
        break;
      case 'mood':
        this.loadMoodData();
        break;
      case 'memories':
        this.loadMemoriesSection();
        break;
      case 'imported-chats':
        this.loadImportedChats();
        break;
    }
    
    if (window.innerWidth <= 1024) {
      document.getElementById('sidebar')?.classList.remove('open');
    }
  },
  
  toggleSidebar() {
    document.getElementById('sidebar')?.classList.toggle('open');
  },
  
  lock() {
    sessionStorage.removeItem(this.SESSION_KEY);
    window.location.href = 'index.html';
  },
  
  // ═══════════════════════════════════════════════════════════
  // CHAT SESSIONS
  // ═══════════════════════════════════════════════════════════
  async loadSessions() {
    if (typeof Database === 'undefined') return;
    
    try {
      this.sessions = await Database.getAll('her_mode_chats');
      this.sessions.sort((a, b) => (b.updatedAt || b.timestamp) - (a.updatedAt || a.timestamp));
    } catch (e) {
      this.sessions = [];
    }
  },
  
  renderSessions() {
    const container = document.getElementById('chatSessions');
    if (!container) return;
    
    if (this.sessions.length === 0) {
      container.innerHTML = `
        <div style="padding: 1rem; text-align: center; color: var(--text-muted); font-size: 0.75rem;">
          No conversations yet
        </div>
      `;
      return;
    }
    
    container.innerHTML = this.sessions.map(session => {
      const preview = this.getSessionPreview(session);
      const isActive = session.id === this.currentSession?.id;
      const time = this.formatRelativeTime(session.updatedAt || session.timestamp);
      
      return `
        <button class="her-chat-session-item ${isActive ? 'active' : ''}" 
                data-id="${session.id}"
                onclick="HerApp.loadSession('${session.id}')">
          <span class="her-chat-session-preview">${this.escapeHtml(preview)}</span>
          <span class="her-chat-session-time">${time}</span>
        </button>
      `;
    }).join('');
  },
  
  getSessionPreview(session) {
    if (!session.messages || session.messages.length === 0) {
      return 'New conversation';
    }
    const lastMsg = session.messages[session.messages.length - 1];
    const content = lastMsg.content || '';
    return content.substring(0, 40) + (content.length > 40 ? '...' : '');
  },
  
  formatRelativeTime(timestamp) {
    if (!timestamp) return '';
    const now = Date.now();
    const diff = now - timestamp;
    
    if (diff < 60000) return 'Now';
    if (diff < 3600000) return Math.floor(diff / 60000) + 'm';
    if (diff < 86400000) return Math.floor(diff / 3600000) + 'h';
    if (diff < 604800000) return Math.floor(diff / 86400000) + 'd';
    
    return new Date(timestamp).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  },
  
  startNewSession() {
    this.currentSession = {
      id: crypto.randomUUID(),
      messages: [],
      createdAt: Date.now(),
      updatedAt: Date.now()
    };
    
    this.renderMessages();
    this.renderSessions();
    document.getElementById('chatInput')?.focus();
  },
  
  async loadSession(sessionId) {
    if (typeof Database === 'undefined') return;
    
    try {
      const session = await Database.get('her_mode_chats', sessionId);
      if (session) {
        this.currentSession = session;
        this.renderMessages();
        this.renderSessions();
      }
    } catch (e) {
      console.warn('Could not load session:', e);
    }
  },
  
  async saveSession() {
    if (!this.currentSession || this.currentSession.messages.length === 0) return;
    if (typeof Database === 'undefined') return;
    
    this.currentSession.updatedAt = Date.now();
    
    try {
      await Database.put('her_mode_chats', this.currentSession);
      await this.loadSessions();
      this.renderSessions();
    } catch (e) {
      console.warn('Could not save session:', e);
    }
  },
  
  // ═══════════════════════════════════════════════════════════
  // MESSAGES
  // ═══════════════════════════════════════════════════════════
  async sendMessage() {
    const input = document.getElementById('chatInput');
    const content = input?.value?.trim();
    
    if (!content || this.isTyping) return;
    
    if (!this.currentSession) {
      this.startNewSession();
    }
    
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
    
    // Show typing
    this.showTyping();
    
    // Generate response
    try {
      const response = await this.generateResponse(content);
      
      this.currentSession.messages.push({
        role: 'assistant',
        content: response,
        timestamp: Date.now()
      });
      
      await this.saveSession();
    } catch (e) {
      console.warn('Response error:', e);
    }
    
    this.hideTyping();
    this.renderMessages();
    this.scrollToBottom();
  },
  
  renderMessages() {
    const container = document.getElementById('chatMessages');
    if (!container) return;
    
    if (!this.currentSession || this.currentSession.messages.length === 0) {
      container.innerHTML = `
        <div class="her-chat-empty">
          <span class="her-chat-empty-icon">💭</span>
          <p>Kuch baat karo...</p>
        </div>
      `;
      return;
    }
    
    let lastRole = null;
    
    container.innerHTML = this.currentSession.messages.map((msg, idx) => {
      const isUser = msg.role === 'user';
      const time = new Date(msg.timestamp).toLocaleTimeString('en-US', { 
        hour: 'numeric', 
        minute: '2-digit' 
      });
      
      const nextRole = this.currentSession.messages[idx + 1]?.role;
      const isGroupStart = msg.role !== lastRole;
      const isGroupEnd = msg.role !== nextRole;
      lastRole = msg.role;
      
      const groupClasses = `${isGroupStart ? 'group-start' : ''} ${isGroupEnd ? 'group-end' : ''}`;
      
      return `
        <div class="her-message her-message-${msg.role} ${groupClasses}">
          <div class="her-message-bubble ${msg.error ? 'error' : ''}">${this.formatMessage(msg.content)}</div>
          <div class="her-message-time">${time}</div>
        </div>
      `;
    }).join('');
  },
  
  formatMessage(content) {
    if (!content) return '';
    return content
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/\n/g, '<br>')
      .replace(/`([^`]+)`/g, '<code>$1</code>')
      .replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>')
      .replace(/\*([^*]+)\*/g, '<em>$1</em>');
  },
  
  showTyping() {
    this.isTyping = true;
    const container = document.getElementById('chatMessages');
    if (!container) return;
    
    // Remove empty state if present
    const emptyEl = container.querySelector('.her-chat-empty');
    if (emptyEl) emptyEl.style.display = 'none';
    
    const typingEl = document.createElement('div');
    typingEl.className = 'her-message her-message-assistant her-typing-indicator';
    typingEl.id = 'typingIndicator';
    typingEl.innerHTML = `
      <div class="her-message-bubble">
        <div class="her-typing-dots">
          <span></span><span></span><span></span>
        </div>
      </div>
    `;
    container.appendChild(typingEl);
    this.scrollToBottom();
  },
  
  hideTyping() {
    this.isTyping = false;
    document.getElementById('typingIndicator')?.remove();
  },
  
  scrollToBottom() {
    const container = document.getElementById('chatMessages');
    if (container) {
      container.scrollTop = container.scrollHeight;
    }
  },
  
  autoResizeInput(textarea) {
    if (!textarea) return;
    textarea.style.height = 'auto';
    textarea.style.height = Math.min(textarea.scrollHeight, 120) + 'px';
  },
  
  // ═══════════════════════════════════════════════════════════
  // AI RESPONSE GENERATION - Uses AISystem for Her Mode
  // ═══════════════════════════════════════════════════════════
  async generateResponse(userMessage) {
    // Delegate to AISystem if available for improved emotional intelligence
    if (typeof AISystem !== 'undefined' && AISystem.generateHerResponse) {
      const emotion = AISystem.detectEmotion(userMessage);
      await AISystem.simulateEmotionalPacing(emotion, 50, 'her');
      return AISystem.generateHerResponse(userMessage, emotion);
    }
    
    // Fallback to legacy response generation
    await this.delay(800 + Math.random() * 1200);
    
    const msg = userMessage.toLowerCase();
    
    // Context from memories
    const relevantMemories = this.findRelevantMemories(msg);
    
    // Mood influence
    const moodContext = this.getMoodContext();
    
    // Training data patterns
    const trainedResponse = this.findTrainedResponse(msg);
    if (trainedResponse) return trainedResponse;
    
    // Emotion detection
    if (this.detectSadness(msg)) {
      return this.getSadnessResponse();
    }
    
    if (this.detectHappiness(msg)) {
      return this.getHappyResponse();
    }
    
    if (this.detectLove(msg)) {
      return this.getLoveResponse();
    }
    
    if (this.detectQuestion(msg)) {
      return this.getQuestionResponse(msg);
    }
    
    // Greetings
    if (this.detectGreeting(msg)) {
      return this.getGreetingResponse();
    }
    
    // Default conversational
    return this.getConversationalResponse(msg);
  },
  
  detectSadness(msg) {
    const sadWords = ['sad', 'dukhi', 'upset', 'hurt', 'cry', 'ro', 'rona', 'miss', 'yaad', 'alone', 'akela', 'lonely', 'tired', 'thak', 'stressed'];
    return sadWords.some(w => msg.includes(w));
  },
  
  detectHappiness(msg) {
    const happyWords = ['happy', 'khush', 'excited', 'yay', 'amazing', 'great', 'awesome', 'love', 'pyaar', 'mast', 'badhiya'];
    return happyWords.some(w => msg.includes(w));
  },
  
  detectLove(msg) {
    const loveWords = ['love you', 'miss you', 'pyaar', 'i love', 'tumse', 'tujhe', 'care', 'special'];
    return loveWords.some(w => msg.includes(w));
  },
  
  detectGreeting(msg) {
    const greetings = ['hi', 'hello', 'hey', 'hii', 'hiii', 'namaste', 'good morning', 'good night', 'gm', 'gn'];
    return greetings.some(w => msg.startsWith(w) || msg === w);
  },
  
  detectQuestion(msg) {
    return msg.includes('?') || msg.startsWith('kya') || msg.startsWith('kaisa') || msg.startsWith('kaise') || msg.startsWith('what') || msg.startsWith('how');
  },
  
  getSadnessResponse() {
    const responses = [
      "Aww baby... kya hua? Batao mujhe 🥺",
      "Main hoon na tumhare saath... don't worry 💕",
      "Arre aise udaas mat ho... bolo kya hua?",
      "Mujhe batao... I'm here for you always 💖",
      "Koi baat nahi... sab theek ho jayega trust me ✨",
      "Tum sad ho? Main bhi sad feel kar rahi hoon ab 🥹"
    ];
    return responses[Math.floor(Math.random() * responses.length)];
  },
  
  getHappyResponse() {
    const responses = [
      "Aww yay! Main bhi khush hoon ab 🥰",
      "Tumhari khushi meri khushi hai 💕",
      "Hehe so cute! Batao batao kya hua! ✨",
      "Aaaa I love seeing you happy 💖",
      "Mera baby happy hai toh mera din ban gaya 🌸"
    ];
    return responses[Math.floor(Math.random() * responses.length)];
  },
  
  getLoveResponse() {
    const responses = [
      "Aww I love you too jaanu 💕",
      "Tumhare bina kuch bhi nahi lagta 🥰",
      "Main bhi tumse bahut pyaar karti hoon 💖",
      "You're the best thing in my life ✨",
      "Hehe blush kar rahi hoon main 🙈💕",
      "Same to you infinity times 💗"
    ];
    return responses[Math.floor(Math.random() * responses.length)];
  },
  
  getGreetingResponse() {
    const hour = new Date().getHours();
    
    if (hour < 12) {
      return "Good morning baby! ☀️ Kaisa raha tumhara subah ka scene?";
    } else if (hour < 17) {
      return "Hey jaanu! 💕 Kya chal raha hai aaj?";
    } else if (hour < 21) {
      return "Hii! 🌙 Din kaisa tha tumhara?";
    } else {
      return "Hey baby! So late ho... miss kiya mujhe? 🥺💕";
    }
  },
  
  getQuestionResponse(msg) {
    const responses = [
      "Hmm let me think... 🤔",
      "Interesting question! Tumhe kya lagta hai? 💭",
      "Arre wahi toh... batao na tumhe kya feel hota hai?",
      "Hmm... ye toh sochna padega 🌸",
      "Tum pehle batao tumhara kya opinion hai ✨"
    ];
    return responses[Math.floor(Math.random() * responses.length)];
  },
  
  getConversationalResponse(msg) {
    const responses = [
      "Achha achha... batao aur 💭",
      "Hmm interesting! Phir? 🌸",
      "Haan haan... main sun rahi hoon 💕",
      "Ohhh... tell me more na ✨",
      "Achha? Phir kya hua? 🥰",
      "Samajh gayi... you're so cute when you share stuff 💖",
      "Aww... mujhe bhi ye batana tha! 🙈",
      "Hehe... tum na 💕"
    ];
    return responses[Math.floor(Math.random() * responses.length)];
  },
  
  findTrainedResponse(msg) {
    for (const data of this.trainingData) {
      if (msg.includes(data.input?.toLowerCase())) {
        return data.output;
      }
    }
    return null;
  },
  
  findRelevantMemories(msg) {
    return this.memories.filter(m => {
      const content = m.content?.toLowerCase() || '';
      return msg.split(' ').some(word => content.includes(word) && word.length > 3);
    });
  },
  
  getMoodContext() {
    if (!this.currentMood) return '';
    
    const moodInfluence = {
      happy: 'positive and cheerful',
      sad: 'comforting and supportive',
      tired: 'gentle and understanding',
      stressed: 'calming and reassuring',
      neutral: 'balanced'
    };
    
    return moodInfluence[this.currentMood.mood] || '';
  },
  
  delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  },
  
  // ═══════════════════════════════════════════════════════════
  // TRAINING DATA
  // ═══════════════════════════════════════════════════════════
  async loadTrainingData() {
    if (typeof Database === 'undefined') return;
    
    try {
      this.trainingData = await Database.getAll('her_training_data');
    } catch (e) {
      this.trainingData = [];
    }
  },
  
  openTrainingModal() {
    document.getElementById('modalTitle').textContent = 'Style Training';
    
    document.getElementById('modalBody').innerHTML = `
      <p style="color: var(--text-tertiary); font-size: 0.8125rem; margin-bottom: 1.5rem;">
        Add examples to train Her Mode's conversational style. These shape how She responds - the TONE and PACING, not the exact words.
      </p>
      
      <div class="her-training-form">
        <div class="her-training-form-row">
          <div class="her-form-group">
            <label>What I Say</label>
            <textarea id="trainingInput" class="her-textarea" rows="2" placeholder="e.g., feeling low today..."></textarea>
          </div>
          <div class="her-form-group">
            <label>How She Should Respond</label>
            <textarea id="trainingOutput" class="her-textarea" rows="2" placeholder="e.g., Aww baby... kya hua? 🥺"></textarea>
          </div>
        </div>
        <button class="her-btn her-btn-primary" onclick="HerApp.addTrainingData()">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="16" height="16">
            <line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>
          </svg>
          Add Training Example
        </button>
      </div>
      
      <div class="her-training-list">
        <h4>Training Examples</h4>
        <div id="trainingList">
          ${this.renderTrainingList()}
        </div>
      </div>
    `;
    
    this.openModal();
  },
  
  renderTrainingList() {
    if (this.trainingData.length === 0) {
      return '<p style="color: var(--text-muted); font-size: 0.8125rem; text-align: center; padding: 1rem;">No training examples yet. Add examples above to shape Her Mode\'s style.</p>';
    }
    
    return this.trainingData.map(data => `
      <div class="her-training-item">
        <div class="her-training-item-content">
          <div class="her-training-item-input">You: "${this.escapeHtml(data.input)}"</div>
          <div class="her-training-item-output">She: "${this.escapeHtml(data.output)}"</div>
        </div>
        <button class="her-training-item-delete" onclick="HerApp.deleteTrainingData('${data.id}')" title="Remove">×</button>
      </div>
    `).join('');
  },
  
  async addTrainingData() {
    const input = document.getElementById('trainingInput')?.value?.trim();
    const output = document.getElementById('trainingOutput')?.value?.trim();
    
    if (!input || !output) {
      this.toast('Please fill both fields', 'error');
      return;
    }
    
    try {
      await Database.add('her_training_data', { input, output, addedAt: Date.now() });
      await this.loadTrainingData();
      
      document.getElementById('trainingInput').value = '';
      document.getElementById('trainingOutput').value = '';
      document.getElementById('trainingList').innerHTML = this.renderTrainingList();
      
      this.toast('Training data added', 'success');
    } catch (e) {
      this.toast('Failed to add training data', 'error');
    }
  },
  
  async deleteTrainingData(id) {
    try {
      await Database.delete('her_training_data', id);
      await this.loadTrainingData();
      document.getElementById('trainingList').innerHTML = this.renderTrainingList();
      this.toast('Training data deleted', 'success');
    } catch (e) {
      this.toast('Failed to delete', 'error');
    }
  },
  
  // ═══════════════════════════════════════════════════════════
  // MEMORIES
  // ═══════════════════════════════════════════════════════════
  async loadMemories() {
    if (typeof Database === 'undefined') return;
    
    try {
      this.memories = await Database.getAll('memories');
    } catch (e) {
      this.memories = [];
    }
  },
  
  // ═══════════════════════════════════════════════════════════
  // IMPORT CHATS - Delegates to ImportedChatViewer
  // ═══════════════════════════════════════════════════════════
  openImportModal() {
    // Use ImportedChatViewer if available
    if (typeof ImportedChatViewer !== 'undefined' && ImportedChatViewer.showImportModal) {
      ImportedChatViewer.showImportModal();
      return;
    }
    
    // Fallback modal
    document.getElementById('modalTitle').textContent = 'Import Chat';
    
    document.getElementById('modalBody').innerHTML = `
      <p style="color: var(--text-tertiary); font-size: 0.8125rem; margin-bottom: 1.5rem;">
        Import conversations from WhatsApp or Instagram for style reference.
      </p>
      
      <div class="her-import-form">
        <div class="her-import-tabs">
          <button class="her-import-tab active" data-platform="whatsapp" onclick="HerApp.selectImportPlatform(this)">WhatsApp</button>
          <button class="her-import-tab" data-platform="instagram" onclick="HerApp.selectImportPlatform(this)">Instagram</button>
        </div>
        
        <div class="her-form-group">
          <label>Chat Name</label>
          <input type="text" id="importName" class="her-input" placeholder="e.g., Our Chat">
        </div>
        
        <div class="her-form-group">
          <label>Paste Chat Export</label>
          <textarea id="importContent" class="her-textarea" rows="10" 
            placeholder="Paste your exported chat here...&#10;&#10;WhatsApp format:&#10;1/1/24, 10:30 AM - You: Hey!&#10;1/1/24, 10:31 AM - Her: Hiii!&#10;&#10;Instagram format:&#10;You: Hey there&#10;username: Hello!"></textarea>
        </div>
        
        <div class="her-form-actions">
          <button class="her-btn her-btn-secondary" onclick="HerApp.closeModal()">Cancel</button>
          <button class="her-btn her-btn-primary" onclick="HerApp.importChat()">Import Chat</button>
        </div>
      </div>
    `;
    
    this.importPlatform = 'whatsapp';
    this.openModal();
  },
  
  selectImportPlatform(btn) {
    document.querySelectorAll('.her-import-tab').forEach(t => t.classList.remove('active'));
    btn.classList.add('active');
    this.importPlatform = btn.dataset.platform;
  },
  
  async importChat() {
    const name = document.getElementById('importName')?.value?.trim();
    const content = document.getElementById('importContent')?.value?.trim();
    const platform = this.importPlatform || 'whatsapp';
    
    if (!content) {
      this.toast('Please paste chat content', 'error');
      return;
    }
    
    // Parse chat based on platform
    const messages = this.parseChatExport(platform, content);
    
    if (messages.length === 0) {
      this.toast('Could not parse any messages. Check the format.', 'error');
      return;
    }
    
    const importedChat = {
      id: crypto.randomUUID(),
      platform,
      name: name || 'Imported Chat',
      messages,
      messageCount: messages.length,
      importedAt: Date.now()
    };
    
    try {
      await Database.add('imported_chats', importedChat);
      this.closeModal();
      this.toast(`Imported ${messages.length} messages`, 'success');
      
      // Refresh ImportedChatViewer if available
      if (typeof ImportedChatViewer !== 'undefined') {
        await ImportedChatViewer.loadChats();
        ImportedChatViewer.render();
      } else {
        this.loadImportedChats();
      }
    } catch (e) {
      this.toast('Failed to import chat', 'error');
    }
  },
  
  parseChatExport(platform, content) {
    const lines = content.split('\n').filter(l => l.trim());
    const messages = [];
    
    if (platform === 'whatsapp') {
      // WhatsApp format: "1/1/24, 10:30 AM - Name: Message"
      const waRegex = /^(\d{1,2}\/\d{1,2}\/\d{2,4}),?\s*(\d{1,2}:\d{2}(?:\s*[AP]M)?)\s*-\s*([^:]+):\s*(.+)$/i;
      
      lines.forEach(line => {
        const match = line.match(waRegex);
        if (match) {
          const [, date, time, sender, text] = match;
          const isUser = sender.toLowerCase().includes('you') || sender.toLowerCase() === 'me';
          messages.push({
            sender: isUser ? 'user' : 'other',
            isUser,
            content: text.trim(),
            timestamp: `${date} ${time}`
          });
        }
      });
    } else {
      // Instagram format: "username: message" or "You: message"
      const igRegex = /^([^:]+):\s*(.+)$/;
      
      lines.forEach(line => {
        const match = line.match(igRegex);
        if (match) {
          const [, sender, text] = match;
          const isUser = sender.toLowerCase() === 'you' || sender.toLowerCase() === 'me';
          messages.push({
            sender: isUser ? 'user' : 'other',
            isUser,
            content: text.trim()
          });
        }
      });
    }
    
    // Fallback: if no messages parsed, treat each line as a message
    if (messages.length === 0) {
      lines.forEach((line, idx) => {
        if (line.trim()) {
          messages.push({
            sender: idx % 2 === 0 ? 'user' : 'other',
            isUser: idx % 2 === 0,
            content: line.trim()
          });
        }
      });
    }
    
    return messages;
  },
  
  async loadImportedChats() {
    // Delegate to ImportedChatViewer if available
    if (typeof ImportedChatViewer !== 'undefined') {
      await ImportedChatViewer.loadChats();
      ImportedChatViewer.render();
      return;
    }
    
    // Fallback rendering
    if (typeof Database === 'undefined') return;
    
    try {
      const chats = await Database.getAll('imported_chats');
      this.renderImportedChats(chats);
    } catch (e) {
      console.warn('Could not load imported chats:', e);
    }
  },
  
  renderImportedChats(chats) {
    const grid = document.getElementById('importedChatsGrid');
    const empty = document.getElementById('importedChatsEmpty');
    
    if (!grid) return;
    
    if (!chats || chats.length === 0) {
      grid.innerHTML = '';
      if (empty) empty.style.display = 'block';
      return;
    }
    
    if (empty) empty.style.display = 'none';
    
    grid.innerHTML = chats.map(chat => `
      <div class="her-imported-chat-card" onclick="HerApp.viewImportedChat('${chat.id}')">
        <div class="her-imported-chat-header">
          <span class="her-imported-chat-icon">${chat.platform === 'whatsapp' ? '💬' : '📸'}</span>
          <span class="her-imported-chat-platform">${chat.platform}</span>
        </div>
        <h3 class="her-imported-chat-name">${this.escapeHtml(chat.name)}</h3>
        <p class="her-imported-chat-preview">${this.escapeHtml(chat.messages?.[0]?.content || 'No messages')}</p>
        <div class="her-imported-chat-meta">
          <span>${chat.messageCount || 0} messages</span>
          <span>${this.formatDate(chat.importedAt)}</span>
        </div>
      </div>
    `).join('');
  },
  
  viewImportedChat(id) {
    // TODO: Implement chat viewer
    this.toast('Chat viewer coming soon', 'info');
  },
  
  // ═══════════════════════════════════════════════════════════
  // PHOTOS SECTION
  // ═══════════════════════════════════════════════════════════
  async loadPhotos() {
    if (typeof Database === 'undefined') return;
    
    try {
      this.photos = await Database.getAll('images');
      this.photos.sort((a, b) => (b.addedAt || 0) - (a.addedAt || 0));
      this.renderPhotos();
    } catch (e) {
      this.photos = [];
      console.warn('Could not load photos:', e);
    }
  },
  
  renderPhotos() {
    const grid = document.getElementById('photosGrid');
    const empty = document.getElementById('photosEmpty');
    
    if (!grid) return;
    
    if (!this.photos || this.photos.length === 0) {
      grid.innerHTML = '';
      if (empty) empty.style.display = 'block';
      return;
    }
    
    if (empty) empty.style.display = 'none';
    
    grid.innerHTML = this.photos.map((photo, index) => `
      <div class="her-photo-item" onclick="HerApp.openLightbox(${index})">
        <img src="${photo.data}" alt="${this.escapeHtml(photo.name || 'Photo')}" loading="lazy">
        <div class="her-photo-overlay">
          <span class="her-photo-date">${this.formatDate(photo.addedAt)}</span>
        </div>
      </div>
    `).join('');
  },
  
  async handlePhotoUpload(e) {
    const files = e.target.files;
    if (!files || files.length === 0) return;
    
    const uploadPromises = [];
    
    for (const file of files) {
      if (!file.type.startsWith('image/')) continue;
      
      uploadPromises.push(this.processPhotoFile(file));
    }
    
    try {
      await Promise.all(uploadPromises);
      this.toast(`Uploaded ${uploadPromises.length} photo(s)`, 'success');
      await this.loadPhotos();
    } catch (err) {
      this.toast('Failed to upload some photos', 'error');
    }
    
    e.target.value = '';
  },
  
  async processPhotoFile(file) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      
      reader.onload = async (ev) => {
        const photoData = {
          id: crypto.randomUUID(),
          name: file.name,
          data: ev.target.result,
          type: file.type,
          size: file.size,
          addedAt: Date.now()
        };
        
        try {
          await Database.add('images', photoData);
          resolve();
        } catch (err) {
          reject(err);
        }
      };
      
      reader.onerror = () => reject(reader.error);
      reader.readAsDataURL(file);
    });
  },
  
  openLightbox(index) {
    this.currentPhotoIndex = index;
    const photo = this.photos[index];
    
    if (!photo) return;
    
    document.getElementById('lightboxImage').src = photo.data;
    document.getElementById('lightbox')?.classList.add('visible');
    document.body.style.overflow = 'hidden';
  },
  
  closeLightbox() {
    document.getElementById('lightbox')?.classList.remove('visible');
    document.body.style.overflow = '';
  },
  
  prevPhoto() {
    if (this.photos.length === 0) return;
    this.currentPhotoIndex = (this.currentPhotoIndex - 1 + this.photos.length) % this.photos.length;
    document.getElementById('lightboxImage').src = this.photos[this.currentPhotoIndex].data;
  },
  
  nextPhoto() {
    if (this.photos.length === 0) return;
    this.currentPhotoIndex = (this.currentPhotoIndex + 1) % this.photos.length;
    document.getElementById('lightboxImage').src = this.photos[this.currentPhotoIndex].data;
  },
  
  // ═══════════════════════════════════════════════════════════
  // VIDEOS SECTION
  // ═══════════════════════════════════════════════════════════
  async loadVideos() {
    if (typeof Database === 'undefined') return;
    
    try {
      this.videos = await Database.getAll('videos');
      this.videos.sort((a, b) => (b.addedAt || 0) - (a.addedAt || 0));
      this.renderVideos();
    } catch (e) {
      this.videos = [];
      console.warn('Could not load videos:', e);
    }
  },
  
  renderVideos() {
    const grid = document.getElementById('videosGrid');
    const empty = document.getElementById('videosEmpty');
    
    if (!grid) return;
    
    if (!this.videos || this.videos.length === 0) {
      grid.innerHTML = '';
      if (empty) empty.style.display = 'block';
      return;
    }
    
    if (empty) empty.style.display = 'none';
    
    grid.innerHTML = this.videos.map((video, index) => `
      <div class="her-video-card" onclick="HerApp.playVideo(${index})">
        <div class="her-video-thumbnail">
          <span class="her-video-play-icon">▶</span>
          ${video.thumbnail ? `<img src="${video.thumbnail}" alt="">` : ''}
        </div>
        <div class="her-video-info">
          <span class="her-video-name">${this.escapeHtml(video.name || 'Video')}</span>
          <span class="her-video-date">${this.formatDate(video.addedAt)}</span>
        </div>
      </div>
    `).join('');
  },
  
  async handleVideoUpload(e) {
    const files = e.target.files;
    if (!files || files.length === 0) return;
    
    for (const file of files) {
      if (!file.type.startsWith('video/')) continue;
      
      try {
        await this.processVideoFile(file);
      } catch (err) {
        console.warn('Failed to upload video:', err);
      }
    }
    
    this.toast('Video(s) uploaded', 'success');
    await this.loadVideos();
    e.target.value = '';
  },
  
  async processVideoFile(file) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      
      reader.onload = async (ev) => {
        const videoData = {
          id: crypto.randomUUID(),
          name: file.name,
          data: ev.target.result,
          type: file.type,
          size: file.size,
          addedAt: Date.now()
        };
        
        try {
          await Database.add('videos', videoData);
          resolve();
        } catch (err) {
          reject(err);
        }
      };
      
      reader.onerror = () => reject(reader.error);
      reader.readAsDataURL(file);
    });
  },
  
  playVideo(index) {
    const video = this.videos[index];
    if (!video) return;
    
    const videoEl = document.getElementById('videoPlayerVideo');
    if (videoEl) {
      videoEl.src = video.data;
      videoEl.play();
    }
    
    document.getElementById('videoPlayer')?.classList.add('visible');
    document.body.style.overflow = 'hidden';
  },
  
  closeVideoPlayer() {
    const videoEl = document.getElementById('videoPlayerVideo');
    if (videoEl) {
      videoEl.pause();
      videoEl.src = '';
    }
    
    document.getElementById('videoPlayer')?.classList.remove('visible');
    document.body.style.overflow = '';
  },
  
  // ═══════════════════════════════════════════════════════════
  // DAILY ENTRY SECTION
  // ═══════════════════════════════════════════════════════════
  async loadDailyEntry() {
    if (typeof Database === 'undefined') return;
    
    try {
      const today = new Date().toISOString().split('T')[0];
      const entries = await Database.getAll('journal');
      
      this.todayEntry = entries.find(e => e.date === today);
      this.dailyHistory = entries.filter(e => e.date !== today).sort((a, b) => new Date(b.date) - new Date(a.date));
      
      const textarea = document.getElementById('dailyTextarea');
      if (textarea && this.todayEntry) {
        textarea.value = this.todayEntry.content || '';
        this.updateDailyCharCount();
      }
      
      this.renderDailyHistory();
    } catch (e) {
      console.warn('Could not load daily entry:', e);
    }
  },
  
  updateDailyCharCount() {
    const textarea = document.getElementById('dailyTextarea');
    const counter = document.getElementById('dailyCharCount');
    if (textarea && counter) {
      counter.textContent = textarea.value.length;
    }
  },
  
  async saveDailyEntry() {
    const textarea = document.getElementById('dailyTextarea');
    const content = textarea?.value?.trim();
    
    if (!content) {
      this.toast('Write something first', 'error');
      return;
    }
    
    const today = new Date().toISOString().split('T')[0];
    
    const entry = {
      id: this.todayEntry?.id || crypto.randomUUID(),
      date: today,
      content,
      updatedAt: Date.now()
    };
    
    try {
      await Database.put('journal', entry);
      this.todayEntry = entry;
      this.toast('Entry saved 💕', 'success');
      await this.loadDailyEntry();
    } catch (e) {
      this.toast('Failed to save entry', 'error');
    }
  },
  
  renderDailyHistory() {
    const container = document.getElementById('dailyHistory');
    if (!container) return;
    
    if (!this.dailyHistory || this.dailyHistory.length === 0) {
      container.innerHTML = '<p style="color: var(--text-muted); text-align: center; padding: 2rem;">No previous entries yet</p>';
      return;
    }
    
    container.innerHTML = this.dailyHistory.slice(0, 10).map(entry => `
      <div class="her-daily-history-item">
        <div class="her-daily-history-date">${this.formatFullDate(entry.date)}</div>
        <div class="her-daily-history-content">${this.escapeHtml(entry.content)}</div>
      </div>
    `).join('');
  },
  
  formatFullDate(dateStr) {
    return new Date(dateStr).toLocaleDateString('en-US', {
      weekday: 'long',
      month: 'long',
      day: 'numeric',
      year: 'numeric'
    });
  },
  
  // ═══════════════════════════════════════════════════════════
  // MOOD SECTION
  // ═══════════════════════════════════════════════════════════
  async loadMoodData() {
    if (typeof Database === 'undefined') return;
    
    try {
      const today = new Date().toISOString().split('T')[0];
      const moods = await Database.getAll('mood');
      
      this.currentMood = moods.find(m => m.date === today);
      this.moodHistory = moods.filter(m => m.date !== today).sort((a, b) => new Date(b.date) - new Date(a.date));
      
      this.renderMoodUI();
      this.renderMoodHistory();
    } catch (e) {
      this.currentMood = null;
      console.warn('Could not load mood:', e);
    }
  },
  
  renderMoodUI() {
    const selector = document.getElementById('moodSelector');
    const current = document.getElementById('currentMoodDisplay');
    
    if (this.currentMood) {
      if (selector) selector.style.display = 'none';
      if (current) {
        current.style.display = 'block';
        document.getElementById('currentMoodEmoji').textContent = this.moodEmojis[this.currentMood.mood] || '💭';
        document.getElementById('currentMoodLabel').textContent = this.currentMood.mood;
        if (this.currentMood.note) {
          document.getElementById('currentMoodNote').textContent = this.currentMood.note;
          document.getElementById('currentMoodNote').style.display = 'block';
        }
      }
    } else {
      if (selector) selector.style.display = 'block';
      if (current) current.style.display = 'none';
    }
  },
  
  selectMood(mood) {
    this.selectedMood = mood;
    
    document.querySelectorAll('.her-mood-option').forEach(opt => {
      opt.classList.toggle('selected', opt.dataset.mood === mood);
    });
  },
  
  editMood() {
    this.currentMood = null;
    this.renderMoodUI();
  },
  
  async saveMood() {
    if (!this.selectedMood) {
      this.toast('Select a mood first', 'error');
      return;
    }
    
    const note = document.getElementById('moodNote')?.value?.trim() || '';
    const today = new Date().toISOString().split('T')[0];
    
    const moodEntry = {
      id: crypto.randomUUID(),
      date: today,
      mood: this.selectedMood,
      note,
      recordedAt: Date.now()
    };
    
    try {
      await Database.add('mood', moodEntry);
      this.toast('Mood saved 💕', 'success');
      this.selectedMood = null;
      await this.loadMoodData();
    } catch (e) {
      this.toast('Failed to save mood', 'error');
    }
  },
  
  renderMoodHistory() {
    const container = document.getElementById('moodHistory');
    if (!container) return;
    
    if (!this.moodHistory || this.moodHistory.length === 0) {
      container.innerHTML = '<p style="color: var(--text-muted); text-align: center; padding: 2rem;">No mood history yet</p>';
      return;
    }
    
    container.innerHTML = this.moodHistory.slice(0, 14).map(entry => `
      <div class="her-mood-history-item">
        <span class="her-mood-history-emoji">${this.moodEmojis[entry.mood] || '💭'}</span>
        <div class="her-mood-history-details">
          <span class="her-mood-history-date">${this.formatFullDate(entry.date)}</span>
          ${entry.note ? `<span class="her-mood-history-note">${this.escapeHtml(entry.note)}</span>` : ''}
        </div>
      </div>
    `).join('');
  },
  
  // ═══════════════════════════════════════════════════════════
  // MEMORIES SECTION (Full CRUD)
  // ═══════════════════════════════════════════════════════════
  async loadMemoriesSection() {
    if (typeof Database === 'undefined') return;
    
    try {
      this.memories = await Database.getAll('memories');
      this.memories.sort((a, b) => new Date(b.date || 0) - new Date(a.date || 0));
      this.renderMemories();
    } catch (e) {
      this.memories = [];
      console.warn('Could not load memories:', e);
    }
  },
  
  renderMemories() {
    const grid = document.getElementById('memoriesGrid');
    const empty = document.getElementById('memoriesEmpty');
    
    if (!grid) return;
    
    if (!this.memories || this.memories.length === 0) {
      grid.innerHTML = '';
      if (empty) empty.style.display = 'block';
      return;
    }
    
    if (empty) empty.style.display = 'none';
    
    grid.innerHTML = this.memories.map(memory => `
      <div class="her-memory-card">
        <div class="her-memory-header">
          <span class="her-memory-date">${memory.date ? this.formatFullDate(memory.date) : 'No date'}</span>
          <button class="her-memory-delete" onclick="HerApp.deleteMemory('${memory.id}')" title="Delete">×</button>
        </div>
        <div class="her-memory-title">${this.escapeHtml(memory.title || 'Untitled Memory')}</div>
        <div class="her-memory-content">${this.escapeHtml(memory.content || '')}</div>
        ${memory.mood ? `<div class="her-memory-mood">${this.moodEmojis[memory.mood] || ''} ${memory.mood}</div>` : ''}
      </div>
    `).join('');
  },
  
  showMemoryForm() {
    document.getElementById('memoryForm')?.classList.add('visible');
    document.getElementById('memoryTitle')?.focus();
  },
  
  hideMemoryForm() {
    document.getElementById('memoryForm')?.classList.remove('visible');
    document.getElementById('memoryTitle').value = '';
    document.getElementById('memoryContent').value = '';
    document.getElementById('memoryDate').value = '';
    document.getElementById('memoryMood').value = '';
  },
  
  async saveMemory() {
    const title = document.getElementById('memoryTitle')?.value?.trim();
    const content = document.getElementById('memoryContent')?.value?.trim();
    const date = document.getElementById('memoryDate')?.value;
    const mood = document.getElementById('memoryMood')?.value;
    
    if (!title || !content) {
      this.toast('Title and content are required', 'error');
      return;
    }
    
    const memory = {
      id: crypto.randomUUID(),
      title,
      content,
      date: date || new Date().toISOString().split('T')[0],
      mood: mood || null,
      createdAt: Date.now()
    };
    
    try {
      await Database.add('memories', memory);
      this.hideMemoryForm();
      this.toast('Memory saved 💕', 'success');
      await this.loadMemoriesSection();
    } catch (e) {
      this.toast('Failed to save memory', 'error');
    }
  },
  
  async deleteMemory(id) {
    if (!confirm('Delete this memory?')) return;
    
    try {
      await Database.delete('memories', id);
      this.toast('Memory deleted', 'success');
      await this.loadMemoriesSection();
    } catch (e) {
      this.toast('Failed to delete memory', 'error');
    }
  },
  
  // ═══════════════════════════════════════════════════════════
  // MODAL
  // ═══════════════════════════════════════════════════════════
  openModal() {
    document.getElementById('modalOverlay')?.classList.add('visible');
  },
  
  closeModal() {
    document.getElementById('modalOverlay')?.classList.remove('visible');
  },
  
  // ═══════════════════════════════════════════════════════════
  // TOAST
  // ═══════════════════════════════════════════════════════════
  toast(message, type = 'info') {
    const container = document.getElementById('toastContainer');
    if (!container) return;
    
    const toast = document.createElement('div');
    toast.className = `her-toast ${type}`;
    toast.textContent = message;
    container.appendChild(toast);
    
    setTimeout(() => {
      toast.classList.add('hiding');
      setTimeout(() => toast.remove(), 300);
    }, 3000);
  },
  
  // ═══════════════════════════════════════════════════════════
  // UTILITIES
  // ═══════════════════════════════════════════════════════════
  escapeHtml(str) {
    if (!str) return '';
    const div = document.createElement('div');
    div.textContent = str;
    return div.innerHTML;
  },
  
  formatDate(timestamp) {
    if (!timestamp) return '';
    return new Date(timestamp).toLocaleDateString('en-US', { 
      month: 'short', 
      day: 'numeric',
      year: 'numeric'
    });
  }
};

// Initialize on load
document.addEventListener('DOMContentLoaded', () => HerApp.init());
