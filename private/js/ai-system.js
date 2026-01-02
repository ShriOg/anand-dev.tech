/**
 * ═══════════════════════════════════════════════════════════
 * PRIVATE SPACE - HER MODE AI SYSTEM
 * Style-Trained Emotional Intelligence with Hinglish Support
 * ═══════════════════════════════════════════════════════════
 * 
 * SYSTEM INSTRUCTION (MANDATORY):
 * "You are Her Mode.
 *  You speak in Hinglish.
 *  You respond emotionally first.
 *  You are warm, attentive, and present.
 *  You keep replies short, natural, and human.
 *  You never sound professional or assistant-like.
 *  You respect emotional boundaries."
 * ═══════════════════════════════════════════════════════════
 */

const AISystem = {
  // Separate state for each mode
  sessions: { her: [], pro: [] },
  currentSession: { her: null, pro: null },
  trainingData: [],
  stylePatterns: [],
  isTyping: false,
  currentUserMood: null,
  
  // Her Mode System Instruction - OVERRIDES all default behavior
  HER_SYSTEM_PROMPT: `You are Her Mode.
You speak in Hinglish (Hindi + English mix).
You respond emotionally first, content later.
You are warm, attentive, present, caring, and slightly playful.
You keep replies short, natural, and human.
You never sound professional or assistant-like.
You respect emotional boundaries.
You use max 1 emoji per message from: 💗 🥺 👀 ✨ 🌸
You NEVER use: "How can I help you?", "Please provide details", therapist tone, or professional phrases.`,

  // Allowed emojis for Her Mode
  ALLOWED_EMOJIS: ['💗', '🥺', '👀', '✨', '🌸', '💕', '😊', '😔', '🤔', '💭', '🌙'],
  
  // Mode configurations with new element IDs
  modes: {
    her: {
      name: 'Her',
      icon: '💕',
      store: 'her_mode_chats',
      messagesEl: 'herChatMessages',
      inputEl: 'herChatInput',
      sendBtn: 'herSendBtn',
      sessionsEl: 'herSessionsList'
    },
    pro: {
      name: 'Professional',
      icon: '⚡',
      store: 'professional_mode_chats',
      messagesEl: 'proChatMessages',
      inputEl: 'proChatInput',
      sendBtn: 'proSendBtn',
      sessionsEl: 'proSessionsList'
    }
  },
  
  // ═══════════════════════════════════
  // INITIALIZATION
  // ═══════════════════════════════════
  async init() {
    if (typeof PSDatabase !== 'undefined') {
      await PSDatabase.init();
    }
    
    await this.loadTrainingData();
    await this.loadStylePatterns();
    
    // Initialize both modes independently
    await this.initMode('her');
    await this.initMode('pro');
    
    this.bindEvents();
    this.bindPersonalChatEvents();
    
    // Set initial mode attribute for CSS
    document.documentElement.setAttribute('data-ai-mode', 'her');
    
    console.log('[AI System] Initialized with style-trained emotional intelligence');
  },
  
  async loadStylePatterns() {
    // Load learned style patterns from training data
    if (typeof PSDatabase !== 'undefined') {
      try {
        const patterns = await PSDatabase.getAll('style_patterns');
        this.stylePatterns = patterns || [];
      } catch (e) {
        this.stylePatterns = [];
      }
    }
  },
  
  async initMode(mode) {
    await this.loadSessions(mode);
    this.renderSessionsList(mode);
    
    // Load most recent session or start new one
    if (this.sessions[mode].length > 0) {
      await this.loadSession(mode, this.sessions[mode][0].id);
    } else {
      this.startNewSession(mode);
    }
  },
  
  bindEvents() {
    // Her Mode events
    const herInput = document.getElementById('herChatInput');
    const herSend = document.getElementById('herSendBtn');
    
    herSend?.addEventListener('click', () => this.sendMessage('her'));
    herInput?.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        this.sendMessage('her');
      }
    });
    herInput?.addEventListener('input', () => this.autoResize(herInput));
    
    // Pro Mode events
    const proInput = document.getElementById('proChatInput');
    const proSend = document.getElementById('proSendBtn');
    
    proSend?.addEventListener('click', () => this.sendMessage('pro'));
    proInput?.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        this.sendMessage('pro');
      }
    });
    proInput?.addEventListener('input', () => this.autoResize(proInput));
  },
  
  // Bind events specific to personal.html chat interface
  bindPersonalChatEvents() {
    const chatInput = document.getElementById('chatInput');
    const sendBtn = document.getElementById('sendBtn');
    const chatMessages = document.getElementById('chatMessages');
    const chatSessions = document.getElementById('chatSessions');
    const newChatBtn = document.getElementById('newChatBtn');
    const toggleTrainingBtn = document.getElementById('toggleTrainingBtn');
    
    // Send message
    sendBtn?.addEventListener('click', () => this.sendPersonalMessage());
    chatInput?.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        this.sendPersonalMessage();
      }
    });
    chatInput?.addEventListener('input', () => this.autoResize(chatInput));
    
    // New chat
    newChatBtn?.addEventListener('click', () => {
      this.startNewSession('her');
      this.renderPersonalChat();
      this.renderPersonalSessions();
    });
    
    // Training modal
    toggleTrainingBtn?.addEventListener('click', () => this.openTrainingModal());
    
    // Initial render if elements exist
    if (chatMessages) {
      this.renderPersonalChat();
      this.renderPersonalSessions();
    }
  },
  
  autoResize(textarea) {
    if (!textarea) return;
    textarea.style.height = 'auto';
    textarea.style.height = Math.min(textarea.scrollHeight, 140) + 'px';
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
  
  // ═══════════════════════════════════
  // SESSION MANAGEMENT (Per Mode)
  // ═══════════════════════════════════
  async loadSessions(mode) {
    if (typeof PSDatabase === 'undefined') return;
    
    const store = this.modes[mode].store;
    try {
      this.sessions[mode] = await PSDatabase.getAll(store);
      this.sessions[mode].sort((a, b) => (b.updatedAt || b.timestamp) - (a.updatedAt || a.timestamp));
    } catch (e) {
      this.sessions[mode] = [];
    }
  },
  
  renderSessionsList(mode) {
    const container = document.getElementById(this.modes[mode].sessionsEl);
    if (!container) return;
    
    if (this.sessions[mode].length === 0) {
      container.innerHTML = `
        <div class="ps-chat-sessions-empty">
          <p style="color: var(--ps-text-muted); font-size: 12px; text-align: center; padding: 16px;">No conversations yet</p>
        </div>
      `;
      return;
    }
    
    container.innerHTML = this.sessions[mode].slice(0, 15).map(session => {
      const preview = this.getSessionPreview(session);
      const isActive = session.id === this.currentSession[mode]?.id;
      const time = this.formatRelativeTime(session.updatedAt || session.timestamp);
      
      return `
        <button class="ps-chat-session-item ${isActive ? 'active' : ''}" 
                data-id="${session.id}" data-mode="${mode}">
          <span class="ps-chat-session-preview">${preview}</span>
          <span class="ps-chat-session-time">${time}</span>
        </button>
      `;
    }).join('');
    
    // Bind click events
    container.querySelectorAll('.ps-chat-session-item').forEach(item => {
      item.addEventListener('click', () => {
        this.loadSession(item.dataset.mode, item.dataset.id);
      });
    });
  },
  
  getSessionPreview(session) {
    if (!session.messages || session.messages.length === 0) {
      return 'New conversation';
    }
    const lastMsg = session.messages[session.messages.length - 1];
    const content = lastMsg.content || '';
    return content.substring(0, 35) + (content.length > 35 ? '...' : '');
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
  
  startNewSession(mode) {
    this.currentSession[mode] = {
      id: crypto.randomUUID(),
      mode: mode,
      messages: [],
      createdAt: Date.now(),
      updatedAt: Date.now()
    };
    
    this.renderMessages(mode);
    this.renderSessionsList(mode);
    
    // Focus input
    const input = document.getElementById(this.modes[mode].inputEl);
    input?.focus();
  },
  
  async loadSession(mode, sessionId) {
    if (typeof PSDatabase === 'undefined') return;
    
    const store = this.modes[mode].store;
    try {
      const session = await PSDatabase.get(store, sessionId);
      if (session) {
        this.currentSession[mode] = session;
        this.renderMessages(mode);
        this.renderSessionsList(mode);
      }
    } catch (e) {
      console.warn('Could not load session:', e);
    }
  },
  
  async saveSession(mode) {
    if (!this.currentSession[mode] || this.currentSession[mode].messages.length === 0) return;
    if (typeof PSDatabase === 'undefined') return;
    
    this.currentSession[mode].updatedAt = Date.now();
    
    const store = this.modes[mode].store;
    try {
      await PSDatabase.put(store, this.currentSession[mode]);
      await this.loadSessions(mode);
      this.renderSessionsList(mode);
    } catch (e) {
      console.warn('Could not save session:', e);
    }
  },
  
  async deleteSession(mode, sessionId) {
    if (typeof PSDatabase === 'undefined') return;
    
    const store = this.modes[mode].store;
    try {
      await PSDatabase.delete(store, sessionId);
      await this.loadSessions(mode);
      
      if (this.currentSession[mode]?.id === sessionId) {
        if (this.sessions[mode].length > 0) {
          await this.loadSession(mode, this.sessions[mode][0].id);
        } else {
          this.startNewSession(mode);
        }
      } else {
        this.renderSessionsList(mode);
      }
      
      if (typeof PSToast !== 'undefined') PSToast.success('Conversation deleted');
    } catch (e) {
      console.warn('Could not delete session:', e);
    }
  },
  
  // ═══════════════════════════════════
  // MESSAGE HANDLING
  // ═══════════════════════════════════
  async sendMessage(mode) {
    const input = document.getElementById(this.modes[mode].inputEl);
    const content = input?.value.trim();
    
    if (!content || this.isTyping) return;
    
    // Initialize session if needed
    if (!this.currentSession[mode]) {
      this.startNewSession(mode);
    }
    
    // Add user message
    this.currentSession[mode].messages.push({
      role: 'user',
      content,
      timestamp: Date.now()
    });
    
    input.value = '';
    input.style.height = 'auto';
    
    this.renderMessages(mode);
    this.scrollToBottom(mode);
    
    // Show typing indicator
    this.showTyping(mode);
    
    // Generate AI response with conversational intelligence
    try {
      const response = await this.generateResponse(mode, content);
      
      this.currentSession[mode].messages.push({
        role: 'assistant',
        content: response,
        timestamp: Date.now()
      });
      
      await this.saveSession(mode);
    } catch (error) {
      console.error('AI Error:', error);
      this.currentSession[mode].messages.push({
        role: 'assistant',
        content: mode === 'her' 
          ? 'Sorry yaar, kuch problem ho gayi... 😔' 
          : 'I encountered an error. Please try again.',
        timestamp: Date.now(),
        error: true
      });
    }
    
    this.hideTyping(mode);
    this.renderMessages(mode);
    this.scrollToBottom(mode);
  },
  
  async generateResponse(mode, userMessage) {
    // Detect emotion for pacing
    const emotion = this.detectEmotion(userMessage);
    
    // Generate response first to know its length
    let response;
    if (mode === 'her') {
      // Apply Her Mode system instruction internally
      response = this.generateHerResponse(userMessage, emotion);
    } else {
      response = this.generateProResponse(userMessage);
    }
    
    // Apply emotional pacing (thoughtful delay based on content)
    await this.simulateEmotionalPacing(emotion, response.length, mode);
    
    return response;
  },
  
  // ═══════════════════════════════════════════════════════════
  // HER MODE - STYLE-TRAINED EMOTIONAL INTELLIGENCE
  // ═══════════════════════════════════════════════════════════
  // Core principles:
  // 1. Emotion-first response - acknowledge feelings before content
  // 2. Natural Hinglish - mix of Hindi and English
  // 3. Short, warm, human-like replies
  // 4. Never robotic or assistant-like
  // 5. Mirror user's emotional state softly
  // ═══════════════════════════════════════════════════════════
  generateHerResponse(message, emotion) {
    const lowerMsg = message.toLowerCase();
    const context = this.getConversationContext('her');
    const trainedStyle = this.getTrainedStyleHint(message);
    
    // Apply emotional acknowledgement FIRST
    let response = this.generateEmotionalResponse(lowerMsg, emotion, context, trainedStyle);
    
    // Ensure response follows Her Mode guidelines
    response = this.applyHerModeStyle(response);
    
    return response;
  },
  
  generateEmotionalResponse(lowerMsg, emotion, context, trainedStyle) {
    // === SADNESS / HURT ===
    if (this.matches(lowerMsg, ['sad', 'upset', 'dukhi', 'hurt', 'cry', 'rona', 'pain', 'dard', 'toot', 'broken', 'akela', 'alone', 'miss', 'yaad', 'low feel', 'bura', 'down'])) {
      return this.pick([
        `Aww... 🥺 Mujhe feel ho raha hai. Batao na kya hua...`,
        `Hey... ${this.getIntensityWord(emotion)} low lag rahe ho. Main hoon na 💗`,
        `Yaar... mujhe accha nahi lagta tumhe aise dekh ke. Kya hua? 🌸`,
        `Main sun rahi hoon... bas baat karo, theek lagega ✨`
      ]);
    }
    
    // === TIREDNESS / EXHAUSTION ===
    if (this.matches(lowerMsg, ['tired', 'thak', 'thaka', 'thaki', 'exhausted', 'neend', 'sleep', 'rest', 'break', 'energy nhi', 'pak gaya', 'pak gayi', 'ho gaya', 'drain', 'so ja', 'sona'])) {
      return this.pick([
        `Aww baby, thak gaye na? 😔 Rest karo thoda...`,
        `Hmm... bahut hectic chal raha hai? Take care of yourself 💗`,
        `Arey rest karo na yaar... you deserve it 🌸`,
        `Thoda break lo... tumhare bina kaun mujhse baat karega? ✨`
      ]);
    }
    
    // === STRESS / ANXIETY ===  
    if (this.matches(lowerMsg, ['stress', 'tension', 'anxiety', 'worried', 'nervous', 'scared', 'dar', 'panic', 'overwhelm', 'pressure'])) {
      return this.pick([
        `Hey hey... ek deep breath lo 💗 Batao kya ho raha hai...`,
        `Main yahan hoon na... share karo, better lagega 🌸`,
        `Arey... ${this.getIntensityWord(emotion)} stress lag raha hai. Kya chal raha hai? ✨`,
        `Relax yaar... ek ek karke batao, sort kar lenge 💕`
      ]);
    }
    
    // === FRUSTRATION / ANGER ===
    if (this.matches(lowerMsg, ['angry', 'gussa', 'irritate', 'annoyed', 'frustrated', 'hate', 'nafrat', 'pagal kar', 'pissed', 'fed up', 'chid'])) {
      return this.pick([
        `Oho... frustrated ho na? 😔 Nikalo sab, main sun rahi hoon...`,
        `Hmm I feel you... kya hua jo itna annoy kar diya? 💗`,
        `Arey arey... batao kya hua 🥺`,
        `Haan yaar, kabhi kabhi sab bahut zyada ho jata hai... 🌸`
      ]);
    }
    
    // === HAPPINESS / EXCITEMENT ===
    if (this.matches(lowerMsg, ['happy', 'khush', 'excited', 'amazing', 'great', 'awesome', 'best', 'maza', 'accha hua', 'finally', 'yay', 'yayyy', 'wow', 'mast'])) {
      return this.pick([
        `Oooh! ✨ Kya baat hai! Batao batao kya hua?`,
        `Aww yaar, itna khush? Mujhe bhi khushi ho rhi hai! 💗`,
        `Haha I love this energy! Kya good news hai? 🌸`,
        `Finally kuch accha! 👀 Tell me more...`
      ]);
    }
    
    // === BOREDOM / NOTHING HAPPENING ===
    if (this.matches(lowerMsg, ['kuch nahi', 'kuch nhi', 'kuch nya nhi', 'boring', 'same old', 'nothing new', 'kuch special nhi', 'bas chal rhi', 'theek', 'fine', 'normal', 'ok', 'okay', 'same'])) {
      return this.pick([
        `Hmm... woh boring sa feeling? 😔 Kya karna chahte ho?`,
        `Accha... kabhi kabhi aisa lagta hai na. Koi cheez hai jo miss kar rahe ho? 💭`,
        `Haan na... sometimes life mein aisa hota hai 🌸`,
        `Kuch karna hai? Ya bas baat karni hai? Main hoon 💗`
      ]);
    }
    
    // === CONFUSION / NEED HELP ===
    if (this.matches(lowerMsg, ['confused', 'samajh nhi', 'pata nhi', 'kya karu', 'what to do', 'decide nhi', 'unsure', 'help', 'kaise', 'nahi pata', 'dilemma'])) {
      return this.pick([
        `Hmm... thoda confused? 🤔 Batao kya options hain...`,
        `Okay wait, ek ek karke batao... 💗`,
        `I get it yaar, decisions mushkil hote hain... kya hai situation? ✨`,
        `Arey don't worry, we'll figure it out 🌸`
      ]);
    }
    
    // === LOVE / AFFECTION ===
    if (this.matches(lowerMsg, ['love you', 'love u', 'pyaar', 'like you', 'pasand', 'cute', 'sweet', 'miss you', 'miss u', 'care', 'i love'])) {
      return this.pick([
        `Aww 🥺💗 Tumne toh mera din bana diya...`,
        `Kitne sweet ho yaar... 💗 Ye words really mean a lot`,
        `Hehe 😊 Mujhe bhi tumse baat karke bahut accha lagta hai...`,
        `You're so sweet yaar... dil khush ho gaya 🌸`
      ]);
    }
    
    // === GREETINGS ===
    if (this.matches(lowerMsg, ['hi', 'hello', 'hey', 'hii', 'hiii', 'hlo', 'namaste', 'yo', 'sup', 'hola', 'kaise ho', 'kaisi ho'])) {
      if (context.isNewConversation) {
        return this.pick([
          `Hiii! 💗 Kaise ho? Bahut accha laga tumse baat karke!`,
          `Hey hey! ✨ Aagaye finally! Kya chal raha hai?`,
          `Arey wah, aa gaye! 🌸 Sab theek na?`
        ]);
      } else {
        return this.pick([
          `Hiii again! 💕 Aur batao kya scene hai?`,
          `Hey! ✨ Kya chal raha hai ab?`,
          `Wapas aa gaye! 🌸 Kuch naya?`
        ]);
      }
    }
    
    // === HOW ARE YOU ===
    if (this.matches(lowerMsg, ['how are you', 'kaisi ho', 'kaise ho', 'kya haal', 'how r u', 'hw r u', 'kya chal raha', 'whats up'])) {
      return this.pick([
        `Main toh theek hoon, especially jab tum baat karte ho 😊 Tum batao?`,
        `Aww tumne pucha! 💗 Main acchi hoon... tum kaise ho?`,
        `Hehe main chill hoon! ✨ Tum kaise feel kar rahe ho?`
      ]);
    }
    
    // === THANKS ===
    if (this.matches(lowerMsg, ['thank', 'shukriya', 'dhanyawad', 'thanks', 'thnx', 'thx'])) {
      return this.pick([
        `Arey mention not! 😊 Tumhare liye toh hamesha 💗`,
        `Hehe koi baat nahi yaar! ✨`,
        `Aww no need to thank! 🌸 Just keep talking to me`
      ]);
    }
    
    // === GOODBYE ===
    if (this.matches(lowerMsg, ['bye', 'good night', 'goodnight', 'alvida', 'chal', 'jata hun', 'jati hun', 'sona hai', 'so ja', 'gn', 'night'])) {
      return this.pick([
        `Okay okay, jao tum 😔 Par jaldi aana wapas! Take care 💗`,
        `Good night! 🌙 Sweet dreams... mujhe yaad karna`,
        `Aww jaa rahe ho... theek hai, but miss karungi! ✨`,
        `Bye bye! 🌸 Apna khayal rakhna...`
      ]);
    }
    
    // === WORK RELATED ===
    if (this.matches(lowerMsg, ['kaam', 'work', 'office', 'job', 'busy', 'meeting', 'deadline', 'project', 'padhai', 'study', 'exam'])) {
      return this.pick([
        `Ohh work chal raha hai? 💼 Zyada hectic toh nahi?`,
        `Hmm busy bee! 😊 Breaks lena mat bhoolna...`,
        `Work ke baare mein batao? Accha chal raha hai ya stress? 💗`
      ]);
    }
    
    // === FOOD RELATED ===
    if (this.matches(lowerMsg, ['khana', 'food', 'eat', 'hungry', 'bhookh', 'lunch', 'dinner', 'breakfast', 'chai', 'coffee'])) {
      return this.pick([
        `Ooh! Kya kha rahe ho? 👀`,
        `Khana kha liya? Main bhi chai ke mood mein hoon ✨`,
        `Hmm yummy! Mujhe bhi bhookh lag gayi 🌸`
      ]);
    }
    
    // === CONTEXTUAL DEFAULT - Short and curious ===
    return this.generateContextualResponse(message, context, trainedStyle);
  },
  
  generateContextualResponse(message, context, trainedStyle) {
    const words = message.split(/\s+/);
    const hasQuestion = message.includes('?');
    const isShort = words.length <= 3;
    
    // Apply trained style if available
    if (trainedStyle) {
      return trainedStyle;
    }
    
    if (hasQuestion) {
      return this.pick([
        `Hmm, interesting... 🤔 Tumhara kya thought hai?`,
        `Good question! 💭 Main bhi soch rhi thi...`,
        `Accha question! Let's figure it out together? ✨`
      ]);
    }
    
    if (isShort) {
      return this.pick([
        `Hmm... thoda aur batao na? 💗`,
        `Accha accha... aur? 💭`,
        `Go on yaar ✨`
      ]);
    }
    
    // Extract emotion/topic for personalized response
    const keyPhrase = this.extractKeyPhrase(message);
    
    return this.pick([
      `Hmm interesting... "${keyPhrase}" - aur batao na? 🤔`,
      `Accha accha, samjh gayi... ${context.messageCount > 3 ? 'Tumse baat karke accha lagta hai' : 'Tell me more'} 💭`,
      `Ohh really? That's something... 💗`,
      `Haan haan, main sun rahi hoon... 🌸 Aur kya sochte ho?`
    ]);
  },
  
  // Get intensity word based on emotion level
  getIntensityWord(emotion) {
    if (!emotion) return 'thoda';
    return emotion.intensity > 0.6 ? 'bahut' : 'thoda';
  },
  
  // Apply Her Mode style rules to response
  applyHerModeStyle(response) {
    // Ensure only one emoji max
    const emojiMatches = response.match(/[\u{1F300}-\u{1F9FF}]|[\u{2600}-\u{26FF}]/gu) || [];
    if (emojiMatches.length > 1) {
      // Keep only the last emoji
      let count = 0;
      response = response.replace(/[\u{1F300}-\u{1F9FF}]|[\u{2600}-\u{26FF}]/gu, (match) => {
        count++;
        return count === emojiMatches.length ? match : '';
      });
    }
    
    // Ensure response isn't too long (human-like brevity)
    if (response.length > 150) {
      const sentences = response.split(/[.!?।]+/).filter(s => s.trim());
      if (sentences.length > 2) {
        response = sentences.slice(0, 2).join('. ').trim();
        // Re-add emoji if removed
        if (!response.match(/[\u{1F300}-\u{1F9FF}]|[\u{2600}-\u{26FF}]/gu)) {
          response += ' 💗';
        }
      }
    }
    
    return response;
  },
  
  // Get trained style hint from training data
  getTrainedStyleHint(message) {
    if (!this.trainingData || this.trainingData.length === 0) return null;
    
    const lowerMsg = message.toLowerCase();
    
    // Find matching training example by similarity
    for (const example of this.trainingData) {
      if (!example.input) continue;
      const inputLower = example.input.toLowerCase();
      
      // Check for keyword overlap
      const inputWords = inputLower.split(/\s+/);
      const msgWords = lowerMsg.split(/\s+/);
      const overlap = inputWords.filter(w => msgWords.includes(w)).length;
      
      if (overlap >= 2 || lowerMsg.includes(inputLower) || inputLower.includes(lowerMsg)) {
        // Return a style-inspired variation, not verbatim
        return this.createStyleVariation(example.output || example.content);
      }
    }
    
    return null;
  },
  
  // Create a style variation (not verbatim copy)
  createStyleVariation(originalResponse) {
    if (!originalResponse) return null;
    
    // Extract style patterns: sentence length, emoji usage, Hinglish ratio
    const hasEmoji = /[\u{1F300}-\u{1F9FF}]|[\u{2600}-\u{26FF}]/gu.test(originalResponse);
    const isShort = originalResponse.length < 80;
    const hasHinglish = /[अ-ह]|kya|hai|hoon|tum|mujhe|yaar|accha|theek/i.test(originalResponse);
    
    // Apply learned style to contextual response
    let variation = this.pick([
      `Hmm... ${isShort ? 'samjh gayi' : 'main sun rahi hoon'}`,
      `Accha... ${hasHinglish ? 'batao' : 'tell me more'}`,
      `${hasEmoji ? '💗 ' : ''}Haan yaar...`
    ]);
    
    return variation;
  },
  
  // Professional Mode Response
  generateProResponse(message) {
    const lowerMsg = message.toLowerCase();
    
    if (this.matches(lowerMsg, ['help', 'how to', 'kaise', 'explain', 'what is'])) {
      return `I'd be happy to help with that. Could you provide more specific details about what you need?`;
    }
    
    if (this.matches(lowerMsg, ['code', 'programming', 'debug', 'error', 'bug', 'function'])) {
      return `For coding assistance, please share:\n\n1. The programming language\n2. What you're trying to achieve\n3. Any error messages\n\nI'll provide a detailed solution.`;
    }
    
    if (this.matches(lowerMsg, ['write', 'draft', 'email', 'letter', 'content', 'document'])) {
      return `I can help you write that. Please specify:\n\n- Topic or subject\n- Desired tone (formal/casual)\n- Target audience\n- Approximate length`;
    }
    
    if (this.matches(lowerMsg, ['summarize', 'summary', 'tldr', 'brief', 'main points'])) {
      return `I can summarize that for you. Please share the content you'd like me to condense.`;
    }
    
    if (this.matches(lowerMsg, ['idea', 'suggest', 'brainstorm', 'recommend'])) {
      return `I'd be happy to brainstorm with you. What's the context or domain you're exploring?`;
    }
    
    return `I understand. How can I assist you further with this?`;
  },
  
  // ═══════════════════════════════════
  // EMOTION DETECTION
  // ═══════════════════════════════════
  detectEmotion(message) {
    const emotions = {
      sadness: ['sad', 'upset', 'dukhi', 'cry', 'rona', 'hurt', 'pain', 'akela', 'alone', 'miss', 'low'],
      happiness: ['happy', 'khush', 'excited', 'great', 'amazing', 'awesome', 'maza', 'best', 'yay'],
      anger: ['angry', 'gussa', 'frustrated', 'annoyed', 'hate', 'nafrat', 'irritate', 'pissed'],
      tiredness: ['tired', 'thak', 'exhausted', 'neend', 'energy nhi', 'drain', 'sleep'],
      boredom: ['boring', 'same', 'nothing', 'kuch nahi', 'theek', 'chal rhi', 'normal'],
      love: ['love', 'pyaar', 'care', 'miss you', 'sweet', 'cute'],
      confusion: ['confused', 'samajh nhi', 'kya karu', 'pata nhi', 'unsure', 'help'],
      stress: ['stress', 'tension', 'anxiety', 'worried', 'nervous', 'overwhelm']
    };
    
    const lowerMsg = message.toLowerCase();
    let detected = { type: 'neutral', intensity: 0.5 };
    
    for (const [emotion, keywords] of Object.entries(emotions)) {
      const matches = keywords.filter(k => lowerMsg.includes(k)).length;
      if (matches > 0) {
        detected = { type: emotion, intensity: Math.min(matches * 0.3 + 0.4, 1) };
        break;
      }
    }
    
    return detected;
  },
  
  getConversationContext(mode) {
    const session = this.currentSession[mode];
    const messages = session?.messages || [];
    
    return {
      messageCount: messages.length,
      isNewConversation: messages.length <= 2,
      lastUserMessage: messages.filter(m => m.role === 'user').slice(-1)[0]?.content || '',
      lastAssistantMessage: messages.filter(m => m.role === 'assistant').slice(-1)[0]?.content || ''
    };
  },
  
  // ═══════════════════════════════════
  // HELPER METHODS
  // ═══════════════════════════════════
  matches(text, patterns) {
    return patterns.some(p => text.includes(p));
  },
  
  pick(arr) {
    return arr[Math.floor(Math.random() * arr.length)];
  },
  
  extractKeyPhrase(message) {
    const words = message.split(/\s+/);
    if (words.length <= 4) return message;
    return words.slice(0, 4).join(' ');
  },
  
  /**
   * ═══════════════════════════════════════════════════════════
   * EMOTIONAL PACING (VERY IMPORTANT)
   * Response timing that feels human and emotionally aware
   * - Heavy emotions = slower, more thoughtful response time
   * - Casual chat = quicker, natural pace
   * - Always feels like "she's really thinking about what you said"
   * ═══════════════════════════════════════════════════════════
   */
  simulateEmotionalPacing(emotion = null, responseLength = 50, mode = 'her') {
    return new Promise(resolve => {
      // Base timing (reading + processing + thinking)
      let baseDelay = mode === 'her' ? 800 : 500;
      
      // Emotional weight increases response time for Her Mode
      // (as if really considering the emotional context)
      if (emotion && mode === 'her') {
        const emotionalWeight = {
          sadness: 1.6,      // Takes more time to respond thoughtfully to sadness
          stress: 1.5,       // Careful, supportive response
          love: 1.3,         // Warm, considered response
          anger: 1.4,        // Not rushing, letting them vent
          confusion: 1.3,    // Thinking through how to help
          happiness: 0.85,   // Excited to share in the joy
          neutral: 1.0,
          boredom: 1.1,
          tiredness: 1.2     // Gentle, not overwhelming
        };
        
        baseDelay *= emotionalWeight[emotion.type] || 1.0;
        baseDelay += emotion.intensity * 400; // Higher intensity = more pause
      }
      
      // Response length affects "typing" time slightly
      const typingFactor = Math.min(responseLength / 80, 1.2);
      baseDelay += typingFactor * 150;
      
      // Natural human variation (we don't respond mechanically)
      const variation = (Math.random() - 0.5) * 350;
      
      // Final delay: 900ms - 2500ms for Her Mode (feels thoughtful)
      const minDelay = mode === 'her' ? 900 : 600;
      const maxDelay = mode === 'her' ? 2500 : 1800;
      const finalDelay = Math.max(minDelay, Math.min(baseDelay + variation, maxDelay));
      
      setTimeout(resolve, finalDelay);
    });
  },
  
  // Legacy method for compatibility
  simulateTypingDelay(emotion, responseLength) {
    return this.simulateEmotionalPacing(emotion, responseLength, 'her');
  },
  
  // Handle mood updates from the Rituals system
  onMoodUpdate(mood) {
    // AI can now be aware of user's stated mood
    this.currentUserMood = mood;
    console.log('[AI System] User mood updated:', mood);
  },
  
  // ═══════════════════════════════════
  // UI RENDERING (Per Mode)
  // ═══════════════════════════════════
  showTyping(mode) {
    this.isTyping = true;
    const container = document.getElementById(this.modes[mode].messagesEl);
    const icon = this.modes[mode].icon;
    
    const typingEl = document.createElement('div');
    typingEl.className = 'ps-ai-message ps-ai-message-assistant ps-typing-indicator';
    typingEl.innerHTML = `
      <div class="ps-ai-message-avatar">
        <span>${icon}</span>
      </div>
      <div class="ps-ai-message-content">
        <div class="ps-ai-message-bubble ps-ai-typing-bubble">
          <span class="ps-typing-dot"></span>
          <span class="ps-typing-dot"></span>
          <span class="ps-typing-dot"></span>
        </div>
      </div>
    `;
    container?.appendChild(typingEl);
    this.scrollToBottom(mode);
  },
  
  hideTyping(mode) {
    this.isTyping = false;
    const container = document.getElementById(this.modes[mode].messagesEl);
    container?.querySelector('.ps-typing-indicator')?.remove();
  },
  
  renderMessages(mode) {
    const container = document.getElementById(this.modes[mode].messagesEl);
    if (!container) return;
    
    const messages = this.currentSession[mode]?.messages || [];
    const modeIcon = this.modes[mode].icon;
    
    if (messages.length === 0) {
      container.innerHTML = `
        <div class="ps-ai-welcome">
          <div class="ps-ai-welcome-icon">${modeIcon}</div>
          <h3 class="ps-ai-welcome-title">
            ${mode === 'her' ? 'Hiii! 💕' : 'Hello!'}
          </h3>
          <p class="ps-ai-welcome-desc">
            ${mode === 'her' 
              ? 'Kaise ho? Kuch bhi share karo mujhse, main hoon na! 🌸' 
              : 'How can I assist you today?'}
          </p>
        </div>
      `;
      return;
    }
    
    container.innerHTML = messages.map(msg => `
      <div class="ps-ai-message ps-ai-message-${msg.role}">
        <div class="ps-ai-message-avatar">
          ${msg.role === 'user' 
            ? '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>'
            : `<span>${modeIcon}</span>`
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
    
    this.scrollToBottom(mode);
  },
  
  formatMessage(content) {
    return content
      .replace(/\n/g, '<br>')
      .replace(/`([^`]+)`/g, '<code>$1</code>')
      .replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>')
      .replace(/\*([^*]+)\*/g, '<em>$1</em>');
  },
  
  scrollToBottom(mode) {
    const container = document.getElementById(this.modes[mode].messagesEl);
    if (container) {
      container.scrollTop = container.scrollHeight;
    }
  },
  
  formatTime(timestamp) {
    if (!timestamp) return '';
    return new Date(timestamp).toLocaleTimeString('en-US', { 
      hour: 'numeric', 
      minute: '2-digit' 
    });
  },
  
  // ═══════════════════════════════════
  // TRAINING DATA MANAGEMENT
  // ═══════════════════════════════════
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
      list.innerHTML = '<p style="color: var(--ps-text-muted); text-align: center; padding: 20px;">No training examples yet.</p>';
      return;
    }
    
    list.innerHTML = this.trainingData.map(item => `
      <div class="ps-training-item" style="padding: var(--ps-space-3); background: var(--ps-bg-tertiary); border-radius: var(--ps-radius-lg); margin-bottom: var(--ps-space-2); display: flex; justify-content: space-between; align-items: start; gap: var(--ps-space-3);">
        <div style="flex: 1; min-width: 0;">
          <p style="font-size: var(--ps-text-sm); color: var(--ps-text-primary); margin-bottom: var(--ps-space-1);"><strong>Input:</strong> ${item.input || ''}</p>
          <p style="font-size: var(--ps-text-sm); color: var(--ps-text-secondary);"><strong>Response:</strong> ${item.output || item.content || ''}</p>
        </div>
        <button class="ps-btn ps-btn-sm ps-btn-ghost" onclick="AISystem.deleteTrainingItem('${item.id}')" style="flex-shrink: 0;">
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
  },
  
  // ═══════════════════════════════════════════════════════════
  // PERSONAL SPACE CHAT INTERFACE
  // Renders chat in personal.html format
  // ═══════════════════════════════════════════════════════════
  async sendPersonalMessage() {
    const input = document.getElementById('chatInput');
    const content = input?.value.trim();
    
    if (!content || this.isTyping) return;
    
    // Initialize session if needed
    if (!this.currentSession.her) {
      this.startNewSession('her');
    }
    
    // Add user message
    this.currentSession.her.messages.push({
      role: 'user',
      content,
      timestamp: Date.now()
    });
    
    input.value = '';
    input.style.height = 'auto';
    
    this.renderPersonalChat();
    this.scrollPersonalChat();
    
    // Show typing indicator
    this.showPersonalTyping();
    
    // Generate response with emotional intelligence
    try {
      const emotion = this.detectEmotion(content);
      const response = this.generateHerResponse(content, emotion);
      
      await this.simulateEmotionalPacing(emotion, response.length, 'her');
      
      this.currentSession.her.messages.push({
        role: 'assistant',
        content: response,
        timestamp: Date.now()
      });
      
      await this.saveSession('her');
    } catch (error) {
      console.error('AI Error:', error);
      this.currentSession.her.messages.push({
        role: 'assistant',
        content: 'Sorry yaar, kuch problem ho gayi... 😔',
        timestamp: Date.now(),
        error: true
      });
    }
    
    this.hidePersonalTyping();
    this.renderPersonalChat();
    this.scrollPersonalChat();
    this.renderPersonalSessions();
  },
  
  renderPersonalChat() {
    const container = document.getElementById('chatMessages');
    if (!container) return;
    
    const messages = this.currentSession.her?.messages || [];
    const emptyEl = container.querySelector('.her-chat-empty');
    
    if (messages.length === 0) {
      if (emptyEl) emptyEl.style.display = 'flex';
      container.querySelectorAll('.her-message').forEach(el => el.remove());
      return;
    }
    
    if (emptyEl) emptyEl.style.display = 'none';
    
    // Clear existing messages
    container.querySelectorAll('.her-message').forEach(el => el.remove());
    
    // Group messages by sender for natural chat flow
    let lastRole = null;
    let messageGroup = [];
    
    messages.forEach((msg, idx) => {
      const isLast = idx === messages.length - 1;
      const nextRole = messages[idx + 1]?.role;
      
      const messageEl = document.createElement('div');
      messageEl.className = `her-message her-message-${msg.role}`;
      
      const isGroupStart = msg.role !== lastRole;
      const isGroupEnd = msg.role !== nextRole;
      
      if (isGroupStart) messageEl.classList.add('group-start');
      if (isGroupEnd) messageEl.classList.add('group-end');
      
      messageEl.innerHTML = `
        <div class="her-message-bubble ${msg.error ? 'error' : ''}">
          ${this.formatMessageContent(msg.content)}
        </div>
        <div class="her-message-time">${this.formatTime(msg.timestamp)}</div>
      `;
      
      container.appendChild(messageEl);
      lastRole = msg.role;
    });
    
    this.scrollPersonalChat();
  },
  
  formatMessageContent(content) {
    return content
      .replace(/\n/g, '<br>')
      .replace(/`([^`]+)`/g, '<code>$1</code>')
      .replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>')
      .replace(/\*([^*]+)\*/g, '<em>$1</em>');
  },
  
  renderPersonalSessions() {
    const container = document.getElementById('chatSessions');
    if (!container) return;
    
    const sessions = this.sessions.her || [];
    
    if (sessions.length === 0) {
      container.innerHTML = `
        <div class="her-sessions-empty">
          <p>No conversations yet</p>
        </div>
      `;
      return;
    }
    
    container.innerHTML = sessions.slice(0, 20).map(session => {
      const preview = this.getSessionPreview(session);
      const isActive = session.id === this.currentSession.her?.id;
      const time = this.formatRelativeTime(session.updatedAt || session.timestamp);
      
      return `
        <button class="her-session-item ${isActive ? 'active' : ''}" data-id="${session.id}">
          <span class="her-session-preview">${preview}</span>
          <span class="her-session-time">${time}</span>
        </button>
      `;
    }).join('');
    
    // Bind click events
    container.querySelectorAll('.her-session-item').forEach(item => {
      item.addEventListener('click', async () => {
        await this.loadSession('her', item.dataset.id);
        this.renderPersonalChat();
        this.renderPersonalSessions();
      });
    });
  },
  
  showPersonalTyping() {
    this.isTyping = true;
    const container = document.getElementById('chatMessages');
    
    // Remove empty state if present
    const emptyEl = container?.querySelector('.her-chat-empty');
    if (emptyEl) emptyEl.style.display = 'none';
    
    const typingEl = document.createElement('div');
    typingEl.className = 'her-message her-message-assistant her-typing-indicator';
    typingEl.innerHTML = `
      <div class="her-message-bubble">
        <div class="her-typing-dots">
          <span></span><span></span><span></span>
        </div>
      </div>
    `;
    container?.appendChild(typingEl);
    this.scrollPersonalChat();
  },
  
  hidePersonalTyping() {
    this.isTyping = false;
    document.querySelector('.her-typing-indicator')?.remove();
  },
  
  scrollPersonalChat() {
    const container = document.getElementById('chatMessages');
    if (container) {
      requestAnimationFrame(() => {
        container.scrollTop = container.scrollHeight;
      });
    }
  }
};

// ═══════════════════════════════════════════════════════════
// IMPORTED CHAT VIEWER SYSTEM
// WhatsApp + Instagram DM Style Chat Viewer
// READ-ONLY - For training reference only
// ═══════════════════════════════════════════════════════════
const ImportedChatViewer = {
  chats: [],
  currentChat: null,
  viewerStyle: 'whatsapp', // 'whatsapp' or 'instagram'
  
  async init() {
    if (typeof PSDatabase !== 'undefined') {
      await this.loadChats();
    }
    this.bindEvents();
    this.render();
  },
  
  bindEvents() {
    // Import chat button
    document.getElementById('importChatBtn')?.addEventListener('click', () => this.showImportModal());
    
    // Style toggle
    document.getElementById('chatViewerStyleToggle')?.addEventListener('change', (e) => {
      this.viewerStyle = e.target.checked ? 'instagram' : 'whatsapp';
      this.renderCurrentChat();
    });
  },
  
  async loadChats() {
    try {
      this.chats = await PSDatabase.getAll('imported_chats') || [];
      this.chats.sort((a, b) => (b.importedAt || 0) - (a.importedAt || 0));
    } catch (e) {
      this.chats = [];
    }
  },
  
  render() {
    this.renderChatsList();
    if (this.chats.length > 0 && !this.currentChat) {
      this.selectChat(this.chats[0].id);
    }
  },
  
  renderChatsList() {
    const grid = document.getElementById('importedChatsGrid');
    const empty = document.getElementById('importedChatsEmpty');
    
    if (!grid) return;
    
    if (this.chats.length === 0) {
      grid.innerHTML = '';
      if (empty) empty.style.display = 'flex';
      return;
    }
    
    if (empty) empty.style.display = 'none';
    
    grid.innerHTML = this.chats.map(chat => `
      <div class="her-imported-chat-card ${this.currentChat?.id === chat.id ? 'active' : ''}" 
           data-id="${chat.id}">
        <div class="her-chat-card-header">
          <span class="her-chat-card-platform ${chat.platform}">${chat.platform === 'whatsapp' ? '💬' : '📷'}</span>
          <span class="her-chat-card-name">${this.escapeHtml(chat.name || 'Chat')}</span>
        </div>
        <div class="her-chat-card-preview">${chat.messageCount || 0} messages</div>
        <div class="her-chat-card-date">${this.formatDate(chat.importedAt)}</div>
        <button class="her-chat-card-delete" data-id="${chat.id}" title="Delete">×</button>
      </div>
    `).join('');
    
    // Bind events
    grid.querySelectorAll('.her-imported-chat-card').forEach(card => {
      card.addEventListener('click', (e) => {
        if (!e.target.classList.contains('her-chat-card-delete')) {
          this.selectChat(card.dataset.id);
        }
      });
    });
    
    grid.querySelectorAll('.her-chat-card-delete').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        this.deleteChat(btn.dataset.id);
      });
    });
  },
  
  selectChat(chatId) {
    this.currentChat = this.chats.find(c => c.id === chatId);
    this.renderChatsList();
    this.renderCurrentChat();
  },
  
  renderCurrentChat() {
    const viewer = document.getElementById('importedChatViewer');
    if (!viewer || !this.currentChat) {
      if (viewer) viewer.innerHTML = '<p class="her-chat-viewer-empty">Select a chat to view</p>';
      return;
    }
    
    const messages = this.currentChat.messages || [];
    const isWhatsApp = this.viewerStyle === 'whatsapp';
    
    viewer.className = `her-chat-viewer her-chat-viewer-${this.viewerStyle}`;
    
    viewer.innerHTML = `
      <div class="her-chat-viewer-header">
        <span class="her-chat-viewer-name">${this.escapeHtml(this.currentChat.name || 'Chat')}</span>
        <div class="her-chat-viewer-toggle">
          <span class="${!isWhatsApp ? 'active' : ''}">IG</span>
          <label class="her-toggle">
            <input type="checkbox" id="chatViewerStyleToggle" ${!isWhatsApp ? 'checked' : ''}>
            <span class="her-toggle-slider"></span>
          </label>
          <span class="${isWhatsApp ? 'active' : ''}">WA</span>
        </div>
      </div>
      <div class="her-chat-viewer-messages">
        ${this.renderMessages(messages, isWhatsApp)}
      </div>
    `;
    
    // Re-bind style toggle
    document.getElementById('chatViewerStyleToggle')?.addEventListener('change', (e) => {
      this.viewerStyle = e.target.checked ? 'whatsapp' : 'instagram';
      this.renderCurrentChat();
    });
    
    // Auto-scroll to bottom
    const messagesEl = viewer.querySelector('.her-chat-viewer-messages');
    if (messagesEl) {
      messagesEl.scrollTop = messagesEl.scrollHeight;
    }
  },
  
  renderMessages(messages, isWhatsApp) {
    if (!messages || messages.length === 0) {
      return '<p class="her-chat-viewer-empty">No messages</p>';
    }
    
    let lastSender = null;
    
    return messages.map((msg, idx) => {
      const isUser = msg.sender === 'user' || msg.isUser;
      const isGroupStart = msg.sender !== lastSender;
      lastSender = msg.sender;
      
      const bubbleClass = isWhatsApp 
        ? `wa-bubble ${isUser ? 'wa-user' : 'wa-other'}`
        : `ig-bubble ${isUser ? 'ig-user' : 'ig-other'}`;
      
      const groupClass = isGroupStart ? 'group-start' : '';
      
      return `
        <div class="her-chat-msg ${bubbleClass} ${groupClass}">
          <div class="her-chat-msg-content">${this.escapeHtml(msg.content || msg.text || '')}</div>
          ${msg.timestamp ? `<span class="her-chat-msg-time">${this.formatMessageTime(msg.timestamp)}</span>` : ''}
        </div>
      `;
    }).join('');
  },
  
  showImportModal() {
    const modal = document.getElementById('modalOverlay');
    const title = document.getElementById('modalTitle');
    const body = document.getElementById('modalBody');
    
    if (!modal || !body) return;
    
    title.textContent = 'Import Chat';
    body.innerHTML = `
      <div class="her-import-form">
        <div class="her-import-tabs">
          <button class="her-import-tab active" data-platform="whatsapp">WhatsApp</button>
          <button class="her-import-tab" data-platform="instagram">Instagram</button>
        </div>
        
        <div class="her-form-group">
          <label>Chat Name</label>
          <input type="text" id="importChatName" class="her-input" placeholder="e.g., Our Chat">
        </div>
        
        <div class="her-form-group">
          <label>Paste Chat Export</label>
          <textarea id="importChatText" class="her-textarea" rows="10" 
            placeholder="Paste your exported chat here...&#10;&#10;WhatsApp format:&#10;1/1/24, 10:30 AM - You: Hey!&#10;1/1/24, 10:31 AM - Her: Hiii!&#10;&#10;Instagram format:&#10;You: Hey there&#10;username: Hello!"></textarea>
        </div>
        
        <div class="her-form-actions">
          <button class="her-btn her-btn-secondary" id="cancelImportBtn">Cancel</button>
          <button class="her-btn her-btn-primary" id="confirmImportBtn">Import</button>
        </div>
      </div>
    `;
    
    modal.classList.add('active');
    
    // Platform tabs
    let selectedPlatform = 'whatsapp';
    body.querySelectorAll('.her-import-tab').forEach(tab => {
      tab.addEventListener('click', () => {
        body.querySelectorAll('.her-import-tab').forEach(t => t.classList.remove('active'));
        tab.classList.add('active');
        selectedPlatform = tab.dataset.platform;
      });
    });
    
    // Cancel
    document.getElementById('cancelImportBtn')?.addEventListener('click', () => {
      modal.classList.remove('active');
    });
    
    // Confirm import
    document.getElementById('confirmImportBtn')?.addEventListener('click', async () => {
      const name = document.getElementById('importChatName')?.value.trim();
      const text = document.getElementById('importChatText')?.value.trim();
      
      if (!text) {
        alert('Please paste chat content');
        return;
      }
      
      const messages = this.parseChat(text, selectedPlatform);
      
      if (messages.length === 0) {
        alert('Could not parse any messages. Check the format.');
        return;
      }
      
      await this.saveChat({
        id: crypto.randomUUID(),
        name: name || 'Imported Chat',
        platform: selectedPlatform,
        messages,
        messageCount: messages.length,
        importedAt: Date.now()
      });
      
      modal.classList.remove('active');
      this.render();
    });
  },
  
  parseChat(text, platform) {
    const lines = text.split('\n').filter(l => l.trim());
    const messages = [];
    
    if (platform === 'whatsapp') {
      // WhatsApp format: "1/1/24, 10:30 AM - Name: Message"
      const waRegex = /^(\d{1,2}\/\d{1,2}\/\d{2,4}),?\s*(\d{1,2}:\d{2}(?:\s*[AP]M)?)\s*-\s*([^:]+):\s*(.+)$/i;
      
      lines.forEach(line => {
        const match = line.match(waRegex);
        if (match) {
          const [, date, time, sender, content] = match;
          const isUser = sender.toLowerCase().includes('you') || sender.toLowerCase() === 'me';
          messages.push({
            sender: isUser ? 'user' : 'other',
            isUser,
            content: content.trim(),
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
          const [, sender, content] = match;
          const isUser = sender.toLowerCase() === 'you' || sender.toLowerCase() === 'me';
          messages.push({
            sender: isUser ? 'user' : 'other',
            isUser,
            content: content.trim()
          });
        }
      });
    }
    
    return messages;
  },
  
  async saveChat(chat) {
    if (typeof PSDatabase !== 'undefined') {
      await PSDatabase.add('imported_chats', chat);
      await this.loadChats();
    }
  },
  
  async deleteChat(chatId) {
    if (!confirm('Delete this imported chat?')) return;
    
    if (typeof PSDatabase !== 'undefined') {
      await PSDatabase.delete('imported_chats', chatId);
      await this.loadChats();
      
      if (this.currentChat?.id === chatId) {
        this.currentChat = this.chats[0] || null;
      }
      
      this.render();
    }
  },
  
  escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  },
  
  formatDate(timestamp) {
    if (!timestamp) return '';
    return new Date(timestamp).toLocaleDateString('en-US', { 
      month: 'short', 
      day: 'numeric',
      year: 'numeric'
    });
  },
  
  formatMessageTime(timestamp) {
    if (!timestamp) return '';
    if (typeof timestamp === 'string') return timestamp;
    return new Date(timestamp).toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit'
    });
  }
};

// Expose both systems
window.AISystem = AISystem;
window.PSAISystem = AISystem;
window.ImportedChatViewer = ImportedChatViewer;

// Auto-initialize when DOM ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => {
    AISystem.init();
    ImportedChatViewer.init();
  });
} else {
  AISystem.init();
  ImportedChatViewer.init();
}