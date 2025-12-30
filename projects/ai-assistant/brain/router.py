import sys
import platform
from datetime import datetime
from typing import Callable, Optional

from actions.schema import Action, ActionResult, ActionType, ActionStatus, create_action
from brain.intent_parser import IntentParser, ParsedIntent
from brain.context import ContextManager
from utils.config import config_manager, PermissionTier


class CommandRouter:
    def __init__(self):
        self.intent_parser = IntentParser()
        self.context = ContextManager()
        self.adapter = self._get_adapter()
        self._confirmation_callback: Optional[Callable[[str], bool]] = None

    def _get_adapter(self):
        system = platform.system().lower()
        if system == "linux":
            from adapters.linux import LinuxAdapter
            return LinuxAdapter()
        elif system == "windows":
            from adapters.windows import WindowsAdapter
            return WindowsAdapter()
        elif system == "darwin":
            from adapters.macos import MacOSAdapter
            return MacOSAdapter()
        else:
            raise RuntimeError(f"Unsupported operating system: {system}")

    def set_confirmation_callback(self, callback: Callable[[str], bool]):
        self._confirmation_callback = callback

    def process(self, user_input: str) -> ActionResult:
        if config_manager.is_kill_switch_active():
            return ActionResult.blocked(
                ActionStatus.BLOCKED_KILL_SWITCH,
                "Kill switch is active. All commands are disabled."
            )

        if self.context.has_pending_confirmation():
            return self._handle_confirmation_response(user_input)

        if not config_manager.check_cooldown():
            return ActionResult.blocked(
                ActionStatus.BLOCKED_COOLDOWN,
                "Please wait a moment before the next command."
            )

        if not config_manager.check_rate_limit():
            return ActionResult.blocked(
                ActionStatus.BLOCKED_RATE_LIMIT,
                "Too many commands. Please slow down."
            )

        config_manager.record_command()

        intent = self.intent_parser.parse(user_input)
        
        if intent.action_type == ActionType.UNKNOWN:
            return self._handle_unknown(intent)

        return self._route_action(intent)

    def _route_action(self, intent: ParsedIntent) -> ActionResult:
        if intent.action_type == ActionType.EXIT:
            return ActionResult.success("Goodbye!", data={"exit": True})

        if intent.action_type == ActionType.HELP:
            return self._show_help()

        if intent.action_type == ActionType.GET_TIME:
            return self._get_time()

        if intent.action_type == ActionType.GET_DATE:
            return self._get_date()

        if intent.action_type == ActionType.STATUS:
            return self._show_status()

        if intent.action_type == ActionType.ENABLE_SAFE_MODE:
            config_manager.enable_safe_mode()
            return ActionResult.success("Safe mode enabled. Only read-only commands will work.")

        if intent.action_type == ActionType.DISABLE_SAFE_MODE:
            config_manager.disable_safe_mode()
            return ActionResult.success("Safe mode disabled. All commands are now available.")

        if config_manager.is_safe_mode():
            tier = config_manager.get_permission_tier(intent.action_type.name.lower())
            if tier != PermissionTier.SAFE:
                return ActionResult.blocked(
                    ActionStatus.BLOCKED_SAFE_MODE,
                    f"Cannot execute '{intent.action_type.name}' in safe mode."
                )

        action = self.intent_parser.create_action_from_intent(intent)

        if action.requires_confirmation:
            return self._request_confirmation(action)

        return self._execute_action(action)

    def _execute_action(self, action: Action) -> ActionResult:
        try:
            result = self.adapter.dispatch(action)
            self.context.add_turn(
                user_input=str(action),
                response=result.message,
                action_type=action.action_type.name,
                success=result.status == ActionStatus.SUCCESS
            )
            return result
        except Exception as e:
            error_result = ActionResult.failure(f"Execution error: {str(e)}")
            self.context.add_turn(
                user_input=str(action),
                response=error_result.message,
                action_type=action.action_type.name,
                success=False
            )
            return error_result

    def _request_confirmation(self, action: Action) -> ActionResult:
        self.context.set_pending_confirmation({
            "action": action,
            "action_type": action.action_type.name,
        })
        return ActionResult.pending_confirmation(
            f"⚠️  This will {action.description.lower()}. Are you sure? (yes/no)"
        )

    def _handle_confirmation_response(self, user_input: str) -> ActionResult:
        pending = self.context.get_pending_confirmation()
        self.context.clear_pending_confirmation()

        response = user_input.strip().lower()
        if response in ("yes", "y", "confirm", "ok", "sure"):
            action = pending["action"]
            return self._execute_action(action)
        else:
            return ActionResult.cancelled("Action cancelled.")

    def _handle_unknown(self, intent: ParsedIntent) -> ActionResult:
        return ActionResult.failure(
            f"I didn't understand: '{intent.raw_input}'. Type 'help' for available commands."
        )

    def _get_time(self) -> ActionResult:
        now = datetime.now()
        time_str = now.strftime("%I:%M %p")
        return ActionResult.success(f"The time is {time_str}")

    def _get_date(self) -> ActionResult:
        now = datetime.now()
        date_str = now.strftime("%A, %B %d, %Y")
        return ActionResult.success(f"Today is {date_str}")

    def _show_status(self) -> ActionResult:
        stats = self.context.get_session_stats()
        safe_mode = "ON" if config_manager.is_safe_mode() else "OFF"
        kill_switch = "ACTIVE" if config_manager.is_kill_switch_active() else "INACTIVE"
        
        status = f"""Assistant Status:
- Platform: {platform.system()} {platform.release()}
- Safe Mode: {safe_mode}
- Kill Switch: {kill_switch}
- Session Commands: {stats['total_commands']}
- Success Rate: {stats['success_rate']:.1f}%"""
        return ActionResult.success(status)

    def _show_help(self) -> ActionResult:
        help_text = """Available Commands:

📱 Applications:
  open <app>          - Open an application
  launch <app>        - Same as open

📁 Files & Folders:
  open file <path>    - Open a file
  open folder <path>  - Open a folder

🌐 Web:
  open url <url>      - Open a URL in browser

🔊 Volume:
  volume <0-100>      - Set volume level
  mute                - Mute volume
  unmute              - Unmute volume

📸 Screenshot:
  screenshot          - Take a screenshot

⚡ System:
  shutdown            - Shutdown computer (requires confirmation)
  restart             - Restart computer (requires confirmation)
  lock                - Lock the screen
  battery             - Show battery status

⏰ Info:
  time                - Current time
  date                - Current date
  status              - Assistant status

🛡️ Safety:
  safe mode           - Enable safe mode
  disable safe mode   - Disable safe mode

❌ Exit:
  exit / quit         - Close assistant"""
        return ActionResult.success(help_text)
