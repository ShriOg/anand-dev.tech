# AI Backend API

Secure backend server for the Professional AI and Her AI assistants.

## Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                        FRONTEND                                  │
├─────────────────────────────────────────────────────────────────┤
│  Professional Space         │        Personal Space (Her)       │
│  ┌─────────────────────┐    │    ┌─────────────────────────┐    │
│  │   ai-assistant.js   │    │    │     ai-system.js        │    │
│  └──────────┬──────────┘    │    └───────────┬─────────────┘    │
│             │               │                │                   │
│             └───────────────┴────────────────┘                   │
│                             │                                    │
│                    ┌────────▼────────┐                           │
│                    │  ai-service.js  │ (Shared Client)           │
│                    └────────┬────────┘                           │
└─────────────────────────────┼───────────────────────────────────┘
                              │
                              │ HTTP POST /api/chat
                              │ (mode: "professional" | "her")
                              │
┌─────────────────────────────▼───────────────────────────────────┐
│                        BACKEND                                   │
│                    ┌────────────────┐                            │
│                    │   server.js    │                            │
│                    └────────┬───────┘                            │
│                             │                                    │
│  ┌──────────────────────────┼──────────────────────────────┐    │
│  │ SECURITY LAYER           │                               │    │
│  │ • Rate limiting          │                               │    │
│  │ • Request validation     │                               │    │
│  │ • CORS protection        │                               │    │
│  │ • Helmet headers         │                               │    │
│  └──────────────────────────┼───────────────────────────────┘    │
│                             │                                    │
│                    ┌────────▼────────┐                           │
│                    │  MODE ROUTER    │                           │
│                    │                 │                           │
│                    │ professional →  │                           │
│                    │ her         →   │ System Prompts            │
│                    └────────┬────────┘                           │
│                             │                                    │
│                    ┌────────▼────────┐                           │
│                    │    .env         │ API_KEY (NEVER EXPOSED)   │
│                    └────────┬────────┘                           │
└─────────────────────────────┼───────────────────────────────────┘
                              │
                              ▼
                    ┌─────────────────┐
                    │   OpenAI API    │
                    └─────────────────┘
```

## Security

**CRITICAL: API keys are NEVER exposed to the frontend.**

- API key stored ONLY in `.env` file
- `.env` is in `.gitignore` - never committed
- Key accessed via `process.env.OPENAI_API_KEY`
- Frontend has no access to API key
- All AI requests go through this backend

## Setup

### 1. Install Dependencies

```bash
cd api
npm install
```

### 2. Configure Environment

```bash
# Copy example config
cp .env.example .env

# Edit .env and add your OpenAI API key
# OPENAI_API_KEY=sk-your-key-here
```

### 3. Run Server

```bash
# Development (with auto-reload)
npm run dev

# Production
npm start
```

Server runs on `http://localhost:3001` by default.

## API Endpoints

### POST `/api/chat`

Main chat endpoint for both modes.

**Request:**
```json
{
  "mode": "professional" | "her",
  "messages": [
    { "role": "user", "content": "Hello" },
    { "role": "assistant", "content": "Hi there!" },
    { "role": "user", "content": "Help me with my project" }
  ]
}
```

**Response:**
```json
{
  "success": true,
  "response": "AI response text here",
  "mode": "professional"
}
```

### POST `/api/chat/action`

Specific AI actions (improve, summarize, etc.)

**Request:**
```json
{
  "mode": "professional",
  "action": "improve_description",
  "data": {
    "title": "Project Name",
    "description": "Current description",
    "tech": ["React", "Node.js"]
  }
}
```

**Available Actions:**
- `improve_description` - Improve project description
- `convert_bullets` - Convert to bullet points
- `suggest_title` - Suggest better title
- `suggest_tech` - Suggest technologies
- `summarize` - Summarize content
- `expand` - Expand content with detail

### GET `/api/health`

Health check endpoint.

**Response:**
```json
{
  "status": "ok",
  "timestamp": "2024-01-15T12:00:00.000Z",
  "configured": true
}
```

## Modes

### Professional Mode (`mode: "professional"`)

- Senior technical assistant
- Career and portfolio helper
- Code, documentation, planning assistance
- Clear, precise, professional tone

### Her Mode (`mode: "her"`)

- Personal companion assistant
- Emotional support and daily assistance
- Warm, conversational Hinglish tone
- Short, human-like responses

## Rate Limits

- 30 requests per minute per IP
- 2 second duplicate request prevention
- 30 second request timeout
- 4000 character max message length
- 20 message conversation history limit

## Environment Variables

| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| `OPENAI_API_KEY` | Yes | - | OpenAI API key |
| `OPENAI_MODEL` | No | `gpt-4o-mini` | OpenAI model |
| `PORT` | No | `3001` | Server port |
| `ALLOWED_ORIGINS` | No | localhost | CORS origins |
| `NODE_ENV` | No | `development` | Environment |

## Deployment

For production deployment:

1. Set `NODE_ENV=production`
2. Use a process manager (PM2, systemd)
3. Configure reverse proxy (nginx)
4. Set up HTTPS
5. Update `ALLOWED_ORIGINS` for your domain

Example PM2 start:
```bash
pm2 start server.js --name "ai-backend"
```
