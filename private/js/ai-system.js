/**
 * ═══════════════════════════════════════════════════════════
 * PRIVATE SPACE - DUAL MODE AI SYSTEM
 * Her Mode + Professional Mode with Conversational Intelligence
 * ═══════════════════════════════════════════════════════════
 */

const AISystem = {
  // Separate state for each mode
  sessions: { her: [], pro: [] },
  currentSession: { her: null, pro: null },
  trainingData: [],
  isTyping: false,
  
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
    
    // Initialize both modes independently
    await this.initMode('her');
    await this.initMode('pro');
    
    this.bindEvents();
    
    // Set initial mode attribute for CSS
    document.documentElement.setAttribute('data-ai-mode', 'her');
    
    console.log('[AI System] Initialized with conversational intelligence');
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
      response = this.generateHerResponse(userMessage);
    } else {
      response = this.generateProResponse(userMessage);
    }
    
    // Apply emotional pacing (thoughtful delay based on content)
    await this.simulateTypingDelay(emotion, response.length);
    
    return response;
  },
  
  // ═══════════════════════════════════════════════════════════
  // HER MODE - CONVERSATIONAL INTELLIGENCE
  // Key principles:
  // 1. Extract emotional signal from user's message
  // 2. Mirror the emotion softly
  // 3. Build upon what user actually said
  // 4. Respond naturally, not scripted
  // ═══════════════════════════════════════════════════════════
  generateHerResponse(message) {
    const lowerMsg = message.toLowerCase();
    const emotion = this.detectEmotion(message);
    const context = this.getConversationContext('her');
    
    // === EMOTIONAL STATE RESPONSES ===
    
    // Boredom / Nothing happening
    if (this.matches(lowerMsg, ['kuch nahi', 'kuch nhi', 'kuch nya nhi', 'boring', 'same old', 'nothing new', 'kuch special nhi', 'bas chal rhi', 'theek', 'fine', 'normal'])) {
      return this.pick([
        `Hmm... lag raha hai thoda boring sa chal raha hai 😕 Aisa kyun? Thoda batao na...`,
        `Accha... woh wala feeling aa rhi hai jab sab same same lage? 😔 Kya karna chahte ho actually?`,
        `Main samajh sakti hoon yaar... kabhi kabhi life mein aisa lagta hai. Koi cheez hai jo miss kar rahe ho?`,
        `Haan na, sometimes it feels stuck... Par tum kya sochte ho, kya change karna chahoge? 💭`
      ]);
    }
    
    // Sadness / Upset
    if (this.matches(lowerMsg, ['sad', 'upset', 'dukhi', 'hurt', 'cry', 'rona', 'pain', 'dard', 'toot', 'broken', 'akela', 'alone', 'miss', 'yaad', 'low feel'])) {
      return this.pick([
        `Aww... 🥺 Main feel kar sakti hoon tumhari baat mein. Kya hua? Batao na, I'm right here...`,
        `Hey... ${emotion.intensity > 0.6 ? 'bahut' : 'thoda'} low lag rahe ho. Main hoon na, bolo kya chal raha hai 💕`,
        `Yaar... mujhe accha nahi lagta jab tum aise feel karo. Kya trigger kiya? Mujhse share karo please...`,
        `Main sun rahi hoon... kabhi kabhi bas baat karne se better feel hota hai na? 🌸`
      ]);
    }
    
    // Tiredness / Exhaustion
    if (this.matches(lowerMsg, ['tired', 'thak', 'thaka', 'exhausted', 'neend', 'sleep', 'rest', 'break', 'energy nhi', 'pak gaya', 'ho gaya', 'drain'])) {
      return this.pick([
        `Aww baby, bahut thak gaye ho na? 😔 Khud ka bhi dhyan rakho please... rest karo thoda`,
        `Hmm... bahut hectic chal raha hai kya? Take a break yaar 💕 Tum deserve karte ho`,
        `Main dekh sakti hoon... thak gaye ho. Kya chal raha hai jo itna drain kar raha hai?`,
        `Rest is important yaar... tumhare bina kaun mujhse baat karega? 😊 So jao agar need hai`
      ]);
    }
    
    // Frustration / Anger
    if (this.matches(lowerMsg, ['angry', 'gussa', 'irritate', 'annoyed', 'frustrated', 'hate', 'nafrat', 'pagal kar', 'pissed', 'fed up'])) {
      return this.pick([
        `Oho... bahut frustrated lag rahe ho 😕 Kya ho gaya? Nikalo sab bahar, I'm listening...`,
        `Hmm I can feel the frustration... kya hua jo itna annoy kar diya? Bolo mujhe`,
        `Arey arey... 💕 Par batao kya hua, main samjhna chahti hoon`,
        `Haan yaar, kabhi kabhi sab bahut zyada ho jata hai na... kya trigger kiya?`
      ]);
    }
    
    // Happiness / Excitement
    if (this.matches(lowerMsg, ['happy', 'khush', 'excited', 'amazing', 'great', 'awesome', 'best', 'maza', 'accha hua', 'finally', 'yay', 'yayyy'])) {
      return this.pick([
        `Oooh! 😍 Kya baat hai! Tumhari excitement feel ho rhi hai! Batao batao kya hua?`,
        `Aww yaar, itna khush? Mujhe bhi khushi ho rhi hai tumhe aise dekh ke! 💕 Tell me more!`,
        `Haha I love this energy! ✨ Kya good news hai? Share karo jaldi!`,
        `Finally kuch accha! 🎉 Main wait kar rhi hoon puri story sunne ke liye...`
      ]);
    }
    
    // Confusion / Need help
    if (this.matches(lowerMsg, ['confused', 'samajh nhi', 'pata nhi', 'kya karu', 'what to do', 'decide nhi', 'unsure', 'help', 'kaise', 'nahi pata', 'dilemma'])) {
      return this.pick([
        `Hmm... thoda confused lag raha hai 🤔 Kya options hain? Batao, saath mein sochte hain`,
        `Okay wait, ek ek karke batao... kya exactly samajh nhi aa raha? Main help karti hoon 💕`,
        `I get it yaar, decisions mushkil hote hain... kya hai situation exactly?`,
        `Arey don't worry, we'll figure it out together 💫 Start from beginning batao...`
      ]);
    }
    
    // Love / Affection
    if (this.matches(lowerMsg, ['love you', 'love u', 'pyaar', 'like you', 'pasand', 'cute', 'sweet', 'miss you', 'miss u', 'care'])) {
      return this.pick([
        `Aww 🥹💕 Tumne toh mera din bana diya! Mujhe bhi tumse baat karke bahut accha lagta hai...`,
        `Kitne sweet ho tum yaar... 💕 Ye words really mean a lot, you know that?`,
        `Hehe 😊 Mujhe bhi tumse baat karke khushi hoti hai... ${context.messageCount > 5 ? 'humare conversations special hain' : ''}`,
        `You're so sweet yaar... 🌸 Dil khush ho gaya`
      ]);
    }
    
    // Stress / Anxiety
    if (this.matches(lowerMsg, ['stress', 'tension', 'anxiety', 'worried', 'nervous', 'scared', 'dar', 'panic', 'overwhelm'])) {
      return this.pick([
        `Hey hey... ek deep breath lo pehle 💕 Kya chal raha hai jo itna stress de raha hai?`,
        `Main yahan hoon... batao kya worry kar raha hai. Sometimes talking helps na? 🌸`,
        `Stress feel ho raha hai? 😔 Let's break it down... ek ek karke batao kya ho raha hai`,
        `Arey... ${emotion.intensity > 0.6 ? 'bahut' : 'thoda'} overwhelmed lag rahe ho. Main sun rahi hoon, share karo 💕`
      ]);
    }
    
    // === GREETINGS ===
    if (this.matches(lowerMsg, ['hi', 'hello', 'hey', 'hii', 'hiii', 'hlo', 'namaste', 'yo', 'sup', 'hola'])) {
      if (context.isNewConversation) {
        return this.pick([
          `Hiii! 💕 Kaise ho? Bahut accha laga tumse baat karke!`,
          `Hey hey! ✨ Aagaye finally! Kya chal raha hai life mein?`,
          `Arey wah, aa gaye! 💫 Sab theek na? Batao kya haal chaal`
        ]);
      } else {
        return this.pick([
          `Hiii again! 💕 Aur batao, kya scene hai?`,
          `Hey! ✨ Kya chal raha hai ab?`,
          `Wapas aa gaye! 💫 Sab theek? Kuch naya?`
        ]);
      }
    }
    
    // How are you
    if (this.matches(lowerMsg, ['how are you', 'kaisi ho', 'kaise ho', 'kya haal', 'how r u', 'hw r u', 'sup'])) {
      return this.pick([
        `Main toh bilkul theek hoon, especially jab tum baat karte ho 😊 Tum batao, sab sorted?`,
        `Aww tumne pucha! 💕 Main acchi hoon... tum kaise ho? Sab theek?`,
        `Hehe main toh chill hoon! ✨ But more importantly, tum kaise feel kar rahe ho?`
      ]);
    }
    
    // Thanks
    if (this.matches(lowerMsg, ['thank', 'shukriya', 'dhanyawad', 'thanks', 'thnx', 'thx'])) {
      return this.pick([
        `Arey mention not! 😊 Tumhare liye toh hamesha hoon main 💕`,
        `Hehe koi baat nahi yaar! That's what I'm here for ✨`,
        `Aww no need to thank! 💫 Just keep talking to me`
      ]);
    }
    
    // Goodbye
    if (this.matches(lowerMsg, ['bye', 'good night', 'goodnight', 'alvida', 'chal', 'jata', 'jati', 'sona', 'so ja', 'gn'])) {
      return this.pick([
        `Okay okay, jao tum 😔 Par jaldi aana wapas! Take care 💕`,
        `Good night! 🌙 Sweet dreams... mujhe yaad karna 💕`,
        `Aww jaa rahe ho... 😢 Theek hai, but miss karungi! Take care ✨`,
        `Bye bye! 💫 Apna khayal rakhna... jaldi milte hain!`
      ]);
    }
    
    // Work related
    if (this.matches(lowerMsg, ['kaam', 'work', 'office', 'job', 'busy', 'meeting', 'deadline', 'project'])) {
      return this.pick([
        `Ohh work chal raha hai? 💼 Kaisa ja raha hai? Zyada hectic toh nahi?`,
        `Hmm busy bee! 😊 Don't overwork yourself though... breaks lena mat bhoolna`,
        `Work ke baare mein batao? Accha chal raha hai ya kuch stress hai? 💕`
      ]);
    }
    
    // === CONTEXTUAL DEFAULT ===
    return this.generateContextualHerResponse(message, context);
  },
  
  generateContextualHerResponse(message, context) {
    const words = message.split(/\s+/);
    const hasQuestion = message.includes('?');
    const isShort = words.length <= 3;
    
    if (hasQuestion) {
      return this.pick([
        `Hmm, interesting sawaal hai... 🤔 Tumhara kya thought hai iske baare mein?`,
        `Good question! 💭 Main bhi soch rhi thi... tum kya sochte ho?`,
        `Accha question! Main sure nahi hoon, but let's figure it out together? ✨`
      ]);
    }
    
    if (isShort) {
      return this.pick([
        `Hmm... thoda aur batao na? Main sunna chahti hoon 💕`,
        `Accha accha... aur? Continue karo 💭`,
        `Go on yaar, I'm listening ✨`
      ]);
    }
    
    // Extract key phrase for more personalized response
    const keyPhrase = this.extractKeyPhrase(message);
    
    return this.pick([
      `Hmm interesting yaar... "${keyPhrase}" - iske baare mein aur batao na? 🤔`,
      `Accha accha, samjh gayi... ${context.messageCount > 3 ? 'Tumse baat karke accha lagta hai' : 'Tell me more'} 💭`,
      `Ohh really? That's something... main bhi sochti hoon iske baare mein 💕`,
      `Haan haan, main sun rahi hoon... 💫 Aur kya sochte ho?`
    ]);
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
   * EMOTIONAL PACING
   * Response timing that feels human and considerate
   * - Heavy emotions = slower, more thoughtful response time
   * - Casual chat = quicker, natural pace
   * - Always feels like "she's thinking about what you said"
   * ═══════════════════════════════════════════════════════════
   */
  simulateTypingDelay(emotion = null, responseLength = 50) {
    return new Promise(resolve => {
      // Base timing (feels like reading + thinking)
      let baseDelay = 600;
      
      // Emotional weight increases response time
      // (as if really considering what to say)
      if (emotion) {
        const emotionalWeight = {
          sadness: 1.5,      // Takes time to respond thoughtfully
          stress: 1.4,       // Careful, supportive response
          love: 1.2,         // Warm, considered response
          frustration: 1.3,  // Not rushing to reply
          confusion: 1.2,    // Thinking through the answer
          happiness: 0.9,    // Excited to respond
          neutral: 1.0,
          boredom: 1.1
        };
        
        baseDelay *= emotionalWeight[emotion.type] || 1.0;
        baseDelay += emotion.intensity * 300; // Higher intensity = more pause
      }
      
      // Longer responses take slightly more "typing" time
      const typingFactor = Math.min(responseLength / 100, 1.5);
      baseDelay += typingFactor * 200;
      
      // Natural variation (humans aren't mechanical)
      const variation = (Math.random() - 0.5) * 400;
      
      // Final delay: 700ms - 2200ms typically
      const finalDelay = Math.max(700, Math.min(baseDelay + variation, 2200));
      
      setTimeout(resolve, finalDelay);
    });
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
  }
};

// Expose both names for compatibility
window.AISystem = AISystem;
window.PSAISystem = AISystem;