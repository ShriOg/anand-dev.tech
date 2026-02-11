import json
import os
import time
from pathlib import Path
from dataclasses import dataclass, field
from typing import Dict, Optional
from enum import Enum


class PermissionTier(Enum):
    SAFE = "safe"
    RESTRICTED = "restricted"
    CRITICAL = "critical"


@dataclass
class SafetyConfig:
    confirmation_required: Dict[str, bool] = field(default_factory=lambda: {
        "shutdown": True,
        "restart": True,
        "delete_file": True,
        "empty_trash": True,
    })
    cooldown_seconds: float = 1.0
    safe_mode: bool = False
    kill_switch_active: bool = False
    max_commands_per_minute: int = 30


@dataclass
class AppConfig:
    app_name: str = "AI Assistant"
    version: str = "1.0.0"
    config_dir: Path = field(default_factory=lambda: Path.home() / ".ai-assistant")
    log_level: str = "INFO"
    safety: SafetyConfig = field(default_factory=SafetyConfig)


class ConfigManager:
    def __init__(self, config_path: Optional[Path] = None):
        self.config = AppConfig()
        self.config_path = config_path or self.config.config_dir / "config.json"
        self._last_command_time: float = 0
        self._command_timestamps: list = []
        self._ensure_config_dir()
        self._load_config()

    def _ensure_config_dir(self):
        self.config.config_dir.mkdir(parents=True, exist_ok=True)

    def _load_config(self):
        if self.config_path.exists():
            try:
                with open(self.config_path, "r") as f:
                    data = json.load(f)
                    if "safety" in data:
                        self.config.safety = SafetyConfig(**data["safety"])
                    if "log_level" in data:
                        self.config.log_level = data["log_level"]
            except (json.JSONDecodeError, IOError):
                pass

    def save_config(self):
        data = {
            "log_level": self.config.log_level,
            "safety": {
                "confirmation_required": self.config.safety.confirmation_required,
                "cooldown_seconds": self.config.safety.cooldown_seconds,
                "safe_mode": self.config.safety.safe_mode,
                "max_commands_per_minute": self.config.safety.max_commands_per_minute,
            }
        }
        with open(self.config_path, "w") as f:
            json.dump(data, f, indent=2)

    def check_cooldown(self) -> bool:
        current_time = time.time()
        if current_time - self._last_command_time < self.config.safety.cooldown_seconds:
            return False
        return True

    def check_rate_limit(self) -> bool:
        current_time = time.time()
        minute_ago = current_time - 60
        self._command_timestamps = [t for t in self._command_timestamps if t > minute_ago]
        return len(self._command_timestamps) < self.config.safety.max_commands_per_minute

    def record_command(self):
        current_time = time.time()
        self._last_command_time = current_time
        self._command_timestamps.append(current_time)

    def is_kill_switch_active(self) -> bool:
        return self.config.safety.kill_switch_active

    def activate_kill_switch(self):
        self.config.safety.kill_switch_active = True

    def deactivate_kill_switch(self):
        self.config.safety.kill_switch_active = False

    def is_safe_mode(self) -> bool:
        return self.config.safety.safe_mode

    def enable_safe_mode(self):
        self.config.safety.safe_mode = True

    def disable_safe_mode(self):
        self.config.safety.safe_mode = False

    def requires_confirmation(self, action: str) -> bool:
        return self.config.safety.confirmation_required.get(action, False)

    def get_permission_tier(self, action: str) -> PermissionTier:
        critical_actions = {"shutdown", "restart", "delete_file", "empty_trash"}
        restricted_actions = {"adjust_volume", "take_screenshot", "open_app"}
        
        if action in critical_actions:
            return PermissionTier.CRITICAL
        elif action in restricted_actions:
            return PermissionTier.RESTRICTED
        return PermissionTier.SAFE


config_manager = ConfigManager()
