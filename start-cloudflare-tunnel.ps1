$ErrorActionPreference = 'Stop'
$port = if ($env:PORT) { $env:PORT } else { '8080' }

$cloudflared = Get-Command cloudflared -ErrorAction SilentlyContinue
if (-not $cloudflared) {
  Write-Host "cloudflared is not installed."
  Write-Host "Install Cloudflare Tunnel first, then run this script again."
  Write-Host "After install it will expose: http://localhost:$port/"
  exit 1
}

Write-Host "Starting public Cloudflare tunnel for http://localhost:$port/"
Write-Host "Keep the phone server running in another terminal."
cloudflared tunnel --url "http://localhost:$port/"

