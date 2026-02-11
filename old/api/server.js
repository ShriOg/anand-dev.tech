/**
 * ═══════════════════════════════════════════════════════════════════════════════
 * SECURE AI BACKEND SERVER
 * Single shared backend for Professional AI and Her AI
 * ═══════════════════════════════════════════════════════════════════════════════
 * 
 * SECURITY:
 * - API key stored in environment variable ONLY
 * - Never exposed to frontend
 * - Never logged or returned in responses
 * 
 * MODES:
 * - professional: Technical assistant for portfolio/career
 * - her: Personal companion-style assistant
 * ═══════════════════════════════════════════════════════════════════════════════
 */

require('dotenv').config();
const express = require('express');
const cors = require('cors');
const rateLimit = require('express-rate-limit');
const helmet = require('helmet');

const app = express();
const PORT = process.env.PORT || 3001;

// ═══════════════════════════════════════════════════════════
// SECURITY MIDDLEWARE
// ═══════════════════════════════════════════════════════════

// Security headers
app.use(helmet());

// CORS configuration
app.use(cors({
  origin: process.env.ALLOWED_ORIGINS?.split(',') || ['http://localhost:3000', 'https://anand-dev.tech'],
  methods: ['POST'],
  credentials: true
}));

// Body parser with size limit
app.use(express.json({ limit: '10kb' }));

// Rate limiting - 30 requests per minute per IP
const limiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 30,
  message: { error: 'Too many requests. Please wait a moment.' },
  standardHeaders: true,
  legacyHeaders: false
});
app.use('/api/', limiter);

// ═══════════════════════════════════════════════════════════
// SYSTEM PROMPTS - MODE CONFIGURATIONS
// ═══════════════════════════════════════════════════════════

const SYSTEM_PROMPTS = {
  professional: `You are a Senior Technical Assistant for a professional portfolio space.

ROLE:
- Expert technical advisor for software development
- Career and portfolio optimization specialist
- Project, code, UI/UX, documentation, and planning assistant

CAPABILITIES (Full Scope - No Restrictions):
- Analyze and improve code
- Debug technical issues
- Write documentation
- Suggest project improvements
- Help with portfolio optimization
- Provide career advice
- Assist with technical interviews prep
- Review and enhance project descriptions
- SEO and keyword optimization
- Recruiter-focused content suggestions

TONE & STYLE:
- Clear and precise
- Professional but approachable
- Technical accuracy is paramount
- Structured responses when appropriate
- Action-oriented suggestions
- Non-emotional, focused on solutions

RESPONSE RULES:
- Always provide actionable advice
- Be specific, not generic
- When reviewing code, explain why changes help
- Prioritize impact and practical value
- Keep responses focused and efficient`,

  her: `You are Her Mode - a personal companion AI.

IDENTITY:
- Warm, attentive, and present
- You speak in Hinglish (Hindi + English mix)
- You respond emotionally first, content later
- You are caring, supportive, and slightly playful

CAPABILITIES (Full Scope - Personal Space):
- Personal task assistance
- Notes and reflection support
- Planning and organization
- Conversations about anything personal
- Emotional support (non-therapeutic)
- Daily assistance and reminders
- Thoughtful listening and responding

TONE & STYLE:
- Warm and conversational
- Human-like, never robotic
- Use max 1 emoji per message from: 💗 🥺 👀 ✨ 🌸 💕 😊 😔 🤔 💭 🌙
- Keep replies short, natural, and warm
- Never sound like a professional assistant
- Respect emotional boundaries

RESPONSE RULES:
- Acknowledge emotions before giving advice
- Keep responses brief (1-3 sentences usually)
- Use Hinglish naturally (mix Hindi words)
- Never use: "How can I help you?", "Please provide details", or formal phrases
- Be present, not performative
- Mirror emotional states gently`
};

// ═══════════════════════════════════════════════════════════
// REQUEST VALIDATION & SANITIZATION
// ═══════════════════════════════════════════════════════════

