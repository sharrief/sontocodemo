---
phase: "02"
plan: "01"
subsystem: infrastructure
tags: [docker, cloudflare-tunnel, port-mapping, env-config]
dependency_graph:
  requires: []
  provides: [docker-port-8901, site-url-tunnel-domain]
  affects: [docker-compose.yml, .env.example]
tech_stack:
  added: []
  patterns: [port-mapping-host-container, env-example-documentation]
key_files:
  created: []
  modified:
    - docker-compose.yml
    - .env.example
decisions:
  - "Port mapping set to 8901:8080 (D-05): Cloudflare Tunnel routes to host:8901 which maps to container:8080"
  - "SITE_URL set to https://sontocodemo.sharrief.com (D-06): canonical public tunnel domain for email links and redirects"
  - "No tunnel token committed to repo (T-02-01): token passed interactively at cloudflared service install time"
metrics:
  duration_minutes: 3
  completed_date: "2026-04-18"
  tasks_completed: 2
  tasks_total: 2
  files_modified: 2
  files_created: 0
requirements:
  - ZROK-04
  - ZROK-01
---

# Phase 02 Plan 01: Cloudflare Tunnel Port and SITE_URL Wiring Summary

**One-liner:** Docker web service remapped to host port 8901 and SITE_URL updated to `https://sontocodemo.sharrief.com` to wire Cloudflare Tunnel traffic through to the app container.

---

## What Was Built

Two targeted configuration changes that connect the Cloudflare Tunnel routing chain to the Docker container:

1. **`docker-compose.yml`** — Changed web service port binding from `"8080:8080"` to `"8901:8080"`. The Cloudflare Tunnel on the host routes `sontocodemo.sharrief.com` → `localhost:8901`. Docker now maps that host port to the container's internal port 8080 where the Express app listens.

2. **`.env.example`** — Updated `SITE_URL` from `http://localhost:8080` to `https://sontocodemo.sharrief.com`. Added an instruction comment reminding developers to update their local `.env` so email links and self-referential redirects resolve correctly through the tunnel.

---

## Tasks Completed

| Task | Name | Commit | Files |
|------|------|--------|-------|
| 1 | Update docker-compose.yml web service port mapping to 8901:8080 | d6f9797 | docker-compose.yml |
| 2 | Update .env.example SITE_URL to public Cloudflare Tunnel domain | c5eeea5 | .env.example |

---

## Verification Results

- `grep '"8901:8080"' docker-compose.yml` → line 12 match (PASS)
- `grep '"8080:8080"' docker-compose.yml` → no output (PASS)
- `grep 'SITE_URL=https://sontocodemo.sharrief.com' .env.example` → line 10 match (PASS)
- DB_SERVER inline comment block preserved in docker-compose.yml (PASS)
- `service_healthy` depends_on condition preserved (PASS)
- `SITE_NAME=Sontoco Holdings` preserved in .env.example (PASS)
- Instruction comment present in .env.example (PASS)
- No tunnel token or cloudflared credential in any file (PASS)

---

## Decisions Made

| Decision | Rationale |
|----------|-----------|
| Port 8901 as tunnel entry point | Cloudflare Tunnel configured on host to route to localhost:8901; maps to container:8080 (D-05) |
| SITE_URL = https://sontocodemo.sharrief.com | Canonical public domain for email links and redirects; must match Cloudflare DNS config (D-06) |
| No token in repo files | Tunnel token is a runtime secret passed once to `cloudflared service install`; never persists in files (T-02-01) |

---

## Deviations from Plan

None — plan executed exactly as written. Both file edits are precise single-line changes with surrounding content fully preserved.

---

## Known Stubs

None. These are configuration changes only; no UI components or data-fetching stubs introduced.

---

## Threat Flags

No new security surface introduced beyond what the plan's threat model covers. Port 8901 binding and SITE_URL update were both anticipated and addressed in the plan's STRIDE register (T-02-01, T-02-02, T-02-03).

---

## Self-Check: PASSED

- docker-compose.yml modified: FOUND at `/home/sharrief/repos/sontocodemo/.claude/worktrees/agent-a8b8a824/docker-compose.yml`
- .env.example modified: FOUND at `/home/sharrief/repos/sontocodemo/.claude/worktrees/agent-a8b8a824/.env.example`
- Task 1 commit d6f9797: FOUND in git log
- Task 2 commit c5eeea5: FOUND in git log
