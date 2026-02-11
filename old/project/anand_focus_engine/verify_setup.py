#!/usr/bin/env python3

import sys
import json
import os
from pathlib import Path

def check_python_version():
    version = sys.version_info
    if version.major < 3 or (version.major == 3 and version.minor < 10):
        print(f"❌ Python {version.major}.{version.minor} found")
        print("   Required: Python 3.10+ (3.14 recommended)")
        return False
    
    is_64bit = sys.maxsize > 2**32
    if not is_64bit:
        print("❌ Python is 32-bit")
        print("   Required: 64-bit Python")
        return False
    
    print(f"✅ Python {version.major}.{version.minor}.{version.micro} (64-bit)")
    return True

def check_files():
    required_files = [
        "main.py",
        "detector.py",
        "focus_session.py",
        "ui_overlay.py",
        "config.json",
        "stats.json"
    ]
    
    script_dir = Path(__file__).parent
    all_exist = True
    
    for filename in required_files:
        filepath = script_dir / filename
        if filepath.exists():
            print(f"✅ {filename}")
        else:
            print(f"❌ {filename} - NOT FOUND")
            all_exist = False
    
    return all_exist

def check_json_files():
    script_dir = Path(__file__).parent
    
    print("\n[JSON Validation]")
    
    config_path = script_dir / "config.json"
    try:
        with open(config_path, 'r') as f:
            config = json.load(f)
        print("✅ config.json (valid JSON)")
        return True
    except Exception as e:
        print(f"❌ config.json - {str(e)}")
        return False
    
    stats_path = script_dir / "stats.json"
    try:
        with open(stats_path, 'r') as f:
            stats = json.load(f)
        print("✅ stats.json (valid JSON)")
        return True
    except Exception as e:
        print(f"❌ stats.json - {str(e)}")
        return False

def check_imports():
    print("\n[Module Imports]")
    
    try:
        import tkinter
        print("✅ tkinter (UI framework)")
    except ImportError:
        print("❌ tkinter - NOT AVAILABLE")
        return False
    
    try:
        import ctypes
        print("✅ ctypes (Windows API)")
    except ImportError:
        print("❌ ctypes - NOT AVAILABLE")
        return False
    
    try:
        from threading import Thread, RLock, Event
        print("✅ threading (concurrency)")
    except ImportError:
        print("❌ threading - NOT AVAILABLE")
        return False
    
    return True

def main():
    print("\n" + "="*60)
    print("  ANAND FOCUS ENGINE™ - SETUP VERIFICATION")
    print("="*60 + "\n")
    
    print("[Python Environment]")
    python_ok = check_python_version()
    
    print("\n[Required Files]")
    files_ok = check_files()
    
    json_ok = check_json_files()
    
    imports_ok = check_imports()
    
    print("\n" + "="*60)
    
    if python_ok and files_ok and json_ok and imports_ok:
        print("✅ ALL CHECKS PASSED - Ready to use!")
        print("\nLaunch with:")
        print("  python main.py              (interactive mode)")
        print("  python main.py --daemon     (daemon mode)")
        print("\nOr use launcher scripts:")
        print("  launch.bat")
        print("  launch.ps1")
        return 0
    else:
        print("❌ SETUP INCOMPLETE - Fix errors above before running")
        return 1

if __name__ == "__main__":
    exit_code = main()
    print("="*60 + "\n")
    sys.exit(exit_code)
