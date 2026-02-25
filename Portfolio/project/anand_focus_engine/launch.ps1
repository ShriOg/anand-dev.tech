#!/usr/bin/env python3
<#
.SYNOPSIS
    Anand Focus Engine™ - God Mode Launcher (PowerShell)
    
.DESCRIPTION
    Windows 10/11 64-bit focus lockdown system launcher
    
.NOTES
    Requires Python 3.14 (64-bit)
#>

param(
    [ValidateSet("interactive", "daemon")]
    [string]$Mode = "interactive"
)

$scriptDir = Split-Path -Parent -Path $MyInvocation.MyCommand.Definition
Push-Location $scriptDir

Write-Host "`n========================================" -ForegroundColor Cyan
Write-Host "  🌟 ANAND FOCUS ENGINE™ - GOD MODE" -ForegroundColor Cyan
Write-Host "========================================`n" -ForegroundColor Cyan

if (-not (Test-Path "main.py")) {
    Write-Host "❌ ERROR: main.py not found" -ForegroundColor Red
    Write-Host "Expected: $scriptDir\main.py" -ForegroundColor Red
    exit 1
}

if (-not (Test-Path "config.json")) {
    Write-Host "❌ ERROR: config.json not found" -ForegroundColor Red
    exit 1
}

if (-not (Test-Path "stats.json")) {
    Write-Host "❌ ERROR: stats.json not found" -ForegroundColor Red
    exit 1
}

Write-Host "✅ All files verified.`n" -ForegroundColor Green
Write-Host "Starting Focus Engine ($Mode mode)...`n"

if ($Mode -eq "daemon") {
    python main.py --daemon
} else {
    python main.py
}

Pop-Location
