from dataclasses import dataclass, field
from enum import Enum, auto
from typing import Any, Dict, Optional


class ActionType(Enum):
    OPEN_APP = auto()
    OPEN_FILE = auto()
    OPEN_FOLDER = auto()
    OPEN_URL = auto()
    ADJUST_VOLUME = auto()
    MUTE_VOLUME = auto()
    UNMUTE_VOLUME = auto()
    TAKE_SCREENSHOT = auto()
    SHUTDOWN = auto()
    RESTART = auto()
    LOCK_SCREEN = auto()
    GET_TIME = auto()
    GET_DATE = auto()
    GET_BATTERY = auto()
    HELP = auto()
    EXIT = auto()
    ENABLE_SAFE_MODE = auto()
    DISABLE_SAFE_MODE = auto()
    STATUS = auto()
    UNKNOWN = auto()


class ActionStatus(Enum):
    SUCCESS = "success"
    FAILURE = "failure"
    PENDING_CONFIRMATION = "pending_confirmation"
    CANCELLED = "cancelled"
    BLOCKED_SAFE_MODE = "blocked_safe_mode"
    BLOCKED_COOLDOWN = "blocked_cooldown"
    BLOCKED_RATE_LIMIT = "blocked_rate_limit"
    BLOCKED_KILL_SWITCH = "blocked_kill_switch"


@dataclass
class Action:
    action_type: ActionType
    parameters: Dict[str, Any] = field(default_factory=dict)
    requires_confirmation: bool = False
    description: str = ""

    def __str__(self) -> str:
        if self.parameters:
            params = ", ".join(f"{k}={v}" for k, v in self.parameters.items())
            return f"{self.action_type.name}({params})"
        return self.action_type.name


@dataclass
class ActionResult:
    status: ActionStatus
    message: str
    data: Optional[Any] = None

    @classmethod
    def success(cls, message: str, data: Any = None) -> "ActionResult":
        return cls(status=ActionStatus.SUCCESS, message=message, data=data)

    @classmethod
    def failure(cls, message: str) -> "ActionResult":
        return cls(status=ActionStatus.FAILURE, message=message)

    @classmethod
    def pending_confirmation(cls, message: str) -> "ActionResult":
        return cls(status=ActionStatus.PENDING_CONFIRMATION, message=message)

    @classmethod
    def cancelled(cls, message: str = "Action cancelled.") -> "ActionResult":
        return cls(status=ActionStatus.CANCELLED, message=message)

    @classmethod
    def blocked(cls, status: ActionStatus, message: str) -> "ActionResult":
        return cls(status=status, message=message)


ACTION_METADATA = {
    ActionType.OPEN_APP: {
        "permission_tier": "restricted",
        "requires_confirmation": False,
        "description": "Opens an application by name",
        "parameters": ["app_name"],
    },
    ActionType.OPEN_FILE: {
        "permission_tier": "restricted",
        "requires_confirmation": False,
        "description": "Opens a file with its default application",
        "parameters": ["path"],
    },
    ActionType.OPEN_FOLDER: {
        "permission_tier": "safe",
        "requires_confirmation": False,
        "description": "Opens a folder in the file manager",
        "parameters": ["path"],
    },
    ActionType.OPEN_URL: {
        "permission_tier": "safe",
        "requires_confirmation": False,
        "description": "Opens a URL in the default browser",
        "parameters": ["url"],
    },
    ActionType.ADJUST_VOLUME: {
        "permission_tier": "restricted",
        "requires_confirmation": False,
        "description": "Adjusts system volume to a specified level (0-100)",
        "parameters": ["level"],
    },
    ActionType.MUTE_VOLUME: {
        "permission_tier": "restricted",
        "requires_confirmation": False,
        "description": "Mutes system volume",
        "parameters": [],
    },
    ActionType.UNMUTE_VOLUME: {
        "permission_tier": "restricted",
        "requires_confirmation": False,
        "description": "Unmutes system volume",
        "parameters": [],
    },
    ActionType.TAKE_SCREENSHOT: {
        "permission_tier": "restricted",
        "requires_confirmation": False,
        "description": "Takes a screenshot and saves it",
        "parameters": ["path"],
    },
    ActionType.SHUTDOWN: {
        "permission_tier": "critical",
        "requires_confirmation": True,
        "description": "Shuts down the system",
        "parameters": [],
    },
    ActionType.RESTART: {
        "permission_tier": "critical",
        "requires_confirmation": True,
        "description": "Restarts the system",
        "parameters": [],
    },
    ActionType.LOCK_SCREEN: {
        "permission_tier": "safe",
        "requires_confirmation": False,
        "description": "Locks the screen",
        "parameters": [],
    },
    ActionType.GET_TIME: {
        "permission_tier": "safe",
        "requires_confirmation": False,
        "description": "Gets the current time",
        "parameters": [],
    },
    ActionType.GET_DATE: {
        "permission_tier": "safe",
        "requires_confirmation": False,
        "description": "Gets the current date",
        "parameters": [],
    },
    ActionType.GET_BATTERY: {
        "permission_tier": "safe",
        "requires_confirmation": False,
        "description": "Gets battery status",
        "parameters": [],
    },
    ActionType.HELP: {
        "permission_tier": "safe",
        "requires_confirmation": False,
        "description": "Shows available commands",
        "parameters": [],
    },
    ActionType.EXIT: {
        "permission_tier": "safe",
        "requires_confirmation": False,
        "description": "Exits the assistant",
        "parameters": [],
    },
    ActionType.ENABLE_SAFE_MODE: {
        "permission_tier": "safe",
        "requires_confirmation": False,
        "description": "Enables safe mode (listen-only)",
        "parameters": [],
    },
    ActionType.DISABLE_SAFE_MODE: {
        "permission_tier": "safe",
        "requires_confirmation": False,
        "description": "Disables safe mode",
        "parameters": [],
    },
    ActionType.STATUS: {
        "permission_tier": "safe",
        "requires_confirmation": False,
        "description": "Shows assistant status",
        "parameters": [],
    },
}


def create_action(action_type: ActionType, **parameters) -> Action:
    metadata = ACTION_METADATA.get(action_type, {})
    return Action(
        action_type=action_type,
        parameters=parameters,
        requires_confirmation=metadata.get("requires_confirmation", False),
        description=metadata.get("description", ""),
    )
