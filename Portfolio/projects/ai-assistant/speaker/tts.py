import threading
import queue
from abc import ABC, abstractmethod
from typing import Optional
from enum import Enum, auto


class TTSEngine(Enum):
    PYTTSX3 = auto()
    SYSTEM = auto()
    DISABLED = auto()


class BaseTTS(ABC):
    @abstractmethod
    def speak(self, text: str) -> bool:
        pass

    @abstractmethod
    def stop(self) -> None:
        pass

    @abstractmethod
    def is_available(self) -> bool:
        pass


class Pyttsx3TTS(BaseTTS):
    def __init__(self):
        self._engine = None
        self._lock = threading.Lock()
        self._initialized = False
        self._init_engine()

    def _init_engine(self):
        try:
            import pyttsx3
            self._engine = pyttsx3.init()
            self._engine.setProperty('rate', 175)
            self._engine.setProperty('volume', 0.9)
            voices = self._engine.getProperty('voices')
            if voices:
                for voice in voices:
                    if 'english' in voice.name.lower() or 'en' in voice.id.lower():
                        self._engine.setProperty('voice', voice.id)
                        break
            self._initialized = True
        except Exception:
            self._initialized = False

    def speak(self, text: str) -> bool:
        if not self._initialized or not self._engine:
            return False
        try:
            with self._lock:
                self._engine.say(text)
                self._engine.runAndWait()
            return True
        except Exception:
            return False

    def stop(self) -> None:
        if self._engine:
            try:
                self._engine.stop()
            except Exception:
                pass

    def is_available(self) -> bool:
        return self._initialized


class SystemTTS(BaseTTS):
    def __init__(self):
        import platform
        self._system = platform.system().lower()
        self._available = self._check_availability()

    def _check_availability(self) -> bool:
        import subprocess
        try:
            if self._system == "darwin":
                subprocess.run(["which", "say"], capture_output=True, check=True)
                return True
            elif self._system == "linux":
                result = subprocess.run(["which", "espeak"], capture_output=True)
                if result.returncode == 0:
                    return True
                result = subprocess.run(["which", "espeak-ng"], capture_output=True)
                return result.returncode == 0
            elif self._system == "windows":
                return True
        except Exception:
            pass
        return False

    def speak(self, text: str) -> bool:
        if not self._available:
            return False
        import subprocess
        try:
            text = text.replace('"', '\\"').replace("'", "\\'")
            if self._system == "darwin":
                subprocess.run(["say", text], check=True)
            elif self._system == "linux":
                try:
                    subprocess.run(["espeak", text], check=True, capture_output=True)
                except FileNotFoundError:
                    subprocess.run(["espeak-ng", text], check=True, capture_output=True)
            elif self._system == "windows":
                ps_script = f'Add-Type -AssemblyName System.Speech; $synth = New-Object System.Speech.Synthesis.SpeechSynthesizer; $synth.Speak("{text}")'
                subprocess.run(["powershell", "-Command", ps_script], check=True, capture_output=True)
            return True
        except Exception:
            return False

    def stop(self) -> None:
        pass

    def is_available(self) -> bool:
        return self._available


class TextToSpeech:
    def __init__(self, engine: TTSEngine = TTSEngine.PYTTSX3):
        self._engine_type = engine
        self._engine: Optional[BaseTTS] = None
        self._speech_queue: queue.Queue = queue.Queue()
        self._worker_thread: Optional[threading.Thread] = None
        self._running = False
        self._enabled = True
        self._init_engine(engine)

    def _init_engine(self, engine: TTSEngine):
        if engine == TTSEngine.DISABLED:
            self._engine = None
            return

        if engine == TTSEngine.PYTTSX3:
            self._engine = Pyttsx3TTS()
            if not self._engine.is_available():
                self._engine = SystemTTS()
        elif engine == TTSEngine.SYSTEM:
            self._engine = SystemTTS()

        if self._engine and not self._engine.is_available():
            self._engine = None

    def start(self):
        if self._running:
            return
        self._running = True
        self._worker_thread = threading.Thread(target=self._process_queue, daemon=True)
        self._worker_thread.start()

    def stop(self):
        self._running = False
        self._speech_queue.put(None)
        if self._engine:
            self._engine.stop()

    def _process_queue(self):
        while self._running:
            try:
                text = self._speech_queue.get(timeout=0.5)
                if text is None:
                    break
                if self._enabled and self._engine:
                    self._engine.speak(text)
            except queue.Empty:
                continue
            except Exception:
                continue

    def speak(self, text: str):
        if not text or not self._enabled:
            return
        self._speech_queue.put(text)

    def speak_sync(self, text: str) -> bool:
        if not text or not self._enabled or not self._engine:
            return False
        return self._engine.speak(text)

    def enable(self):
        self._enabled = True

    def disable(self):
        self._enabled = False
        if self._engine:
            self._engine.stop()

    def is_enabled(self) -> bool:
        return self._enabled

    def is_available(self) -> bool:
        return self._engine is not None and self._engine.is_available()

    def clear_queue(self):
        while not self._speech_queue.empty():
            try:
                self._speech_queue.get_nowait()
            except queue.Empty:
                break
