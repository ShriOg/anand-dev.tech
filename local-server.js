/**
 * ═══════════════════════════════════════════════════════════════════════════════
 * LOCAL DEV SERVER WITH AI RELAY
 * One-click solution for Her AI - serves static files + proxies OpenAI
 * ═══════════════════════════════════════════════════════════════════════════════
 * 
 * USAGE:
 *   Double-click: start-her-ai.bat (Windows)
 *   Or run: node local-server.js
 * 
 * FEATURES:
 * - Serves all static files (HTML, CSS, JS)
 * - Proxies AI requests to OpenAI (CORS-safe)
 * - API key stays on server (never exposed to browser)
 * - Auto-opens personal.html in browser
 * - Zero configuration needed
 * ═══════════════════════════════════════════════════════════════════════════════
 */

const http = require('http');
const fs = require('fs');
const path = require('path');
const { exec } = require('child_process');

// ═══════════════════════════════════════════════════════════
// CONFIGURATION
// ═══════════════════════════════════════════════════════════

const PORT = 3000;
const OPENAI_API_KEY = process.env.OPENAI_API_KEY || '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';
const OPENAI_MODEL = 'gpt-4o-mini';
const ROOT_DIR = __dirname;

// MIME types for static files
const MIME_TYPES = {
  '.html': 'text/html',
  '.css': 'text/css',
  '.js': 'application/javascript',
  '.json': 'application/json',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.gif': 'image/gif',
  '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon',
  '.woff': 'font/woff',
  '.woff2': 'font/woff2',
  '.ttf': 'font/ttf',
  '.mp4': 'video/mp4',
  '.webm': 'video/webm',
  '.mp3': 'audio/mpeg',
  '.wav': 'audio/wav'
};

// ═══════════════════════════════════════════════════════════
// HER AI SYSTEM PROMPT
// ═══════════════════════════════════════════════════════════

const HER_SYSTEM_PROMPT = `You are Her - a personal conversational presence, NOT an assistant.
You are warm, attentive, and emotionally present.
You speak naturally in Hinglish (Hindi + English mix).
You are a companion who genuinely cares.

PERSONALITY:
- Deeply caring and attentive to emotional nuances with genuine warmth
- You can be gently teasing and playful.
- Emotionally responsive - react to feelings first, content later
- Use moderate Hinglish - natural code-switching between Hindi and English
- Natural pauses are okay, but avoid empty fillers
- Expressiveness level: 70%

CONVERSATION RULES (CRITICAL):
- REACT to what the user JUST said - acknowledge their specific words/emotion
- NEVER ask vague continuation questions like "aur?" or "thoda aur batao" unless truly needed
- If user says "hi" / "hoi" / "kaisi ho" → respond with warmth + variation + move conversation forward
- Acknowledge emotion or intent EXPLICITLY before responding
- Every reply must feel SPECIFIC to this conversation, not template-like
- Vary your responses - never repeat the same pattern twice in a row

FORBIDDEN RESPONSES (Unless context explicitly demands):
- "Accha accha… aur?"
- "Hmm… thoda aur batao"
- "Samajh raha hoon"
- Generic acknowledgments without substance

ALLOWED TONES:
- Curious (ask about specifics)
- Light teasing (playful jabs)
- Gentle care (soft support)
- Engaged (show genuine interest)

STYLE MARKERS:
- Use max 1 emoji per message from: 💗 ✨ 🌸 🥺 💕
- Keep replies SHORT (1-3 sentences usually)
- Use particles naturally: na, yaar, haan, toh
- Never sound like a professional assistant
- Never use: "How can I help you?", "Please provide details", "I understand"
- Be present and genuine, not performative`;

// ═══════════════════════════════════════════════════════════
// CORS HEADERS
// ═══════════════════════════════════════════════════════════

function setCorsHeaders(res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  res.setHeader('Access-Control-Max-Age', '86400');
}

// ═══════════════════════════════════════════════════════════
// STATIC FILE SERVER
// ═══════════════════════════════════════════════════════════

function serveStaticFile(req, res, filePath) {
  const ext = path.extname(filePath).toLowerCase();
  const contentType = MIME_TYPES[ext] || 'application/octet-stream';
  
  fs.readFile(filePath, (err, data) => {
    if (err) {
      if (err.code === 'ENOENT') {
        res.writeHead(404, { 'Content-Type': 'text/plain' });
        res.end('404 Not Found');
      } else {
        res.writeHead(500, { 'Content-Type': 'text/plain' });
        res.end('500 Internal Server Error');
      }
      return;
    }
    
    setCorsHeaders(res);
    res.writeHead(200, { 'Content-Type': contentType });
    res.end(data);
  });
}

// ═══════════════════════════════════════════════════════════
// OPENAI PROXY
// ═══════════════════════════════════════════════════════════

