# Copilot Instructions — anand-dev.tech

## Architecture Overview

Personal portfolio + private dashboard mono-repo for `anand-dev.tech`, hosted on GitHub Pages with a Node.js API backend. Four top-level layers:

| Layer | Location | Purpose |
|---|---|---|
| **Landing Hub** | `index.html`, `script.js`, `style.css` | Three.js particle field with cards linking to WebOS, DomainBattle, Portfolio |
| **Public Portfolio** | `Portfolio/` (`index.html`, `pages/`, `assets/`) | Visitor-facing portfolio, projects, lab experiments |
| **Private Dashboard** | `private/` (own `css/`, `js/`, `she/`, `__/`) | Password-protected admin: Professional mode, Personal ("Her AI") mode, media gallery |
| **API Backend** | `Portfolio/api/`, `Portfolio/server/`, `Portfolio/local-server.js` | Node.js servers proxying AI to OpenAI/Groq — keys never reach browser |

Other sub-projects: `webos/` (browser OS), `DomainBattle/` (game), `extrass/` (restaurant PWAs).

## Sub-Projects

All three are **fully independent** from Portfolio/private — zero shared source code. They share a common Render backend (`anand-os-backend.onrender.com`) with JWT auth.

**`webos/`** — Browser-based OS with windowed apps (Notes, Files, AI, Admin). IIFE modules + bare globals. Real JWT auth via `localStorage.accessToken`. Entry: `webos/index.html` (landing), `webos/os/index.html` (desktop). Config in `webos/js/config.js` sets `window.API_BASE_URL`.

**`DomainBattle/`** — Real-time multiplayer game (Socket.IO via CDN). All logic in one file (`battle.js`, 3 object literals: `DOM`, `UI`, `SocketManager`). Requires webos login — reads same `accessToken` from localStorage.

**`extrass/`** — Two PWA restaurant apps for "Pramod Fast Food":
- Customer app: `extrass/pramod-fast-food/` — reactive `State` pub-sub store (`state.js`), frozen IIFE modules. PWA with service worker.
- Admin dashboard: `extrass/admin/` — Socket.IO real-time orders, SHA-256 hash gate auth. Kitchen display at `kitchen.html`.
- `extrass/old/` — Legacy Python server, unused. Only Python in the entire repo.

Gotcha: Render free tier has ~30s cold starts. DomainBattle/extrass have retry logic; webos does not.

## Zero-Dependency Philosophy

**No frameworks, no build tools, no bundlers.** Pure vanilla HTML/CSS/JS. Backend is minimal Express or raw `http`. Do not introduce React, Vite, webpack, etc. unless explicitly requested.

No `import`/`export` anywhere — all scripts load via ordered `<script>` tags and communicate through window globals.

## JavaScript Patterns

Two patterns are used depending on context:

**1. IIFE Module (portfolio + unified dashboard `private/a.html`):**
```js
const PSChat = (function() {
  'use strict';
  let _messages = [];                    // private state uses _underscore prefix
  function send(msg) { /* ... */ }
  return { init, send };                 // public API
})();
```
Portfolio modules: `ContentLoader`, `App` (PascalCase). Private unified modules use `PS` prefix: `PSAuth`, `PSChat`, `PSUI`, `PSSettings`, `PSSync`.

**2. Object Literal (standalone private pages):**
```js
const ProApp = { currentChat: null, async init() { ... }, send() { ... } };
const HerApp = { ... };    // personal.html
const Toast  = { ... };    // also object literal, exposed via window.Toast
```

Auto-init pattern used everywhere:
```js
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => Module.init());
} else { Module.init(); }
```

## CSS Architecture

**Portfolio** (`Portfolio/assets/css/`): 7 files loaded in order — `variables.css` → `base.css` → `layout.css` → `components.css` → `animations.css` → `responsive.css` → `zoom-transitions.css`. Unprefixed tokens: `--bg-*`, `--text-*`, `--accent-*`, `--space-1`–`--space-32`.

**Private** (`private/css/`): 20 files, parallel system with `--ps-` namespaced tokens (`--ps-bg-primary`, `--ps-text-secondary`). Do NOT mix private CSS with portfolio CSS.

Both are dark-first. Portfolio: `#0a0a0b` bg, `#3b82f6` blue accent. Private: `#000000` bg, `#e8a4b8` pink accent for "Her" mode. BEM naming throughout: `.block__element--modifier`.

## Content Management

`Portfolio/assets/content.json` is the **single source of truth** for all public content (site metadata, navigation, hero, projects, skills). HTML uses `data-content` attributes; `content-loader.js` maps JSON → DOM. Zero hardcoded text in HTML.

When adding public content: update `content.json` first, then add `data-content` attributes in HTML.

## AI Integration

Two personas share one pipeline: `ai-service.js` → backend → LLM.

| Server | Path | Provider | Use |
|---|---|---|---|
| Local dev | `Portfolio/local-server.js` | Groq (Llama 3.1 70B) | `node local-server.js`, raw `http` |
| Production | `Portfolio/api/server.js` | OpenAI (GPT-4o-mini) | Express + helmet + rate-limit (30/min) |
| Simple proxy | `Portfolio/server/server.js` | Groq | Minimal ESM proxy |

Request: `POST /api/chat` with `{ mode: "professional" | "her", messages }` — mode selects system prompt server-side. API keys in `.env`, never client-side.

## Data Storage

`private/js/database.js` wraps IndexedDB (`PrivateSpaceDB` v3) with 16 object stores: projects, navigation, pages, settings, her_chats, pro_chats, training, memories, journal, mood, images, videos, imported_chats, etc. Generic CRUD: `Database.add/put/get/getAll/delete/clear/getByIndex`.

Auth is client-side SHA-256 hash comparison (intentionally lightweight for personal use).

## Private Dashboard Entry Points

Three separate HTML files load different script sets:
- `private/a.html` — Unified dashboard, loads ~24 scripts in dependency order
- `private/professional.html` — Professional mode only (5 scripts)
- `private/personal.html` — Personal/Her mode only (6 scripts)
- `private/she/` — Media gallery with dedicated AI chat pages

Secret access: `Ctrl+Shift+P` from root landing page, or click logo 5× within 2 seconds.

## Local Development

```bash
cd Portfolio
npm install          # only dependency: dotenv
npm start            # runs local-server.js on port 3000, auto-opens browser
```

Requires `Portfolio/.env` with `GROQ_API_KEY` for AI features.

## Naming Conventions

- **Files**: kebab-case (`content-loader.js`, `ai-service.js`)
- **JS modules**: PascalCase (`ContentLoader`, `PSAuth`, `ProApp`)
- **Methods/variables**: camelCase; private state: `_underscore` prefix
- **Constants**: UPPER_SNAKE_CASE (`DB_NAME`, `SESSION_KEY`, `DEFAULT_SETTINGS`)
- **CSS tokens**: Portfolio unprefixed (`--bg-primary`), Private `--ps-` prefixed (`--ps-bg-primary`)
- **Pages**: each in own folder with `index.html` for clean URLs

## Key Gotchas

- `404.html` (root) is fully self-contained with inline CSS/JS — does not share the site's CSS
- Three separate server files exist: `local-server.js` ≠ `api/server.js` ≠ `server/server.js`
- Root `index.html` is a Three.js landing hub, NOT a placeholder — it uses its own `script.js` + `style.css`
- `private/` is at repo root, NOT inside `Portfolio/` — they are sibling directories
- `private/she/` contains 500+ media files — avoid bulk reads of that directory