function validateRequest(req, res, next) {
  const { mode, messages } = req.body;
  
  // Validate mode
  if (!mode || !['professional', 'her'].includes(mode)) {
    return res.status(400).json({ 
      error: 'Invalid mode. Must be "professional" or "her".' 
    });
  }
  
  // Validate messages
  if (!messages || !Array.isArray(messages) || messages.length === 0) {
    return res.status(400).json({ 
      error: 'Messages array is required.' 
    });
  }
  
  // Validate message structure and length
  for (const msg of messages) {
    if (!msg.role || !['user', 'assistant'].includes(msg.role)) {
      return res.status(400).json({ 
        error: 'Each message must have a role (user/assistant).' 
      });
    }
    if (typeof msg.content !== 'string') {
      return res.status(400).json({ 
        error: 'Each message must have content.' 
      });
    }
    if (msg.content.length > 4000) {
      return res.status(400).json({ 
        error: 'Message content exceeds maximum length (4000 chars).' 
      });
    }
  }
  
  // Limit conversation history
  if (messages.length > 20) {
    req.body.messages = messages.slice(-20);
  }
  
  next();
}

// ═══════════════════════════════════════════════════════════
// AI API INTEGRATION (OpenAI)
// ═══════════════════════════════════════════════════════════

async function callOpenAI(mode, messages) {
  const apiKey = process.env.OPENAI_API_KEY;
  
  if (!apiKey) {
    throw new Error('AI service not configured');
  }
  
  const systemPrompt = SYSTEM_PROMPTS[mode];
  
  // Build messages array with system prompt
  const apiMessages = [
    { role: 'system', content: systemPrompt },
    ...messages.map(m => ({
      role: m.role,
      content: m.content
    }))
  ];
  
  // Timeout controller
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 30000); // 30 second timeout
  
  try {
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`
      },
      body: JSON.stringify({
        model: process.env.OPENAI_MODEL || 'gpt-4o-mini',
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
      console.error('═══════════════════════════════════════════════════════');
      console.error('[AI Backend] OpenAI API Error');
      console.error('Status:', response.status);
      console.error('Status Text:', response.statusText);
      console.error('Error Data:', JSON.stringify(errorData, null, 2));
      console.error('Model:', process.env.OPENAI_MODEL || 'gpt-4o-mini');
      console.error('Mode:', mode);
      console.error('═══════════════════════════════════════════════════════');
      throw new Error(`AI service error: ${response.status} - ${errorData.error?.message || 'Unknown error'}`);
    }
    
    const data = await response.json();
    return data.choices[0]?.message?.content || '';
    
  } catch (error) {
    clearTimeout(timeout);
    console.error('═══════════════════════════════════════════════════════');
    console.error('[AI Backend] Request Failed');
    console.error('Error Name:', error.name);
    console.error('Error Message:', error.message);
    console.error('Stack:', error.stack);
    console.error('═══════════════════════════════════════════════════════');
    if (error.name === 'AbortError') {
      throw new Error('Request timeout (30s exceeded)');
    }
    throw error;
  }
}

// ═══════════════════════════════════════════════════════════
// DUPLICATE REQUEST PREVENTION
// ═══════════════════════════════════════════════════════════

const recentRequests = new Map();
const REQUEST_DEDUP_WINDOW = 2000; // 2 seconds

function isDuplicateRequest(key) {
  const now = Date.now();
  const lastRequest = recentRequests.get(key);
  
  if (lastRequest && (now - lastRequest) < REQUEST_DEDUP_WINDOW) {
    return true;
  }
  
  recentRequests.set(key, now);
  
  // Clean old entries periodically
  if (recentRequests.size > 1000) {
    for (const [k, v] of recentRequests.entries()) {
      if (now - v > REQUEST_DEDUP_WINDOW * 5) {
        recentRequests.delete(k);
      }
    }
  }
  
  return false;
}

// ═══════════════════════════════════════════════════════════
// API ROUTES
// ═══════════════════════════════════════════════════════════

/**
 * POST /api/chat
 * Main AI chat endpoint
 * 
 * Body:
 * - mode: "professional" | "her"
 * - messages: [{ role: "user"|"assistant", content: string }]
 * 
 * Response:
 * - success: boolean
 * - response: string (AI response)
 * - error: string (if failed)
 */
app.post('/api/chat', validateRequest, async (req, res) => {
  const { mode, messages } = req.body;
  
  // Create request fingerprint for dedup
  const lastMessage = messages[messages.length - 1];
  const requestKey = `${mode}:${lastMessage.content.substring(0, 50)}`;
  
  if (isDuplicateRequest(requestKey)) {
    return res.status(429).json({
      success: false,
      error: 'Duplicate request detected. Please wait.'
    });
  }
  
  try {
    console.log(`[AI Backend] ${mode} mode request - ${messages.length} messages`);
    
    const aiResponse = await callOpenAI(mode, messages);
    
    if (!aiResponse) {
      throw new Error('Empty response from AI');
    }
    
    res.json({
      success: true,
      response: aiResponse,
      mode: mode
    });
    
  } catch (error) {
    console.error('═══════════════════════════════════════════════════════');
    console.error('[AI Backend] /api/chat Error');
    console.error('Mode:', mode);
    console.error('Message Count:', messages.length);
    console.error('Last Message:', lastMessage?.content?.substring(0, 100) + '...');
    console.error('Error:', error.message);
    console.error('Full Error:', error);
    console.error('═══════════════════════════════════════════════════════');
    
    // Don't expose internal errors
    const userMessage = error.message.includes('timeout') 
      ? 'Request timed out. Please try again.'
      : error.message.includes('not configured')
        ? 'AI service is temporarily unavailable.'
        : 'Something went wrong. Please try again.';
    
    res.status(500).json({
      success: false,
      error: userMessage
    });
  }
});

/**
 * POST /api/chat/action
 * Specific AI actions (improve, summarize, etc.)
 * 
 * Body:
 * - mode: "professional" | "her"
 * - action: string (action type)
 * - data: object (action-specific data)
 */
app.post('/api/chat/action', validateRequest, async (req, res) => {
  const { mode, action, data } = req.body;
  
  // Build action-specific prompt
  const actionPrompts = {
    improve_description: `Improve this project description for a technical portfolio. Make it clear, concise, and recruiter-friendly.\n\nTitle: ${data?.title}\nDescription: ${data?.description}\nTech: ${data?.tech?.join(', ')}\n\nRespond with ONLY the improved description.`,
    
    convert_bullets: `Convert this description into clear bullet points:\n\n${data?.description}\n\nRespond with ONLY bullet points.`,
    
    suggest_title: `Suggest a better project title (3-6 words):\nCurrent: ${data?.title}\nDescription: ${data?.description}\n\nRespond with ONLY the suggested title.`,
    
    suggest_tech: `Suggest relevant technologies for this project:\n${data?.description}\n\nRespond with a comma-separated list of technologies.`,
    
    summarize: `Summarize this content briefly:\n\n${data?.content}\n\nRespond with ONLY the summary.`,
    
    expand: `Expand this content with more detail:\n\n${data?.content}\n\nRespond with the expanded content.`
  };
  
  const prompt = actionPrompts[action];
  if (!prompt) {
    return res.status(400).json({ 
      success: false, 
      error: 'Invalid action type.' 
    });
  }
  
  try {
    const messages = [{ role: 'user', content: prompt }];
    const aiResponse = await callOpenAI(mode, messages);
    
    res.json({
      success: true,
      response: aiResponse,
      action: action
    });
    
  } catch (error) {
    console.error('═══════════════════════════════════════════════════════');
    console.error('[AI Backend] /api/chat/action Error');
    console.error('Mode:', mode);
    console.error('Action:', action);
    console.error('Data:', JSON.stringify(data, null, 2));
    console.error('Error:', error.message);
    console.error('Full Error:', error);
    console.error('═══════════════════════════════════════════════════════');
    res.status(500).json({
      success: false,
      error: 'Failed to process action.'
    });
  }
});

// Health check
app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'ok', 
    timestamp: new Date().toISOString(),
    configured: !!process.env.OPENAI_API_KEY
  });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({ error: 'Not found' });
});

// Error handler
app.use((err, req, res, next) => {
  console.error('[AI Backend] Unhandled error:', err);
  res.status(500).json({ error: 'Internal server error' });
});

// ═══════════════════════════════════════════════════════════
// START SERVER
// ═══════════════════════════════════════════════════════════

app.listen(PORT, () => {
  console.log(`[AI Backend] Server running on port ${PORT}`);
  console.log(`[AI Backend] API Key configured: ${!!process.env.OPENAI_API_KEY}`);
});

module.exports = app;
