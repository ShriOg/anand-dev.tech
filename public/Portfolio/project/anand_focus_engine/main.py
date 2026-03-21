import sys
import json
import threading
import time
import ctypes
from pathlib import Path
from typing import Optional
from datetime import datetime

from detector import WindowDetector, DetectionResult
from focus_session import FocusSession, FocusState
from ui_overlay import OverlayUI

class AnandFocusEngine:
    def __init__(self, config_path: str = "config.json", stats_path: str = "stats.json"):
        self.config_path = Path(config_path)
        self.stats_path = Path(stats_path)

        self.detector = WindowDetector(str(self.config_path))
        self.session = FocusSession(str(self.config_path), str(self.stats_path))
        self.overlay = OverlayUI(str(self.config_path))

        with open(self.config_path, 'r') as f:
            self.config = json.load(f)

        self.detector.register_detection_callback(self._on_distraction_detected)
        self.session.register_state_change_callback(self._on_state_changed)
        self.session.register_time_tick_callback(self._on_time_tick)

        self._distraction_timestamp: Optional[datetime] = None
        self._last_closed_timestamp: Optional[datetime] = None
        self._close_cooldown_ms = self.config.get("auto_close_delay_ms", 500)

        self._running = False
        self._lock = threading.RLock()

    def _on_distraction_detected(self, result: DetectionResult) -> None:
        if not self.session.get_session_info()['active']:
            return

        self.session.record_distraction_attempt()

        now = datetime.now()
        if self._last_closed_timestamp:
            time_since_last_close = (now - self._last_closed_timestamp).total_seconds() * 1000
            if time_since_last_close < self._close_cooldown_ms:
                return

        self._last_closed_timestamp = now
        self.detector.close_active_window_tab()

        self.overlay.flash_warning(
            count=self.config.get("flash_warning_count", 3),
            interval_ms=self.config.get("flash_warning_interval_ms", 200)
        )

    def _on_state_changed(self, old_state: FocusState, new_state: FocusState) -> None:
        if new_state == FocusState.FOCUS_ACTIVE:
            self.detector.start_detection_loop(interval_seconds=0.5)
        elif new_state == FocusState.IDLE:
            self.detector.stop_detection_loop()

    def _on_time_tick(self, tick_data: dict) -> None:
        self.overlay.update_session_info(tick_data)

    def start_focus_session(self, duration_minutes: int) -> bool:
        if not self.session.start_session(duration_minutes):
            return False

        return True

    def stop_focus_session(self, override_password: Optional[str] = None) -> bool:
        session_info = self.session.get_session_info()

        if not session_info['active']:
            return True

        if override_password is None:
            return False

        return self.session.emergency_stop(override_password)

    def get_status(self) -> dict:
        session_info = self.session.get_session_info()

        return {
            'timestamp': datetime.now().isoformat(),
            'session_active': session_info['active'],
            'state': session_info.get('state', 'IDLE'),
            'time_remaining_seconds': session_info.get('time_remaining_seconds', 0),
            'distraction_attempts': session_info.get('distraction_attempts', 0),
            'planned_duration_minutes': session_info.get('planned_duration_minutes', 0)
        }

    def run_interactive_mode(self) -> None:
        print("\n" + "="*60)
        print("🌟 ANAND FOCUS ENGINE™ - GOD MODE")
        print("="*60 + "\n")

        self.overlay.start_update_loop()

        overlay_thread = threading.Thread(target=self.overlay.run, daemon=True)
        overlay_thread.start()

        session_info = self.session.get_session_info()
        self.overlay.update_session_info(session_info)

        while True:
            print("\n[MENU]")
            print("1. Start 25-min focus session")
            print("2. Start 45-min focus session")
            print("3. Start 60-min focus session")
            print("4. View current status")
            print("5. View stats")
            print("6. Emergency stop (requires password)")
            print("7. Exit program")
            print("-" * 40)

            choice = input("Enter choice (1-7): ").strip()

            if choice == "1":
                if self.start_focus_session(25):
                    print("\n✅ Focus session started! (25 minutes)")
                    print("⚠️  Focus mode is LOCKED. Distraction sites will auto-close.")
                else:
                    print("\n❌ Cannot start session. Either already active or invalid duration.")

            elif choice == "2":
                if self.start_focus_session(45):
                    print("\n✅ Focus session started! (45 minutes)")
                    print("⚠️  Focus mode is LOCKED. Distraction sites will auto-close.")
                else:
                    print("\n❌ Cannot start session. Either already active or invalid duration.")

            elif choice == "3":
                if self.start_focus_session(60):
                    print("\n✅ Focus session started! (60 minutes)")
                    print("⚠️  Focus mode is LOCKED. Distraction sites will auto-close.")
                else:
                    print("\n❌ Cannot start session. Either already active or invalid duration.")

            elif choice == "4":
                status = self.get_status()
                print("\n[CURRENT STATUS]")
                print(f"State: {status['state']}")
                print(f"Active: {status['session_active']}")
                print(f"Time Remaining: {status['time_remaining_seconds']}s")
                print(f"Distraction Attempts: {status['distraction_attempts']}")
                print(f"Planned Duration: {status['planned_duration_minutes']}m")

            elif choice == "5":
                with open(self.stats_path, 'r') as f:
                    stats = json.load(f)

                print("\n[SESSION STATS]")
                print(f"Total Focused Minutes: {stats.get('total_focused_minutes', 0)}")
                print(f"Total Distraction Attempts: {stats.get('distraction_attempts', 0)}")
                print(f"Sessions Completed: {stats.get('sessions_completed', 0)}")

                if stats.get('last_session'):
                    last = stats['last_session']
                    print(f"\nLast Session:")
                    print(f"  - Duration: {last.get('planned_duration_minutes')}m")
                    print(f"  - Attempts: {last.get('distraction_attempts')}")

            elif choice == "6":
                password = input("Enter emergency override password: ").strip()
                if self.stop_focus_session(override_password=password):
                    print("\n✅ Focus session stopped.")
                else:
                    print("\n❌ Incorrect password or no active session.")

            elif choice == "7":
                print("\nShutting down Focus Engine...")
                break

            else:
                print("\n❌ Invalid choice. Please enter 1-7.")

        self.overlay.stop_update_loop()
        self.overlay.quit()

    def run_daemon_mode(self) -> None:
        print("\n" + "="*60)
        print("🌟 ANAND FOCUS ENGINE™ - DAEMON MODE")
        print("="*60)
        print("Running in background. Press Ctrl+C to stop.\n")

        self.overlay.start_update_loop()

        overlay_thread = threading.Thread(target=self.overlay.run, daemon=True)
        overlay_thread.start()

        self._running = True

        try:
            while self._running:
                session_info = self.session.get_session_info()
                self.overlay.update_session_info(session_info)
                time.sleep(1)
        except KeyboardInterrupt:
            print("\n\nShutting down...")
        finally:
            self.overlay.stop_update_loop()
            self.overlay.quit()

def main():
    import os

    script_dir = Path(__file__).parent
    os.chdir(script_dir)

    config_path = script_dir / "config.json"
    stats_path = script_dir / "stats.json"

    if not config_path.exists() or not stats_path.exists():
        print("❌ Error: config.json or stats.json not found.")
        print(f"Expected location: {script_dir}")
        sys.exit(1)

    engine = AnandFocusEngine(str(config_path), str(stats_path))

    if len(sys.argv) > 1 and sys.argv[1] == "--daemon":
        engine.run_daemon_mode()
    else:
        engine.run_interactive_mode()

if __name__ == "__main__":
    main()
