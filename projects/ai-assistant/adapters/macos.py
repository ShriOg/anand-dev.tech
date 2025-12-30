import subprocess
import os
from pathlib import Path
from datetime import datetime
from actions.schema import Action, ActionResult
from adapters import BaseAdapter


class MacOSAdapter(BaseAdapter):
    
    APP_ALIASES = {
        "browser": "Safari",
        "safari": "Safari",
        "chrome": "Google Chrome",
        "firefox": "Firefox",
        "terminal": "Terminal",
        "finder": "Finder",
        "files": "Finder",
        "file manager": "Finder",
        "calculator": "Calculator",
        "notes": "Notes",
        "text editor": "TextEdit",
        "settings": "System Preferences",
        "preferences": "System Preferences",
        "code": "Visual Studio Code",
        "vscode": "Visual Studio Code",
        "music": "Music",
        "photos": "Photos",
        "mail": "Mail",
    }

    def execute(self, action: Action) -> ActionResult:
        return self.dispatch(action)

    def open_app(self, app_name: str) -> ActionResult:
        try:
            app_lower = app_name.lower().strip()
            actual_app = self.APP_ALIASES.get(app_lower, app_name)
            subprocess.Popen(
                ["open", "-a", actual_app],
                stdout=subprocess.DEVNULL,
                stderr=subprocess.DEVNULL
            )
            return ActionResult.success(f"Opening {app_name}")
        except Exception as e:
            return ActionResult.failure(f"Failed to open {app_name}: {str(e)}")

    def open_file(self, path: str) -> ActionResult:
        try:
            expanded_path = os.path.expanduser(path)
            if not os.path.exists(expanded_path):
                return ActionResult.failure(f"File not found: {path}")
            subprocess.Popen(
                ["open", expanded_path],
                stdout=subprocess.DEVNULL,
                stderr=subprocess.DEVNULL
            )
            return ActionResult.success(f"Opening file: {path}")
        except Exception as e:
            return ActionResult.failure(f"Failed to open file: {str(e)}")

    def open_folder(self, path: str) -> ActionResult:
        try:
            expanded_path = os.path.expanduser(path)
            if not os.path.isdir(expanded_path):
                return ActionResult.failure(f"Folder not found: {path}")
            subprocess.Popen(
                ["open", expanded_path],
                stdout=subprocess.DEVNULL,
                stderr=subprocess.DEVNULL
            )
            return ActionResult.success(f"Opening folder: {path}")
        except Exception as e:
            return ActionResult.failure(f"Failed to open folder: {str(e)}")

    def open_url(self, url: str) -> ActionResult:
        try:
            if not url.startswith(("http://", "https://")):
                url = "https://" + url
            subprocess.Popen(
                ["open", url],
                stdout=subprocess.DEVNULL,
                stderr=subprocess.DEVNULL
            )
            return ActionResult.success(f"Opening URL: {url}")
        except Exception as e:
            return ActionResult.failure(f"Failed to open URL: {str(e)}")

    def adjust_volume(self, level: int) -> ActionResult:
        try:
            level = max(0, min(100, level))
            macos_volume = round(level * 7 / 100)
            subprocess.run(
                ["osascript", "-e", f"set volume output volume {level}"],
                check=True,
                capture_output=True
            )
            return ActionResult.success(f"Volume set to {level}%")
        except Exception as e:
            return ActionResult.failure(f"Failed to adjust volume: {str(e)}")

    def mute_volume(self) -> ActionResult:
        try:
            subprocess.run(
                ["osascript", "-e", "set volume output muted true"],
                check=True,
                capture_output=True
            )
            return ActionResult.success("Volume muted")
        except Exception as e:
            return ActionResult.failure(f"Failed to mute volume: {str(e)}")

    def unmute_volume(self) -> ActionResult:
        try:
            subprocess.run(
                ["osascript", "-e", "set volume output muted false"],
                check=True,
                capture_output=True
            )
            return ActionResult.success("Volume unmuted")
        except Exception as e:
            return ActionResult.failure(f"Failed to unmute volume: {str(e)}")

    def take_screenshot(self, path: str) -> ActionResult:
        try:
            if not path:
                screenshots_dir = Path.home() / "Pictures" / "Screenshots"
                screenshots_dir.mkdir(parents=True, exist_ok=True)
                timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
                path = str(screenshots_dir / f"screenshot_{timestamp}.png")
            
            subprocess.run(
                ["screencapture", "-x", path],
                check=True,
                capture_output=True
            )
            return ActionResult.success(f"Screenshot saved to {path}", data={"path": path})
        except Exception as e:
            return ActionResult.failure(f"Failed to take screenshot: {str(e)}")

    def shutdown(self) -> ActionResult:
        try:
            subprocess.run(
                ["osascript", "-e", 'tell app "System Events" to shut down'],
                check=True
            )
            return ActionResult.success("Shutting down...")
        except Exception as e:
            return ActionResult.failure(f"Failed to shutdown: {str(e)}")

    def restart(self) -> ActionResult:
        try:
            subprocess.run(
                ["osascript", "-e", 'tell app "System Events" to restart'],
                check=True
            )
            return ActionResult.success("Restarting...")
        except Exception as e:
            return ActionResult.failure(f"Failed to restart: {str(e)}")

    def lock_screen(self) -> ActionResult:
        try:
            subprocess.run(
                ["pmset", "displaysleepnow"],
                check=True,
                capture_output=True
            )
            return ActionResult.success("Screen locked")
        except Exception as e:
            return ActionResult.failure(f"Failed to lock screen: {str(e)}")

    def get_battery(self) -> ActionResult:
        try:
            result = subprocess.run(
                ["pmset", "-g", "batt"],
                capture_output=True,
                text=True
            )
            output = result.stdout
            
            import re
            match = re.search(r"(\d+)%", output)
            if match:
                percentage = int(match.group(1))
                status = "Charging" if "charging" in output.lower() else "Discharging"
                if "AC Power" in output and "charged" in output.lower():
                    status = "Fully Charged"
                return ActionResult.success(
                    f"Battery: {percentage}% ({status})",
                    data={"percentage": percentage, "status": status}
                )
            return ActionResult.failure("Could not parse battery status")
        except Exception as e:
            return ActionResult.failure(f"Failed to get battery: {str(e)}")
