const PersonalityAdapter = {

  styleProfile: null,
  isInitialized: false,
  lastAnalysisTimestamp: null,
  sourceHash: null,

  metrics: {

    lengthProfile: {
      veryShort: 0,
      short: 0,
      medium: 0,
      long: 0,
      veryLong: 0,
      averageLength: 0
    },

    toneIndicators: {
      casualMarkers: 0,
      affectionMarkers: 0,
      playfulMarkers: 0,
      seriousMarkers: 0,
      questionFrequency: 0
    },

    hinglishProfile: {
      hindiWordRatio: 0,
      codeSwitch: 0,
      commonPatterns: [],
      englishDominant: true
    },

    punctuationStyle: {
      multiDots: 0,
      exclamationFreq: 0,
      questionFreq: 0,
      capsUsage: 0,
      minimalPunctuation: false
    },

    emojiProfile: {
      frequency: 0,
      favorites: [],
      placementEnd: 0,
      placementMid: 0,
      doubleEmoji: 0
    },

    rhythmProfile: {
      quickReplier: false,
      multiMessage: false,
      messageChaining: 0,
      averageMessagesPerBurst: 1
    },

    emotionalStyle: {
      expressiveness: 0,
      usesFillers: false,
      repeatsLetters: false,
      usesParticles: false
    }
  },

  config: {
    minMessagesRequired: 50,
    recalculateInterval: 86400000,
    maxStoreSize: 5000
  },

  async init() {
    console.log('[PersonalityAdapter] Initializing style adaptation layer...');

    await this.loadCachedProfile();

    if (this.shouldReanalyze()) {
      await this.analyzeSourceChats();
    }

    this.isInitialized = true;
    console.log('[PersonalityAdapter] Ready. Style profile:', this.styleProfile ? 'loaded' : 'pending');

    return this;
  },

  async analyzeSourceChats() {
    console.log('[PersonalityAdapter] Analyzing source chats for style patterns...');

    try {

      const chatFiles = await this.loadInstaChats();

      if (!chatFiles || chatFiles.length === 0) {
        console.log('[PersonalityAdapter] No chat files found for analysis');
        return;
      }

      const messages = this.extractMessagesFromHTML(chatFiles);

      if (messages.length < this.config.minMessagesRequired) {
        console.log(`[PersonalityAdapter] Insufficient messages (${messages.length}/${this.config.minMessagesRequired})`);
        return;
      }

      this.analyzeStylePatterns(messages);

      this.sourceHash = this.calculateSourceHash(chatFiles);
      this.lastAnalysisTimestamp = Date.now();

      await this.cacheStyleProfile();

      console.log('[PersonalityAdapter] Style analysis complete. Analyzed:', messages.length, 'messages');

      messages.length = 0;

    } catch (error) {
      console.warn('[PersonalityAdapter] Analysis failed:', error);
    }
  },

  async loadInstaChats() {
    const basePath = '/private/she/chats/insta';
    const files = [];

    try {

      const indexResponse = await fetch(`${basePath}/index.json`);
      if (!indexResponse.ok) return files;

      const index = await indexResponse.json();

      for (const chat of (index.chats || [])) {
        if (chat.folder) {

          for (let i = 1; i <= 10; i++) {
            try {
              const htmlPath = `${basePath}/${chat.folder}/message_${i}.html`;
              const response = await fetch(htmlPath);
              if (response.ok) {
                const html = await response.text();
                files.push({ folder: chat.folder, content: html, index: i });
              } else {
                break;
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

  extractMessagesFromHTML(files) {
    const messages = [];

    for (const file of files) {
      try {
        const parser = new DOMParser();
        const doc = parser.parseFromString(file.content, 'text/html');

        const messageBlocks = doc.querySelectorAll('.pam._3-95._2ph-._a6-g.uiBoxWhite.noborder');

        messageBlocks.forEach(block => {
          const senderEl = block.querySelector('h2');
          const contentEl = block.querySelector('._a6-p');
          const timeEl = block.querySelector('._a6-o');

          if (senderEl && contentEl) {
            const sender = senderEl.textContent?.trim() || '';
            const content = contentEl.textContent?.trim() || '';

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

    const herMessages = messages.filter(m => m.sender !== 'AS');

    return herMessages;
  },

  analyzeStylePatterns(messages) {

    this.resetMetrics();

    const totalMessages = messages.length;
    if (totalMessages === 0) return;

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

      if (wordCount <= 3) this.metrics.lengthProfile.veryShort++;
      else if (wordCount <= 8) this.metrics.lengthProfile.short++;
      else if (wordCount <= 15) this.metrics.lengthProfile.medium++;
      else if (wordCount <= 30) this.metrics.lengthProfile.long++;
      else this.metrics.lengthProfile.veryLong++;

      if (/haha|hehe|lol|😂|🤣|rofl/i.test(content)) this.metrics.toneIndicators.casualMarkers++;
      if (/yaar|dear|love|care|miss|❤|💗|🥺|💕/i.test(content)) this.metrics.toneIndicators.affectionMarkers++;
      if (/🙈|😝|😜|tease|poke|hmph/i.test(content)) this.metrics.toneIndicators.playfulMarkers++;
      if (content.endsWith('?') || content.includes('?')) this.metrics.toneIndicators.questionFrequency++;

      const hindiRatio = this.calculateHindiRatio(content);
      this.metrics.hinglishProfile.hindiWordRatio += hindiRatio;
      if (this.hasCodeSwitch(content)) this.metrics.hinglishProfile.codeSwitch++;

      if (/\.{2,}/.test(content)) this.metrics.punctuationStyle.multiDots++;
      if (/!/.test(content)) this.metrics.punctuationStyle.exclamationFreq++;
      if (/\?/.test(content)) this.metrics.punctuationStyle.questionFreq++;
      if (/[A-Z]{3,}/.test(content)) this.metrics.punctuationStyle.capsUsage++;

      const emojis = content.match(/[\u{1F300}-\u{1F9FF}]|[\u{2600}-\u{26FF}]|[\u{2700}-\u{27BF}]/gu) || [];
      totalEmojis += emojis.length;
      if (emojis.length > 0) {
        emojis.forEach(e => this.trackEmojiUsage(e));

        const contentLen = content.length;
        const lastEmojiPos = content.lastIndexOf(emojis[emojis.length - 1]);
        if (lastEmojiPos > contentLen * 0.7) this.metrics.emojiProfile.placementEnd++;
        else this.metrics.emojiProfile.placementMid++;

        if (emojis.length >= 2) this.metrics.emojiProfile.doubleEmoji++;
      }

      if (/umm|hmm|uh|uhh/i.test(content)) this.metrics.emotionalStyle.usesFillers = true;
      if (/(.)\1{2,}/i.test(content)) this.metrics.emotionalStyle.repeatsLetters = true;
      if (/\bna\b|\byaar\b|\byar\b|\byre\b|\bhaan\b/i.test(content)) this.metrics.emotionalStyle.usesParticles = true;

      if (msg.sender === lastSender) {
        consecutiveCount++;
      } else {
        if (consecutiveCount > 1) burstCounts.push(consecutiveCount);
        consecutiveCount = 1;
        lastSender = msg.sender;
      }
    });

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

    if (burstCounts.length > 0) {
      const avgBurst = burstCounts.reduce((a, b) => a + b, 0) / burstCounts.length;
      this.metrics.rhythmProfile.averageMessagesPerBurst = avgBurst;
      this.metrics.rhythmProfile.multiMessage = avgBurst > 1.5;
    }

    this.metrics.emotionalStyle.expressiveness = this.calculateExpressiveness();

    this.buildStyleProfile();

    console.log('[PersonalityAdapter] Style metrics calculated:', this.metrics);
  },

  getWords(text) {
    return text.split(/\s+/).filter(w => w.length > 0);
  },

  calculateHindiRatio(text) {
    const words = this.getWords(text.toLowerCase());
    if (words.length === 0) return 0;

    const hindiWords = words.filter(w =>
      /^(kya|hai|hoon|hain|tum|mujhe|yaar|accha|theek|haan|nahi|aur|bhi|kar|karo|krna|krne|rha|rhi|ho|toh|se|ke|ko|me|mein|na|ek|do|teen|kitna|kaise|kyun|kab|kahan|woh|ye|yeh|mai|mere|meri|tera|teri|tumhara|tumhari|apna|apni|sab|kuch|bohot|bahut|thoda|jyada|phir|abhi|aaj|kal|suno|dekho|chalo|chal|jao|aao|bolo|ruko|btao|batao)$/i.test(w)
    ).length;

    return hindiWords / words.length;
  },

  hasCodeSwitch(text) {

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

    score += Math.min(this.metrics.emojiProfile.frequency * 0.3, 0.3);

    if (this.metrics.emotionalStyle.repeatsLetters) score += 0.15;

    if (this.metrics.emotionalStyle.usesFillers) score += 0.1;

    if (this.metrics.emotionalStyle.usesParticles) score += 0.15;

    score += this.metrics.toneIndicators.casualMarkers * 0.2;

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

  buildStyleProfile() {
    this.styleProfile = {

      preferredLength: this.getPreferredLength(),

      tone: {
        primary: this.getPrimaryTone(),
        secondary: this.getSecondaryTone(),
        warmth: this.metrics.toneIndicators.affectionMarkers > 0.1 ? 'warm' : 'neutral',
        humor: this.metrics.toneIndicators.casualMarkers > 0.15 ? 'playful' : 'reserved'
      },

      language: {
        hinglishLevel: this.getHinglishLevel(),
        useParticles: this.metrics.emotionalStyle.usesParticles,
        useFillers: this.metrics.emotionalStyle.usesFillers,
        repeatLetters: this.metrics.emotionalStyle.repeatsLetters
      },

      emoji: {
        usage: this.getEmojiUsageLevel(),
        favorites: this.metrics.emojiProfile.favorites.slice(0, 3),
        placement: this.metrics.emojiProfile.placementEnd > 0.6 ? 'end' : 'mixed'
      },

      punctuation: {
        useDots: this.metrics.punctuationStyle.multiDots > 0.1,
        exclamatory: this.metrics.punctuationStyle.exclamationFreq > 0.15,
        minimal: this.metrics.punctuationStyle.minimalPunctuation
      },

      rhythm: {
        multiMessage: this.metrics.rhythmProfile.multiMessage,
        avgBurst: this.metrics.rhythmProfile.averageMessagesPerBurst
      },

      expressiveness: this.metrics.emotionalStyle.expressiveness,

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

    if (!this.styleProfile) return true;

    if (this.lastAnalysisTimestamp &&
        Date.now() - this.lastAnalysisTimestamp > this.config.recalculateInterval) {
      return true;
    }

    return false;
  },

  calculateSourceHash(files) {

    const totalSize = files.reduce((sum, f) => sum + f.content.length, 0);
    return `${files.length}-${totalSize}`;
  },

  getStyleHints() {
    if (!this.styleProfile) {
      return this.getDefaultStyleHints();
    }

    return {

      targetLength: this.styleProfile.preferredLength,

      tone: this.styleProfile.tone.primary,
      warmth: this.styleProfile.tone.warmth,
      humor: this.styleProfile.tone.humor,

      hinglishLevel: this.styleProfile.language.hinglishLevel,
      useParticles: this.styleProfile.language.useParticles,
      useFillers: this.styleProfile.language.useFillers,

      emojiFrequency: this.styleProfile.emoji.usage,
      suggestedEmojis: this.styleProfile.emoji.favorites,
      emojiPlacement: this.styleProfile.emoji.placement,

      useDots: this.styleProfile.punctuation.useDots,

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

  adaptResponse(response, hints = null) {
    if (!hints) hints = this.getStyleHints();
    if (!response) return response;

    let adapted = response;

    adapted = this.adjustLength(adapted, hints.targetLength);

    if (hints.useParticles && Math.random() > 0.4) {
      adapted = this.addParticles(adapted);
    }

    if (hints.useFillers && Math.random() > 0.6) {
      adapted = this.addLetterRepetition(adapted);
    }

    adapted = this.adjustEmojis(adapted, hints);

    adapted = this.adjustPunctuation(adapted, hints);

    return adapted;
  },

  adjustLength(response, targetLength) {
    const words = response.split(/\s+/);

    switch (targetLength) {
      case 'short':
        if (words.length > 12) {

          return words.slice(0, 8).join(' ') + '...';
        }
        break;
      case 'medium':

        break;
      case 'medium-long':

        break;
    }

    return response;
  },

  addParticles(response) {

    const particles = ['na', 'yaar', 'haan', 'toh'];
    const particle = particles[Math.floor(Math.random() * particles.length)];

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

    const patterns = [
      { find: /\bhii?\b/gi, replace: 'hiii' },
      { find: /\boki?\b/gi, replace: 'okkk' },
      { find: /\bsorry\b/gi, replace: 'sorryyy' },
      { find: /\bplease\b/gi, replace: 'pleasee' },
      { find: /\bhmm\b/gi, replace: 'hmmm' }
    ];

    const pattern = patterns[Math.floor(Math.random() * patterns.length)];
    return response.replace(pattern.find, pattern.replace);
  },

  adjustEmojis(response, hints) {
    const emojis = response.match(/[\u{1F300}-\u{1F9FF}]|[\u{2600}-\u{26FF}]/gu) || [];

    switch (hints.emojiFrequency) {
      case 'minimal':

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

        if (emojis.length === 0 && hints.suggestedEmojis?.length > 0) {
          const emoji = hints.suggestedEmojis[Math.floor(Math.random() * hints.suggestedEmojis.length)];
          if (hints.emojiPlacement === 'end') {
            response = response.trim() + ' ' + emoji;
          }
        }
        break;

      case 'frequent':

        if (emojis.length === 0 && hints.suggestedEmojis?.length > 0 && Math.random() > 0.3) {
          const emoji = hints.suggestedEmojis[Math.floor(Math.random() * hints.suggestedEmojis.length)];
          response = response.trim() + ' ' + emoji;
        }
        break;
    }

    return response;
  },

  adjustPunctuation(response, hints) {

    if (hints.useDots && Math.random() > 0.6) {

      if (!/[.!?…]$/.test(response.trim())) {
        response = response.trim() + '...';
      }
    }

    return response;
  },

  clearProfile() {
    this.styleProfile = null;
    this.lastAnalysisTimestamp = null;
    this.sourceHash = null;
    this.resetMetrics();
    localStorage.removeItem('herStyleProfile');
    console.log('[PersonalityAdapter] Profile cleared');
  },

  getStatus() {
    return {
      hasProfile: !!this.styleProfile,
      lastAnalyzed: this.lastAnalysisTimestamp
        ? new Date(this.lastAnalysisTimestamp).toISOString()
        : null,
      metrics: this.styleProfile ? 'loaded' : 'none',

      contentStored: false
    };
  }
};

window.PersonalityAdapter = PersonalityAdapter;

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => PersonalityAdapter.init());
} else {
  PersonalityAdapter.init();
}
