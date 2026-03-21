# AI Assistant

A local-first, privacy-respecting, cross-platform desktop assistant.

## Features

- **Cross-Platform**: Works on Linux, Windows, and macOS
- **Privacy-First**: All processing happens locally - no data sent to external servers
- **Offline-Capable**: Works without an internet connection
- **Safe by Design**: Confirmation prompts, rate limiting, and safe mode
- **Multiple Interfaces**: CLI, GUI, and Voice support

## Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                        Interface Layer                          │
│              (CLI / GUI / Voice - swappable)                    │
└─────────────────────────┬───────────────────────────────────────┘
                          │ User Input / Response
                          ▼
┌─────────────────────────────────────────────────────────────────┐
│                         Core Brain                              │
│  ┌──────────────┐  ┌────────────┐  ┌──────────────────────┐    │
│  │Intent Parser │→ │  Router    │→ │ Context Manager      │    │
│  └──────────────┘  └────────────┘  └──────────────────────┘    │
└─────────────────────────┬───────────────────────────────────────┘
                          │ Abstract Actions
                          ▼
┌─────────────────────────────────────────────────────────────────┐
│                    Action Abstraction Layer                     │
│         (OPEN_APP, ADJUST_VOLUME, TAKE_SCREENSHOT, etc.)       │
└─────────────────────────┬───────────────────────────────────────┘
                          │ OS-Agnostic Commands
                          ▼
┌─────────────────────────────────────────────────────────────────┐
│                       OS Adapter Layer                          │
│    ┌───────────┐    ┌───────────┐    ┌───────────┐            │
│    │   Linux   │    │  Windows  │    │   macOS   │            │
│    │  Adapter  │    │  Adapter  │    │  Adapter  │            │
│    └───────────┘    └───────────┘    └───────────┘            │
└─────────────────────────────────────────────────────────────────┘
```

## Project Structure

```
ai-assistant/
├── main.py                 # Application entry point
├── interfaces/
│   ├── cli.py             # Command-line interface
│   ├── gui_kivy.py        # Desktop GUI interface (Kivy)
│   └── voice.py           # Voice interface coordinator
├── brain/
│   ├── intent_parser.py   # Natural language → intent
│   ├── router.py          # Command routing & execution
│   └── context.py         # Conversation context
├── actions/
│   └── schema.py          # Abstract action definitions
├── adapters/
│   ├── linux.py           # Linux-specific commands
│   ├── windows.py         # Windows-specific commands
│   └── macos.py           # macOS-specific commands
├── speaker/
│   └── tts.py             # Text-to-Speech engine
├── listener/
│   └── stt.py             # Speech-to-Text engine
├── ui/
│   └── assistant.kv       # Kivy layout/styling
├── utils/
│   └── config.py          # Configuration & safety
├── requirements.txt
└── README.md
```

## Requirements

- Python 3.9 or higher
- Kivy 2.2+ (installed via requirements.txt)

### Installation

```bash
# Clone or download the project
cd ai-assistant

# (Optional) Create virtual environment
python -m venv venv
source venv/bin/activate  # Linux/macOS
# or
.\venv\Scripts\activate   # Windows

# Install dependencies
pip install -r requirements.txt
```

### Optional Voice Dependencies

Voice support is included in requirements.txt. If you encounter PyAudio installation issues:

**Windows Note**:
```bash
pip install pipwin
pipwin install pyaudio
```

**Linux Note**:
```bash
sudo apt-get install portaudio19-dev
pip install PyAudio
```

## Usage

### GUI Mode (Default)

```bash
python main.py
```

The application launches in GUI mode by default with a clean, dark-themed interface.

### GUI with Voice

```bash
python main.py --voice
```

Enable voice input (push-to-talk) and text-to-speech output. Click the 🎤 button to start listening.

### CLI Mode

```bash
python main.py --cli
```

For terminal-based interaction or scripting.

### Single Command

```bash
python main.py --command "open notepad"
python main.py -c "time"
```

### Safe Mode

```bash
python main.py --safe-mode
python main.py --cli --safe-mode
```

### Quiet Mode (CLI, no banner)

```bash
python main.py --cli --quiet
```

## Interface Modes

### GUI Interface (Default)
- Modern Kivy-based desktop window
- Clean dark theme with accent colors
- Top bar with title and status indicator
- Scrollable conversation view with message bubbles
- Bottom input bar with text field and send button
- Microphone button for voice input (visible even when disabled)
- Status indicator: Idle / Listening / Processing / Speaking
- Launches automatically when app starts

### CLI Interface
- Text-based command line interface
- Works in any terminal
- Lowest resource usage
- Best for scripting and automation
- Enable with `--cli` flag

### Voice Interface
- Push-to-talk voice input (click 🎤 button)
- Text-to-speech responses
- Runs in background thread (non-blocking)
- Confirmation required for destructive actions
- 1-second cooldown between commands
- Enable with `--voice` flag

## Available Commands

### Applications
| Command | Description |
|---------|-------------|
| `open <app>` | Open an application |
| `launch <app>` | Same as open |

### Files & Folders
| Command | Description |
|---------|-------------|
| `open file <path>` | Open a file |
| `open folder <path>` | Open a folder |

### Web
| Command | Description |
|---------|-------------|
| `open url <url>` | Open a URL in browser |

### Volume Control
| Command | Description |
|---------|-------------|
| `volume <0-100>` | Set volume level |
| `mute` | Mute volume |
| `unmute` | Unmute volume |

### Screenshots
| Command | Description |
|---------|-------------|
| `screenshot` | Take a screenshot |

### System
| Command | Description |
|---------|-------------|
| `shutdown` | Shutdown (requires confirmation) |
| `restart` | Restart (requires confirmation) |
| `lock` | Lock screen |
| `battery` | Show battery status |

### Information
| Command | Description |
|---------|-------------|
| `time` | Current time |
| `date` | Current date |
| `status` | Assistant status |
| `help` | Show all commands |

### Safety
| Command | Description |
|---------|-------------|
| `safe mode` | Enable safe mode |
| `disable safe mode` | Disable safe mode |
| `exit` | Close assistant |

## Adding New Commands

### 1. Define the Action Type

In `actions/schema.py`:

```python
class ActionType(Enum):
    # ... existing types
    MY_NEW_ACTION = auto()
