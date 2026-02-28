@echo off
title Abhilasha AI - Local Server
color 0D

echo.
echo ═══════════════════════════════════════════════════════════
echo   💗 Starting Abhilasha AI Local Server...
echo ═══════════════════════════════════════════════════════════
echo.

where node >nul 2>nul
if %ERRORLEVEL% NEQ 0 (
    echo [ERROR] Node.js is not installed!
    echo.
    echo Please install Node.js from: https://nodejs.org
    echo.
    pause
    exit /b 1
)

cd /d "%~dp0"

echo Starting server on http://localhost:3000
echo.
echo Abhilasha will open automatically in your browser...
echo.
echo Press Ctrl+C to stop the server
echo ═══════════════════════════════════════════════════════════
echo.

node local-server.js

if %ERRORLEVEL% NEQ 0 (
    echo.
    echo [ERROR] Server stopped unexpectedly!
    pause
)
