import tkinter as tk
from tkinter import ttk, scrolledtext
import threading
from typing import Optional

from brain.router import CommandRouter
from actions.schema import ActionStatus
from interfaces.voice import VoiceInterface, VoiceState


class GUIInterface:
    WINDOW_TITLE = "AI Assistant"
    WINDOW_WIDTH = 600
    WINDOW_HEIGHT = 500
    
    COLORS = {
        "bg": "#0f0f12",
        "surface": "#1a1a1e",
        "surface_hover": "#252529",
        "border": "#2a2a30",
        "text": "#f0f0f3",
        "text_secondary": "#9a9aa0",
        "accent": "#50c8ff",
        "accent_hover": "#3dbae8",
        "success": "#27ca40",
        "error": "#ff5f56",
        "warning": "#ffbd2e",
    }
    
    STATUS_COLORS = {
        VoiceState.IDLE: "#9a9aa0",
        VoiceState.LISTENING: "#50c8ff",
        VoiceState.PROCESSING: "#ffbd2e",
        VoiceState.SPEAKING: "#27ca40",
        VoiceState.DISABLED: "#5a5a62",
    }
    
    STATUS_TEXT = {
        VoiceState.IDLE: "● Idle",
        VoiceState.LISTENING: "● Listening...",
        VoiceState.PROCESSING: "● Processing...",
        VoiceState.SPEAKING: "● Speaking...",
        VoiceState.DISABLED: "● Voice Disabled",
    }

    def __init__(self, router: CommandRouter, enable_voice: bool = False):
        self.router = router
        self._voice: Optional[VoiceInterface] = None
        self._voice_enabled = enable_voice
        self._running = False
        
        self._root: Optional[tk.Tk] = None
        self._output_area: Optional[scrolledtext.ScrolledText] = None
        self._input_field: Optional[ttk.Entry] = None
        self._voice_button: Optional[ttk.Button] = None
        self._status_label: Optional[ttk.Label] = None
        
        if enable_voice:
            self._voice = VoiceInterface(router)

    def start(self):
        self._running = True
        self._create_window()
        self._setup_voice()
        self._show_welcome()
        self._root.mainloop()

    def stop(self):
        self._running = False
        if self._voice:
            self._voice.stop()
        if self._root:
            self._root.quit()
            self._root.destroy()

    def _create_window(self):
        self._root = tk.Tk()
        self._root.title(self.WINDOW_TITLE)
        self._root.geometry(f"{self.WINDOW_WIDTH}x{self.WINDOW_HEIGHT}")
        self._root.configure(bg=self.COLORS["bg"])
        self._root.minsize(400, 350)
        
        self._root.protocol("WM_DELETE_WINDOW", self._on_close)
        
        self._setup_styles()
        self._create_widgets()
        self._bind_events()

    def _setup_styles(self):
        style = ttk.Style()
        style.theme_use('clam')
        
        style.configure("TFrame", background=self.COLORS["bg"])
        style.configure("Surface.TFrame", background=self.COLORS["surface"])
        
        style.configure(
            "TLabel",
            background=self.COLORS["bg"],
            foreground=self.COLORS["text"],
            font=("Segoe UI", 10)
        )
        
        style.configure(
            "Title.TLabel",
            background=self.COLORS["bg"],
            foreground=self.COLORS["text"],
            font=("Segoe UI", 14, "bold")
        )
        
        style.configure(
            "Status.TLabel",
            background=self.COLORS["bg"],
            foreground=self.COLORS["text_secondary"],
            font=("Segoe UI", 9)
        )
        
        style.configure(
            "TEntry",
            fieldbackground=self.COLORS["surface"],
            foreground=self.COLORS["text"],
            insertcolor=self.COLORS["text"],
            borderwidth=1,
            relief="solid"
        )
        
        style.configure(
            "TButton",
            background=self.COLORS["accent"],
            foreground=self.COLORS["bg"],
            font=("Segoe UI", 10, "bold"),
            borderwidth=0,
            focuscolor="none",
            padding=(15, 8)
        )
        style.map(
            "TButton",
            background=[("active", self.COLORS["accent_hover"]), ("pressed", self.COLORS["accent_hover"])]
        )
        
        style.configure(
            "Voice.TButton",
            background=self.COLORS["surface"],
            foreground=self.COLORS["text"],
            font=("Segoe UI", 10),
            borderwidth=1,
            padding=(12, 8)
        )
        style.map(
            "Voice.TButton",
            background=[("active", self.COLORS["surface_hover"]), ("pressed", self.COLORS["surface_hover"])]
        )

    def _create_widgets(self):
        main_frame = ttk.Frame(self._root, padding=20)
        main_frame.pack(fill=tk.BOTH, expand=True)
        
        header_frame = ttk.Frame(main_frame)
        header_frame.pack(fill=tk.X, pady=(0, 15))
        
        title_label = ttk.Label(header_frame, text="🤖 AI Assistant", style="Title.TLabel")
        title_label.pack(side=tk.LEFT)
        
        self._status_label = ttk.Label(header_frame, text="● Idle", style="Status.TLabel")
        self._status_label.pack(side=tk.RIGHT)
        
        output_frame = ttk.Frame(main_frame)
        output_frame.pack(fill=tk.BOTH, expand=True, pady=(0, 15))
        
        self._output_area = scrolledtext.ScrolledText(
            output_frame,
            wrap=tk.WORD,
            font=("Consolas", 10),
            bg=self.COLORS["surface"],
            fg=self.COLORS["text"],
            insertbackground=self.COLORS["text"],
            selectbackground=self.COLORS["accent"],
            selectforeground=self.COLORS["bg"],
            relief="flat",
            borderwidth=0,
            padx=12,
            pady=12,
            state=tk.DISABLED
        )
        self._output_area.pack(fill=tk.BOTH, expand=True)
        
        self._output_area.tag_configure("success", foreground=self.COLORS["success"])
        self._output_area.tag_configure("error", foreground=self.COLORS["error"])
        self._output_area.tag_configure("warning", foreground=self.COLORS["warning"])
        self._output_area.tag_configure("info", foreground=self.COLORS["text_secondary"])
        self._output_area.tag_configure("user", foreground=self.COLORS["accent"])
        
        input_frame = ttk.Frame(main_frame)
        input_frame.pack(fill=tk.X)
        
        self._input_field = tk.Entry(
            input_frame,
            font=("Segoe UI", 11),
            bg=self.COLORS["surface"],
            fg=self.COLORS["text"],
            insertbackground=self.COLORS["text"],
            relief="flat",
            borderwidth=0
        )
        self._input_field.pack(side=tk.LEFT, fill=tk.X, expand=True, ipady=10, ipadx=10)
        
        button_frame = ttk.Frame(input_frame)
        button_frame.pack(side=tk.RIGHT, padx=(10, 0))
        
        if self._voice_enabled:
            self._voice_button = ttk.Button(
                button_frame,
                text="🎤",
                style="Voice.TButton",
                command=self._on_voice_click,
                width=4
            )
            self._voice_button.pack(side=tk.LEFT, padx=(0, 5))
        
        submit_button = ttk.Button(
            button_frame,
            text="Send",
            command=self._on_submit
        )
        submit_button.pack(side=tk.LEFT)

    def _bind_events(self):
        self._input_field.bind("<Return>", lambda e: self._on_submit())
        self._input_field.bind("<Up>", self._on_history_up)
        self._root.bind("<Escape>", lambda e: self._on_close())
        self._input_field.focus_set()
        
        self._command_history = []
        self._history_index = -1

    def _setup_voice(self):
        if self._voice:
            self._voice.set_state_callback(self._on_voice_state_change)
            self._voice.set_result_callback(self._on_voice_result)
            self._voice.start()
            
            if self._voice.is_available():
                self._update_status(VoiceState.IDLE)
            else:
                self._update_status(VoiceState.DISABLED)
                self._append_output("⚠️ Voice features unavailable. Install speech libraries for voice support.\n", "warning")

    def _show_welcome(self):
        welcome = """╔══════════════════════════════════════════════════════════════╗
║                    AI ASSISTANT v1.0.0                       ║
║              Local-First • Privacy-Respecting                ║
╠══════════════════════════════════════════════════════════════╣
║  Type 'help' for commands  •  Click 🎤 for voice input       ║
╚══════════════════════════════════════════════════════════════╝

"""
        self._append_output(welcome, "info")

    def _on_submit(self):
        user_input = self._input_field.get().strip()
        if not user_input:
            return
        
        self._input_field.delete(0, tk.END)
        
        self._command_history.append(user_input)
        self._history_index = len(self._command_history)
        
        self._append_output(f"🤖 > {user_input}\n", "user")
        
        self._process_command(user_input)

    def _process_command(self, command: str):
        def _run():
            result = self.router.process(command)
            self._root.after(0, lambda: self._display_result(result))
            
            if result.data and result.data.get("exit"):
                self._root.after(100, self._on_close)
        
        thread = threading.Thread(target=_run, daemon=True)
        thread.start()

    def _display_result(self, result):
        status_tags = {
            ActionStatus.SUCCESS: "success",
            ActionStatus.FAILURE: "error",
            ActionStatus.PENDING_CONFIRMATION: "warning",
            ActionStatus.CANCELLED: "info",
            ActionStatus.BLOCKED_SAFE_MODE: "warning",
            ActionStatus.BLOCKED_COOLDOWN: "warning",
            ActionStatus.BLOCKED_RATE_LIMIT: "warning",
            ActionStatus.BLOCKED_KILL_SWITCH: "error",
        }
        
        tag = status_tags.get(result.status, "info")
        self._append_output(f"{result.message}\n\n", tag)

    def _append_output(self, text: str, tag: str = None):
        self._output_area.configure(state=tk.NORMAL)
        if tag:
            self._output_area.insert(tk.END, text, tag)
        else:
            self._output_area.insert(tk.END, text)
        self._output_area.see(tk.END)
        self._output_area.configure(state=tk.DISABLED)

    def _on_voice_click(self):
        if not self._voice or not self._voice.is_available():
            self._append_output("❌ Voice input not available.\n", "error")
            return
        
        if self._voice.get_state() == VoiceState.LISTENING:
            self._voice._stt.stop_listening()
            self._update_status(VoiceState.IDLE)
        else:
            self._append_output("🎤 Listening...\n", "info")
            self._voice.listen_for_command(timeout=5.0)

    def _on_voice_state_change(self, state: VoiceState):
        self._root.after(0, lambda: self._update_status(state))

    def _on_voice_result(self, message: str):
        def _update():
            if "❌" in message:
                self._append_output(f"{message}\n", "error")
            else:
                self._append_output(f"{message}\n\n", "success")
        self._root.after(0, _update)

    def _update_status(self, state: VoiceState):
        text = self.STATUS_TEXT.get(state, "● Unknown")
        color = self.STATUS_COLORS.get(state, self.COLORS["text_secondary"])
        
        if self._status_label:
            self._status_label.configure(text=text, foreground=color)
        
        if self._voice_button:
            if state == VoiceState.LISTENING:
                self._voice_button.configure(text="⏹")
            else:
                self._voice_button.configure(text="🎤")

    def _on_history_up(self, event):
        if self._command_history and self._history_index > 0:
            self._history_index -= 1
            self._input_field.delete(0, tk.END)
            self._input_field.insert(0, self._command_history[self._history_index])

    def _on_close(self):
        self.stop()


def run_gui(enable_voice: bool = False):
    router = CommandRouter()
    gui = GUIInterface(router, enable_voice=enable_voice)
    gui.start()


if __name__ == "__main__":
    run_gui(enable_voice=True)
