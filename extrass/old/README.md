# Pramod Fast Food — Server Setup

Quick HTTP server options for running the menu app locally.

## Option 1: Simple HTTP Server (Built-in Python)

**No dependencies required.** Uses Python's `http.server` module.

```bash
cd extrass/pramod-fast-food
python3 serve.py
```

**Options:**
```bash
python3 serve.py --port 8080              # Custom port
python3 serve.py --host 0.0.0.0          # Listen on all interfaces
python3 serve.py --no-browser             # Don't auto-open browser
```

**Browser:** Opens http://localhost:3000 automatically

**Good for:** Quick testing, static serving, development.

---

## Option 2: Flask Server (Recommended for API integration)

**Slightly more setup, but ready for backend routes.**

### Install Flask

```bash
pip install flask
# or
pip3 install flask
```

### Run the server

```bash
cd extrass/pramod-fast-food
python3 server.py
```

**Options:**
```bash
python3 server.py --port 8080              # Custom port
python3 server.py --host 0.0.0.0           # Listen on all interfaces
python3 server.py --debug                  # Hot-reload + debug mode
python3 server.py --no-browser             # Don't auto-open browser
```

**Browser:** Opens http://localhost:3000 automatically

**Good for:**
- When you're ready to add API endpoints (`/api/menu`, `/api/checkout`, etc.)
- Hot-reloading during development (`--debug`)
- Future features: authentication, logging, database integration

---

## API Endpoints (Flask Server)

**Currently stubbed — implement as needed:**

| Endpoint | Method | Purpose |
|----------|--------|---------|
| `/api/menu` | GET | Fetch menu items (future: from database) |
| `/api/checkout` | POST | Process order (future: validate + integrate) |
| `/api/health` | GET | Server health check |

**Example (curl):**
```bash
curl http://localhost:3000/api/health
# {"status":"ok"}
```

---

## Connecting Frontend to Backend

In JavaScript, when ready to use actual API:

```javascript
// Currently: MenuData.load() expects hardcoded data
// MenuData properties: { categories: {...}, allItems(), findById(id), keys(), get(key) }

// Future: replace in js/app.js or add a data loader:
async function loadMenu() {
  try {
    const res = await fetch('/api/menu');
    if (res.ok) {
      const data = await res.json();
      MenuData.load(data);  // Swap data — everything downstream stays the same!
    }
  } catch (e) {
    console.log('API unavailable, using client data');
  }
}
```

Cart checkout already has a helper `Cart.checkoutURL()` to build WhatsApp message.

---

## File Structure

```
pramod-fast-food/
├── index.html                    ← Main app
├── css/style.css                 ← All styles
├── js/
│   ├── menu-data.js             ← Data layer (menu items)
│   ├── state.js                 ← State management
│   ├── cart.js                  ← Cart logic
│   ├── ui.js                    ← DOM rendering
│   └── app.js                   ← Orchestrator (DOMContentLoaded)
├── serve.py                      ← Simple HTTP server
├── server.py                     ← Flask server (with API routes)
└── README.md                     ← This file
```

---

## Troubleshooting

**Port already in use?**
```bash
python3 serve.py --port 8080
# or kill the process:
lsof -i :3000
kill -9 <PID>
```

**Flask not found?**
```bash
pip3 install flask
# or use serve.py instead
```

**Browser doesn't open?**
```bash
python3 serve.py --no-browser
# Then manually: http://localhost:3000
```

---

## Production Deployment

For production, use a proper WSGI server:

```bash
# Install gunicorn
pip install gunicorn

# Run with 4 workers
gunicorn --workers 4 -b 0.0.0.0:8000 server:app
```

Or use Docker, Heroku, AWS Lambda, etc.

---

## Next Steps

1. **Test locally** → `python3 serve.py`
2. **Add API routes** → Edit `server.py` `/api/*` sections
3. **Connect frontend** → Update `js/menu-data.js` to fetch from `/api/menu`
4. **Database** → Add DB layer (SQLite, PostgreSQL, MongoDB, etc.)
5. **Auth/Orders** → Integrate with order management system
6. **Deploy** → Host on production server

---

**Last updated:** Feb 27, 2026
