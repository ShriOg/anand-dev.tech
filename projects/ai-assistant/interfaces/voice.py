import threading
from typing import Optional, Callable
from enum import Enum, auto

from brain.router import CommandRouter
from actions.schema import ActionStatus
from speaker.tts import TextToSpeech, TTSEngine
from listener.stt import SpeechToText, STTEngine, ListenResult


class VoiceState(Enum):
    IDLE = auto()
    LISTENING = auto()
    PROCESSING = auto()
    SPEAKING = auto()
    DISABLED = auto()


class VoiceInterface:
    WAKE_WORDS = ["hey assistant", "assistant", "jarvis", "computer"]
    CONFIRMATION_WORDS = ["yes", "yeah", "yep", "confirm", "ok", "okay", "sure", "do it"]
    CANCEL_WORDS = ["no", "nope", "cancel", "stop", "nevermind", "never mind"]

    def __init__(self, router: CommandRouter):
        self.router = router
        self._tts = TextToSpeech(TTSEngine.PYTTSX3)
        self._stt = SpeechToText(STTEngine.SPEECH_RECOGNITION)
        self._state = VoiceState.IDLE
        self._enabled = False
        self._wake_word_enabled = False
        self._state_callback: Optional[Callable[[VoiceState], None]] = None
        self._result_callback: Optional[Callable[[str], None]] = None
        self._cooldown = 1.0
        self._last_command_time = 0.0

    def start(self):
        self._enabled = True
        self._tts.start()
        self._set_state(VoiceState.IDLE)

    def stop(self):
        self._enabled = False
        self._tts.stop()
        self._stt.stop_listening()
        self._set_state(VoiceState.DISABLED)

    def _set_state(self, state: VoiceState):
        self._state = state
        if self._state_callback:
            self._state_callback(state)

    def set_state_callback(self, callback: Callable[[VoiceState], None]):
        self._state_callback = callback

    def set_result_callback(self, callback: Callable[[str], None]):
        self._result_callback = callback

    def get_state(self) -> VoiceState:
        return self._state

    def listen_for_command(self, timeout: float = 5.0):
        if not self._enabled or self._state == VoiceState.LISTENING:
            return

        def _on_listen_complete(result: ListenResult):
            if result.success and result.text:
                self._process_voice_input(result.text)
            else:
                self._set_state(VoiceState.IDLE)
                if result.error and self._result_callback:
                    self._result_callback(f"❌ {result.error}")

        self._set_state(VoiceState.LISTENING)
        self._stt.listen_async(timeout, _on_listen_complete)

    def _process_voice_input(self, text: str):
        import time
        
        self._set_state(VoiceState.PROCESSING)
        
        current_time = time.time()
        if current_time - self._last_command_time < self._cooldown:
            self._notify_result("⏳ Please wait before the next command.")
            self._set_state(VoiceState.IDLE)
            return
        
        self._last_command_time = current_time
        
        text_lower = text.lower().strip()
        if self._wake_word_enabled:
            wake_word_found = False
            for wake_word in self.WAKE_WORDS:
                if text_lower.startswith(wake_word):
                    text = text[len(wake_word):].strip()
                    wake_word_found = True
                    break
            if not wake_word_found:
                self._set_state(VoiceState.IDLE)
                return

        if not text:
            self._set_state(VoiceState.IDLE)
            return

        result = self.router.process(text)
        
        self._notify_result(result.message)
        
        if result.status == ActionStatus.PENDING_CONFIRMATION:
            self._speak_and_wait_for_confirmation(result.message)
        else:
            self._speak(result.message)
            self._set_state(VoiceState.IDLE)

        if result.data and result.data.get("exit"):
            self.stop()

    def _speak_and_wait_for_confirmation(self, message: str):
        self._speak("This action requires confirmation. Say yes to confirm or no to cancel.")
        self._set_state(VoiceState.LISTENING)
        
        def _on_confirmation(result: ListenResult):
            if result.success and result.text:
                response_lower = result.text.lower().strip()
                
                confirmed = any(word in response_lower for word in self.CONFIRMATION_WORDS)
                cancelled = any(word in response_lower for word in self.CANCEL_WORDS)
                
                if confirmed:
                    final_result = self.router.process("yes")
                elif cancelled:
                    final_result = self.router.process("no")
                else:
                    final_result = self.router.process("no")
                    self._speak("I didn't understand. Cancelling action.")
                
                self._notify_result(final_result.message)
                self._speak(final_result.message)
            else:
                self.router.process("no")
                self._speak("No response detected. Cancelling action.")
            
            self._set_state(VoiceState.IDLE)
        
        self._stt.listen_async(timeout=5.0, callback=_on_confirmation)

    def _speak(self, text: str):
        if not self._enabled:
            return
        self._set_state(VoiceState.SPEAKING)
        clean_text = self._clean_for_speech(text)
        self._tts.speak_sync(clean_text)
        self._set_state(VoiceState.IDLE)

    def _clean_for_speech(self, text: str) -> str:
        replacements = {
            "✅": "",
            "❌": "",
            "⚠️": "Warning.",
            "🚫": "",
            "🔒": "",
            "⏳": "",
            "🚦": "",
            "🛑": "",
            "👋": "",
            "🤖": "",
        }
        for emoji, replacement in replacements.items():
            text = text.replace(emoji, replacement)
        return text.strip()

    def _notify_result(self, message: str):
        if self._result_callback:
            self._result_callback(message)

    def enable_wake_word(self):
        self._wake_word_enabled = True

    def disable_wake_word(self):
        self._wake_word_enabled = False

    def enable_tts(self):
        self._tts.enable()

    def disable_tts(self):
        self._tts.disable()

    def is_tts_available(self) -> bool:
        return self._tts.is_available()

    def is_stt_available(self) -> bool:
        return self._stt.is_available()

    def is_available(self) -> bool:
        return self.is_tts_available() or self.is_stt_available()

    def calibrate_microphone(self, duration: float = 1.0):
        self._stt.calibrate(duration)

    def set_cooldown(self, seconds: float):
        self._cooldown = max(0.5, seconds)
