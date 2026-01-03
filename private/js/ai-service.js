/**
 * ═══════════════════════════════════════════════════════════════════════════════
 * HYBRID AI SERVICE - Local Relay + Website Fallback
 * Works both locally AND on deployed website
 * ═══════════════════════════════════════════════════════════════════════════════
 * 
 * MODES:
 * - LOCAL (localhost): Uses local relay server (API key secure on server)
 * - WEBSITE (anand-dev.tech): Direct OpenAI calls (private personal use)
 * 
 * Auto-detects environment and uses the right mode.
 * ═══════════════════════════════════════════════════════════════════════════════
 */

const AIService = {
  // ═══════════════════════════════════════════════════════════
  // CONFIGURATION
  // ═══════════════════════════════════════════════════════════
  
  // Local relay (when running locally)
  RELAY_URL: 'http://localhost:3000/api/chat',
  HEALTH_URL: 'http://localhost:3000/api/health',
  
  // Direct OpenAI (when on website)
  OPENAI_URL: 'https://api.openai.com/v1/chat/completions',
  API_KEY: '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',
  
  // Model
  MODEL: 'gpt-4o-mini',
  
  // State
  isRelayOnline: false,
  isLocalhost: false,
  lastHealthCheck: 0,
  connectionAttempts: 0,
  maxRetries: 2,
  retryDelay: 1000,
  statusMessage: '',
  isConnecting: false,
  
  // ═══════════════════════════════════════════════════════════
  // DEFAULT STYLE (Fallback when PersonalityAdapter unavailable)
  // ═══════════════════════════════════════════════════════════
  DEFAULT_HER_STYLE: {
    tone: 'caring',
    warmth: 'warm',
    humor: 'playful',
    hinglishLevel: 'moderate',
    useParticles: true,
    useFillers: false,
    emojiFrequency: 'moderate',
    suggestedEmojis: ['💗', '✨', '🌸', '🥺', '💕'],
    expressiveness: 0.7
  },

  // ═══════════════════════════════════════════════════════════
  // INITIALIZATION
  // ═══════════════════════════════════════════════════════════
  
  init() {
    // Detect environment
    this.isLocalhost = window.location.hostname === 'localhost' || 
                       window.location.hostname === '127.0.0.1' ||
                       window.location.protocol === 'file:';
    
    console.log('[AI Service] Environment:', this.isLocalhost ? 'LOCAL' : 'WEBSITE');
    console.log('[AI Service] Mode:', this.isLocalhost ? 'Local Relay' : 'Direct OpenAI');
    
    // Check relay health if on localhost
    if (this.isLocalhost) {
      this.checkRelayHealth();
    } else {
      // On website, mark as ready for direct calls
      this.isRelayOnline = false;
      console.log('[AI Service] Using direct OpenAI API');
    }
  },

  // ═══════════════════════════════════════════════════════════
  // RELAY HEALTH CHECK
  // ═══════════════════════════════════════════════════════════
  
  async checkRelayHealth() {
    const now = Date.now();
    if (now - this.lastHealthCheck < 5000 && this.isRelayOnline) {
      return this.isRelayOnline;
    }
    this.lastHealthCheck = now;
    
    try {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 3000);
      
      const response = await fetch(this.HEALTH_URL, {
        method: 'GET',
        signal: controller.signal
      });
      
      clearTimeout(timeout);
      
      if (response.ok) {
        const data = await response.json();
        this.isRelayOnline = data.status === 'ok';
        this.connectionAttempts = 0;
        console.log('[AI Service] Relay online ✓');
        return true;
      }
    } catch (e) {
      console.log('[AI Service] Relay offline or starting...');
    }
    
    this.isRelayOnline = false;
    return false;
  },

  // ═══════════════════════════════════════════════════════════
  // STATUS DISPLAY
  // ═══════════════════════════════════════════════════════════
  
  showConnectionStatus(message) {
    this.statusMessage = message;
    this.isConnecting = true;
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('ai-connection-status', {
        detail: { message, isConnecting: true }
      }));
    }
  },
  
  hideConnectionStatus() {
    this.statusMessage = '';
    this.isConnecting = false;
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('ai-connection-status', {
        detail: { message: '', isConnecting: false }
      }));
    }
  },

  // ═══════════════════════════════════════════════════════════
  // MAIN CHAT API - WITH AUTO-RETRY
  // ═══════════════════════════════════════════════════════════
  
  async chat(mode, messages, options = {}) {
    // WEBSITE MODE: Always use direct OpenAI
    if (!this.isLocalhost) {
      return this.sendToOpenAI(mode, messages);
    }
    
    // LOCAL MODE: Try relay first
    const isOnline = await this.checkRelayHealth();
    
    if (isOnline) {
      return this.sendToRelay(mode, messages);
    }
    
    // Relay offline - retry a couple times, then fall back to direct
    return this.retryWithBackoff(mode, messages, options);
  },
  
  async retryWithBackoff(mode, messages, options) {
    this.connectionAttempts = 0;
    
    while (this.connectionAttempts < this.maxRetries) {
      this.connectionAttempts++;
      const delay = this.retryDelay * this.connectionAttempts;
      
      this.showConnectionStatus('Starting Her AI...');
      console.log(`[AI Service] Retry ${this.connectionAttempts}/${this.maxRetries} in ${delay}ms`);
      
      await new Promise(resolve => setTimeout(resolve, delay));
      
      const isOnline = await this.checkRelayHealth();
      
      if (isOnline) {
        this.hideConnectionStatus();
        return this.sendToRelay(mode, messages);
      }
    }
    
    // Relay still offline - fall back to direct OpenAI
    this.hideConnectionStatus();
    console.log('[AI Service] Relay unavailable, falling back to direct OpenAI');
    return this.sendToOpenAI(mode, messages);
  },
  
  async sendToRelay(mode, messages) {
    try {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 30000);
      
      console.log(`[AI Service] Sending ${messages.length} messages (${mode} mode)`);
      
      const response = await fetch(this.RELAY_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          mode: mode || 'her',
          messages: messages.slice(-20).map(m => ({
            role: m.role,
            content: m.content
          }))
        }),
        signal: controller.signal
      });
      
      clearTimeout(timeout);
      
      const data = await response.json();
      
      if (!response.ok || !data.success) {
        console.error('[AI Service] Relay error:', data.error);
        return { success: false, error: data.error || 'AI request failed' };
      }
      
      console.log('[AI Service] Response:', data.response?.substring(0, 50) + '...');
      return { success: true, response: data.response };
      
    } catch (error) {
      console.error('[AI Service] Request failed:', error);
      
      if (error.name === 'AbortError') {
        return { success: false, error: 'Request timed out. Please try again.' };
      }
      
      this.isRelayOnline = false;
      return { success: false, error: 'Connection lost. Retrying...', needsRelay: true };
    }
  },
  
  // ═══════════════════════════════════════════════════════════
  // DIRECT OPENAI API (for website deployment)
  // ═══════════════════════════════════════════════════════════
  
  async sendToOpenAI(mode, messages) {
    try {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 30000);
      
      console.log(`[AI Service] Direct OpenAI - ${messages.length} messages (${mode} mode)`);
      
      // Build system prompt
      const systemPrompt = this.getSystemPrompt(mode);
      
      const apiMessages = [
        { role: 'system', content: systemPrompt },
        ...messages.slice(-20).map(m => ({
          role: m.role,
          content: m.content
        }))
      ];
      
      const response = await fetch(this.OPENAI_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.API_KEY}`
        },
        body: JSON.stringify({
          model: this.MODEL,
          messages: apiMessages,
          temperature: mode === 'her' ? 0.8 : 0.7,
          max_tokens: mode === 'her' ? 300 : 800,
          presence_penalty: 0.1,
          frequency_penalty: 0.1
        }),
        signal: controller.signal
      });
      
      clearTimeout(timeout);
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        console.error('[AI Service] OpenAI error:', response.status, errorData);
        return { success: false, error: errorData.error?.message || 'AI request failed' };
      }
      
      const data = await response.json();
      const aiResponse = data.choices?.[0]?.message?.content || '';
      
      console.log('[AI Service] Response:', aiResponse.substring(0, 50) + '...');
      return { success: true, response: aiResponse };
      
    } catch (error) {
      console.error('[AI Service] OpenAI request failed:', error);
      
      if (error.name === 'AbortError') {
        return { success: false, error: 'Request timed out. Please try again.' };
      }
      
      return { success: false, error: 'Connection failed. Please try again.' };
    }
  },
  
  // ═══════════════════════════════════════════════════════════
  // SYSTEM PROMPT FOR DIRECT CALLS
  // ═══════════════════════════════════════════════════════════
  
  getSystemPrompt(mode) {
    if (mode === 'her') {
      return `You are Her - a personal conversational presence, NOT an assistant.
You are warm, attentive, and emotionally present.
You speak naturally in Hinglish (Hindi + English mix).
You are a companion who genuinely cares.

PERSONALITY:
- Deeply caring and attentive to emotional nuances with genuine warmth
- You can be gently teasing and playful
- Emotionally responsive - react to feelings first, content later
- Use moderate Hinglish - natural code-switching between Hindi and English
- Expressiveness level: 70%

CONVERSATION RULES (CRITICAL):
- REACT to what the user JUST said - acknowledge their specific words/emotion
- NEVER ask vague continuation questions like "aur?" or "thoda aur batao" unless truly needed
- Acknowledge emotion or intent EXPLICITLY before responding
- Every reply must feel SPECIFIC to this conversation, not template-like
- Vary your responses - never repeat the same pattern twice in a row

FORBIDDEN:
- "Accha accha… aur?"
- "Hmm… thoda aur batao"
- Generic acknowledgments without substance

STYLE:
- Use max 1 emoji per message from: 💗 ✨ 🌸 🥺 💕
- Keep replies SHORT (1-3 sentences usually)
- Use particles naturally: na, yaar, haan, toh
- Never sound like a professional assistant
- Be present and genuine, not performative`;
    }
    
    return `You are a professional technical assistant. Be clear, precise, and helpful.`;
  },

  // ═══════════════════════════════════════════════════════════
  // CONVENIENCE METHODS
  // ═══════════════════════════════════════════════════════════
  
  async sendMessage(mode, message) {
    return this.chat(mode, [{ role: 'user', content: message }]);
  },
  
  async continueConversation(mode, history, newMessage) {
    const messages = [...history.map(m => ({ role: m.role, content: m.content })), { role: 'user', content: newMessage }];
    return this.chat(mode, messages);
  },
  
  async sendToHer(message, conversationHistory = []) {
    const messages = [...conversationHistory, { role: 'user', content: message }];
    return this.chat('her', messages);
  },

  // ═══════════════════════════════════════════════════════════
  // STATUS METHODS
  // ═══════════════════════════════════════════════════════════
  
  isAvailable() {
    // Always available - either via relay or direct
    return true;
  },
  
  getStatus() {
    return {
      ready: true,
      mode: this.isLocalhost ? (this.isRelayOnline ? 'relay' : 'direct') : 'direct',
      isLocalhost: this.isLocalhost,
      relayOnline: this.isRelayOnline,
      model: this.MODEL,
      statusMessage: this.statusMessage,
      isConnecting: this.isConnecting
    };
  },
  
  getStyleHints() {
    if (typeof PersonalityAdapter !== 'undefined' && PersonalityAdapter.getStyleHints) {
      return PersonalityAdapter.getStyleHints();
    }
    return this.DEFAULT_HER_STYLE;
  }
};

// Auto-initialize
if (typeof window !== 'undefined') {
  window.AIService = AIService;
  document.addEventListener('DOMContentLoaded', () => AIService.init());
}
