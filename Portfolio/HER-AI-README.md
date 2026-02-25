# 🌸 Her AI - Local Setup Guide

> **Her AI** is a personal AI companion that runs locally. This guide explains how to use it.

---

## Quick Start (One Click)

### Option 1: Double-click the launcher
Simply double-click **`start-her-ai.bat`** in the project folder.

This will:
1. ✅ Start the local server
2. ✅ Open Her AI in your browser
3. ✅ Everything works automatically

### Option 2: VS Code
1. Open the project in VS Code
2. Press `F5` or use **Run > Start Debugging**
3. Select "🌸 Her AI - Start Server"

### Option 3: Terminal
```bash
npm start
# or
node local-server.js
```

---

## How It Works

```
┌─────────────────────────────────────────────────────────┐
│                      YOUR BROWSER                        │
│  personal.html ←→ AIService.js ←→ localhost:3000/api    │
└───────────────────────────────┬─────────────────────────┘
                                │
┌───────────────────────────────▼─────────────────────────┐
│                   LOCAL SERVER                           │
│  local-server.js                                        │
│  ├── Serves static files (HTML, CSS, JS)                │
│  ├── Proxies AI requests to OpenAI                      │
│  └── Keeps API key secure (never in browser)            │
└───────────────────────────────┬─────────────────────────┘
                                │
┌───────────────────────────────▼─────────────────────────┐
│                      OPENAI API                          │
│  api.openai.com/v1/chat/completions                     │
└─────────────────────────────────────────────────────────┘
```

---

## Files Created

| File | Purpose |
|------|---------|
| `local-server.js` | Unified server: static files + AI relay |
| `start-her-ai.bat` | Windows launcher (double-click to start) |
| `start-her-ai.ps1` | PowerShell launcher |
| `package.json` | npm scripts (`npm start`) |
| `.vscode/tasks.json` | VS Code task (auto-run on folder open) |
| `.vscode/launch.json` | VS Code debug configuration |

---

## URLs

Once the server is running:

- **Her AI**: http://localhost:3000/private/personal.html
- **Health Check**: http://localhost:3000/api/health
- **Main Site**: http://localhost:3000/

---

## Requirements

- **Node.js** (v14 or higher) - [Download here](https://nodejs.org)
- No other dependencies needed!

---

## Troubleshooting

### "Node is not recognized"
Install Node.js from https://nodejs.org and restart your terminal.

### Server won't start
Check if port 3000 is already in use. Kill other processes or change the PORT in `local-server.js`.

### AI not responding
1. Check if the server is running (look for terminal output)
2. Check browser console for errors
3. Verify the API key in `local-server.js`

---

## Security Notes

This is a **LOCAL-ONLY** system:
- API key stays on your machine
- Never exposed to the browser
- Not deployed publicly
- For personal use only

---

## Her AI Personality

Her AI is configured to be:
- 💗 Warm and caring
- 🌸 Conversational (Hinglish)
- ✨ Emotionally aware
- 🥺 Never sounds like a bot

Customize the system prompt in `local-server.js` → `HER_SYSTEM_PROMPT`.
