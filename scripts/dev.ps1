# Run the dev environment (server + client) on Windows.
# Usage: scripts\dev.ps1
$ErrorActionPreference = "Stop"
Push-Location (Join-Path $PSScriptRoot "..")
try {
    npm run dev
} finally {
    Pop-Location
}
