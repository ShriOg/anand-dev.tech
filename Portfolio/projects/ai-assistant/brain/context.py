from typing import Optional
from dataclasses import dataclass, field
from collections import deque
from datetime import datetime


@dataclass
class ConversationTurn:
    user_input: str
    response: str
    timestamp: datetime = field(default_factory=datetime.now)
    action_type: Optional[str] = None
    success: bool = True


class ContextManager:
    def __init__(self, max_history: int = 10):
        self.max_history = max_history
        self.history: deque[ConversationTurn] = deque(maxlen=max_history)
        self.pending_confirmation: Optional[dict] = None
        self.session_start: datetime = datetime.now()
        self.preferences: dict = {}
        self.command_count: int = 0
        self.success_count: int = 0

    def add_turn(self, user_input: str, response: str, action_type: Optional[str] = None, success: bool = True):
        turn = ConversationTurn(
            user_input=user_input,
            response=response,
            action_type=action_type,
            success=success
        )
        self.history.append(turn)
        self.command_count += 1
        if success:
            self.success_count += 1

    def get_last_turn(self) -> Optional[ConversationTurn]:
        if self.history:
            return self.history[-1]
        return None

    def get_history(self, count: Optional[int] = None) -> list[ConversationTurn]:
        if count is None:
            return list(self.history)
        return list(self.history)[-count:]

    def set_pending_confirmation(self, action: dict):
        self.pending_confirmation = action

    def get_pending_confirmation(self) -> Optional[dict]:
        return self.pending_confirmation

    def clear_pending_confirmation(self):
        self.pending_confirmation = None

    def has_pending_confirmation(self) -> bool:
        return self.pending_confirmation is not None

    def set_preference(self, key: str, value):
        self.preferences[key] = value

    def get_preference(self, key: str, default=None):
        return self.preferences.get(key, default)

    def clear(self):
        self.history.clear()
        self.pending_confirmation = None
        self.command_count = 0
        self.success_count = 0

    def get_session_stats(self) -> dict:
        return {
            "session_start": self.session_start.isoformat(),
            "total_commands": self.command_count,
            "successful_commands": self.success_count,
            "success_rate": self.success_count / max(self.command_count, 1) * 100,
            "history_size": len(self.history),
        }

    def get_context_summary(self) -> str:
        if not self.history:
            return "No previous context."
        
        last_turns = list(self.history)[-3:]
        summary_parts = []
        for turn in last_turns:
            summary_parts.append(f"User: {turn.user_input}")
            summary_parts.append(f"Assistant: {turn.response[:100]}...")
        return "\n".join(summary_parts)
