import threading
from typing import Optional, Callable
from datetime import datetime

from kivy.app import App
from kivy.uix.boxlayout import BoxLayout
from kivy.uix.scrollview import ScrollView
from kivy.uix.label import Label
from kivy.uix.textinput import TextInput
from kivy.uix.button import Button
from kivy.uix.widget import Widget
from kivy.uix.image import Image
from kivy.clock import Clock
from kivy.core.window import Window
from kivy.properties import StringProperty, ListProperty, BooleanProperty, NumericProperty
from kivy.lang import Builder
from kivy.utils import get_color_from_hex
from kivy.metrics import dp
from kivy.animation import Animation
import os

from brain.router import CommandRouter
from actions.schema import ActionStatus


class MessageBubble(BoxLayout):
    text = StringProperty("")
    is_user = BooleanProperty(False)
    timestamp = StringProperty("")


class ConversationView(ScrollView):
    pass


class StatusIndicator(Label):
    status = StringProperty("idle")
    dot_opacity = NumericProperty(1)
    pulse_anim = None
    
    def on_status(self, instance, value):
        if self.pulse_anim:
            self.pulse_anim.cancel(self)
        
        if value in ('listening', 'processing'):
            self.pulse_anim = Animation(dot_opacity=0.4, duration=0.6) + Animation(dot_opacity=1, duration=0.6)
            self.pulse_anim.repeat = True
            self.pulse_anim.start(self)
        else:
            self.dot_opacity = 1


class MicButton(Button):
    mic_state = StringProperty("idle")
    glow_intensity = NumericProperty(0)
    pulse_anim = None
    
    def on_mic_state(self, instance, value):
        if self.pulse_anim:
            self.pulse_anim.cancel(self)
        
        if value == 'listening':
            self.pulse_anim = Animation(glow_intensity=1, duration=0.5) + Animation(glow_intensity=0.4, duration=0.5)
            self.pulse_anim.repeat = True
            self.pulse_anim.start(self)
        elif value == 'processing':
            self.pulse_anim = Animation(glow_intensity=0.7, duration=0.3)
            self.pulse_anim.start(self)
        else:
            self.glow_intensity = 0


