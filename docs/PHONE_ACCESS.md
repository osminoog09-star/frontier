# FRONTIER phone access

## Same Wi-Fi

1. Run `start-phone-server.ps1`.
2. Open `http://localhost:8080/` on this PC.
3. Open the LAN URL printed by the server on the phone, for example `http://192.168.68.115:8080/`.

The phone and PC must be on the same Wi-Fi/LAN. If Windows Firewall asks, allow private network access for Node.js.

## Internet access

For true internet access from mobile data or another network, use a tunnel.

Prepared script: `start-cloudflare-tunnel.ps1`.

It requires `cloudflared` to be installed on Windows. When installed:

1. Run `start-phone-server.ps1`.
2. In another terminal run `start-cloudflare-tunnel.ps1`.
3. Open the `https://...trycloudflare.com` URL on the phone.

## Smoke checks

- Local health: `http://localhost:8080/health`
- Game: `http://localhost:8080/`
- Main file stays `frontier.html`; the server only changes how it is served.

