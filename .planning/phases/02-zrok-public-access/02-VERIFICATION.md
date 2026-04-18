---
status: gaps_found
phase: 02-zrok-public-access
verified: 2026-04-18
score: 4/5
---

# Verification — Phase 02: Cloudflare Tunnel Public Access

## Must-Haves

| Truth | Status | Evidence |
|-------|--------|----------|
| docker-compose.yml exposes host port 8901 | ✓ PASS | `grep '"8901:8080"' docker-compose.yml` matches line 12 |
| .env.example documents SITE_URL as public domain | ✓ PASS | `SITE_URL=https://sontocodemo.sharrief.com` present |
| cloudflared binary installed | ✓ PASS | v2026.3.0 at /usr/bin/cloudflared |
| cloudflared systemd service running and enabled | ✓ PASS | active (running), enabled on boot |
| App reachable at https://sontocodemo.sharrief.com | ✓ PASS | Confirmed by user in browser |
| Tunnel token NOT in any repo file | ✓ PASS | No token found in repository |
| Container SITE_URL = public domain | ✓ PASS | docker compose exec web printenv SITE_URL confirmed |

## Gaps

### GAP-01: MySQL password exposed in healthcheck (CR-01)
- **Severity:** Critical (security)
- **File:** docker-compose.yml line 43
- **Detail:** MySQL healthcheck passes `${DB_PASSWORD}` as a CLI argument, visible in `docker inspect`, logs, and process listings
- **Note:** This pre-existed Phase 2 — our changes did not introduce it
- **Fix:** `/gsd-code-review-fix 2` or manually use `MYSQL_PWD` env var in healthcheck

## Phase Goal

Functionally achieved: app is publicly reachable via Cloudflare Tunnel at `https://sontocodemo.sharrief.com`. The gap is a pre-existing security issue in docker-compose.yml unrelated to tunnel wiring.
