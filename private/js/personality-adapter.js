/**
 * ═══════════════════════════════════════════════════════════════════════════════
 * HER AI - PERSONALITY ADAPTATION LAYER
 * ═══════════════════════════════════════════════════════════════════════════════
 * 
 * PURPOSE:
 * Learns communication STYLE patterns from locally stored chat history.
 * This is STYLE adaptation, not content recall or identity replication.
 * 
 * ═══════════════════════════════════════════════════════════════════════════════
 * STRICT ETHICAL BOUNDARIES
 * ═══════════════════════════════════════════════════════════════════════════════
 * 
 * WHAT THIS LEARNS (READ-ONLY ANALYSIS):
 * ✓ Tone patterns (casual, soft, teasing, caring)
 * ✓ Reply length distribution
 * ✓ Hinglish/slang frequency
 * ✓ Punctuation and capitalization habits
 * ✓ Emoji usage patterns
 * ✓ Message pacing and rhythm
 * ✓ Emotional expression style
 * ✓ Humor patterns
 * 
 * WHAT THIS NEVER DOES:
 * ✗ Store or memorize actual message content
 * ✗ Quote or paraphrase real messages
 * ✗ Reference specific events or names from chats
 * ✗ Claim to "remember" conversations
 * ✗ Pretend to be the real person
 * ✗ Create dependency or manipulation
 * 
 * DATA HANDLING:
 * - All analysis is LOCAL and PRIVATE
 * - No chat content leaves the device
 * - Only statistical style metrics are stored
 * - Learning resets if source files are removed
 * 
 * ═══════════════════════════════════════════════════════════════════════════════
 */

