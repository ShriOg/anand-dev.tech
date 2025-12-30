import threading
import time
from abc import ABC, abstractmethod
from typing import Optional, Callable
from enum import Enum, auto
from dataclasses import dataclass


class STTEngine(Enum):
    VOSK = auto()
    SPEECH_RECOGNITION = auto()
    DISABLED = auto()


@dataclass
class ListenResult:
    success: bool
    text: str
    confidence: float = 0.0
    error: str = ""


class BaseSTT(ABC):
    @abstractmethod
    def listen(self, timeout: float = 5.0) -> ListenResult:
        pass

    @abstractmethod
    def is_available(self) -> bool:
        pass

    @abstractmethod
    def calibrate(self, duration: float = 1.0) -> None:
        pass


class VoskSTT(BaseSTT):
    def __init__(self):
        self._model = None
        self._recognizer = None
        self._available = False
        self._sample_rate = 16000
        self._init_engine()

    def _init_engine(self):
        try:
            from vosk import Model, KaldiRecognizer
            import os
            
            model_paths = [
                os.path.expanduser("~/.vosk/model"),
                os.path.expanduser("~/vosk-model-small-en-us-0.15"),
                "model",
                "vosk-model",
            ]
            
            model_path = None
            for path in model_paths:
                if os.path.exists(path):
                    model_path = path
                    break
            
            if model_path:
                self._model = Model(model_path)
                self._recognizer = KaldiRecognizer(self._model, self._sample_rate)
                self._available = True
        except Exception:
            self._available = False

    def listen(self, timeout: float = 5.0) -> ListenResult:
        if not self._available:
            return ListenResult(False, "", error="Vosk not available")
        
        try:
            import pyaudio
            import json
            
            p = pyaudio.PyAudio()
            stream = p.open(
                format=pyaudio.paInt16,
                channels=1,
                rate=self._sample_rate,
                input=True,
                frames_per_buffer=4000
            )
            
            self._recognizer.Reset()
            start_time = time.time()
            result_text = ""
            
            while time.time() - start_time < timeout:
                data = stream.read(4000, exception_on_overflow=False)
                if self._recognizer.AcceptWaveform(data):
                    result = json.loads(self._recognizer.Result())
                    if result.get("text"):
                        result_text = result["text"]
                        break
            
            if not result_text:
                final = json.loads(self._recognizer.FinalResult())
                result_text = final.get("text", "")
            
            stream.stop_stream()
            stream.close()
            p.terminate()
            
            if result_text:
                return ListenResult(True, result_text, confidence=0.8)
            return ListenResult(False, "", error="No speech detected")
            
        except Exception as e:
            return ListenResult(False, "", error=str(e))

    def is_available(self) -> bool:
        return self._available

    def calibrate(self, duration: float = 1.0) -> None:
        pass


class SpeechRecognitionSTT(BaseSTT):
    def __init__(self):
        self._recognizer = None
        self._microphone = None
        self._available = False
        self._init_engine()

    def _init_engine(self):
        try:
            import speech_recognition as sr
            self._recognizer = sr.Recognizer()
            self._microphone = sr.Microphone()
            with self._microphone as source:
                self._recognizer.adjust_for_ambient_noise(source, duration=0.5)
            self._available = True
        except Exception:
            self._available = False

    def listen(self, timeout: float = 5.0) -> ListenResult:
        if not self._available:
            return ListenResult(False, "", error="Speech recognition not available")
        
        try:
            import speech_recognition as sr
            
            with self._microphone as source:
                audio = self._recognizer.listen(source, timeout=timeout, phrase_time_limit=10)
            
            try:
                text = self._recognizer.recognize_google(audio)
                return ListenResult(True, text, confidence=0.85)
            except sr.UnknownValueError:
                return ListenResult(False, "", error="Could not understand audio")
            except sr.RequestError:
                try:
                    text = self._recognizer.recognize_sphinx(audio)
                    return ListenResult(True, text, confidence=0.6)
                except Exception:
                    return ListenResult(False, "", error="Offline recognition failed")
                    
        except Exception as e:
            return ListenResult(False, "", error=str(e))

    def is_available(self) -> bool:
        return self._available

    def calibrate(self, duration: float = 1.0) -> None:
        if self._available and self._microphone:
            try:
                with self._microphone as source:
                    self._recognizer.adjust_for_ambient_noise(source, duration=duration)
            except Exception:
                pass


class SpeechToText:
    def __init__(self, engine: STTEngine = STTEngine.SPEECH_RECOGNITION):
        self._engine_type = engine
        self._engine: Optional[BaseSTT] = None
        self._listening = False
        self._enabled = True
        self._last_listen_time: float = 0
        self._cooldown: float = 0.5
        self._on_result_callback: Optional[Callable[[ListenResult], None]] = None
        self._listen_thread: Optional[threading.Thread] = None
        self._init_engine(engine)

    def _init_engine(self, engine: STTEngine):
        if engine == STTEngine.DISABLED:
            self._engine = None
            return

        if engine == STTEngine.VOSK:
            self._engine = VoskSTT()
            if not self._engine.is_available():
                self._engine = SpeechRecognitionSTT()
        elif engine == STTEngine.SPEECH_RECOGNITION:
            self._engine = SpeechRecognitionSTT()
            if not self._engine.is_available():
                self._engine = VoskSTT()

        if self._engine and not self._engine.is_available():
            self._engine = None

    def listen_once(self, timeout: float = 5.0) -> ListenResult:
        if not self._enabled or not self._engine:
            return ListenResult(False, "", error="Speech recognition disabled or unavailable")
        
        current_time = time.time()
        if current_time - self._last_listen_time < self._cooldown:
            return ListenResult(False, "", error="Cooldown active")
        
        self._listening = True
        result = self._engine.listen(timeout)
        self._listening = False
        self._last_listen_time = time.time()
        
        return result

    def listen_async(self, timeout: float = 5.0, callback: Optional[Callable[[ListenResult], None]] = None):
        if self._listening:
            return
        
        def _listen_worker():
            result = self.listen_once(timeout)
            if callback:
                callback(result)
            elif self._on_result_callback:
                self._on_result_callback(result)
        
        self._listen_thread = threading.Thread(target=_listen_worker, daemon=True)
        self._listen_thread.start()

    def set_callback(self, callback: Callable[[ListenResult], None]):
        self._on_result_callback = callback

    def is_listening(self) -> bool:
        return self._listening

    def stop_listening(self):
        self._listening = False

    def enable(self):
        self._enabled = True

    def disable(self):
        self._enabled = False
        self._listening = False

    def is_enabled(self) -> bool:
        return self._enabled

    def is_available(self) -> bool:
        return self._engine is not None and self._engine.is_available()

    def calibrate(self, duration: float = 1.0):
        if self._engine:
            self._engine.calibrate(duration)

    def set_cooldown(self, seconds: float):
        self._cooldown = max(0.1, seconds)
