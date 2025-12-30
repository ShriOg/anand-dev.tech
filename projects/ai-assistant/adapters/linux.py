import subprocess
import os
from pathlib import Path
from datetime import datetime
from actions.schema import Action, ActionResult
from adapters import BaseAdapter


class LinuxAdapter(BaseAdapter):
    
    APP_ALIASES = {
        "browser": "xdg-open https://",
        "firefox": "firefox",
        "chrome": "google-chrome",
        "chromium": "chromium-browser",
        "terminal": "gnome-terminal",
        "files": "nautilus",
        "file manager": "nautilus",
        "calculator": "gnome-calculator",
        "settings": "gnome-control-center",
        "text editor": "gedit",
        "code": "code",
        "vscode": "code",
    }

    def execute(self, action: Action) -> ActionResult:
        return self.dispatch(action)

    def open_app(self, app_name: str) -> ActionResult:
        try:
            app_lower = app_name.lower().strip()
            command = self.APP_ALIASES.get(app_lower, app_lower)
            subprocess.Popen(
                command,
                shell=True,
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
                ["xdg-open", expanded_path],
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
                ["xdg-open", expanded_path],
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
                ["xdg-open", url],
                stdout=subprocess.DEVNULL,
                stderr=subprocess.DEVNULL
            )
            return ActionResult.success(f"Opening URL: {url}")
        except Exception as e:
            return ActionResult.failure(f"Failed to open URL: {str(e)}")

    def adjust_volume(self, level: int) -> ActionResult:
        try:
            level = max(0, min(100, level))
            subprocess.run(
                ["pactl", "set-sink-volume", "@DEFAULT_SINK@", f"{level}%"],
                check=True,
                capture_output=True
            )
            return ActionResult.success(f"Volume set to {level}%")
        except subprocess.CalledProcessError:
            try:
                subprocess.run(
                    ["amixer", "set", "Master", f"{level}%"],
                    check=True,
                    capture_output=True
                )
                return ActionResult.success(f"Volume set to {level}%")
            except Exception as e:
                return ActionResult.failure(f"Failed to adjust volume: {str(e)}")
        except Exception as e:
            return ActionResult.failure(f"Failed to adjust volume: {str(e)}")

    def mute_volume(self) -> ActionResult:
        try:
            subprocess.run(
                ["pactl", "set-sink-mute", "@DEFAULT_SINK@", "1"],
                check=True,
                capture_output=True
            )
            return ActionResult.success("Volume muted")
        except subprocess.CalledProcessError:
            try:
                subprocess.run(
                    ["amixer", "set", "Master", "mute"],
                    check=True,
                    capture_output=True
                )
                return ActionResult.success("Volume muted")
            except Exception as e:
                return ActionResult.failure(f"Failed to mute volume: {str(e)}")
        except Exception as e:
            return ActionResult.failure(f"Failed to mute volume: {str(e)}")

    def unmute_volume(self) -> ActionResult:
        try:
            subprocess.run(
                ["pactl", "set-sink-mute", "@DEFAULT_SINK@", "0"],
                check=True,
                capture_output=True
            )
            return ActionResult.success("Volume unmuted")
        except subprocess.CalledProcessError:
            try:
                subprocess.run(
                    ["amixer", "set", "Master", "unmute"],
                    check=True,
                    capture_output=True
                )
                return ActionResult.success("Volume unmuted")
            except Exception as e:
                return ActionResult.failure(f"Failed to unmute volume: {str(e)}")
        except Exception as e:
            return ActionResult.failure(f"Failed to unmute volume: {str(e)}")

    def take_screenshot(self, path: str) -> ActionResult:
        try:
            if not path:
                screenshots_dir = Path.home() / "Pictures" / "Screenshots"
                screenshots_dir.mkdir(parents=True, exist_ok=True)
                timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
                path = str(screenshots_dir / f"screenshot_{timestamp}.png")
            
            try:
                subprocess.run(
                    ["gnome-screenshot", "-f", path],
                    check=True,
                    capture_output=True
                )
            except (subprocess.CalledProcessError, FileNotFoundError):
                subprocess.run(
                    ["scrot", path],
                    check=True,
                    capture_output=True
                )
            
            return ActionResult.success(f"Screenshot saved to {path}", data={"path": path})
        except Exception as e:
            return ActionResult.failure(f"Failed to take screenshot: {str(e)}")

    def shutdown(self) -> ActionResult:
        try:
            subprocess.run(["systemctl", "poweroff"], check=True)
            return ActionResult.success("Shutting down...")
        except Exception as e:
            return ActionResult.failure(f"Failed to shutdown: {str(e)}")

    def restart(self) -> ActionResult:
        try:
            subprocess.run(["systemctl", "reboot"], check=True)
            return ActionResult.success("Restarting...")
        except Exception as e:
            return ActionResult.failure(f"Failed to restart: {str(e)}")

    def lock_screen(self) -> ActionResult:
        try:
            try:
                subprocess.run(
                    ["gnome-screensaver-command", "-l"],
                    check=True,
                    capture_output=True
                )
            except (subprocess.CalledProcessError, FileNotFoundError):
                subprocess.run(
                    ["loginctl", "lock-session"],
                    check=True,
                    capture_output=True
                )
            return ActionResult.success("Screen locked")
        except Exception as e:
            return ActionResult.failure(f"Failed to lock screen: {str(e)}")

    def get_battery(self) -> ActionResult:
        try:
            result = subprocess.run(
                ["cat", "/sys/class/power_supply/BAT0/capacity"],
                capture_output=True,
                text=True
            )
            if result.returncode == 0:
                percentage = result.stdout.strip()
                status_result = subprocess.run(
                    ["cat", "/sys/class/power_supply/BAT0/status"],
                    capture_output=True,
                    text=True
                )
                status = status_result.stdout.strip() if status_result.returncode == 0 else "Unknown"
                return ActionResult.success(
                    f"Battery: {percentage}% ({status})",
                    data={"percentage": int(percentage), "status": status}
                )
            return ActionResult.failure("Could not read battery status")
        except Exception as e:
            return ActionResult.failure(f"Failed to get battery: {str(e)}")
