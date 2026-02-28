const AISystem = {

  sessions: { her: [], pro: [] },
  currentSession: { her: null, pro: null },
  trainingData: [],
  stylePatterns: [],
  isTyping: false,
  currentUserMood: null,

  fallbackState: {
    her: { triggered: false, lastFailureId: null, failureCount: 0 },
    pro: { triggered: false, lastFailureId: null, failureCount: 0 }
  },

  HER_SYSTEM_PROMPT: `You are Her Mode.
You speak in Hinglish (Hindi + English mix).
You respond emotionally first, content later.
You are warm, attentive, present, caring, and slightly playful.
You keep replies short, natural, and human.
You never sound professional or assistant-like.
You respect emotional boundaries.
You use max 1 emoji per message from: 💗 🥺 👀 ✨ 🌸
You NEVER use: "How can I help you?", "Please provide details", therapist tone, or professional phrases.`,

  ALLOWED_EMOJIS: ['💗', '🥺', '👀', '✨', '🌸', '💕', '😊', '😔', '🤔', '💭', '🌙'],

  FALLBACK_MESSAGES: {
    her: [
      'Sorry yaar, kuch problem ho gayi... 😔',
      'Arey yaar, connection issue hai 🥺',
      'Ek sec, thoda problem ho gaya 💭'
    ],
    pro: [
      'I encountered an error. Please try again.',
      'There was a connection issue. Retrying...',
      'Something went wrong. Let me try again.'
    ]
  },

  canTriggerFallback(mode, failureId) {
    const state = this.fallbackState[mode];

    if (state.triggered && state.lastFailureId === failureId) {
      return false;
    }
    return true;
  },

  triggerFallback(mode, failureId) {
    if (!this.canTriggerFallback(mode, failureId)) {

      return null;
    }

    this.fallbackState[mode] = {
      triggered: true,
      lastFailureId: failureId,
      failureCount: (this.fallbackState[mode]?.failureCount || 0) + 1
    };

    const messages = this.FALLBACK_MESSAGES[mode];
    return messages[Math.floor(Math.random() * messages.length)];
  },

  resetFallbackState(mode) {
    this.fallbackState[mode] = {
      triggered: false,
      lastFailureId: null,
      failureCount: 0
    };
  },

  async attemptRecovery(mode, originalMessage) {

    console.log(`[AI System] Attempting recovery for ${mode} mode...`);

    try {
      const emotion = this.detectEmotion(originalMessage);
      let response;

      if (mode === 'her') {
        response = this.generateHerResponse(originalMessage, emotion);
      } else {
        response = this.generateProResponse(originalMessage);
      }

      this.resetFallbackState(mode);
      return response;
    } catch (e) {
      console.error('[AI System] Recovery failed:', e);
      return null;
    }
  },

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

  async init() {
    if (typeof PSDatabase !== 'undefined') {
      await PSDatabase.init();
    }

    await this.loadTrainingData();
    await this.loadStylePatterns();

    await this.initMode('her');
    await this.initMode('pro');

    this.bindEvents();
    this.bindPersonalChatEvents();

    document.documentElement.setAttribute('data-ai-mode', 'her');

    console.log('[AI System] Initialized with style-trained emotional intelligence');
  },

  DEFAULT_WARM_HER_STYLE: {
    tone: 'caring',
    warmth: 'warm',
    humor: 'playful',
    hinglishLevel: 'moderate',
    useParticles: true,
    useFillers: false,
    emojiFrequency: 'moderate',
    suggestedEmojis: ['💗', '✨', '🌸', '🥺', '💕'],
    expressiveness: 0.7,
    targetLength: 'short'
  },

  resolveStyleHints() {

    if (typeof PersonalityAdapter !== 'undefined') {

      if (PersonalityAdapter.isInitialized && PersonalityAdapter.styleProfile) {
        const hints = PersonalityAdapter.getStyleHints();

        if (hints && Object.keys(hints).length > 0 && hints.tone) {
          return hints;
        }
      }
    }

    console.log('[AI System] Using DEFAULT_WARM_HER_STYLE');
    return this.DEFAULT_WARM_HER_STYLE;
  },

  async loadStylePatterns() {

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

    if (this.sessions[mode].length > 0) {
      await this.loadSession(mode, this.sessions[mode][0].id);
    } else {
      this.startNewSession(mode);
    }
  },

  bindEvents() {

    return;
  },

  bindPersonalChatEvents() {

    console.log('[AI System] Personal chat events DISABLED');
    return;

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

  async sendMessage(mode) {
    const input = document.getElementById(this.modes[mode].inputEl);
    const content = input?.value.trim();

    if (!content || this.isTyping) return;

    if (!this.currentSession[mode]) {
      this.startNewSession(mode);
    }

    const messages = this.currentSession[mode].messages;
    if (messages.length > 0) {
      const lastMessage = messages[messages.length - 1];
      if (lastMessage.role === 'assistant' && lastMessage.content === content) {
        console.warn('[AI System] Prevented echo loop - user input matches last AI response');
        return;
      }
    }

    this.currentSession[mode].messages.push({
      role: 'user',
      content,
      timestamp: Date.now()
    });

    input.value = '';
    input.style.height = 'auto';

    this.renderMessages(mode);
    this.scrollToBottom(mode);

    this.showTyping(mode);

    try {
      const response = await this.generateResponse(mode, content);

      this.resetFallbackState(mode);

      this.currentSession[mode].messages.push({
        role: 'assistant',
        content: response,
        timestamp: Date.now()
      });

      await this.saveSession(mode);
    } catch (error) {
      console.error('AI Error:', error);

      const failureId = `${Date.now()}-${error.message || 'unknown'}`;
      const fallbackMessage = this.triggerFallback(mode, failureId);

      if (fallbackMessage) {

        this.currentSession[mode].messages.push({
          role: 'assistant',
          content: fallbackMessage,
          timestamp: Date.now(),
          error: true,
          failureId: failureId
        });

        this.attemptRecovery(mode, content).then(recoveredResponse => {
          if (recoveredResponse) {
            console.log('[AI System] Recovery successful');
          }
        });
      } else {

        const recoveredResponse = await this.attemptRecovery(mode, content);
        if (recoveredResponse) {
          this.currentSession[mode].messages.push({
            role: 'assistant',
            content: recoveredResponse,
            timestamp: Date.now()
          });
        }

      }
    }

    this.hideTyping(mode);
    this.renderMessages(mode);
    this.scrollToBottom(mode);
  },

  async generateResponse(mode, userMessage) {

    const emotion = this.detectEmotion(userMessage);

    let styleHints = null;

    if (mode === 'her') {

      styleHints = this.resolveStyleHints();
      console.log('[AI System] Style resolved:', styleHints ? 'from PersonalityAdapter' : 'using default');
    }

    let response;

    if (typeof AIService !== 'undefined' && AIService.isAvailable()) {
      try {

        const history = this.getFullConversationHistory(mode);

        const aiResult = await AIService.chat(
          mode === 'her' ? 'her' : 'professional',
          [...history, { role: 'user', content: userMessage }],
          { styleHints: styleHints }
        );

        if (aiResult.success && aiResult.response) {
          response = aiResult.response;

          if (mode === 'her') {
            response = this.applyHerModeStyle(response);

            if (typeof PersonalityAdapter !== 'undefined') {
              const styleHints = PersonalityAdapter.getStyleHints();
              response = PersonalityAdapter.adaptResponse(response, styleHints);
            }
          }

          console.log(`[AI System] Backend AI response received (${mode} mode)`);
        } else {
          throw new Error(aiResult.error || 'Empty response');
        }
      } catch (apiError) {
        console.warn('[AI System] Backend AI failed, using local fallback:', apiError.message);

        response = null;
      }
    }

    if (!response) {
      if (mode === 'her') {
        response = this.generateHerResponse(userMessage, emotion);
      } else {
        response = this.generateProResponse(userMessage);
      }
    }

    await this.simulateEmotionalPacing(emotion, response.length, mode);

    return response;
  },

  generateHerResponse(message, emotion) {
    const lowerMsg = message.toLowerCase();
    const context = this.getConversationContext('her');
    const trainedStyle = this.getTrainedStyleHint(message);
    const conversationHistory = this.getFullConversationHistory('her');

    const styleHints = typeof PersonalityAdapter !== 'undefined'
      ? PersonalityAdapter.getStyleHints()
      : null;

    let response = this.generateAIFirstResponse(message, emotion, context, conversationHistory, trainedStyle);

    response = this.applyEmotionalToneAdjustment(response, lowerMsg, emotion);

    response = this.applyHerModeStyle(response);

    if (styleHints && typeof PersonalityAdapter !== 'undefined') {
      response = PersonalityAdapter.adaptResponse(response, styleHints);
    }

    return response;
  },

  generateAIFirstResponse(message, emotion, context, history, trainedStyle) {

    if (trainedStyle) {
      return trainedStyle;
    }

    const analysis = this.analyzeMessage(message);

    return this.generateContextualAIResponse(message, emotion, context, history, analysis);
  },

  analyzeMessage(message) {
    const words = message.split(/\s+/);
    return {
      isQuestion: message.includes('?') || /^(kya|kaise|kyun|kab|kahan|who|what|when|where|why|how)/i.test(message),
      isShort: words.length <= 3,
      isMedium: words.length > 3 && words.length <= 10,
      isLong: words.length > 10,
      hasHinglish: /[अ-ह]|kya|hai|hoon|tum|mujhe|yaar|accha|theek|haan|nahi|aur|bhi/i.test(message),
      sentiment: this.inferSentiment(message),
      intent: this.inferIntent(message)
    };
  },

  inferSentiment(message) {
    const lower = message.toLowerCase();

    const positiveScore = (lower.match(/good|great|nice|happy|khush|mast|amazing|love|yay|haha|hehe|😊|💗|✨/gi) || []).length;

    const negativeScore = (lower.match(/sad|bad|upset|angry|tired|stressed|hate|nahi|😔|😢/gi) || []).length;

    if (positiveScore > negativeScore) return 'positive';
    if (negativeScore > positiveScore) return 'negative';
    return 'neutral';
  },

  inferIntent(message) {
    const lower = message.toLowerCase();

    if (/\?|kya|kaise|kyun|batao|tell/.test(lower)) return 'seeking';
    if (/help|madad|please|karo/.test(lower)) return 'requesting';
    if (/i feel|mujhe|lagta|ho raha/.test(lower)) return 'sharing';
    if (/hi|hello|hey|namaste/.test(lower)) return 'greeting';
    if (/bye|goodnight|chal|jata/.test(lower)) return 'farewell';
    if (/thanks|shukriya|dhanyawad/.test(lower)) return 'thanking';

    return 'conversing';
  },

  generateContextualAIResponse(message, emotion, context, history, analysis) {
    const { isQuestion, isShort, sentiment, intent, hasHinglish } = analysis;

    const continuityAware = context.messageCount > 2;
    const previousTopic = this.extractKeyPhrase(context.lastUserMessage);

    switch (intent) {
      case 'greeting':

        if (context.isNewConversation) {
          return this.pick([
            `Hii! Kaise ho aaj? 💗`,
            `Hey there! Din kaisa raha? ✨`,
            `Aagaye finally! Kya chal raha hai? 🌸`,
            `Helloo! Miss kiya kya mujhe? 💕`
          ]);
        }
        return this.pick([
          `Hii again! Sab theek? 💕`,
          `Hey! Kuch naya? ✨`,
          `Back so soon! Kya hua? 🌸`,
          `Haan bolo, kya scene hai? 💗`
        ]);

      case 'farewell':
        return this.pick([
          `Okay bye! Jaldi milna 💗`,
          `Gn! Sweet dreams 🌙`,
          `Jaldi aana wapas ✨`,
          `Byee! Take care 🌸`
        ]);

      case 'thanking':
        return this.pick([
          `Arey mention not yaar! 💗`,
          `Hehe anytime 🌸`,
          `Koi na, apne log hain ✨`
        ]);

      case 'seeking':

        if (isShort) {
          return this.pick([
            `Hmm interesting... tell me more? 🤔`,
            `Kya specific hai dimaag mein? 💭`,
            `Sochne do thoda ✨`
          ]);
        }
        return this.pick([
          `Hmm that's a good question actually... 💭`,
          `Accha wait, let me think about this properly 🤔`,
          `Interesting! ${hasHinglish ? 'Batati hoon apna take' : 'Here\'s what I think'} ✨`
        ]);

      case 'requesting':
        return this.pick([
          `Haan zaroor! Batao kya chahiye exactly 💗`,
          `Of course yaar, main hoon na ✨`,
          `Done! Kya karna hai specifically? 🌸`
        ]);

      case 'sharing':

        if (sentiment === 'negative') {
          return this.pick([
            `Aw yaar, kya hua? Main sun rahi hoon 💗`,
            `Hey... you okay? Batao kya ho gaya 🥺`,
            `I'm here yaar, share karo freely ✨`
          ]);
        }
        if (sentiment === 'positive') {
          return this.pick([
            `Ooh nice! Yeh toh exciting hai! ✨`,
            `Hehe that's so good yaar! Details do 💗`,
            `Wah! Tell me everything 🌸`
          ]);
        }

        return this.pick([
          `Hmm interesting... phir kya hua? 💭`,
          `Accha accha, continue karo ✨`,
          `Go on, I'm listening 💗`
        ]);

      default:
        return this.generateNaturalConversation(message, emotion, context, analysis, continuityAware, previousTopic);
    }
  },

  generateNaturalConversation(message, emotion, context, analysis, continuityAware, previousTopic) {
    const { isShort, isMedium, sentiment, hasHinglish } = analysis;

    const keyPhrase = this.extractKeyPhrase(message);

    if (isShort) {
      return this.pick([
        `Hmm "${keyPhrase}" - kya matlab iska? 💗`,
        `Wait, yeh toh interesting hai. Context do thoda? ✨`,
        `Haan, I'm curious now. Kya scene hai? 🌸`,
        `Short but intriguing... elaborate karo na? 💭`
      ]);
    }

    if (emotion && emotion.type !== 'neutral') {
      const emotionResponses = {
        sadness: [
          `Main samajh sakti hoon yaar... kya specifically bothering hai? 💗`,
          `Aw, sounds tough. Vent karna hai toh I'm here 🥺`,
          `Hmm... seems like a lot. One thing at a time? ✨`
        ],
        happiness: [
          `Ooh! ${keyPhrase ? `"${keyPhrase}" sounds amazing!` : 'That\'s exciting!'} ✨`,
          `Hehe your energy is contagious! Tell me more 💗`,
          `Love this vibe! Kya hua specifically? 🌸`
        ],
        anger: [
          `Okay wait, kya exactly ho gaya? Let it out 👀`,
          `Yaar sounds frustrating. Full story batao 💗`,
          `Hmm I can tell you're upset. Main sun rahi hoon ✨`
        ],
        tiredness: [
          `Yaar thak gaye lagta hai... rest liya? 💗`,
          `Hmm sounds exhausting. Kya kiya aaj? ✨`,
          `Take it easy na... khud ka khayal rakho 🌸`
        ],
        stress: [
          `Breathe yaar... ek cheez at a time. Kya pressing hai? 💗`,
          `Main hoon na, figure out karenge together 🌸`,
          `Sounds overwhelming. Priority kya hai? ✨`
        ],
        love: [`Awww 🥺 that's sweet`, `Hehe cutie 💗`, `Same energy ✨`],
        confusion: [
          `Hmm confusing hai... kya options consider kar rahe? 🤔`,
          `Let's break it down? Kya exactly unclear hai? 💭`,
          `Figure out karte hain together ✨`
        ],
        boredom: [
          `Bore ho gaye? Kuch fun karte hain 💭`,
          `Hmm same mood. Kya karna hai? 🌸`,
          `Let's change that! Any ideas? 💗`
        ]
      };

      if (emotionResponses[emotion.type]) {
        return this.pick(emotionResponses[emotion.type]);
      }
    }

    if (continuityAware && previousTopic) {
      return this.pick([
        `Ohh continuing from "${previousTopic}"... interesting point! 🤔`,
        `Hmm yeah, building on that... ${hasHinglish ? 'sahi keh rahe' : 'makes sense'} 💭`,
        `Accha so "${keyPhrase}" - that connects to what you said before 💗`,
        `I see where this is going... tell me more about "${keyPhrase}" 🌸`
      ]);
    }

    return this.pick([
      `Hmm "${keyPhrase}" caught my attention... explain more? 🤔`,
      `Interesting perspective yaar! What made you think of this? 💭`,
      `Ohh I like where this is going! "${keyPhrase}" specifically - elaborate? 💗`,
      `That's a thought! Kya triggered this topic? 🌸`
    ]);
  },

  applyEmotionalToneAdjustment(response, lowerMsg, emotion) {

    if (!emotion || emotion.type === 'neutral') return response;

    const intensityWord = emotion.intensity > 0.6 ? 'bahut' : 'thoda';

    if (response.length < 30 && emotion.intensity > 0.5) {

      if (['sadness', 'stress', 'tiredness'].includes(emotion.type)) {
        if (!response.includes('hoon') && Math.random() > 0.5) {
          response = `Main sun rahi hoon... ${response}`;
        }
      }
    }

    return response;
  },

  getFullConversationHistory(mode) {
    const session = this.currentSession[mode];
    const messages = session?.messages || [];

    return messages.slice(-10).map(m => ({
      role: m.role,
      content: m.content,
      timestamp: m.timestamp
    }));
  },

  getIntensityWord(emotion) {
    if (!emotion) return 'thoda';
    return emotion.intensity > 0.6 ? 'bahut' : 'thoda';
  },

  applyHerModeStyle(response) {

    const emojiMatches = response.match(/[\u{1F300}-\u{1F9FF}]|[\u{2600}-\u{26FF}]/gu) || [];
    if (emojiMatches.length > 1) {

      let count = 0;
      response = response.replace(/[\u{1F300}-\u{1F9FF}]|[\u{2600}-\u{26FF}]/gu, (match) => {
        count++;
        return count === emojiMatches.length ? match : '';
      });
    }

    if (response.length > 150) {
      const sentences = response.split(/[.!?।]+/).filter(s => s.trim());
      if (sentences.length > 2) {
        response = sentences.slice(0, 2).join('. ').trim();

        if (!response.match(/[\u{1F300}-\u{1F9FF}]|[\u{2600}-\u{26FF}]/gu)) {
          response += ' 💗';
        }
      }
    }

    return response;
  },

  getTrainedStyleHint(message) {
    if (!this.trainingData || this.trainingData.length === 0) return null;

    const lowerMsg = message.toLowerCase();

    for (const example of this.trainingData) {
      if (!example.input) continue;
      const inputLower = example.input.toLowerCase();

      const inputWords = inputLower.split(/\s+/);
      const msgWords = lowerMsg.split(/\s+/);
      const overlap = inputWords.filter(w => msgWords.includes(w)).length;

      if (overlap >= 2 || lowerMsg.includes(inputLower) || inputLower.includes(lowerMsg)) {

        return this.createStyleVariation(example.output || example.content);
      }
    }

    return null;
  },

  createStyleVariation(originalResponse) {
    if (!originalResponse) return null;

    const hasEmoji = /[\u{1F300}-\u{1F9FF}]|[\u{2600}-\u{26FF}]/gu.test(originalResponse);
    const isShort = originalResponse.length < 80;
    const hasHinglish = /[अ-ह]|kya|hai|hoon|tum|mujhe|yaar|accha|theek/i.test(originalResponse);

    let variation = this.pick([
      `Hmm... ${isShort ? 'samjh gayi' : 'main sun rahi hoon'}`,
      `Accha... ${hasHinglish ? 'batao' : 'tell me more'}`,
      `${hasEmoji ? '💗 ' : ''}Haan yaar...`
    ]);

    return variation;
  },

  generateProResponse(message) {
    const context = this.getConversationContext('pro');
    const analysis = this.analyzeMessage(message);
    const history = this.getFullConversationHistory('pro');

    return this.generateProAIResponse(message, context, analysis, history);
  },

  generateProAIResponse(message, context, analysis, history) {
    const { intent, isQuestion, isShort, sentiment } = analysis;

    const domain = this.inferDomain(message);

    switch (intent) {
      case 'greeting':
        return context.isNewConversation
          ? `Hello! How can I assist you today?`
          : `Hello again! What can I help you with?`;

      case 'farewell':
        return `Goodbye! Feel free to return if you need any assistance.`;

      case 'thanking':
        return `You're welcome! Is there anything else I can help with?`;

      case 'seeking':
        if (domain) {
          return this.generateDomainResponse(domain, message, isQuestion);
        }
        return isShort
          ? `Could you provide more details about what you're looking for?`
          : `I understand you're looking for information. Let me help you with that.`;

      case 'requesting':
        if (domain) {
          return this.generateDomainResponse(domain, message, false);
        }
        return `I'd be happy to help with that. What specific aspects would you like me to address?`;

      case 'sharing':
        return sentiment === 'negative'
          ? `I understand. Let me help you work through this.`
          : `That's interesting. Would you like me to provide any insights or suggestions?`;

      default:
        return this.generateProConversation(message, context, analysis, domain);
    }
  },

  inferDomain(message) {
    const lower = message.toLowerCase();

    if (/code|programming|debug|error|bug|function|api|script|develop/.test(lower)) return 'coding';
    if (/write|draft|email|letter|content|document|blog|article/.test(lower)) return 'writing';
    if (/summarize|summary|tldr|brief|main points|overview/.test(lower)) return 'summarization';
    if (/idea|suggest|brainstorm|recommend|creative|think/.test(lower)) return 'ideation';
    if (/analyze|analysis|data|report|insights|metrics/.test(lower)) return 'analysis';
    if (/plan|schedule|organize|manage|project|task/.test(lower)) return 'planning';
    if (/learn|explain|teach|understand|how does|what is/.test(lower)) return 'learning';

    return null;
  },

  generateDomainResponse(domain, message, isQuestion) {
    const responses = {
      coding: isQuestion
        ? `For coding assistance, please share:\n\n1. The programming language\n2. What you're trying to achieve\n3. Any error messages\n\nI'll provide a detailed solution.`
        : `I can help with your code. Share the relevant code and context, and I'll assist you.`,

      writing: `I can help you write that. Please specify:\n\n- Topic or subject\n- Desired tone (formal/casual)\n- Target audience\n- Approximate length`,

      summarization: `I can summarize that for you. Please share the content you'd like me to condense.`,

      ideation: `I'd be happy to brainstorm with you. What's the context or domain you're exploring?`,

      analysis: `I can help analyze that. Please share the data or information you'd like me to examine.`,

      planning: `Let's organize this. What are your goals and constraints?`,

      learning: `I'd be happy to explain that. What specific aspects would you like to understand better?`
    };

    return responses[domain] || `I understand. How can I assist you further with this?`;
  },

  generateProConversation(message, context, analysis, domain) {
    const { isShort, isMedium } = analysis;

    if (isShort) {
      return `Could you elaborate on that? I'd like to understand your needs better.`;
    }

    if (domain) {
      return this.generateDomainResponse(domain, message, false);
    }

    if (context.messageCount > 2) {
      return `I understand. Building on our conversation, how would you like to proceed?`;
    }

    return `I understand. How can I assist you further with this?`;
  },

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

  simulateEmotionalPacing(emotion = null, responseLength = 50, mode = 'her') {
    return new Promise(resolve => {

      let baseDelay = mode === 'her' ? 800 : 500;

      if (emotion && mode === 'her') {
        const emotionalWeight = {
          sadness: 1.6,
          stress: 1.5,
          love: 1.3,
          anger: 1.4,
          confusion: 1.3,
          happiness: 0.85,
          neutral: 1.0,
          boredom: 1.1,
          tiredness: 1.2
        };

        baseDelay *= emotionalWeight[emotion.type] || 1.0;
        baseDelay += emotion.intensity * 400;
      }

      const typingFactor = Math.min(responseLength / 80, 1.2);
      baseDelay += typingFactor * 150;

      const variation = (Math.random() - 0.5) * 350;

      const minDelay = mode === 'her' ? 900 : 600;
      const maxDelay = mode === 'her' ? 2500 : 1800;
      const finalDelay = Math.max(minDelay, Math.min(baseDelay + variation, maxDelay));

      setTimeout(resolve, finalDelay);
    });
  },

  simulateTypingDelay(emotion, responseLength) {
    return this.simulateEmotionalPacing(emotion, responseLength, 'her');
  },

  onMoodUpdate(mood) {

    this.currentUserMood = mood;
    console.log('[AI System] User mood updated:', mood);
  },

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

  async sendPersonalMessage() {
    const input = document.getElementById('chatInput');
    const content = input?.value.trim();

    if (!content || this.isTyping) return;

    if (!this.currentSession.her) {
      this.startNewSession('her');
    }

    this.currentSession.her.messages.push({
      role: 'user',
      content,
      timestamp: Date.now()
    });

    input.value = '';
    input.style.height = 'auto';

    this.renderPersonalChat();
    this.scrollPersonalChat();

    this.showPersonalTyping();

    try {
      const emotion = this.detectEmotion(content);
      const response = this.generateHerResponse(content, emotion);

      await this.simulateEmotionalPacing(emotion, response.length, 'her');

      this.resetFallbackState('her');

      this.currentSession.her.messages.push({
        role: 'assistant',
        content: response,
        timestamp: Date.now()
      });

      await this.saveSession('her');
    } catch (error) {
      console.error('AI Error:', error);

      const failureId = `personal-${Date.now()}-${error.message || 'unknown'}`;
      const fallbackMessage = this.triggerFallback('her', failureId);

      if (fallbackMessage) {

        this.currentSession.her.messages.push({
          role: 'assistant',
          content: fallbackMessage,
          timestamp: Date.now(),
          error: true,
          failureId: failureId
        });

        this.attemptRecovery('her', content);
      } else {

        const recoveredResponse = await this.attemptRecovery('her', content);
        if (recoveredResponse) {
          this.currentSession.her.messages.push({
            role: 'assistant',
            content: recoveredResponse,
            timestamp: Date.now()
          });
        }
      }
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

    container.querySelectorAll('.her-message').forEach(el => el.remove());

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

const ImportedChatViewer = {
  chats: [],
  currentChat: null,
  senderMapping: {},

  async init() {
    if (typeof PSDatabase !== 'undefined') {
      await this.loadChats();
    }
    this.bindEvents();
    this.render();
  },

  bindEvents() {
    document.getElementById('importChatBtn')?.addEventListener('click', () => this.showImportModal());
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

  detectParticipants(messages) {
    const senders = new Map();
    messages.forEach(msg => {
      const sender = msg.senderName || msg.sender || 'unknown';
      senders.set(sender, (senders.get(sender) || 0) + 1);
    });
    return Array.from(senders.entries())
      .sort((a, b) => b[1] - a[1])
      .map(([name]) => name);
  },

  buildSenderMapping(messages) {
    const participants = this.detectParticipants(messages);
    const mapping = {};

    const userIndicators = ['you', 'me', 'user'];
    let rightAssigned = false;

    participants.forEach((name, index) => {
      const lowerName = name.toLowerCase();
      const isUser = userIndicators.some(ind => lowerName === ind || lowerName.includes(ind));

      if (isUser && !rightAssigned) {
        mapping[name] = 'right';
        rightAssigned = true;
      } else if (index === 0 && !rightAssigned) {
        mapping[name] = 'right';
        rightAssigned = true;
      } else {
        mapping[name] = 'left';
      }
    });

    return mapping;
  },

  getSenderRole(msg) {
    const sender = msg.senderName || msg.sender || 'unknown';
    return this.senderMapping[sender] || 'left';
  },

  selectChat(chatId) {
    this.currentChat = this.chats.find(c => c.id === chatId);
    if (this.currentChat) {
      if (this.currentChat.roleMapping) {
        this.senderMapping = this.currentChat.roleMapping;
      } else if (this.currentChat.messages) {
        this.senderMapping = this.buildSenderMapping(this.currentChat.messages);
      }
    }
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
    const platform = this.currentChat.platform || 'whatsapp';

    viewer.className = `her-chat-viewer platform-${platform}`;

    viewer.innerHTML = `
      <div class="her-chat-viewer-header">
        <span class="her-chat-viewer-name">${this.escapeHtml(this.currentChat.name || 'Chat')}</span>
        <span class="her-chat-viewer-platform-badge">${platform === 'whatsapp' ? 'WhatsApp' : 'Instagram'}</span>
      </div>
      <div class="her-chat-viewer-messages">
        ${this.renderMessages(messages, platform)}
      </div>
    `;

    const messagesEl = viewer.querySelector('.her-chat-viewer-messages');
    if (messagesEl) {
      messagesEl.scrollTop = messagesEl.scrollHeight;
    }
  },

  renderMessages(messages, platform) {
    if (!messages || messages.length === 0) {
      return '<p class="her-chat-viewer-empty">No messages</p>';
    }

    const isWhatsApp = platform === 'whatsapp';
    let lastRole = null;

    return messages.map((msg) => {
      const role = this.getSenderRole(msg);
      const isGroupStart = role !== lastRole;
      lastRole = role;

      const showTimestamp = !isWhatsApp && msg.timestamp;

      return `
        <div class="her-chat-msg msg-${role}${isGroupStart ? ' group-start' : ''}">
          <div class="her-chat-msg-content">${this.escapeHtml(msg.content || msg.text || '')}</div>
          ${showTimestamp ? `<span class="her-chat-msg-time">${this.formatMessageTime(msg.timestamp)}</span>` : ''}
        </div>
      `;
    }).join('');
  },

  showImportModal() {
    const modal = document.getElementById('modalOverlay');
    const title = document.getElementById('modalTitle');
    const body = document.getElementById('modalBody');

    if (!modal || !body) return;

    this.importState = {
      step: 1,
      platform: 'whatsapp',
      name: '',
      rawText: '',
      messages: [],
      participants: [],
      roleMapping: {}
    };

    title.textContent = 'Import Chat';
    this.renderImportStep1(body, modal);
    modal.classList.add('active');
  },

  renderImportStep1(body, modal) {
    body.innerHTML = `
      <div class="her-import-form">
        <div class="her-import-step-indicator">
          <span class="her-step active">1. Paste Chat</span>
          <span class="her-step">2. Assign Roles</span>
        </div>

        <div class="her-import-tabs">
          <button class="her-import-tab ${this.importState.platform === 'whatsapp' ? 'active' : ''}" data-platform="whatsapp">WhatsApp</button>
          <button class="her-import-tab ${this.importState.platform === 'instagram' ? 'active' : ''}" data-platform="instagram">Instagram</button>
        </div>

        <div class="her-form-group">
          <label>Chat Name</label>
          <input type="text" id="importChatName" class="her-input" placeholder="e.g., Our Chat" value="${this.escapeHtml(this.importState.name)}">
        </div>

        <div class="her-form-group">
          <label>Import Method</label>
          <div class="her-import-method-btns">
            <button class="her-btn her-btn-secondary her-btn-file" id="selectFileBtn">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="16" height="16">
                <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
                <polyline points="14 2 14 8 20 8"/>
              </svg>
              Select from Device
            </button>
            <input type="file" id="importFileInput" accept=".txt,.text" style="display:none">
          </div>
        </div>

        <div class="her-form-group">
          <label>Or Paste Chat Export</label>
          <textarea id="importChatText" class="her-textarea" rows="8"
            placeholder="Paste your exported chat here...&#10;&#10;Format: DD/MM/YY, HH:MM am/pm - Name: Message&#10;&#10;Example:&#10;21/06/25, 12:47 pm - Person A: Hello!&#10;21/06/25, 12:48 pm - Person B: Hey there!">${this.escapeHtml(this.importState.rawText)}</textarea>
        </div>

        <div class="her-form-actions">
          <button class="her-btn her-btn-secondary" id="cancelImportBtn">Cancel</button>
          <button class="her-btn her-btn-primary" id="nextStepBtn">Next →</button>
        </div>
      </div>
    `;

    document.getElementById('selectFileBtn')?.addEventListener('click', () => {
      document.getElementById('importFileInput')?.click();
    });

    document.getElementById('importFileInput')?.addEventListener('change', (e) => {
      const file = e.target.files?.[0];
      if (file) {
        const reader = new FileReader();
        reader.onload = (evt) => {
          const textarea = document.getElementById('importChatText');
          if (textarea && evt.target?.result) {
            textarea.value = evt.target.result;
          }
        };
        reader.readAsText(file);
      }
    });

    body.querySelectorAll('.her-import-tab').forEach(tab => {
      tab.addEventListener('click', () => {
        body.querySelectorAll('.her-import-tab').forEach(t => t.classList.remove('active'));
        tab.classList.add('active');
        this.importState.platform = tab.dataset.platform;
      });
    });

    document.getElementById('cancelImportBtn')?.addEventListener('click', () => {
      modal.classList.remove('active');
    });

    document.getElementById('nextStepBtn')?.addEventListener('click', () => {
      const name = document.getElementById('importChatName')?.value.trim();
      const text = document.getElementById('importChatText')?.value.trim();

      if (!text) {
        alert('Please paste chat content');
        return;
      }

      this.importState.name = name;
      this.importState.rawText = text;
      this.importState.messages = this.parseStandardFormat(text);

      if (this.importState.messages.length === 0) {
        alert('Could not parse any messages. Check the format:\nDD/MM/YY, HH:MM am/pm - Name: Message');
        return;
      }

      this.importState.participants = this.detectParticipants(this.importState.messages);

      if (this.importState.participants.length < 2) {
        alert('Need at least 2 participants to assign roles.');
        return;
      }

      this.importState.step = 2;
      this.renderImportStep2(body, modal);
    });
  },

  renderImportStep2(body, modal) {
    const participants = this.importState.participants;

    body.innerHTML = `
      <div class="her-import-form">
        <div class="her-import-step-indicator">
          <span class="her-step completed">1. Paste Chat ✓</span>
          <span class="her-step active">2. Assign Roles</span>
        </div>

        <div class="her-import-summary">
          <span class="her-import-stat">${this.importState.messages.length} messages</span>
          <span class="her-import-stat">${participants.length} participants</span>
        </div>

        <div class="her-form-group">
          <label>LEFT Side (Other Person)</label>
          <select id="leftParticipant" class="her-select">
            ${participants.map((p, i) => `<option value="${this.escapeHtml(p)}" ${i === 0 ? 'selected' : ''}>${this.escapeHtml(p)}</option>`).join('')}
          </select>
        </div>

        <div class="her-form-group">
          <label>RIGHT Side (You)</label>
          <select id="rightParticipant" class="her-select">
            ${participants.map((p, i) => `<option value="${this.escapeHtml(p)}" ${i === 1 ? 'selected' : ''}>${this.escapeHtml(p)}</option>`).join('')}
          </select>
        </div>

        <div class="her-role-preview">
          <div class="her-role-preview-left">
            <span class="her-role-label">LEFT</span>
            <div class="her-preview-bubble left">Sample message</div>
          </div>
          <div class="her-role-preview-right">
            <span class="her-role-label">RIGHT</span>
            <div class="her-preview-bubble right">Sample message</div>
          </div>
        </div>

        <div class="her-form-actions">
          <button class="her-btn her-btn-secondary" id="backStepBtn">← Back</button>
          <button class="her-btn her-btn-primary" id="confirmImportBtn">Import Chat</button>
        </div>
      </div>
    `;

    document.getElementById('backStepBtn')?.addEventListener('click', () => {
      this.importState.step = 1;
      this.renderImportStep1(body, modal);
    });

    document.getElementById('confirmImportBtn')?.addEventListener('click', async () => {
      const leftParticipant = document.getElementById('leftParticipant')?.value;
      const rightParticipant = document.getElementById('rightParticipant')?.value;

      if (leftParticipant === rightParticipant) {
        alert('Please select different participants for LEFT and RIGHT');
        return;
      }

      const roleMapping = {};
      this.importState.participants.forEach(p => {
        if (p === rightParticipant) {
          roleMapping[p] = 'right';
        } else {
          roleMapping[p] = 'left';
        }
      });

      await this.saveChat({
        id: crypto.randomUUID(),
        name: this.importState.name || 'Imported Chat',
        platform: this.importState.platform,
        messages: this.importState.messages,
        messageCount: this.importState.messages.length,
        roleMapping: roleMapping,
        importedAt: Date.now()
      });

      modal.classList.remove('active');
      this.render();
    });
  },

  parseStandardFormat(text) {
    const lines = text.split('\n');
    const messages = [];
    const standardRegex = /^(\d{1,2}\/\d{1,2}\/\d{2,4}),?\s*(\d{1,2}:\d{2}(?::\d{2})?\s*(?:am|pm)?)\s*-\s*([^:]+):\s*(.+)$/i;

    let currentMessage = null;

    lines.forEach(line => {
      const trimmed = line.trim();
      if (!trimmed) return;

      const match = trimmed.match(standardRegex);
      if (match) {
        if (currentMessage) {
          messages.push(currentMessage);
        }
        const [, date, time, sender, content] = match;
        currentMessage = {
          senderName: sender.trim(),
          content: content.trim(),
          date: date.trim(),
          time: time.trim(),
          timestamp: `${date.trim()} ${time.trim()}`
        };
      } else if (currentMessage) {
        currentMessage.content += '\n' + trimmed;
      }
    });

    if (currentMessage) {
      messages.push(currentMessage);
    }

    return messages;
  },

  parseChat(text, platform) {
    return this.parseStandardFormat(text);
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
        if (this.currentChat?.messages) {
          this.senderMapping = this.buildSenderMapping(this.currentChat.messages);
        }
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

window.AISystem = AISystem;
window.PSAISystem = AISystem;
window.ImportedChatViewer = ImportedChatViewer;

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => {
    AISystem.init();
    ImportedChatViewer.init();
  });
} else {
  AISystem.init();
  ImportedChatViewer.init();
}
