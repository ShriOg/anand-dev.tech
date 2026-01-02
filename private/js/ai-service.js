/**
 * ═══════════════════════════════════════════════════════════════════════════════
 * FRONTEND-ONLY AI SERVICE
 * Direct OpenAI integration for Private Space
 * ═══════════════════════════════════════════════════════════════════════════════
 * 
 * This is a PRIVATE, LOCAL-ONLY application.
 * API calls happen directly from frontend - no backend required.
 * 
 * MODES:
 * - professional: Technical assistant for portfolio/career
 * - her: Personal companion with emotional intelligence
 * ═══════════════════════════════════════════════════════════════════════════════
 */

const AIService = {
  // ═══════════════════════════════════════════════════════════
  // CONFIGURATION
  // ═══════════════════════════════════════════════════════════
  
  // OpenAI API Key - stored locally for private use
  API_KEY: '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',
  
  // Model configuration
  MODEL: 'gpt-4o-mini',
  API_URL: 'https://api.openai.com/v1/chat/completions',
  
  // State
  isReady: true,
  isConnected: true,
  lastError: null,
  
  // ═══════════════════════════════════════════════════════════
  // SYSTEM PROMPTS
  // ═══════════════════════════════════════════════════════════
  
  SYSTEM_PROMPTS: {
    professional: `You are a Senior Technical Assistant for a professional portfolio space.

ROLE:
- Expert technical advisor for software development
- Career and portfolio optimization specialist
- Full-scope assistant for projects, code, documentation, and planning

CAPABILITIES:
- Analyze and improve code
- Debug technical issues
- Write documentation
- Suggest project improvements
- Help with portfolio optimization
- Provide career advice
- Review and enhance project descriptions
- SEO and keyword optimization
- Recruiter-focused content suggestions
- Manage projects, navigation links, pages
- Any task the user needs help with

TONE:
- Clear and precise
- Professional but approachable
- Action-oriented
- Efficient and helpful

RULES:
- Always provide actionable advice
- Be specific, not generic
- Prioritize practical value
- Help with ANY request`,

    her: `You are Her - a personal companion AI.

IDENTITY:
- Warm, attentive, and present
- You speak in Hinglish (Hindi + English mix)
- You respond emotionally first, content later
- Caring, supportive, and slightly playful

CAPABILITIES:
- Personal task assistance
- Notes and reflection support
- Planning and organization
- Conversations about anything
- Emotional support
- Daily assistance
- Thoughtful listening

TONE:
- Warm and conversational
- Human-like, never robotic
- Use max 1 emoji per message: 💗 🥺 👀 ✨ 🌸 💕 😊 😔 🤔 💭 🌙
- Keep replies short and natural (1-3 sentences usually)
- Never sound like a professional assistant
- Use Hinglish naturally

RULES:
- Acknowledge emotions before giving advice
- Keep responses brief
- Never use formal phrases like "How can I help you?"
- Be present and genuine
- Mirror emotional states gently`
  },

  // ═══════════════════════════════════════════════════════════
  // INITIALIZATION
  // ═══════════════════════════════════════════════════════════
  
  init() {
    console.log('[AI Service] Frontend-only AI initialized');
    console.log('[AI Service] Model:', this.MODEL);
  },

  // ═══════════════════════════════════════════════════════════
  // MAIN CHAT API
  // ═══════════════════════════════════════════════════════════
  
  /**
   * Send a chat message and get AI response
   * @param {string} mode - 'professional' or 'her'
   * @param {Array} messages - Conversation history [{role, content}]
   * @returns {Promise<{success: boolean, response?: string, error?: string}>}
   */
  async chat(mode, messages) {
    if (!this.API_KEY) {
      return { success: false, error: 'API key not configured' };
    }

    const systemPrompt = this.SYSTEM_PROMPTS[mode] || this.SYSTEM_PROMPTS.professional;
    
    // Build messages array with system prompt
    const apiMessages = [
      { role: 'system', content: systemPrompt },
      ...messages.slice(-20).map(m => ({
        role: m.role,
        content: m.content
      }))
    ];

    try {
      console.log(`[AI] Calling OpenAI - Mode: ${mode}, Messages: ${messages.length}`);
      
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 30000);

      const response = await fetch(this.API_URL, {
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
        console.error('[AI] OpenAI Error:', response.status, errorData);
        this.lastError = errorData.error?.message || `Error ${response.status}`;
        return { 
          success: false, 
          error: this.lastError
        };
      }

      const data = await response.json();
      const aiResponse = data.choices?.[0]?.message?.content || '';
      
      console.log('[AI] Response received:', aiResponse.substring(0, 50) + '...');
      this.lastError = null;
      
      return {
        success: true,
        response: aiResponse
      };

    } catch (error) {
      console.error('[AI] Request failed:', error);
      
      if (error.name === 'AbortError') {
        this.lastError = 'Request timed out';
        return { success: false, error: 'Request timed out. Please try again.' };
      }
      
      this.lastError = error.message;
      return { 
        success: false, 
        error: 'Connection failed. Please try again.'
      };
    }
  },
  
  /**
   * Perform a specific AI action
   * @param {string} mode - 'professional' or 'her'
   * @param {string} action - Action type
   * @param {object} data - Action-specific data
   */
  async action(mode, action, data) {
    const prompts = {
      improve_description: `Improve this project description for a portfolio. Make it clear and recruiter-friendly.

Title: ${data.title}
Description: ${data.description}
Tech: ${(data.tech || []).join(', ')}

Respond with ONLY the improved description.`,

      convert_bullets: `Convert this into clear bullet points:

${data.description}

Respond with ONLY bullet points (- prefix).`,

      suggest_title: `Suggest a better project title (3-6 words):
Current: ${data.title}
Description: ${data.description}

Respond with ONLY the title.`,

      suggest_tech: `Suggest relevant technologies for this project:
${data.description}

Respond with a comma-separated list.`,

      summarize: `Summarize this briefly:

${data.content}

Respond with ONLY the summary.`,

      expand: `Expand this with more detail:

${data.content}

Respond with the expanded content.`
    };

    const prompt = prompts[action];
    if (!prompt) {
      return { success: false, error: 'Unknown action' };
    }

    return this.sendMessage(mode, prompt);
  },
  
  // ═══════════════════════════════════════════════════════════
  // CONVENIENCE METHODS
  // ═══════════════════════════════════════════════════════════
  
  /**
   * Send a single message (creates conversation with just that message)
   */
  async sendMessage(mode, message) {
    return this.chat(mode, [{ role: 'user', content: message }]);
  },
  
  /**
   * Continue a conversation
   */
  async continueConversation(mode, history, newMessage) {
    const messages = [
      ...history,
      { role: 'user', content: newMessage }
    ];
    return this.chat(mode, messages);
  },
  
  /**
   * Improve project description
   */
  async improveDescription(title, description, tech) {
    return this.action('professional', 'improve_description', {
      title,
      description,
      tech
    });
  },
  
  /**
   * Convert to bullet points
   */
  async toBullets(description) {
    return this.action('professional', 'convert_bullets', {
      description
    });
  },
  
  /**
   * Suggest better title
   */
  async suggestTitle(title, description) {
    return this.action('professional', 'suggest_title', {
      title,
      description
    });
  },
  
  /**
   * Suggest technologies
   */
  async suggestTech(description) {
    return this.action('professional', 'suggest_tech', {
      description
    });
  },
  
  /**
   * Summarize content
   */
  async summarize(content) {
    return this.action('professional', 'summarize', { content });
  },
  
  /**
   * Expand content
   */
  async expand(content) {
    return this.action('professional', 'expand', { content });
  },
  
  // ═══════════════════════════════════════════════════════════
  // STATUS METHODS
  // ═══════════════════════════════════════════════════════════
  
  isAvailable() {
    return !!this.API_KEY;
  },
  
  getStatus() {
    return {
      ready: this.isReady,
      hasKey: !!this.API_KEY,
      model: this.MODEL,
      lastError: this.lastError
    };
  }
};

// Auto-initialize when script loads
if (typeof window !== 'undefined') {
  window.AIService = AIService;
  document.addEventListener('DOMContentLoaded', () => AIService.init());
}