class AssistantRoot(BoxLayout):
    status_text = StringProperty("● Idle")
    status_color = ListProperty([0.6, 0.6, 0.63, 1])
    mic_state = StringProperty("idle")
    voice_available = BooleanProperty(False)

    def __init__(self, router: CommandRouter, voice_interface=None, **kwargs):
        super().__init__(**kwargs)
        self.router = router
        self.voice = voice_interface
        self.voice_available = voice_interface is not None and voice_interface.is_available()
        
        if self.voice:
            self.voice.set_state_callback(self._on_voice_state_change)
            self.voice.set_result_callback(self._on_voice_result)
            self.voice.start()

    def send_message(self):
        input_field = self.ids.input_field
        text = input_field.text.strip()
        if not text:
            return
        
        input_field.text = ""
        self._add_message(text, is_user=True)
        self._set_status("processing")
        
        threading.Thread(target=self._process_command, args=(text,), daemon=True).start()

    def _process_command(self, text: str):
        result = self.router.process(text)
        Clock.schedule_once(lambda dt: self._handle_result(result), 0)

    def _handle_result(self, result):
        self._add_message(result.message, is_user=False, status=result.status)
        self._set_status("idle")
        
        if result.data and result.data.get("exit"):
            Clock.schedule_once(lambda dt: App.get_running_app().stop(), 0.5)

    def _add_message(self, text: str, is_user: bool = False, status: ActionStatus = None):
        container = self.ids.message_container
        
        bubble = MessageBubble()
        bubble.text = text
        bubble.is_user = is_user
        bubble.timestamp = datetime.now().strftime("%H:%M")
        
        container.add_widget(bubble)
        
        Clock.schedule_once(lambda dt: self._scroll_to_bottom(), 0.1)

    def _scroll_to_bottom(self):
        scroll_view = self.ids.scroll_view
        scroll_view.scroll_y = 0

    def _set_status(self, status: str):
        status_map = {
            "idle": ("● Idle", [0.6, 0.6, 0.63, 1]),
            "listening": ("● Listening...", [0.31, 0.78, 1, 1]),
            "processing": ("● Processing...", [1, 0.74, 0.18, 1]),
            "speaking": ("● Speaking...", [0.15, 0.79, 0.25, 1]),
            "disabled": ("● Voice Disabled", [0.35, 0.35, 0.38, 1]),
        }
        text, color = status_map.get(status, status_map["idle"])
        self.status_text = text
        self.status_color = color
        self.mic_state = status

    def on_mic_press(self):
        if not self.voice or not self.voice_available:
            self._add_message("Voice input is not available. Install voice dependencies.", is_user=False)
            return
        
        if self.mic_state == "listening":
            self.voice._stt.stop_listening()
            self._set_status("idle")
        else:
            self._set_status("listening")
            self._add_message("🎤 Listening...", is_user=False)
            self.voice.listen_for_command(timeout=5.0)

    def _on_voice_state_change(self, state):
        state_map = {
            "IDLE": "idle",
            "LISTENING": "listening",
            "PROCESSING": "processing",
            "SPEAKING": "speaking",
            "DISABLED": "disabled",
        }
        status = state_map.get(state.name, "idle")
        Clock.schedule_once(lambda dt: self._set_status(status), 0)

    def _on_voice_result(self, message: str):
        Clock.schedule_once(lambda dt: self._add_message(message, is_user=False), 0)

    def show_welcome(self):
        welcome_messages = [
            "Welcome to AI Assistant v1.0.0",
            "Local-first • Privacy-respecting • Cross-platform",
            "Type 'help' to see available commands.",
        ]
        for msg in welcome_messages:
            self._add_message(msg, is_user=False)


class AssistantApp(App):
    def __init__(self, router: CommandRouter, enable_voice: bool = False, **kwargs):
        super().__init__(**kwargs)
        self.router = router
        self.enable_voice = enable_voice
        self.voice_interface = None
        self.title = "AI Assistant"
        
        if enable_voice:
            try:
                from interfaces.voice import VoiceInterface
                self.voice_interface = VoiceInterface(router)
            except Exception:
                self.voice_interface = None

    def build(self):
        Window.clearcolor = get_color_from_hex("#0a0a0c")
        Window.size = (700, 600)
        Window.minimum_width = 450
        Window.minimum_height = 400
        
        # Set app icon
        icon_path = os.path.join(os.path.dirname(__file__), '..', 'assets', 'icons', 'app.ico')
        if os.path.exists(icon_path):
            self.icon = icon_path
        
        kv_path = os.path.join(os.path.dirname(__file__), '..', 'ui', 'assistant.kv')
        if os.path.exists(kv_path):
            Builder.load_file(kv_path)
        
        self.root_widget = AssistantRoot(
            router=self.router,
            voice_interface=self.voice_interface
        )
        
        Clock.schedule_once(lambda dt: self.root_widget.show_welcome(), 0.3)
        
        return self.root_widget

    def on_stop(self):
        if self.voice_interface:
            self.voice_interface.stop()


class GUIKivyInterface:
    def __init__(self, router: CommandRouter, enable_voice: bool = False):
        self.router = router
        self.enable_voice = enable_voice
        self._app: Optional[AssistantApp] = None

    def start(self):
        self._app = AssistantApp(
            router=self.router,
            enable_voice=self.enable_voice
        )
        self._app.run()

    def stop(self):
        if self._app:
            self._app.stop()


def run_kivy_gui(enable_voice: bool = False):
    router = CommandRouter()
    gui = GUIKivyInterface(router, enable_voice=enable_voice)
    gui.start()


if __name__ == "__main__":
    run_kivy_gui(enable_voice=True)
