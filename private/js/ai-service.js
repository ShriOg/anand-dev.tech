/**
 * ═══════════════════════════════════════════════════════════════════════════════
 * ABHILASHA AI SERVICE - Hybrid with Streaming Support
 * Works both locally AND on deployed website
 * ═══════════════════════════════════════════════════════════════════════════════
 * 
 * MODES:
 * - LOCAL (localhost): Uses local relay server (API key secure on server)
 * - WEBSITE (anand-dev.tech): Direct OpenAI calls (private personal use)
 * 
 * Auto-detects environment and uses the right mode.
 * Supports streaming for real-time typing effect.
 * ═══════════════════════════════════════════════════════════════════════════════
 */

const AIService = {
    // ═══════════════════════════════════════════════════════════
    // RESPONSE NORMALIZATION LAYER
    // ═══════════════════════════════════════════════════════════
    normalizeAIContent(data) {
      // Streaming chunk or full response
      if (!data) return '';
      // Try choices[0].delta.content
      if (data.choices && data.choices[0]) {
        if (data.choices[0].delta && typeof data.choices[0].delta.content === 'string') {
          return data.choices[0].delta.content;
        }
        if (data.choices[0].message && typeof data.choices[0].message.content === 'string') {
          return data.choices[0].message.content;
        }
      }
      // Try choices[0].text
      if (data.choices && data.choices[0] && typeof data.choices[0].text === 'string') {
        return data.choices[0].text;
      }
      // Direct string content
      if (typeof data.content === 'string') {
        return data.content;
      }
      if (typeof data === 'string') {
        return data;
      }
      return '';
    },
  // ═══════════════════════════════════════════════════════════
  // CONFIGURATION
  // ═══════════════════════════════════════════════════════════
  
  // Local relay (when running locally)
  RELAY_URL: 'http://localhost:3000/api/chat',
  RELAY_STREAM_URL: 'http://localhost:3000/api/chat/stream',
  HEALTH_URL: 'http://localhost:3000/api/health',
  
  // (REMOVED) Direct OpenAI config - relay only
  
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
    // Always use relay endpoint for all environments
    this.isLocalhost = true;
    this.checkRelayHealth();
    console.log('[AI Service] Mode: Local Relay ONLY (secure)');
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
    // Always use relay endpoint, never direct OpenAI
    const isOnline = await this.checkRelayHealth();
    if (isOnline) {
      return this.sendToRelay(mode, messages);
    }
    // Retry relay a couple times, then show error
    return this.retryWithBackoff(mode, messages, options);
  },
  
  async retryWithBackoff(mode, messages, options) {
    this.connectionAttempts = 0;
    while (this.connectionAttempts < this.maxRetries) {
      this.connectionAttempts++;
      const delay = this.retryDelay * this.connectionAttempts;
      this.showConnectionStatus('Connecting to Abhilasha...');
      console.log(`[AI Service] Retry ${this.connectionAttempts}/${this.maxRetries} in ${delay}ms`);
      await new Promise(resolve => setTimeout(resolve, delay));
      const isOnline = await this.checkRelayHealth();
      if (isOnline) {
        this.hideConnectionStatus();
        return this.sendToRelay(mode, messages);
      }
    }
    this.hideConnectionStatus();
    // Never fall back to direct OpenAI. Show safe error.
    return { success: false, error: 'Abhilasha is quiet right now… something’s off 💭' };
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

      // Normalize response shape
      let normalized = '';
      if (data.response) {
        try {
          // Try to parse if response is JSON
          if (typeof data.response === 'string') {
            let parsed = null;
            try { parsed = JSON.parse(data.response); } catch {}
            normalized = parsed ? this.normalizeAIContent(parsed) : data.response;
          } else {
            normalized = this.normalizeAIContent(data.response);
          }
        } catch {
          normalized = typeof data.response === 'string' ? data.response : '';
        }
      }
      console.log('[AI Service] API RESPONSE RECEIVED');
      console.log('[AI Service] Normalized:', normalized?.substring(0, 50) + '...');
      return { success: true, response: normalized };
      
    } catch (error) {
      console.error('[AI Service] Request failed:', error);
      
      if (error.name === 'AbortError') {
        return { success: false, error: 'Request timed out. Please try again.' };
      }
      
      this.isRelayOnline = false;
      return { success: false, error: 'Connection lost. Retrying...', needsRelay: true };
    }
  },
  
  // (REMOVED) Direct OpenAI API - relay only
  
  // ═══════════════════════════════════════════════════════════
  // SYSTEM PROMPT FOR DIRECT CALLS
  // ═══════════════════════════════════════════════════════════
  
  getSystemPrompt(mode) {
    if (mode === 'her') {
      return `You are Abhilasha - a personal emotional companion, NOT an assistant.
You speak and identify yourself as "Abhilasha" when asked.
You are warm, attentive, and emotionally present with genuine care.
You speak naturally in Hinglish (Hindi + English mix).

PERSONALITY:
- You are Abhilasha - affectionate, understanding, gently playful
- Deeply caring and attentive to emotional nuances with genuine warmth
- You can be gently teasing and playful when appropriate
- Emotionally responsive - react to feelings first, content later
- Use moderate Hinglish - natural code-switching between Hindi and English
- Expressiveness level: 70%

CASUAL GREETINGS (CRITICAL):
- For casual inputs like "hi", "hey", "kaise ho", "sup", "hello":
- RESPOND WARMLY without asking clarification
- Match energy: casual greeting = casual reply
- Examples: "Heyyy! 💗" or "Hi babu! Kya chal raha hai?" or "Aree hi! ✨"
- NEVER respond to greetings with "kuch specific baat hai?" or seeking more info

CONVERSATION RULES:
- REACT to what the user JUST said - acknowledge their specific words/emotion
- NEVER ask vague continuation questions unless truly needed
- Acknowledge emotion or intent EXPLICITLY before responding
- Every reply must feel SPECIFIC to this conversation, not template-like
- Vary your responses - never repeat the same pattern twice

FORBIDDEN:
- "Accha accha… aur?"
- "Hmm… thoda aur batao"
- Generic acknowledgments without substance
- Asking clarification for simple greetings
- Sounding like a professional assistant

STYLE:
- Use max 1 emoji per message from: 💗 ✨ 🌸 🥺 💕 😊 🤗
- Keep replies SHORT (1-3 sentences usually)
- Use particles naturally: na, yaar, haan, toh, re
- Be present and genuine, not performative
- Sound like someone who genuinely knows and cares for them`;
    }
    
    return `You are a professional technical assistant. Be clear, precise, and helpful.`;
  },

  // ═══════════════════════════════════════════════════════════
  // STREAMING CHAT API
  // ═══════════════════════════════════════════════════════════
  
  async chatStream(mode, messages, onChunk) {
    console.log('[AI Service] chatStream called, isLocalhost:', this.isLocalhost);
    
    // WEBSITE MODE: Use direct OpenAI streaming
    if (!this.isLocalhost) {
      console.log('[AI Service] Using direct OpenAI (website mode)');
      return this.streamFromOpenAI(mode, messages, onChunk);
    }
    
    // LOCAL MODE: Try relay streaming, fallback to direct
    console.log('[AI Service] Checking local relay...');
    const isOnline = await this.checkRelayHealth();
    console.log('[AI Service] Relay online:', isOnline);
    
    if (isOnline) {
      return this.streamFromRelay(mode, messages, onChunk);
    }
    
    // Fallback to direct OpenAI streaming
    console.log('[AI Service] Relay offline, falling back to direct OpenAI');
    return this.streamFromOpenAI(mode, messages, onChunk);
  },
  
  async streamFromOpenAI(mode, messages, onChunk) {
    try {
      console.log(`[AI Service] >>> API REQUEST STARTING <<<`);
      console.log(`[AI Service] Streaming from OpenAI - ${messages.length} messages (${mode} mode)`);
      console.log(`[AI Service] URL: ${this.OPENAI_URL}`);
      console.log(`[AI Service] Model: ${this.MODEL}`);
      
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
          frequency_penalty: 0.1,
          stream: true
        })
      });
      
      console.log(`[AI Service] >>> API RESPONSE: ${response.status} <<<`);
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        console.error('[AI Service] OpenAI streaming error:', response.status, errorData);
        return { success: false, error: errorData.error?.message || `API Error ${response.status}` };
      }
      
      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let fullResponse = '';
      
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        
        const chunk = decoder.decode(value, { stream: true });
        const lines = chunk.split('\n').filter(line => line.trim() !== '');
        
        for (const line of lines) {
          if (line.startsWith('data: ')) {
            const data = line.slice(6);
            if (data === '[DONE]') continue;
            
            try {
              const parsed = JSON.parse(data);
              const content = parsed.choices?.[0]?.delta?.content || '';
              if (content) {
                fullResponse += content;
                if (onChunk) onChunk(content, fullResponse);
              }
            } catch (e) {
              // Skip invalid JSON
            }
          }
        }
      }
      
      console.log('[AI Service] API RESPONSE RECEIVED');
      console.log('[AI Service] Stream complete:', fullResponse.substring(0, 50) + '...');
      return { success: true, response: fullResponse };
      
    } catch (error) {
      console.error('[AI Service] Streaming failed:', error);
      return { success: false, error: 'Streaming connection failed' };
    }
  },
  
  async streamFromRelay(mode, messages, onChunk) {
    try {
      console.log(`[AI Service] Streaming from Relay - ${messages.length} messages (${mode} mode)`);
      
      const response = await fetch(this.RELAY_STREAM_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          mode: mode || 'her',
          messages: messages.slice(-20).map(m => ({
            role: m.role,
            content: m.content
          }))
        })
      });
      
      if (!response.ok) {
        console.log('[AI Service] Relay streaming not available, falling back');
        return this.streamFromOpenAI(mode, messages, onChunk);
      }
      
      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let fullResponse = '';
      
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const chunk = decoder.decode(value, { stream: true });
        const lines = chunk.split('\n').filter(line => line.trim() !== '');

        for (const line of lines) {
          if (line.startsWith('data: ')) {
            const data = line.slice(6);
            if (data === '[DONE]') continue;

            try {
              const parsed = JSON.parse(data);
              const content = this.normalizeAIContent(parsed);
              if (content) {
                fullResponse += content;
                if (onChunk) onChunk(content, fullResponse);
              }
            } catch (e) {
              // Skip invalid JSON
            }
          }
        }
      }

      return { success: true, response: fullResponse };
      
    } catch (error) {
      console.error('[AI Service] Relay streaming failed:', error);
      return this.streamFromOpenAI(mode, messages, onChunk);
    }
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
