import tkinter as tk
from tkinter import font as tkfont
import ctypes
import threading
import json
from typing import Dict, Any, Optional, Callable
from pathlib import Path
from datetime import datetime

GWL_EXSTYLE = -20
WS_EX_LAYERED = 0x80000
WS_EX_TRANSPARENT = 0x20
WS_EX_TOPMOST = 0x8
LWA_ALPHA = 0x2
LWA_COLORKEY = 0x1


class OverlayUI:
    def __init__(self, config_path: str):
        with open(config_path, 'r') as f:
            self.config = json.load(f)
        
        self.root = tk.Tk()
        self.root.withdraw()
        
        screen_width = self.root.winfo_screenwidth()
        screen_height = self.root.winfo_screenheight()
        
        bar_height = self.config.get("ui_overlay", {}).get("top_bar_height", 60)
        
        self.root.geometry(f"{screen_width}x{bar_height}+0+0")
        self.root.attributes('-alpha', 0.0)
        self.root.attributes('-topmost', True)
        
        self.frame = tk.Frame(self.root)
        self.frame.pack(fill=tk.BOTH, expand=True)
        
        self.frame.configure(bg='#1a1a1a')
        
        self.root.update()
        
        self._apply_glass_effect()
        
        self._create_widgets()
        
        self.session_info: Dict[str, Any] = {
            'state': 'IDLE',
            'active': False,
            'time_remaining_seconds': 0,
            'distraction_attempts': 0
        }
        
        self.flash_active = False
        self.flash_count = 0
        self.is_visible = False
        
        self._lock = threading.RLock()
        self._update_thread: Optional[threading.Thread] = None
        self._running = False

    def _apply_glass_effect(self) -> None:
        try:
            hwnd = ctypes.windll.kernel32.GetConsoleWindow()
            if hwnd == 0:
                hwnd = self.root.winfo_id()
            
            user32 = ctypes.windll.user32
            
            exstyle = user32.GetWindowLongW(hwnd, GWL_EXSTYLE)
            exstyle |= WS_EX_LAYERED | WS_EX_TOPMOST
            user32.SetWindowLongW(hwnd, GWL_EXSTYLE, exstyle)
            
            user32.SetLayeredWindowAttributes(hwnd, 0, 240, LWA_ALPHA)
            
        except Exception:
            pass

    def _create_widgets(self) -> None:
        left_frame = tk.Frame(self.frame, bg='#1a1a1a')
        left_frame.pack(side=tk.LEFT, fill=tk.BOTH, expand=True, padx=20, pady=10)
        
        status_font = tkfont.Font(family="Segoe UI", size=12, weight="bold")
        
        self.status_label = tk.Label(
            left_frame,
            text="FOCUS MODE ACTIVE",
            font=status_font,
            fg="#00ff41",
            bg="#1a1a1a"
        )
        self.status_label.pack(side=tk.LEFT)
        
        right_frame = tk.Frame(self.frame, bg='#1a1a1a')
        right_frame.pack(side=tk.RIGHT, fill=tk.BOTH, expand=False, padx=20, pady=10)
        
        timer_font = tkfont.Font(family="Segoe UI", size=13, weight="bold")
        
        self.timer_label = tk.Label(
            right_frame,
            text="00:00",
            font=timer_font,
            fg="#00ff41",
            bg="#1a1a1a"
        )
        self.timer_label.pack(side=tk.LEFT, padx=(0, 20))
        
        attempts_font = tkfont.Font(family="Segoe UI", size=11)
        
        self.attempts_label = tk.Label(
            right_frame,
            text="Attempts: 0",
            font=attempts_font,
            fg="#888888",
            bg="#1a1a1a"
        )
        self.attempts_label.pack(side=tk.LEFT)

    def update_session_info(self, info: Dict[str, Any]) -> None:
        with self._lock:
            self.session_info = info.copy()

    def _update_display(self) -> None:
        with self._lock:
            if self.session_info['state'] == 'IDLE':
                self.status_label.config(text="IDLE", fg="#888888")
                self.timer_label.config(text="--:--")
                self.attempts_label.config(text="Attempts: 0")
                if self.is_visible:
                    self.hide()
            
            elif self.session_info['state'] == 'FOCUS_ACTIVE':
                self.status_label.config(text="FOCUS MODE ACTIVE", fg="#00ff41")
                
                time_remaining = self.session_info.get('time_remaining_seconds', 0)
                minutes = time_remaining // 60
                seconds = time_remaining % 60
                self.timer_label.config(text=f"{minutes:02d}:{seconds:02d}")
                
                attempts = self.session_info.get('distraction_attempts', 0)
                self.attempts_label.config(text=f"Attempts: {attempts}")
                
                if not self.is_visible:
                    self.show()
            
            elif self.session_info['state'] == 'LOCKED':
                self.status_label.config(text="LOCKED - SESSION COMPLETE", fg="#ff6b6b")
                
                time_remaining = self.session_info.get('time_remaining_seconds', 0)
                minutes = time_remaining // 60
                seconds = time_remaining % 60
                self.timer_label.config(text=f"{minutes:02d}:{seconds:02d}")
                
                attempts = self.session_info.get('distraction_attempts', 0)
                self.attempts_label.config(text=f"Attempts: {attempts}")
                
                if not self.is_visible:
                    self.show()

    def show(self) -> None:
        with self._lock:
            self.is_visible = True
            try:
                self.root.attributes('-alpha', self.config.get("ui_overlay", {}).get("opacity", 0.95))
                self.root.deiconify()
            except Exception:
                pass

    def hide(self) -> None:
        with self._lock:
            self.is_visible = False
            try:
                self.root.attributes('-alpha', 0.0)
                self.root.withdraw()
            except Exception:
                pass

    def flash_warning(self, count: int = 3, interval_ms: int = 200) -> None:
        def flash_worker():
            for _ in range(count * 2):
                try:
                    current_alpha = float(self.root.attributes('-alpha'))
                    new_alpha = 0.2 if current_alpha > 0.5 else 0.95
                    self.root.attributes('-alpha', new_alpha)
                    self.root.update()
                except Exception:
                    pass
                
                threading.Event().wait(interval_ms / 1000.0)
            
            try:
                self.root.attributes('-alpha', self.config.get("ui_overlay", {}).get("opacity", 0.95))
                self.root.update()
            except Exception:
                pass
        
        flash_thread = threading.Thread(target=flash_worker, daemon=True)
        flash_thread.start()

    def start_update_loop(self) -> None:
        with self._lock:
            if self._running:
                return
            self._running = True
        
        self._update_thread = threading.Thread(target=self._update_loop_worker, daemon=False)
        self._update_thread.start()

    def stop_update_loop(self) -> None:
        with self._lock:
            self._running = False
        
        if self._update_thread:
            self._update_thread.join(timeout=5.0)
            self._update_thread = None

    def _update_loop_worker(self) -> None:
        update_interval = self.config.get("ui_overlay", {}).get("update_interval", 1000) / 1000.0
        
        while self._running:
            try:
                self._update_display()
                self.root.update()
                threading.Event().wait(update_interval)
            except Exception:
                threading.Event().wait(0.1)

    def run(self) -> None:
        try:
            self.root.mainloop()
        except Exception:
            pass

    def quit(self) -> None:
        try:
            self.root.quit()
            self.root.destroy()
        except Exception:
            pass

    def __del__(self):
        self.stop_update_loop()
        try:
            self.quit()
        except Exception:
            pass
