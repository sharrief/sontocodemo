# Phase 2: zrok Public Access - Discussion Log

> **Audit trail only.** Do not use as input to planning, research, or execution agents.
> Decisions are captured in CONTEXT.md — this log preserves the alternatives considered.

**Date:** 2026-04-18
**Phase:** 02-zrok-public-access
**Areas discussed:** Tool selection, installation method, tunnel mode, subdomain, SITE_URL

---

## Tool Selection

| Option | Description | Selected |
|--------|-------------|----------|
| zrok.io hosted | Free, ephemeral random URLs, no custom domain on free tier | |
| Self-hosted zrok | Custom domain possible but requires a VPS to run the controller | |
| Cloudflare Tunnel | Free, custom domain, valid TLS, stable URL, requires domain on Cloudflare DNS | ✓ |
| ngrok Personal | Custom domain via CNAME at Dreamhost (no nameserver migration), ~$8/mo | |

**User's choice:** Cloudflare Tunnel
**Notes:** User initially had domain at Dreamhost with email services. Confirmed Cloudflare Tunnel requires full nameserver migration (partial/CNAME setup is a paid feature). User migrated sharrief.com to Cloudflare DNS. Email stays at Dreamhost servers — only DNS records moved. ngrok was offered as an alternative to avoid migration but user preferred the free option.

---

## Subdomain

| Option | Description | Selected |
|--------|-------------|----------|
| sontocodemo.sharrief.com | Matches demo URL in README.md, already proxied in Cloudflare | ✓ |
| demo.sharrief.com | Shorter, more generic | |

**User's choice:** sontocodemo.sharrief.com

---

## Tunnel Mode

| Option | Description | Selected |
|--------|-------------|----------|
| System service (systemd) | Starts on boot via `cloudflared service install`, always on | ✓ |
| Manual start | Run `cloudflared tunnel run` manually when needed | |

**User's choice:** System service

---

## SITE_URL

| Option | Description | Selected |
|--------|-------------|----------|
| Update to tunnel domain | Set SITE_URL=https://sontocodemo.sharrief.com in .env.example | ✓ |
| Leave as localhost | Keep http://localhost:8080, email links broken | |

**User's choice:** Update SITE_URL

---

## Claude's Discretion

- Config file location for cloudflared — use defaults from `service install`
- Verification step (curl check) — include in plan

## Deferred Ideas

- Cloudflare Access authentication layer in front of the app
- cloudflared as docker-compose sidecar
- Automated tunnel health monitoring
