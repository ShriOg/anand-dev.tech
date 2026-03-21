import json
import threading
import time
from enum import Enum
from datetime import datetime, timedelta
from typing import Callable, Optional, Dict, Any
from dataclasses import dataclass, asdict
from pathlib import Path

class FocusState(Enum):
    IDLE = "IDLE"
    FOCUS_ACTIVE = "FOCUS_ACTIVE"
    LOCKED = "LOCKED"
    COOLDOWN = "COOLDOWN"

@dataclass
class SessionData:
    session_id: str
    start_time: datetime
    planned_duration_minutes: int
    distraction_attempts: int = 0
    actual_end_time: Optional[datetime] = None

    def to_dict(self) -> Dict[str, Any]:
        data = asdict(self)
        data['start_time'] = self.start_time.isoformat()
        data['actual_end_time'] = self.actual_end_time.isoformat() if self.actual_end_time else None
        return data

class FocusSession:
    def __init__(self, config_path: str, stats_path: str):
        with open(config_path, 'r') as f:
            self.config = json.load(f)

        self.stats_path = Path(stats_path)
        with open(stats_path, 'r') as f:
            self.stats = json.load(f)

        self.state = FocusState.IDLE
        self.current_session: Optional[SessionData] = None
        self.session_start_time: Optional[datetime] = None
        self.session_planned_duration: int = 0
        self.session_end_time: Optional[datetime] = None

        self._timer_thread: Optional[threading.Thread] = None
        self._running = False
        self._lock = threading.RLock()

        self.state_change_callbacks: list = []
        self.time_tick_callbacks: list = []

    def register_state_change_callback(self, callback: Callable[[FocusState, FocusState], None]) -> None:
        with self._lock:
            self.state_change_callbacks.append(callback)

    def register_time_tick_callback(self, callback: Callable[[Dict[str, Any]], None]) -> None:
        with self._lock:
            self.time_tick_callbacks.append(callback)

    def _set_state(self, new_state: FocusState) -> None:
        with self._lock:
            old_state = self.state
            self.state = new_state

            for callback in self.state_change_callbacks:
                try:
                    callback(old_state, new_state)
                except Exception:
                    pass

    def start_session(self, duration_minutes: int) -> bool:
        with self._lock:
            if self.state != FocusState.IDLE:
                return False

            if duration_minutes not in self.config.get("focus_session_durations", [25, 45, 60]):
                return False

            session_id = datetime.now().strftime("%Y%m%d_%H%M%S")
            self.current_session = SessionData(
                session_id=session_id,
                start_time=datetime.now(),
                planned_duration_minutes=duration_minutes,
                distraction_attempts=0
            )

            self.session_start_time = datetime.now()
            self.session_planned_duration = duration_minutes
            self.session_end_time = self.session_start_time + timedelta(minutes=duration_minutes)

            self._set_state(FocusState.FOCUS_ACTIVE)

            self._running = True

        if self._timer_thread is None or not self._timer_thread.is_alive():
            self._timer_thread = threading.Thread(target=self._timer_loop, daemon=False)
            self._timer_thread.start()

        return True

    def record_distraction_attempt(self) -> None:
        with self._lock:
            if self.current_session:
                self.current_session.distraction_attempts += 1
                self.stats['distraction_attempts'] += 1

    def _timer_loop(self) -> None:
        while self._running:
            with self._lock:
                if self.state == FocusState.FOCUS_ACTIVE:
                    now = datetime.now()
                    time_remaining = self.session_end_time - now

                    if time_remaining.total_seconds() <= 0:
                        self._end_session_locked()
                    else:
                        minutes_remaining = int(time_remaining.total_seconds() // 60)
                        seconds_remaining = int(time_remaining.total_seconds() % 60)

                        tick_data = {
                            'state': self.state.value,
                            'minutes_remaining': minutes_remaining,
                            'seconds_remaining': seconds_remaining,
                            'distraction_attempts': self.current_session.distraction_attempts if self.current_session else 0,
                            'total_minutes_focused': self.stats.get('total_focused_minutes', 0)
                        }

                        for callback in self.time_tick_callbacks:
                            try:
                                callback(tick_data)
                            except Exception:
                                pass

                elif self.state == FocusState.LOCKED:
                    lockdown_end = self.session_end_time + timedelta(
                        seconds=self.config.get("session_cooldown_seconds", 300)
                    )

                    if datetime.now() >= lockdown_end:
                        self._unlock_session()

            time.sleep(0.1)

    def _end_session_locked(self) -> None:
        self.session_end_time = datetime.now()
        self._set_state(FocusState.LOCKED)

    def _unlock_session(self) -> None:
        with self._lock:
            if self.current_session:
                self.current_session.actual_end_time = datetime.now()

                focused_minutes = (self.current_session.actual_end_time - self.current_session.start_time).total_seconds() / 60
                self.stats['total_focused_minutes'] += int(focused_minutes)
                self.stats['sessions_completed'] += 1
                self.stats['sessions'].append(self.current_session.to_dict())
                self.stats['last_session'] = self.current_session.to_dict()
                self.stats['last_updated'] = datetime.now().isoformat()

                self._save_stats()

            self._set_state(FocusState.IDLE)
            self.current_session = None
            self.session_start_time = None
            self.session_planned_duration = 0
            self.session_end_time = None
            self._running = False

    def get_session_info(self) -> Dict[str, Any]:
        with self._lock:
            if not self.current_session or not self.session_end_time:
                return {
                    'state': self.state.value,
                    'active': False,
                    'time_remaining_seconds': 0,
                    'distraction_attempts': 0
                }

            time_remaining = max(0, (self.session_end_time - datetime.now()).total_seconds())

            return {
                'state': self.state.value,
                'active': self.state in [FocusState.FOCUS_ACTIVE, FocusState.LOCKED],
                'time_remaining_seconds': int(time_remaining),
                'distraction_attempts': self.current_session.distraction_attempts if self.current_session else 0,
                'session_id': self.current_session.session_id if self.current_session else None,
                'planned_duration_minutes': self.session_planned_duration
            }

    def _save_stats(self) -> None:
        try:
            with open(self.stats_path, 'w') as f:
                json.dump(self.stats, f, indent=2)
        except Exception:
            pass

    def can_disable_focus(self, override_password: Optional[str] = None) -> bool:
        with self._lock:
            if self.state == FocusState.IDLE:
                return True

            if override_password:
                correct_password = self.config.get("emergency_override_password", "focus2026")
                return override_password == correct_password

            return False

    def emergency_stop(self, password: str) -> bool:
        with self._lock:
            correct_password = self.config.get("emergency_override_password", "focus2026")
            if password != correct_password:
                return False

            self._running = False
            self._set_state(FocusState.IDLE)
            self.current_session = None
            self.session_start_time = None
            self.session_planned_duration = 0
            self.session_end_time = None

            return True

    def __del__(self):
        self._running = False
        if self._timer_thread and self._timer_thread.is_alive():
            self._timer_thread.join(timeout=2.0)
