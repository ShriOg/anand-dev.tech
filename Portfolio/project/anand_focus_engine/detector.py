import ctypes
import subprocess
import threading
import json
from typing import List, Set, Callable, Optional
from pathlib import Path
from dataclasses import dataclass
from datetime import datetime

EnumWindowsProc = ctypes.WINFUNCTYPE(ctypes.c_bool, ctypes.c_void_p, ctypes.c_void_p)

@dataclass
class DetectionResult:
    detected: bool
    window_title: str = ""
    process_name: str = ""
    detection_type: str = ""
    timestamp: datetime = None

    def __post_init__(self):
        if self.timestamp is None:
            self.timestamp = datetime.now()

class WindowDetector:
    def __init__(self, config_path: str):
        with open(config_path, 'r') as f:
            self.config = json.load(f)

        self.blocked_sites: Set[str] = set(self.config.get("blocked_sites", []))
        self.blocked_window_titles: Set[str] = set(self.config.get("blocked_window_titles", []))
        self.detection_callbacks: List[Callable[[DetectionResult], None]] = []

        self.user32 = ctypes.windll.user32
        self.kernel32 = ctypes.windll.kernel32
        self.psapi = ctypes.windll.psapi

        self._detection_thread: Optional[threading.Thread] = None
        self._running = False
        self._lock = threading.RLock()

    def register_detection_callback(self, callback: Callable[[DetectionResult], None]) -> None:
        with self._lock:
            self.detection_callbacks.append(callback)

    def _get_active_window_title(self) -> str:
        hwnd = self.user32.GetForegroundWindow()
        length = self.user32.GetWindowTextLength(hwnd)

        if length == 0:
            return ""

        buffer = ctypes.create_unicode_buffer(length + 1)
        self.user32.GetWindowTextW(hwnd, buffer, length + 1)
        return buffer.value

    def _get_process_name_from_hwnd(self, hwnd: int) -> str:
        try:
            pid = ctypes.c_ulong()
            self.user32.GetWindowThreadProcessId(hwnd, ctypes.byref(pid))

            process_handle = self.kernel32.OpenProcess(
                0x0400 | 0x0010,
                False,
                pid.value
            )

            if not process_handle:
                return ""

            buffer = (ctypes.c_char * 260)()
            self.psapi.GetModuleFileNameExA(process_handle, None, buffer, 260)
            self.kernel32.CloseHandle(process_handle)

            process_path = buffer.value.decode('utf-8', errors='ignore')
            return Path(process_path).name if process_path else ""
        except Exception:
            return ""

    def _is_blocked_title(self, title: str) -> bool:
        title_lower = title.lower()
        for blocked in self.blocked_window_titles:
            if blocked.lower() in title_lower:
                return True
        return False

    def _is_blocked_site(self, process_name: str) -> bool:
        process_lower = process_name.lower()
        if "chrome" in process_lower or "msedge" in process_lower or "firefox" in process_lower:
            return True
        return False

    def detect_distraction_by_title(self) -> Optional[DetectionResult]:
        title = self._get_active_window_title()

        if not title:
            return None

        if self._is_blocked_title(title):
            return DetectionResult(
                detected=True,
                window_title=title,
                detection_type="window_title"
            )

        for blocked in self.blocked_sites:
            if blocked.lower() in title.lower():
                return DetectionResult(
                    detected=True,
                    window_title=title,
                    detection_type="site_in_title"
                )

        return DetectionResult(detected=False, window_title=title)

    def detect_distraction_by_process(self) -> Optional[DetectionResult]:
        hwnd = self.user32.GetForegroundWindow()
        process_name = self._get_process_name_from_hwnd(hwnd)

        if not process_name:
            return None

        if self._is_blocked_site(process_name):
            return DetectionResult(
                detected=True,
                process_name=process_name,
                detection_type="browser_process"
            )

        return None

    def detect_distraction(self) -> Optional[DetectionResult]:
        result = self.detect_distraction_by_title()

        if result and result.detected:
            return result

        result = self.detect_distraction_by_process()
        if result and result.detected:
            return result

        return None

    def start_detection_loop(self, interval_seconds: float = 1.0) -> None:
        with self._lock:
            if self._running:
                return

            self._running = True

        self._detection_thread = threading.Thread(
            target=self._detection_loop_worker,
            args=(interval_seconds,),
            daemon=False
        )
        self._detection_thread.start()

    def stop_detection_loop(self) -> None:
        with self._lock:
            self._running = False

        if self._detection_thread:
            self._detection_thread.join(timeout=5.0)
            self._detection_thread = None

    def _detection_loop_worker(self, interval_seconds: float) -> None:
        import time

        while self._running:
            try:
                result = self.detect_distraction()

                if result:
                    with self._lock:
                        for callback in self.detection_callbacks:
                            try:
                                callback(result)
                            except Exception:
                                pass

                time.sleep(interval_seconds)
            except Exception:
                with self._lock:
                    if self._running:
                        time.sleep(interval_seconds)

    def close_active_window_tab(self) -> bool:
        import time
        try:
            self.user32.keybd_event(0x57, 0, 0, 0)
            self.user32.keybd_event(0x11, 0, 0, 0)
            time.sleep(0.05)
            self.user32.keybd_event(0x57, 0, 2, 0)
            self.user32.keybd_event(0x11, 0, 2, 0)
            return True
        except Exception:
            return False

    def __del__(self):
        self.stop_detection_loop()
