import subprocess
import os
import ctypes
from pathlib import Path
from datetime import datetime
from actions.schema import Action, ActionResult
from adapters import BaseAdapter


class WindowsAdapter(BaseAdapter):
    
    APP_ALIASES = {
        "browser": "start msedge",
        "edge": "start msedge",
        "chrome": "start chrome",
        "firefox": "start firefox",
        "terminal": "start wt",
        "cmd": "start cmd",
        "powershell": "start powershell",
        "explorer": "start explorer",
        "files": "start explorer",
        "file manager": "start explorer",
        "calculator": "start calc",
        "notepad": "start notepad",
        "text editor": "start notepad",
        "settings": "start ms-settings:",
        "code": "start code",
        "vscode": "start code",
        "paint": "start mspaint",
        "task manager": "start taskmgr",
    }

    def execute(self, action: Action) -> ActionResult:
        return self.dispatch(action)

    def open_app(self, app_name: str) -> ActionResult:
        try:
            app_lower = app_name.lower().strip()
            command = self.APP_ALIASES.get(app_lower)
            
            if command:
                subprocess.Popen(
                    command,
                    shell=True,
                    stdout=subprocess.DEVNULL,
                    stderr=subprocess.DEVNULL
                )
            else:
                subprocess.Popen(
                    f"start {app_name}",
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
            os.startfile(expanded_path)
            return ActionResult.success(f"Opening file: {path}")
        except Exception as e:
            return ActionResult.failure(f"Failed to open file: {str(e)}")

    def open_folder(self, path: str) -> ActionResult:
        try:
            expanded_path = os.path.expanduser(path)
            if not os.path.isdir(expanded_path):
                return ActionResult.failure(f"Folder not found: {path}")
            subprocess.Popen(["explorer", expanded_path])
            return ActionResult.success(f"Opening folder: {path}")
        except Exception as e:
            return ActionResult.failure(f"Failed to open folder: {str(e)}")

    def open_url(self, url: str) -> ActionResult:
        try:
            if not url.startswith(("http://", "https://")):
                url = "https://" + url
            os.startfile(url)
            return ActionResult.success(f"Opening URL: {url}")
        except Exception as e:
            return ActionResult.failure(f"Failed to open URL: {str(e)}")

    def adjust_volume(self, level: int) -> ActionResult:
        try:
            level = max(0, min(100, level))
            ps_script = f'''
            $vol = {level} / 100
            $obj = New-Object -ComObject WScript.Shell
            1..50 | ForEach-Object {{ $obj.SendKeys([char]174) }}
            $steps = [math]::Round({level} / 2)
            1..$steps | ForEach-Object {{ $obj.SendKeys([char]175) }}
            '''
            try:
                from ctypes import cast, POINTER
                from comtypes import CLSCTX_ALL
                from pycaw.pycaw import AudioUtilities, IAudioEndpointVolume
                
                devices = AudioUtilities.GetSpeakers()
                interface = devices.Activate(IAudioEndpointVolume._iid_, CLSCTX_ALL, None)
                volume = cast(interface, POINTER(IAudioEndpointVolume))
                volume.SetMasterVolumeLevelScalar(level / 100, None)
                return ActionResult.success(f"Volume set to {level}%")
            except ImportError:
                subprocess.run(
                    ["powershell", "-Command", ps_script],
                    capture_output=True,
                    shell=True
                )
                return ActionResult.success(f"Volume set to approximately {level}%")
        except Exception as e:
            return ActionResult.failure(f"Failed to adjust volume: {str(e)}")

    def mute_volume(self) -> ActionResult:
        try:
            try:
                from ctypes import cast, POINTER
                from comtypes import CLSCTX_ALL
                from pycaw.pycaw import AudioUtilities, IAudioEndpointVolume
                
                devices = AudioUtilities.GetSpeakers()
                interface = devices.Activate(IAudioEndpointVolume._iid_, CLSCTX_ALL, None)
                volume = cast(interface, POINTER(IAudioEndpointVolume))
                volume.SetMute(1, None)
            except ImportError:
                subprocess.run(
                    ["powershell", "-Command", "(New-Object -ComObject WScript.Shell).SendKeys([char]173)"],
                    capture_output=True,
                    shell=True
                )
            return ActionResult.success("Volume muted")
        except Exception as e:
            return ActionResult.failure(f"Failed to mute volume: {str(e)}")

    def unmute_volume(self) -> ActionResult:
        try:
            try:
                from ctypes import cast, POINTER
                from comtypes import CLSCTX_ALL
                from pycaw.pycaw import AudioUtilities, IAudioEndpointVolume
                
                devices = AudioUtilities.GetSpeakers()
                interface = devices.Activate(IAudioEndpointVolume._iid_, CLSCTX_ALL, None)
                volume = cast(interface, POINTER(IAudioEndpointVolume))
                volume.SetMute(0, None)
            except ImportError:
                subprocess.run(
                    ["powershell", "-Command", "(New-Object -ComObject WScript.Shell).SendKeys([char]173)"],
                    capture_output=True,
                    shell=True
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
            
            try:
                from PIL import ImageGrab
                screenshot = ImageGrab.grab()
                screenshot.save(path)
            except ImportError:
                ps_script = f'''
                Add-Type -AssemblyName System.Windows.Forms
                $screen = [System.Windows.Forms.Screen]::PrimaryScreen.Bounds
                $bitmap = New-Object System.Drawing.Bitmap($screen.Width, $screen.Height)
                $graphics = [System.Drawing.Graphics]::FromImage($bitmap)
                $graphics.CopyFromScreen($screen.Location, [System.Drawing.Point]::Empty, $screen.Size)
                $bitmap.Save("{path}")
                '''
                subprocess.run(["powershell", "-Command", ps_script], capture_output=True)
            
            return ActionResult.success(f"Screenshot saved to {path}", data={"path": path})
        except Exception as e:
            return ActionResult.failure(f"Failed to take screenshot: {str(e)}")

    def shutdown(self) -> ActionResult:
        try:
            subprocess.run(["shutdown", "/s", "/t", "5"], check=True)
            return ActionResult.success("Shutting down in 5 seconds...")
        except Exception as e:
            return ActionResult.failure(f"Failed to shutdown: {str(e)}")

    def restart(self) -> ActionResult:
        try:
            subprocess.run(["shutdown", "/r", "/t", "5"], check=True)
            return ActionResult.success("Restarting in 5 seconds...")
        except Exception as e:
            return ActionResult.failure(f"Failed to restart: {str(e)}")

    def lock_screen(self) -> ActionResult:
        try:
            ctypes.windll.user32.LockWorkStation()
            return ActionResult.success("Screen locked")
        except Exception as e:
            return ActionResult.failure(f"Failed to lock screen: {str(e)}")

    def get_battery(self) -> ActionResult:
        try:
            class SYSTEM_POWER_STATUS(ctypes.Structure):
                _fields_ = [
                    ("ACLineStatus", ctypes.c_byte),
                    ("BatteryFlag", ctypes.c_byte),
                    ("BatteryLifePercent", ctypes.c_byte),
                    ("SystemStatusFlag", ctypes.c_byte),
                    ("BatteryLifeTime", ctypes.c_ulong),
                    ("BatteryFullLifeTime", ctypes.c_ulong),
                ]

            status = SYSTEM_POWER_STATUS()
            ctypes.windll.kernel32.GetSystemPowerStatus(ctypes.byref(status))
            
            percentage = status.BatteryLifePercent
            if percentage > 100:
                return ActionResult.failure("No battery detected")
            
            charging = "Charging" if status.ACLineStatus == 1 else "Discharging"
            return ActionResult.success(
                f"Battery: {percentage}% ({charging})",
                data={"percentage": percentage, "status": charging}
            )
        except Exception as e:
            return ActionResult.failure(f"Failed to get battery: {str(e)}")
