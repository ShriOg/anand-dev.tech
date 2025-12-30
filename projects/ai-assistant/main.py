#!/usr/bin/env python3
import sys
import argparse
import platform

def check_python_version():
    if sys.version_info < (3, 9):
        print("Error: Python 3.9 or higher is required.")
        sys.exit(1)


def parse_arguments():
    parser = argparse.ArgumentParser(
        description="AI Assistant - Local-first, privacy-respecting desktop assistant",
        formatter_class=argparse.RawDescriptionHelpFormatter,
        epilog="""
Examples:
  python main.py              Start GUI mode (default)
  python main.py --voice      Start GUI with voice support
  python main.py --cli        Start CLI mode
  python main.py --safe-mode  Start in safe mode (read-only)
  python main.py --version    Show version information
        """
    )
    
    parser.add_argument(
        "--version", "-v",
        action="store_true",
        help="Show version information"
    )
    
    parser.add_argument(
        "--safe-mode", "-s",
        action="store_true",
        help="Start in safe mode (only read-only commands)"
    )
    
    parser.add_argument(
        "--quiet", "-q",
        action="store_true",
        help="Suppress banner and non-essential output (CLI mode only)"
    )
    
    parser.add_argument(
        "--command", "-c",
        type=str,
        help="Execute a single command and exit"
    )
    
    parser.add_argument(
        "--cli",
        action="store_true",
        help="Start in CLI mode instead of GUI (default is GUI)"
    )
    
    parser.add_argument(
        "--gui", "-g",
        action="store_true",
        help="Start in GUI mode (default behavior)"
    )
    
    parser.add_argument(
        "--voice",
        action="store_true",
        help="Enable voice input/output in GUI mode"
    )
    
    return parser.parse_args()


def show_version():
    print("""
AI Assistant v1.0.0
-------------------
Platform: {} {}
Python: {}
Architecture: {}
    """.format(
        platform.system(),
        platform.release(),
        platform.python_version(),
        platform.machine()
    ))


def run_single_command(command: str, safe_mode: bool = False):
    from brain.router import CommandRouter
    from utils.config import config_manager
    
    if safe_mode:
        config_manager.enable_safe_mode()
    
    router = CommandRouter()
    result = router.process(command)
    print(result.message)
    
    return 0 if result.status.value == "success" else 1


def run_interactive(safe_mode: bool = False, quiet: bool = False):
    from brain.router import CommandRouter
    from interfaces.cli import CLIInterface
    from utils.config import config_manager
    
    if safe_mode:
        config_manager.enable_safe_mode()
    
    router = CommandRouter()
    cli = CLIInterface(router)
    
    if quiet:
        cli.enable_quiet_mode()
    
    cli.start()


def run_gui(safe_mode: bool = False, enable_voice: bool = False):
    from brain.router import CommandRouter
    from interfaces.gui_kivy import GUIKivyInterface
    from utils.config import config_manager
    
    if safe_mode:
        config_manager.enable_safe_mode()
    
    router = CommandRouter()
    gui = GUIKivyInterface(router, enable_voice=enable_voice)
    gui.start()


def main():
    check_python_version()
    args = parse_arguments()
    
    if args.version:
        show_version()
        return 0
    
    if args.command:
        return run_single_command(args.command, args.safe_mode)
    
    if args.cli:
        if args.voice:
            print("Warning: --voice is only available in GUI mode. Starting CLI mode.")
        run_interactive(args.safe_mode, args.quiet)
    else:
        run_gui(args.safe_mode, args.voice)
    
    return 0


if __name__ == "__main__":
    sys.exit(main())
