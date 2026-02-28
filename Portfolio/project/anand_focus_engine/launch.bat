@echo off

cd /d "%~dp0"

echo.
echo ========================================
echo  🌟 ANAND FOCUS ENGINE™ - GOD MODE
echo ========================================
echo.

python --version >nul 2>&1
if errorlevel 1 (
    echo ❌ ERROR: Python 3.14 (64-bit) not found in PATH
    echo.
    echo Please ensure Python 3.14 64-bit is installed and added to PATH
    pause
    exit /b 1
)

if not exist main.py (
    echo ❌ ERROR: main.py not found
    pause
    exit /b 1
)

if not exist config.json (
    echo ❌ ERROR: config.json not found
    pause
    exit /b 1
)

if not exist stats.json (
    echo ❌ ERROR: stats.json not found
    pause
    exit /b 1
)

echo ✅ All files verified.
echo.
echo Starting Focus Engine...
echo.

python main.py

pause