```

### 2. Add Intent Pattern

In `brain/intent_parser.py`:

```python
IntentPattern(
    patterns=[
        r"^my\s+new\s+command(?:\s+(?P<param>.+))?$",
    ],
    action_type=ActionType.MY_NEW_ACTION,
    entity_extractors={"param": "param"}
),
```

### 3. Implement in Adapters

In each adapter (`adapters/linux.py`, `windows.py`, `macos.py`):

```python
def my_new_action(self, param: str) -> ActionResult:
    # OS-specific implementation
    return ActionResult.success("Action completed")
```

### 4. Add to Dispatcher

In `adapters/__init__.py`:

```python
ActionType.MY_NEW_ACTION: lambda: self.my_new_action(action.parameters.get("param", "")),
```

## Safety Features

### Confirmation Prompts
Destructive actions (shutdown, restart) require explicit confirmation.

### Rate Limiting
Maximum 30 commands per minute to prevent accidental spam.

### Cooldown
1-second cooldown between commands.

### Safe Mode
Read-only mode that blocks all system-modifying commands.

### Kill Switch
Emergency stop that blocks all command execution.

## Configuration

Configuration is stored in `~/.ai-assistant/config.json`:

```json
{
  "log_level": "INFO",
  "safety": {
    "cooldown_seconds": 1.0,
    "safe_mode": false,
    "max_commands_per_minute": 30,
    "confirmation_required": {
      "shutdown": true,
      "restart": true,
      "delete_file": true
    }
  }
}
```

## Extending the System

### Adding a New Interface

1. Create a new class that inherits from `BaseInterface`
2. Implement `start()`, `stop()`, `display_output()`, and `get_input()`
3. Use the existing `CommandRouter` for processing

## Platform Notes

### Windows
- GUI and CLI work out of the box
- Voice TTS uses Windows SAPI (built-in)
- PyAudio installation may require:
  ```bash
  pip install pipwin
  pipwin install pyaudio
  ```
- Volume control works best with optional `pycaw` package

### Linux
- Requires `espeak` or `espeak-ng` for TTS fallback
- Install: `sudo apt install espeak-ng`
- PyAudio requires: `sudo apt install portaudio19-dev`

### macOS
- Uses built-in `say` command for TTS
- Full functionality with standard Python

## Known Limitations

- **Volume Control**: May require additional packages on some systems
- **Voice STT**: Google Speech API requires internet; use Vosk for fully offline
- **Wake Word**: Scaffolded but not enabled by default (requires continuous listening)
- **GUI Theming**: Uses Tkinter defaults with custom colors; may vary by OS

## Troubleshooting

### Voice not working
1. Check microphone permissions
2. Install required packages: `pip install pyttsx3 SpeechRecognition PyAudio`
3. Test microphone with another application

### GUI not starting
1. Ensure Tkinter is installed (included with Python on most systems)
2. On Linux: `sudo apt install python3-tk`

### Commands not recognized
1. Check spelling and syntax
2. Use `help` command to see available commands
3. Ensure proper spacing (e.g., "open notepad" not "opennotepad")

## License

MIT License

## Contributing

1. Fork the repository
2. Create a feature branch
3. Submit a pull request

---

Built with ❤️ for privacy and local-first computing.
