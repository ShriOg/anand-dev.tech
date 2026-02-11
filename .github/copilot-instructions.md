# Copilot Instructions — anand-dev.tech

## Architecture Overview

This is a personal portfolio + private dashboard for `anand-dev.tech`, hosted on GitHub Pages with a separate Node.js API backend. The project has **three layers**:

| Layer | Location | Purpose |
|---|---|---|
| **Public Portfolio** | `old/index.html`, `old/pages/`, `old/assets/` | Visitor-facing portfolio, projects, lab |
| **Private Dashboard** | `old/private/` (own `css/`, `js/`) | Password-protected admin with Professional and Personal ("Her AI") modes |
| **API Backend** | `old/api/`, `old/server/`, `old/local-server.js` | Node.js servers proxying AI requests to OpenAI/Groq — API keys never reach the browser |

The root `index.html` is a placeholder. All real site code lives under `old/`.

## Tech Stack & Zero-Dependency Philosophy

**No frameworks, no build tools, no bundlers.** Frontend is pure vanilla HTML/CSS/JS. Backend uses minimal Express (or raw `http` for local dev). Do not introduce React, Vite, webpack, or any frontend framework unless explicitly requested.

- Public JS uses **IIFE Module Pattern** (e.g., `ContentLoader`, `App`) exposing public API via return object
- Private JS uses **ES6 classes** and **object literals** for singletons (`AIService`, `Database`)
- Inter-module communication via `CustomEvent` dispatching and globals — no import/export
- All `<script>` tags are loaded in order; modules communicate through window globals

## CSS Conventions

Seven modular CSS files loaded in order: `variables.css` → `base.css` → `layout.css` → `components.css` → `animations.css` → `responsive.css` → `zoom-transitions.css`.

- **Design tokens** in `old/assets/css/variables.css`: `--bg-*`, `--text-*`, `--accent-*`, `--space-1` through `--space-32`, `--z-base` through `--z-overlay`, fluid `clamp()` typography
- **BEM naming**: `.block__element--modifier` (e.g., `.nav__link--active`, `.focus-card__preview-visual`)
- **Dark-first theme**: public `#0a0a0b` background, private `#000000`. Blue accent `#3b82f6`, pink accent `#e8a4b8` for personal mode
- Private dashboard has its own parallel CSS system in `old/private/css/` — do not mix with public CSS

## Content Management

`old/assets/content.json` is the **single source of truth** for all public content. HTML uses `data-content` attributes; `ContentLoader` maps JSON fields to DOM. No text is hardcoded in HTML — all projects, skills, nav items, and hero content come from this JSON.

When adding public content, update `content.json` first, then ensure corresponding `data-content` attributes exist in HTML.

## JavaScript Patterns

```js
// Public-side IIFE pattern (ContentLoader, App):
const MyModule = (function() {
  'use strict';
  let state = null;
  function doThing() { /* ... */ }
  return { init, doThing }; // public API
})();

// Auto-init at file end:
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => MyModule.init());
} else {
  MyModule.init();
}
```

- Canvas 2D for all animations (`ParticleSystem`, `WaveSimulation`)
- `requestAnimationFrame` loops for rendering
- `IntersectionObserver` for scroll-reveal
- `<template>` elements hold overlay/case-study content, cloned on card open
- Mobile gets a separate JS file (`mobile.js`); `app.js` defers with `if (isMobile()) return`

## AI Integration

Two AI personas (Professional and "Abhilasha/Her") share `AIService` → backend → OpenAI/Groq pipeline:

- **Frontend**: `old/private/js/ai-service.js` (auto-detects local vs deployed endpoint)
- **Backend**: `old/api/server.js` (production, OpenAI GPT-4o-mini) or `old/local-server.js` (local dev, Groq Llama 3.1 70B)
- **Request**: `POST /api/chat` with `{ mode: "professional" | "her", messages }` — mode selects system prompt
- **Security**: API keys in `.env`, never in client code. Rate limiting, body size limits, helmet headers on production

## Data Storage

Private dashboard uses **IndexedDB** (`PrivateSpaceDB`) via `old/private/js/database.js` — 13 object stores for projects, chats, memories, mood, images, journal, etc. Generic CRUD: `Database.add/put/get/getAll/delete/clear/getByIndex`.

Auth is client-side SHA-256 hash comparison (intentionally lightweight for personal use).

## Local Development

```bash
cd old
npm install    # only dependency: dotenv
npm start      # runs local-server.js on port 3000, auto-opens browser
```

Requires `.env` with `GROQ_API_KEY` for AI features. Server serves static files + proxies `/api/*` to Groq.

## Naming & File Conventions

- **Files**: kebab-case (`content-loader.js`, `ai-service.js`)
- **JS classes/modules**: PascalCase (`ContentLoader`, `ParticleSystem`)
- **JS methods/variables**: camelCase
- **Constants**: UPPER_SNAKE_CASE (`DB_NAME`, `SYSTEM_PROMPTS`)
- **DOM attributes**: `data-content`, `data-preview`, `data-focus-id`, `data-project-id`
- **Pages**: each gets own folder with `index.html` for clean URLs (`pages/projects/index.html`)
- **Templates** in `old/templates/` use `{{mustache}}` placeholders as structural reference only (no templating engine)

## Key Gotchas

- The `404.html` is fully self-contained (~730 lines with inline CSS/JS, dot-matrix aesthetic) — it does not share the site's CSS system
- Three separate server files exist for different contexts; `local-server.js` ≠ `api/server.js` ≠ `server/server.js`
- Secret private dashboard entry: `Ctrl+Shift+P` or click logo 5 times within 2 seconds