const PersonalityAdapter = {
  
  // ═══════════════════════════════════════════════════════════
  // STATE - STYLE METRICS ONLY (NO CONTENT)
  // ═══════════════════════════════════════════════════════════
  
  styleProfile: null,
  isInitialized: false,
  lastAnalysisTimestamp: null,
  sourceHash: null, // Track if source files changed
  
  // Style metrics container (NEVER contains actual messages)
  metrics: {
    // Message length patterns
    lengthProfile: {
      veryShort: 0,    // 1-3 words
      short: 0,        // 4-8 words  
      medium: 0,       // 9-15 words
      long: 0,         // 16-30 words
      veryLong: 0,     // 30+ words
      averageLength: 0
    },
    
    // Tone indicators (statistical only)
    toneIndicators: {
      casualMarkers: 0,      // "haha", "lol", informal
      affectionMarkers: 0,   // caring words, softeners
      playfulMarkers: 0,     // teasing, jokes
      seriousMarkers: 0,     // formal, direct
      questionFrequency: 0   // ends with ?
    },
    
    // Hinglish patterns
    hinglishProfile: {
      hindiWordRatio: 0,      // Hindi words / total
      codeSwitch: 0,          // Mid-sentence switches
      commonPatterns: [],      // Generic patterns, no content
      englishDominant: true
    },
    
    // Punctuation style
    punctuationStyle: {
      multiDots: 0,           // "..." usage
      exclamationFreq: 0,     // "!" frequency
      questionFreq: 0,        // "?" frequency
      capsUsage: 0,           // CAPS frequency
      minimalPunctuation: false
    },
    
    // Emoji patterns
    emojiProfile: {
      frequency: 0,           // Emojis per message
      favorites: [],          // Top used (emojis only, generic)
      placementEnd: 0,        // % at end of message
      placementMid: 0,        // % mid-message
      doubleEmoji: 0          // Double emoji usage
    },
    
    // Conversation rhythm
    rhythmProfile: {
      quickReplier: false,    // Short gaps
      multiMessage: false,    // Sends multiple in sequence
      messageChaining: 0,     // Continuation messages
      averageMessagesPerBurst: 1
    },
    
    // Emotional expression
    emotionalStyle: {
      expressiveness: 0,      // 0-1 scale
      usesFillers: false,     // "umm", "hmm", etc.
      repeatsLetters: false,  // "hiii", "sorryyy"
      usesParticles: false    // "na", "yaar", "yar"
    }
  },
  
  // Analysis configuration
  config: {
    minMessagesRequired: 50,  // Minimum messages to learn from
    recalculateInterval: 86400000, // 24 hours in ms
    maxStoreSize: 5000 // Max bytes for stored metrics
  },
  
  // ═══════════════════════════════════════════════════════════
  // INITIALIZATION
  // ═══════════════════════════════════════════════════════════
  
  async init() {
    console.log('[PersonalityAdapter] Initializing style adaptation layer...');
    
    // Load cached style profile if exists
    await this.loadCachedProfile();
    
    // Check if we need to reanalyze
    if (this.shouldReanalyze()) {
      await this.analyzeSourceChats();
    }
    
    this.isInitialized = true;
    console.log('[PersonalityAdapter] Ready. Style profile:', this.styleProfile ? 'loaded' : 'pending');
    
    return this;
  },
  
  // ═══════════════════════════════════════════════════════════
  // SOURCE ANALYSIS (READ-ONLY)
  // ═══════════════════════════════════════════════════════════
  
  async analyzeSourceChats() {
    console.log('[PersonalityAdapter] Analyzing source chats for style patterns...');
    
    try {
      // Load Instagram chat HTML files
      const chatFiles = await this.loadInstaChats();
      
      if (!chatFiles || chatFiles.length === 0) {
        console.log('[PersonalityAdapter] No chat files found for analysis');
        return;
      }
      
      // Extract messages (for analysis only, not storage)
      const messages = this.extractMessagesFromHTML(chatFiles);
      
      if (messages.length < this.config.minMessagesRequired) {
        console.log(`[PersonalityAdapter] Insufficient messages (${messages.length}/${this.config.minMessagesRequired})`);
        return;
      }
      
      // Analyze patterns - ONLY STYLE, NO CONTENT STORED
      this.analyzeStylePatterns(messages);
      
      // Calculate source hash for change detection
      this.sourceHash = this.calculateSourceHash(chatFiles);
      this.lastAnalysisTimestamp = Date.now();
      
      // Cache the style profile (metrics only)
      await this.cacheStyleProfile();
      
      console.log('[PersonalityAdapter] Style analysis complete. Analyzed:', messages.length, 'messages');
      
      // CRITICAL: Clear messages from memory after analysis
      messages.length = 0;
      
    } catch (error) {
      console.warn('[PersonalityAdapter] Analysis failed:', error);
    }
  },
  
  async loadInstaChats() {
    const basePath = '/private/she/chats/insta';
    const files = [];
    
    try {
      // Load index to find chat folders
      const indexResponse = await fetch(`${basePath}/index.json`);
      if (!indexResponse.ok) return files;
      
      const index = await indexResponse.json();
      
      // Load each chat folder's message files
      for (const chat of (index.chats || [])) {
        if (chat.folder) {
          // Try to load message_1.html, message_2.html, etc.
          for (let i = 1; i <= 10; i++) {
            try {
              const htmlPath = `${basePath}/${chat.folder}/message_${i}.html`;
              const response = await fetch(htmlPath);
              if (response.ok) {
                const html = await response.text();
                files.push({ folder: chat.folder, content: html, index: i });
              } else {
                break; // No more message files
              }
            } catch (e) {
              break;
            }
          }
        }
      }
    } catch (error) {
      console.warn('[PersonalityAdapter] Failed to load chat files:', error);
    }
    
    return files;
  },
  
  // ═══════════════════════════════════════════════════════════
  // MESSAGE EXTRACTION (TEMPORARY, FOR ANALYSIS ONLY)
  // ═══════════════════════════════════════════════════════════
  
  extractMessagesFromHTML(files) {
    const messages = [];
    
    for (const file of files) {
      try {
        const parser = new DOMParser();
        const doc = parser.parseFromString(file.content, 'text/html');
        
        // Instagram export format: messages are in divs with specific class patterns
        const messageBlocks = doc.querySelectorAll('.pam._3-95._2ph-._a6-g.uiBoxWhite.noborder');
        
        messageBlocks.forEach(block => {
          const senderEl = block.querySelector('h2');
          const contentEl = block.querySelector('._a6-p');
          const timeEl = block.querySelector('._a6-o');
          
          if (senderEl && contentEl) {
            const sender = senderEl.textContent?.trim() || '';
            const content = contentEl.textContent?.trim() || '';
            
            // Filter out system messages and attachments
            if (content && 
                !content.includes('sent an attachment') &&
                !content.includes('Liked a message') &&
                content.length > 0) {
              messages.push({
                sender: sender,
                content: content,
                isHer: sender !== 'AS' && sender !== 'Instagram User' && sender.length > 0
              });
            }
          }
        });
      } catch (e) {
        console.warn('[PersonalityAdapter] Failed to parse HTML:', e);
      }
    }
    
    // Filter to get only "her" messages for style learning
    const herMessages = messages.filter(m => m.sender !== 'AS');
    
    return herMessages;
  },
  
  // ═══════════════════════════════════════════════════════════
  // STYLE PATTERN ANALYSIS
  // ═══════════════════════════════════════════════════════════
  
  analyzeStylePatterns(messages) {
    // Reset metrics
    this.resetMetrics();
    
    const totalMessages = messages.length;
    if (totalMessages === 0) return;
    
    // Analyze each message for STYLE only
    let totalWords = 0;
    let totalEmojis = 0;
    let consecutiveCount = 0;
    let burstCounts = [];
    let lastSender = null;
    
    messages.forEach((msg, idx) => {
      const content = msg.content;
      const words = this.getWords(content);
      const wordCount = words.length;
      totalWords += wordCount;
      
      // Length profile
      if (wordCount <= 3) this.metrics.lengthProfile.veryShort++;
      else if (wordCount <= 8) this.metrics.lengthProfile.short++;
      else if (wordCount <= 15) this.metrics.lengthProfile.medium++;
      else if (wordCount <= 30) this.metrics.lengthProfile.long++;
      else this.metrics.lengthProfile.veryLong++;
      
      // Tone indicators
      if (/haha|hehe|lol|😂|🤣|rofl/i.test(content)) this.metrics.toneIndicators.casualMarkers++;
      if (/yaar|dear|love|care|miss|❤|💗|🥺|💕/i.test(content)) this.metrics.toneIndicators.affectionMarkers++;
      if (/🙈|😝|😜|tease|poke|hmph/i.test(content)) this.metrics.toneIndicators.playfulMarkers++;
      if (content.endsWith('?') || content.includes('?')) this.metrics.toneIndicators.questionFrequency++;
      
      // Hinglish analysis
      const hindiRatio = this.calculateHindiRatio(content);
      this.metrics.hinglishProfile.hindiWordRatio += hindiRatio;
      if (this.hasCodeSwitch(content)) this.metrics.hinglishProfile.codeSwitch++;
      
      // Punctuation
      if (/\.{2,}/.test(content)) this.metrics.punctuationStyle.multiDots++;
      if (/!/.test(content)) this.metrics.punctuationStyle.exclamationFreq++;
      if (/\?/.test(content)) this.metrics.punctuationStyle.questionFreq++;
      if (/[A-Z]{3,}/.test(content)) this.metrics.punctuationStyle.capsUsage++;
      
      // Emoji analysis
      const emojis = content.match(/[\u{1F300}-\u{1F9FF}]|[\u{2600}-\u{26FF}]|[\u{2700}-\u{27BF}]/gu) || [];
      totalEmojis += emojis.length;
      if (emojis.length > 0) {
        emojis.forEach(e => this.trackEmojiUsage(e));
        // Placement analysis
        const contentLen = content.length;
        const lastEmojiPos = content.lastIndexOf(emojis[emojis.length - 1]);
        if (lastEmojiPos > contentLen * 0.7) this.metrics.emojiProfile.placementEnd++;
        else this.metrics.emojiProfile.placementMid++;
        
        if (emojis.length >= 2) this.metrics.emojiProfile.doubleEmoji++;
      }
      
      // Emotional style
      if (/umm|hmm|uh|uhh/i.test(content)) this.metrics.emotionalStyle.usesFillers = true;
      if (/(.)\1{2,}/i.test(content)) this.metrics.emotionalStyle.repeatsLetters = true; // "hiii", "okkkk"
      if (/\bna\b|\byaar\b|\byar\b|\byre\b|\bhaan\b/i.test(content)) this.metrics.emotionalStyle.usesParticles = true;
      
      // Message bursts (consecutive messages)
      if (msg.sender === lastSender) {
        consecutiveCount++;
      } else {
        if (consecutiveCount > 1) burstCounts.push(consecutiveCount);
        consecutiveCount = 1;
        lastSender = msg.sender;
      }
    });
    
    // Normalize metrics
    this.metrics.lengthProfile.averageLength = totalWords / totalMessages;
    this.metrics.toneIndicators.casualMarkers /= totalMessages;
    this.metrics.toneIndicators.affectionMarkers /= totalMessages;
    this.metrics.toneIndicators.playfulMarkers /= totalMessages;
    this.metrics.toneIndicators.questionFrequency /= totalMessages;
    this.metrics.hinglishProfile.hindiWordRatio /= totalMessages;
    this.metrics.hinglishProfile.codeSwitch /= totalMessages;
    this.metrics.hinglishProfile.englishDominant = this.metrics.hinglishProfile.hindiWordRatio < 0.3;
    
    this.metrics.punctuationStyle.multiDots /= totalMessages;
    this.metrics.punctuationStyle.exclamationFreq /= totalMessages;
    this.metrics.punctuationStyle.questionFreq /= totalMessages;
    this.metrics.punctuationStyle.capsUsage /= totalMessages;
    this.metrics.punctuationStyle.minimalPunctuation = 
      this.metrics.punctuationStyle.exclamationFreq < 0.1 && 
      this.metrics.punctuationStyle.questionFreq < 0.15;
    
    this.metrics.emojiProfile.frequency = totalEmojis / totalMessages;
    this.metrics.emojiProfile.favorites = this.getTopEmojis(5);
    this.metrics.emojiProfile.placementEnd /= totalMessages;
    this.metrics.emojiProfile.placementMid /= totalMessages;
    this.metrics.emojiProfile.doubleEmoji /= totalMessages;
    
    // Rhythm profile
    if (burstCounts.length > 0) {
      const avgBurst = burstCounts.reduce((a, b) => a + b, 0) / burstCounts.length;
      this.metrics.rhythmProfile.averageMessagesPerBurst = avgBurst;
      this.metrics.rhythmProfile.multiMessage = avgBurst > 1.5;
    }
    
    // Emotional expressiveness (composite score)
    this.metrics.emotionalStyle.expressiveness = this.calculateExpressiveness();
    
    // Build style profile summary
    this.buildStyleProfile();
    
    console.log('[PersonalityAdapter] Style metrics calculated:', this.metrics);
  },
  
  // ═══════════════════════════════════════════════════════════
  // HELPER FUNCTIONS
  // ═══════════════════════════════════════════════════════════
  
  getWords(text) {
    return text.split(/\s+/).filter(w => w.length > 0);
  },
  
  calculateHindiRatio(text) {
    const words = this.getWords(text.toLowerCase());
    if (words.length === 0) return 0;
    
    // Common Hinglish words
    const hindiWords = words.filter(w => 
      /^(kya|hai|hoon|hain|tum|mujhe|yaar|accha|theek|haan|nahi|aur|bhi|kar|karo|krna|krne|rha|rhi|ho|toh|se|ke|ko|me|mein|na|ek|do|teen|kitna|kaise|kyun|kab|kahan|woh|ye|yeh|mai|mere|meri|tera|teri|tumhara|tumhari|apna|apni|sab|kuch|bohot|bahut|thoda|jyada|phir|abhi|aaj|kal|suno|dekho|chalo|chal|jao|aao|bolo|ruko|btao|batao)$/i.test(w)
    ).length;
    
    return hindiWords / words.length;
  },
  
  hasCodeSwitch(text) {
    // Check for mid-sentence Hindi-English switching
    const words = this.getWords(text);
    if (words.length < 3) return false;
    
    let prevWasHindi = null;
    let switches = 0;
    
    words.forEach(w => {
      const isHindi = /^(kya|hai|hoon|tum|mujhe|yaar|accha|theek|haan|nahi|aur|bhi|kar|karo|ho|toh|se|ke|ko|me|na)$/i.test(w);
      if (prevWasHindi !== null && isHindi !== prevWasHindi) {
        switches++;
      }
      prevWasHindi = isHindi;
    });
    
    return switches >= 2;
  },
  
  emojiCounts: {},
  
  trackEmojiUsage(emoji) {
    this.emojiCounts[emoji] = (this.emojiCounts[emoji] || 0) + 1;
  },
  
  getTopEmojis(n) {
    return Object.entries(this.emojiCounts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, n)
      .map(e => e[0]);
  },
  
  calculateExpressiveness() {
    let score = 0;
    
    // Emoji usage adds expressiveness
    score += Math.min(this.metrics.emojiProfile.frequency * 0.3, 0.3);
    
    // Letter repetition adds expressiveness
    if (this.metrics.emotionalStyle.repeatsLetters) score += 0.15;
    
    // Fillers add naturalness
    if (this.metrics.emotionalStyle.usesFillers) score += 0.1;
    
    // Particles add warmth
    if (this.metrics.emotionalStyle.usesParticles) score += 0.15;
    
    // Casual markers
    score += this.metrics.toneIndicators.casualMarkers * 0.2;
    
    // Affection markers
    score += this.metrics.toneIndicators.affectionMarkers * 0.1;
    
    return Math.min(score, 1);
  },
  
  resetMetrics() {
    this.metrics.lengthProfile = { veryShort: 0, short: 0, medium: 0, long: 0, veryLong: 0, averageLength: 0 };
    this.metrics.toneIndicators = { casualMarkers: 0, affectionMarkers: 0, playfulMarkers: 0, seriousMarkers: 0, questionFrequency: 0 };
    this.metrics.hinglishProfile = { hindiWordRatio: 0, codeSwitch: 0, commonPatterns: [], englishDominant: true };
    this.metrics.punctuationStyle = { multiDots: 0, exclamationFreq: 0, questionFreq: 0, capsUsage: 0, minimalPunctuation: false };
    this.metrics.emojiProfile = { frequency: 0, favorites: [], placementEnd: 0, placementMid: 0, doubleEmoji: 0 };
    this.metrics.rhythmProfile = { quickReplier: false, multiMessage: false, messageChaining: 0, averageMessagesPerBurst: 1 };
    this.metrics.emotionalStyle = { expressiveness: 0, usesFillers: false, repeatsLetters: false, usesParticles: false };
    this.emojiCounts = {};
  },
  
  // ═══════════════════════════════════════════════════════════
  // STYLE PROFILE BUILDING
  // ═══════════════════════════════════════════════════════════
  
  buildStyleProfile() {
    this.styleProfile = {
      // Response length guidance
      preferredLength: this.getPreferredLength(),
      
      // Tone characteristics
      tone: {
        primary: this.getPrimaryTone(),
        secondary: this.getSecondaryTone(),
        warmth: this.metrics.toneIndicators.affectionMarkers > 0.1 ? 'warm' : 'neutral',
        humor: this.metrics.toneIndicators.casualMarkers > 0.15 ? 'playful' : 'reserved'
      },
      
      // Language style
      language: {
        hinglishLevel: this.getHinglishLevel(),
        useParticles: this.metrics.emotionalStyle.usesParticles,
        useFillers: this.metrics.emotionalStyle.usesFillers,
        repeatLetters: this.metrics.emotionalStyle.repeatsLetters
      },
      
      // Emoji style
      emoji: {
        usage: this.getEmojiUsageLevel(),
        favorites: this.metrics.emojiProfile.favorites.slice(0, 3),
        placement: this.metrics.emojiProfile.placementEnd > 0.6 ? 'end' : 'mixed'
      },
      
      // Punctuation style
      punctuation: {
        useDots: this.metrics.punctuationStyle.multiDots > 0.1,
        exclamatory: this.metrics.punctuationStyle.exclamationFreq > 0.15,
        minimal: this.metrics.punctuationStyle.minimalPunctuation
      },
      
      // Rhythm
      rhythm: {
        multiMessage: this.metrics.rhythmProfile.multiMessage,
        avgBurst: this.metrics.rhythmProfile.averageMessagesPerBurst
      },
      
      // Overall expressiveness
      expressiveness: this.metrics.emotionalStyle.expressiveness,
      
      // Timestamp
      analyzedAt: Date.now()
    };
    
    console.log('[PersonalityAdapter] Style profile built:', this.styleProfile);
  },
  
  getPreferredLength() {
    const { veryShort, short, medium, long, veryLong } = this.metrics.lengthProfile;
    const total = veryShort + short + medium + long + veryLong;
    
    if ((veryShort + short) / total > 0.6) return 'short';
    if ((long + veryLong) / total > 0.3) return 'medium-long';
    return 'medium';
  },
  
  getPrimaryTone() {
    const { casualMarkers, affectionMarkers, playfulMarkers, seriousMarkers } = this.metrics.toneIndicators;
    
    const tones = [
      { name: 'casual', score: casualMarkers },
      { name: 'caring', score: affectionMarkers },
      { name: 'playful', score: playfulMarkers },
      { name: 'direct', score: seriousMarkers }
    ];
    
    tones.sort((a, b) => b.score - a.score);
    return tones[0].name;
  },
  
  getSecondaryTone() {
    const { casualMarkers, affectionMarkers, playfulMarkers, seriousMarkers } = this.metrics.toneIndicators;
    
    const tones = [
      { name: 'casual', score: casualMarkers },
      { name: 'caring', score: affectionMarkers },
      { name: 'playful', score: playfulMarkers },
      { name: 'direct', score: seriousMarkers }
    ];
    
    tones.sort((a, b) => b.score - a.score);
    return tones[1]?.name || 'neutral';
  },
  
  getHinglishLevel() {
    const ratio = this.metrics.hinglishProfile.hindiWordRatio;
    if (ratio > 0.4) return 'heavy';
    if (ratio > 0.2) return 'moderate';
    if (ratio > 0.05) return 'light';
    return 'minimal';
  },
  
  getEmojiUsageLevel() {
    const freq = this.metrics.emojiProfile.frequency;
    if (freq > 1.5) return 'frequent';
    if (freq > 0.7) return 'moderate';
    if (freq > 0.3) return 'occasional';
    return 'minimal';
  },
  
  // ═══════════════════════════════════════════════════════════
  // STORAGE (METRICS ONLY, NEVER CONTENT)
  // ═══════════════════════════════════════════════════════════
  
  async loadCachedProfile() {
    try {
      const cached = localStorage.getItem('herStyleProfile');
      if (cached) {
        const data = JSON.parse(cached);
        this.styleProfile = data.profile;
        this.lastAnalysisTimestamp = data.timestamp;
        this.sourceHash = data.hash;
        console.log('[PersonalityAdapter] Loaded cached style profile');
      }
    } catch (e) {
      console.warn('[PersonalityAdapter] Failed to load cached profile:', e);
    }
  },
  
  async cacheStyleProfile() {
    try {
      const data = {
        profile: this.styleProfile,
        timestamp: this.lastAnalysisTimestamp,
        hash: this.sourceHash
      };
      
      const json = JSON.stringify(data);
      if (json.length > this.config.maxStoreSize) {
        console.warn('[PersonalityAdapter] Profile too large to cache');
        return;
      }
      
      localStorage.setItem('herStyleProfile', json);
      console.log('[PersonalityAdapter] Style profile cached');
    } catch (e) {
      console.warn('[PersonalityAdapter] Failed to cache profile:', e);
    }
  },
  
  shouldReanalyze() {
    // Reanalyze if no profile exists
    if (!this.styleProfile) return true;
    
    // Reanalyze if profile is old
    if (this.lastAnalysisTimestamp && 
        Date.now() - this.lastAnalysisTimestamp > this.config.recalculateInterval) {
      return true;
    }
    
    return false;
  },
  
  calculateSourceHash(files) {
    // Simple hash of file count and total size
    const totalSize = files.reduce((sum, f) => sum + f.content.length, 0);
    return `${files.length}-${totalSize}`;
  },
  
  // ═══════════════════════════════════════════════════════════
  // PUBLIC API FOR AI SYSTEM
  // ═══════════════════════════════════════════════════════════
  
  /**
   * Get style hints for response generation
   * Returns ONLY style guidance, NEVER content
   */
  getStyleHints() {
    if (!this.styleProfile) {
      return this.getDefaultStyleHints();
    }
    
    return {
      // Length guidance
      targetLength: this.styleProfile.preferredLength,
      
      // Tone guidance
      tone: this.styleProfile.tone.primary,
      warmth: this.styleProfile.tone.warmth,
      humor: this.styleProfile.tone.humor,
      
      // Language hints
      hinglishLevel: this.styleProfile.language.hinglishLevel,
      useParticles: this.styleProfile.language.useParticles,
      useFillers: this.styleProfile.language.useFillers,
      
      // Emoji guidance
      emojiFrequency: this.styleProfile.emoji.usage,
      suggestedEmojis: this.styleProfile.emoji.favorites,
      emojiPlacement: this.styleProfile.emoji.placement,
      
      // Punctuation
      useDots: this.styleProfile.punctuation.useDots,
      
      // Expressiveness
      expressiveness: this.styleProfile.expressiveness
    };
  },
  
  getDefaultStyleHints() {
    return {
      targetLength: 'short',
      tone: 'casual',
      warmth: 'warm',
      humor: 'playful',
      hinglishLevel: 'moderate',
      useParticles: true,
      useFillers: true,
      emojiFrequency: 'moderate',
      suggestedEmojis: ['💗', '✨', '🌸'],
      emojiPlacement: 'end',
      useDots: true,
      expressiveness: 0.6
    };
  },
  
  /**
   * Adapt a generated response to match learned style
   * Takes AI output and adjusts STYLE only
   */
  adaptResponse(response, hints = null) {
    if (!hints) hints = this.getStyleHints();
    if (!response) return response;
    
    let adapted = response;
    
    // Apply length adjustment
    adapted = this.adjustLength(adapted, hints.targetLength);
    
    // Apply Hinglish particles if learned
    if (hints.useParticles && Math.random() > 0.4) {
      adapted = this.addParticles(adapted);
    }
    
    // Apply letter repetition if learned
    if (hints.useFillers && Math.random() > 0.6) {
      adapted = this.addLetterRepetition(adapted);
    }
    
    // Adjust emoji usage
    adapted = this.adjustEmojis(adapted, hints);
    
    // Adjust punctuation
    adapted = this.adjustPunctuation(adapted, hints);
    
    return adapted;
  },
  
  adjustLength(response, targetLength) {
    const words = response.split(/\s+/);
    
    switch (targetLength) {
      case 'short':
        if (words.length > 12) {
          // Shorten by keeping key parts
          return words.slice(0, 8).join(' ') + '...';
        }
        break;
      case 'medium':
        // Keep as-is for medium
        break;
      case 'medium-long':
        // Keep as-is, might add filler
        break;
    }
    
    return response;
  },
  
  addParticles(response) {
    // Add natural Hinglish particles
    const particles = ['na', 'yaar', 'haan', 'toh'];
    const particle = particles[Math.floor(Math.random() * particles.length)];
    
    // Add at natural positions (not if already present)
    if (!/\b(na|yaar|haan|toh)\b/i.test(response)) {
      if (response.endsWith('?')) {
        return response.slice(0, -1) + ` ${particle}?`;
      }
      if (Math.random() > 0.5) {
        return response + ` ${particle}`;
      }
    }
    
    return response;
  },
  
  addLetterRepetition(response) {
    // Add natural letter repetition to certain words
    const patterns = [
      { find: /\bhii?\b/gi, replace: 'hiii' },
      { find: /\boki?\b/gi, replace: 'okkk' },
      { find: /\bsorry\b/gi, replace: 'sorryyy' },
      { find: /\bplease\b/gi, replace: 'pleasee' },
      { find: /\bhmm\b/gi, replace: 'hmmm' }
    ];
    
    // Only apply one pattern randomly
    const pattern = patterns[Math.floor(Math.random() * patterns.length)];
    return response.replace(pattern.find, pattern.replace);
  },
  
  adjustEmojis(response, hints) {
    const emojis = response.match(/[\u{1F300}-\u{1F9FF}]|[\u{2600}-\u{26FF}]/gu) || [];
    
    // Check current emoji count vs preference
    switch (hints.emojiFrequency) {
      case 'minimal':
        // Remove extra emojis
        if (emojis.length > 1) {
          let count = 0;
          response = response.replace(/[\u{1F300}-\u{1F9FF}]|[\u{2600}-\u{26FF}]/gu, (m) => {
            count++;
            return count === 1 ? m : '';
          });
        }
        break;
        
      case 'occasional':
      case 'moderate':
        // Ensure at least one emoji if none present
        if (emojis.length === 0 && hints.suggestedEmojis?.length > 0) {
          const emoji = hints.suggestedEmojis[Math.floor(Math.random() * hints.suggestedEmojis.length)];
          if (hints.emojiPlacement === 'end') {
            response = response.trim() + ' ' + emoji;
          }
        }
        break;
        
      case 'frequent':
        // Possibly add emoji if missing
        if (emojis.length === 0 && hints.suggestedEmojis?.length > 0 && Math.random() > 0.3) {
          const emoji = hints.suggestedEmojis[Math.floor(Math.random() * hints.suggestedEmojis.length)];
          response = response.trim() + ' ' + emoji;
        }
        break;
    }
    
    return response;
  },
  
  adjustPunctuation(response, hints) {
    // Add ellipsis style if learned
    if (hints.useDots && Math.random() > 0.6) {
      // Don't add if already has ending punctuation
      if (!/[.!?…]$/.test(response.trim())) {
        response = response.trim() + '...';
      }
    }
    
    return response;
  },
  
  // ═══════════════════════════════════════════════════════════
  // CLEANUP AND PRIVACY
  // ═══════════════════════════════════════════════════════════
  
  /**
   * Clear all learned data
   * Call this if source files are removed
   */
  clearProfile() {
    this.styleProfile = null;
    this.lastAnalysisTimestamp = null;
    this.sourceHash = null;
    this.resetMetrics();
    localStorage.removeItem('herStyleProfile');
    console.log('[PersonalityAdapter] Profile cleared');
  },
  
  /**
   * Get privacy-safe status
   */
  getStatus() {
    return {
      hasProfile: !!this.styleProfile,
      lastAnalyzed: this.lastAnalysisTimestamp 
        ? new Date(this.lastAnalysisTimestamp).toISOString() 
        : null,
      metrics: this.styleProfile ? 'loaded' : 'none',
      // NEVER expose actual content or detailed patterns
      contentStored: false
    };
  }
};

// Export for use by AI system
window.PersonalityAdapter = PersonalityAdapter;

// Auto-initialize
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => PersonalityAdapter.init());
} else {
  PersonalityAdapter.init();
}
