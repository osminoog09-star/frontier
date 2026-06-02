$ErrorActionPreference = 'Stop'
$root = Split-Path -Parent $MyInvocation.MyCommand.Path
$port = if ($env:PORT) { $env:PORT } else { '8080' }
Set-Location $root

Write-Host "Starting FRONTIER phone server on port $port..."
Write-Host "Open on this PC: http://localhost:$port/"
Write-Host "Open on phone on same Wi-Fi: use one of the IPv4 addresses printed by server.js."
Write-Host ""

$env:PORT = $port
node .\server.js