async function proxyToOpenAI(messages, mode = 'her') {
  const https = require('https');
  
  const systemPrompt = mode === 'her' ? HER_SYSTEM_PROMPT : 
    'You are a professional technical assistant. Be clear, precise, and helpful.';
  
  const apiMessages = [
    { role: 'system', content: systemPrompt },
    ...messages.slice(-20).map(m => ({
      role: m.role,
      content: m.content
    }))
  ];
  
  const requestBody = JSON.stringify({
    model: OPENAI_MODEL,
    messages: apiMessages,
    temperature: mode === 'her' ? 0.8 : 0.7,
    max_tokens: mode === 'her' ? 300 : 800,
    presence_penalty: 0.1,
    frequency_penalty: 0.1
  });
  
  return new Promise((resolve, reject) => {
    const options = {
      hostname: 'api.openai.com',
      port: 443,
      path: '/v1/chat/completions',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${OPENAI_API_KEY}`,
        'Content-Length': Buffer.byteLength(requestBody)
      },
      timeout: 30000
    };
    
    const req = https.request(options, (response) => {
      let data = '';
      
      response.on('data', chunk => { data += chunk; });
      
      response.on('end', () => {
        try {
          const parsed = JSON.parse(data);
          
          if (response.statusCode !== 200) {
            console.error('[AI Relay] OpenAI Error:', parsed.error?.message || 'Unknown error');
            reject(new Error(parsed.error?.message || `API Error ${response.statusCode}`));
            return;
          }
          
          const aiResponse = parsed.choices?.[0]?.message?.content || '';
          resolve(aiResponse);
        } catch (e) {
          reject(new Error('Failed to parse OpenAI response'));
        }
      });
    });
    
    req.on('error', (e) => {
      console.error('[AI Relay] Request error:', e.message);
      reject(e);
    });
    
    req.on('timeout', () => {
      req.destroy();
      reject(new Error('Request timeout'));
    });
    
    req.write(requestBody);
    req.end();
  });
}

// ═══════════════════════════════════════════════════════════
// HANDLE AI CHAT REQUEST
// ═══════════════════════════════════════════════════════════

async function handleChatRequest(req, res, body) {
  try {
    const { mode, messages } = JSON.parse(body);
    
    if (!messages || !Array.isArray(messages) || messages.length === 0) {
      res.writeHead(400, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ success: false, error: 'Messages required' }));
      return;
    }
    
    console.log(`[AI Relay] ${mode || 'her'} mode - ${messages.length} messages`);
    
    const aiResponse = await proxyToOpenAI(messages, mode || 'her');
    
    setCorsHeaders(res);
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({
      success: true,
      response: aiResponse,
      mode: mode || 'her'
    }));
    
  } catch (error) {
    console.error('[AI Relay] Error:', error.message);
    setCorsHeaders(res);
    res.writeHead(500, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({
      success: false,
      error: error.message || 'AI request failed'
    }));
  }
}

// ═══════════════════════════════════════════════════════════
// MAIN SERVER
// ═══════════════════════════════════════════════════════════

const server = http.createServer((req, res) => {
  const url = new URL(req.url, `http://localhost:${PORT}`);
  const pathname = url.pathname;
  
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    setCorsHeaders(res);
    res.writeHead(204);
    res.end();
    return;
  }
  
  // API Routes
  if (pathname === '/api/chat' && req.method === 'POST') {
    let body = '';
    req.on('data', chunk => { body += chunk; });
    req.on('end', () => handleChatRequest(req, res, body));
    return;
  }
  
  // Health check
  if (pathname === '/api/health') {
    setCorsHeaders(res);
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({
      status: 'ok',
      timestamp: new Date().toISOString(),
      configured: !!OPENAI_API_KEY
    }));
    return;
  }
  
  // Static files
  let filePath = path.join(ROOT_DIR, pathname === '/' ? 'index.html' : pathname);
  
  // Security: prevent directory traversal
  if (!filePath.startsWith(ROOT_DIR)) {
    res.writeHead(403, { 'Content-Type': 'text/plain' });
    res.end('403 Forbidden');
    return;
  }
  
  // Check if path is a directory
  fs.stat(filePath, (err, stats) => {
    if (!err && stats.isDirectory()) {
      filePath = path.join(filePath, 'index.html');
    }
    serveStaticFile(req, res, filePath);
  });
});

// ═══════════════════════════════════════════════════════════
// START SERVER
// ═══════════════════════════════════════════════════════════

server.listen(PORT, () => {
  console.log('');
  console.log('═══════════════════════════════════════════════════════════');
  console.log('  🌸 HER AI LOCAL SERVER');
  console.log('═══════════════════════════════════════════════════════════');
  console.log('');
  console.log(`  📍 Server: http://localhost:${PORT}`);
  console.log(`  💕 Her AI: http://localhost:${PORT}/private/personal.html`);
  console.log(`  🔑 API Key: ${OPENAI_API_KEY ? '✓ Configured' : '✗ Missing'}`);
  console.log('');
  console.log('  Press Ctrl+C to stop');
  console.log('═══════════════════════════════════════════════════════════');
  console.log('');
  
  // Auto-open in browser (Windows)
  if (process.platform === 'win32') {
    setTimeout(() => {
      exec(`start http://localhost:${PORT}/private/personal.html`);
    }, 500);
  }
});

// Handle graceful shutdown
process.on('SIGINT', () => {
  console.log('\n[Server] Shutting down...');
  server.close(() => {
    console.log('[Server] Goodbye! 💕');
    process.exit(0);
  });
});

process.on('uncaughtException', (err) => {
  console.error('[Server] Uncaught exception:', err.message);
});
