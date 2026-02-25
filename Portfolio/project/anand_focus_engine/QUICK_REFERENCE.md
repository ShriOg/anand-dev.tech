# QUICK REFERENCE

## 🚀 Launch

**Batch (Windows):**
```batch
launch.bat
```

**PowerShell (Interactive):**
```powershell
powershell -ExecutionPolicy Bypass -File launch.ps1 -Mode interactive
```

**PowerShell (Daemon):**
```powershell
powershell -ExecutionPolicy Bypass -File launch.ps1 -Mode daemon
```

**Direct Python:**
```python
python main.py              # Interactive mode
python main.py --daemon     # Daemon mode
```

---

## 📋 Menu Options

| Option | Action | Details |
|--------|--------|---------|
| 1 | Start 25-min session | Quick power block |
| 2 | Start 45-min session | Standard focus |
| 3 | Start 60-min session | Deep work |
| 4 | View status | Current session details |
| 5 | View stats | Lifetime statistics |
| 6 | Emergency stop | Requires password |
| 7 | Exit program | Shutdown engine |

---

## ⚙️ Configuration

**File:** `config.json`

**Key Settings:**
```json
{
  "blocked_sites": ["instagram.com", "youtube.com", ...],
  "blocked_window_titles": ["Instagram", "YouTube", ...],
  "emergency_override_password": "focus2026",
  "focus_session_durations": [25, 45, 60],
  "auto_close_delay_ms": 500,
  "session_cooldown_seconds": 300,
  "ui_overlay": {
    "opacity": 0.95,
    "top_bar_height": 60,
    "update_interval": 1000
  }
}
```

**To Add a Site:**
```json
"blocked_sites": [
  "instagram.com",
  "yoursite.com"  // Add here
]
```

**To Change Password:**
```json
"emergency_override_password": "your_secret_password"
```

---

## 👁️ Overlay UI

**During FOCUS_ACTIVE:**
```
┌───────────────────────────────────┐
│ FOCUS MODE ACTIVE    25:13  Attempts: 2 │
└───────────────────────────────────┘
  (Green text, updates every second)
```

**During LOCKED (Cooldown):**
```
┌──────────────────────────────────────┐
│ LOCKED - SESSION COMPLETE   04:47  Attempts: 2 │
└──────────────────────────────────────┘
  (Red text, shows countdown)
```

**During IDLE:**
- Overlay hidden from screen

---

## 🔐 Emergency Override

**When**: Need to stop active session  
**Requires**: Correct password  
**Default Password**: `focus2026`

**Steps:**
1. Choose menu option `6`
2. Enter password when prompted
3. Receive confirmation: `✅ Focus session stopped.`

---

## 📊 Statistics

**File:** `stats.json`

**Tracks:**
- Total focused minutes (sum of all sessions)
- Distraction attempts blocked
- Sessions completed
- Session history (timestamps, attempt counts)
- Last session details

**View in Program:**
- Choose menu option `5` to display

**File Structure:**
```json
{
  "total_focused_minutes": 145,
  "distraction_attempts": 23,
  "sessions_completed": 5,
  "sessions": [
    {
      "session_id": "20260211_143000",
      "start_time": "2026-02-11T14:30:00",
      "planned_duration_minutes": 60,
      "distraction_attempts": 5,
      "actual_end_time": "2026-02-11T15:30:15"
    }
  ]
}
```

---

## 🐛 Troubleshooting

| Problem | Solution |
|---------|----------|
| "Python not found" | Install Python 3.14 (64-bit), add to PATH |
| Overlay not visible | Check `config.json` opacity, restart engine |
| Sites not blocking | Verify exact window titles in Task Manager |
| Password wrong | Check `config.json` for correct override password |
| Stats not saving | Ensure `stats.json` writable, not read-only |
| Detection slow | Reduce interval in `detector.py` line 23 |

---

## 🎯 Best Practices

1. **Change default password** immediately
2. **Test focus session** without critical work first
3. **Customize blocked sites** to your needs
4. **Review stats weekly** to track patterns
5. **Adjust durations** based on your productivity
6. **Use 25-min** for short power blocks
7. **Use 45-min** for standard work sessions
8. **Use 60-min** for deep, uninterrupted work

---

## 📁 File Structure

```
anand_focus_engine/
├── main.py                    # Run this
├── detector.py                # Window detection
├── focus_session.py           # Session management
├── ui_overlay.py              # UI display
├── config.json                # Configuration
├── stats.json                 # Statistics
├── launch.bat                 # Windows launcher
├── launch.ps1                 # PowerShell launcher
├── README.md                  # Full documentation
└── IMPLEMENTATION_SUMMARY.md  # Technical spec
```

---

## ⌨️ Keyboard Shortcuts

**During Session:**
- No keyboard shortcuts available (by design)
- Password-protected emergency stop only
- Must use menu option 6 for override

**Windows Keys:**
- `Ctrl+W` – Sent by engine to close distraction tabs
- `F12` – Unused (reserved for future use)

---

## 📈 Performance Tips

1. **Close unused applications** – reduces CPU usage
2. **Update graphics drivers** – better overlay rendering
3. **Adjust update interval** – higher value (e.g., 2000ms) = less CPU
4. **Reduce detection frequency** – slower scanning = less overhead

---

## 🔄 State Flow Diagram

```
                Start Session
                    ↓
        ┌───────────────────────┐
        │   FOCUS_ACTIVE        │ ← Detection ON
        │   ├─ Timer running    │
        │   └─ Blocking ON      │
        └────────────┬──────────┘
                     │ Timer expires
                     ↓
        ┌───────────────────────┐
        │   LOCKED              │ ← Cooldown timer
        │   ├─ 5 minutes        │
        │   └─ Blocking OFF     │
        └────────────┬──────────┘
                     │ Cooldown expires
                     ↓
        ┌───────────────────────┐
        │   IDLE                │ ← Detection OFF
        │   ├─ Stats saved      │
        │   └─ Ready for next   │
        └───────────────────────┘
```

---

## 🎁 Example Workflows

### Workflow 1: 25-Min Pomodoro
```
Start → Focus 25m → Lock 5m → Ready for next block
```

### Workflow 2: 60-Min Deep Work
```
Start → Focus 60m → Lock 5m → Review stats → Next session
```

### Workflow 3: Emergency Stop (Wrong Password)
```
Session active → Choose 6 → Enter wrong password → ❌ Rejected
```

---

## 📞 Support

**Questions about:**
- Features → See README.md
- Architecture → See IMPLEMENTATION_SUMMARY.md
- Configuration → See config.json comments above
- Usage → See menu options (1-7)

---

## ✅ Checklist Before Use

- [ ] Python 3.14 (64-bit) installed
- [ ] All 9 files present in directory
- [ ] config.json readable/valid JSON
- [ ] stats.json readable/valid JSON
- [ ] Changed default password
- [ ] Tested with 25-min session first
- [ ] Verified overlay appears
- [ ] Added your blocked sites

---

**ANAND FOCUS ENGINE™ – READY TO USE**

🌟 Start focusing. Stop distracting. Stay locked.
