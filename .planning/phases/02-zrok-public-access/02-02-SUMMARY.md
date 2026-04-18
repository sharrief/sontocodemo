---
phase: 02-zrok-public-access
plan: "02"
subsystem: infrastructure/tunnel
tags: [cloudflared, cloudflare-tunnel, systemd, public-access]
key-files:
  created: []
  modified: []
  host-side:
    - /usr/bin/cloudflared
    - /etc/systemd/system/cloudflared.service
    - /etc/apt/sources.list.d/cloudflared.list
metrics:
  tasks_completed: 4
  tasks_total: 4
  deviations: 0
---

# SUMMARY — Plan 02-02: cloudflared Install & Tunnel Registration

## What Was Built

Cloudflare Tunnel (`cloudflared`) installed and registered as a persistent systemd service on the host machine. The app at `https://sontocodemo.sharrief.com` is now publicly reachable through the tunnel, routing Cloudflare edge → `localhost:8901` → Docker web container port 8080.

## Commits

No repository commits — all tasks were host-side operations.

| Task | Action | Result |
|------|--------|--------|
| T1 | Install cloudflared via apt | cloudflared 2026.3.0 installed at /usr/bin/cloudflared |
| T2 | Register systemd service with tunnel token | cloudflared.service active (running), enabled on boot |
| T3 | Start containers, verify local + public URL | localhost:8901 and https://sontocodemo.sharrief.com both return 2xx/3xx |
| T4 | Update local .env SITE_URL, force-recreate web container | Container reports SITE_URL=https://sontocodemo.sharrief.com |

## Deviations

- **docker compose restart vs force-recreate:** `docker compose restart web` does not re-read `.env`, so the container retained the old SITE_URL. Fixed with `docker compose up -d --force-recreate web`.

## Self-Check: PASSED

- `cloudflared --version` → 2026.3.0 ✓
- `systemctl is-active cloudflared` → active ✓
- `systemctl is-enabled cloudflared` → enabled ✓
- `https://sontocodemo.sharrief.com` → reachable in browser ✓
- `docker compose exec web printenv SITE_URL` → https://sontocodemo.sharrief.com ✓
- Tunnel token not stored in any repo file ✓
