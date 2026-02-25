from abc import ABC, abstractmethod
from actions.schema import Action, ActionResult, ActionType


class BaseAdapter(ABC):
    @abstractmethod
    def execute(self, action: Action) -> ActionResult:
        pass

    @abstractmethod
    def open_app(self, app_name: str) -> ActionResult:
        pass

    @abstractmethod
    def open_file(self, path: str) -> ActionResult:
        pass

    @abstractmethod
    def open_folder(self, path: str) -> ActionResult:
        pass

    @abstractmethod
    def open_url(self, url: str) -> ActionResult:
        pass

    @abstractmethod
    def adjust_volume(self, level: int) -> ActionResult:
        pass

    @abstractmethod
    def mute_volume(self) -> ActionResult:
        pass

    @abstractmethod
    def unmute_volume(self) -> ActionResult:
        pass

    @abstractmethod
    def take_screenshot(self, path: str) -> ActionResult:
        pass

    @abstractmethod
    def shutdown(self) -> ActionResult:
        pass

    @abstractmethod
    def restart(self) -> ActionResult:
        pass

    @abstractmethod
    def lock_screen(self) -> ActionResult:
        pass

    @abstractmethod
    def get_battery(self) -> ActionResult:
        pass

    def dispatch(self, action: Action) -> ActionResult:
        handlers = {
            ActionType.OPEN_APP: lambda: self.open_app(action.parameters.get("app_name", "")),
            ActionType.OPEN_FILE: lambda: self.open_file(action.parameters.get("path", "")),
            ActionType.OPEN_FOLDER: lambda: self.open_folder(action.parameters.get("path", "")),
            ActionType.OPEN_URL: lambda: self.open_url(action.parameters.get("url", "")),
            ActionType.ADJUST_VOLUME: lambda: self.adjust_volume(action.parameters.get("level", 50)),
            ActionType.MUTE_VOLUME: lambda: self.mute_volume(),
            ActionType.UNMUTE_VOLUME: lambda: self.unmute_volume(),
            ActionType.TAKE_SCREENSHOT: lambda: self.take_screenshot(action.parameters.get("path", "")),
            ActionType.SHUTDOWN: lambda: self.shutdown(),
            ActionType.RESTART: lambda: self.restart(),
            ActionType.LOCK_SCREEN: lambda: self.lock_screen(),
            ActionType.GET_BATTERY: lambda: self.get_battery(),
        }
        
        handler = handlers.get(action.action_type)
        if handler:
            return handler()
        return ActionResult.failure(f"Unsupported action: {action.action_type.name}")
