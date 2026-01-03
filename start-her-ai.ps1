# Her AI - Local Server Launcher
# Double-click or run this script to start Her AI

$Host.UI.RawUI.WindowTitle = "Her AI - Local Server"
Write-Host ""
Write-Host "═══════════════════════════════════════════════════════════" -ForegroundColor Magenta
Write-Host "  🌸 Starting Her AI Local Server..." -ForegroundColor Magenta
Write-Host "═══════════════════════════════════════════════════════════" -ForegroundColor Magenta
Write-Host ""

# Check if Node.js is installed
try {
    $nodeVersion = node --version
    Write-Host "  ✓ Node.js: $nodeVersion" -ForegroundColor Green
} catch {
    Write-Host "  ✗ Node.js is not installed!" -ForegroundColor Red
    Write-Host ""
    Write-Host "  Please install Node.js from: https://nodejs.org" -ForegroundColor Yellow
    Write-Host ""
    Read-Host "Press Enter to exit"
    exit 1
}

# Navigate to script directory
$scriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
Set-Location $scriptDir

Write-Host ""
Write-Host "  Starting server on http://localhost:3000" -ForegroundColor Cyan
Write-Host "  Her AI will open automatically in your browser..." -ForegroundColor Cyan
Write-Host ""
Write-Host "  Press Ctrl+C to stop the server" -ForegroundColor DarkGray
Write-Host "═══════════════════════════════════════════════════════════" -ForegroundColor Magenta
Write-Host ""

# Start the local server
node local-server.js

# If server exits unexpectedly
if ($LASTEXITCODE -ne 0) {
    Write-Host ""
    Write-Host "[ERROR] Server stopped unexpectedly!" -ForegroundColor Red
    Read-Host "Press Enter to exit"
}
