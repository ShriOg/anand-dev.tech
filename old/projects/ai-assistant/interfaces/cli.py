import sys
from typing import Optional
from abc import ABC, abstractmethod

from brain.router import CommandRouter
from actions.schema import ActionStatus


class BaseInterface(ABC):
    def __init__(self, router: CommandRouter):
        self.router = router
        self.running = False

    @abstractmethod
    def start(self):
        pass

    @abstractmethod
    def stop(self):
        pass

    @abstractmethod
    def display_output(self, message: str):
        pass

    @abstractmethod
    def get_input(self) -> str:
        pass


class CLIInterface(BaseInterface):
    BANNER = """
╔══════════════════════════════════════════════════════════════╗
║                    AI ASSISTANT v1.0.0                       ║
║              Local-First • Privacy-Respecting                ║
╠══════════════════════════════════════════════════════════════╣
║  Type 'help' for commands  •  Type 'exit' to quit            ║
╚══════════════════════════════════════════════════════════════╝
"""
    
    PROMPT = "\n🤖 > "
    
    STATUS_ICONS = {
        ActionStatus.SUCCESS: "✅",
        ActionStatus.FAILURE: "❌",
        ActionStatus.PENDING_CONFIRMATION: "⚠️ ",
        ActionStatus.CANCELLED: "🚫",
        ActionStatus.BLOCKED_SAFE_MODE: "🔒",
        ActionStatus.BLOCKED_COOLDOWN: "⏳",
        ActionStatus.BLOCKED_RATE_LIMIT: "🚦",
        ActionStatus.BLOCKED_KILL_SWITCH: "🛑",
    }

    def __init__(self, router: CommandRouter):
        super().__init__(router)
        self.quiet_mode = False

    def start(self):
        self.running = True
        self._show_banner()
        self._main_loop()

    def stop(self):
        self.running = False
        self.display_output("\nGoodbye! 👋")

    def _show_banner(self):
        if not self.quiet_mode:
            print(self.BANNER)

    def _main_loop(self):
        while self.running:
            try:
                user_input = self.get_input()
                
                if not user_input:
                    continue

                result = self.router.process(user_input)
                
                self._display_result(result)

                if result.data and result.data.get("exit"):
                    self.stop()
                    break

            except KeyboardInterrupt:
                print("\n")
                self.display_output("Interrupted. Type 'exit' to quit or continue typing.")
            except EOFError:
                self.stop()
                break

    def get_input(self) -> str:
        try:
            user_input = input(self.PROMPT).strip()
            return user_input
        except (EOFError, KeyboardInterrupt):
            raise

    def display_output(self, message: str):
        print(message)

    def _display_result(self, result):
        icon = self.STATUS_ICONS.get(result.status, "")
        
        if result.status == ActionStatus.SUCCESS:
            self.display_output(f"{icon} {result.message}")
        elif result.status == ActionStatus.FAILURE:
            self.display_output(f"{icon} {result.message}")
        elif result.status == ActionStatus.PENDING_CONFIRMATION:
            self.display_output(f"\n{result.message}")
        else:
            self.display_output(f"{icon} {result.message}")

    def enable_quiet_mode(self):
        self.quiet_mode = True

    def disable_quiet_mode(self):
        self.quiet_mode = False


def run_cli():
    router = CommandRouter()
    cli = CLIInterface(router)
    cli.start()


if __name__ == "__main__":
    run_cli()
