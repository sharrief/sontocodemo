---
gsd_state_version: 1.0
milestone: v1.0
milestone_name: milestone
status: executing
last_updated: "2026-04-18T17:47:06.814Z"
progress:
  total_phases: 2
  completed_phases: 1
  total_plans: 4
  completed_plans: 2
  percent: 50
---

# STATE — sontocodemo

**Project:** Containerize & Expose via Cloudflare Tunnel
**Initialized:** 2026-04-17

---

## Project Reference

**Core Value:** The app runs reliably in Docker and is reachable from the public internet via Cloudflare Tunnel at `https://sontocodemo.sharrief.com` — no cloud deployment required.

**Current Focus:** Phase 02 — zrok-public-access

**What We're Solving:**

- Existing app (accounts, statements, trades, admin portal, onboarding) has partial Docker setup
- Need to verify Dockerfile, configure docker-compose with MySQL and all env vars
- Need to ensure hybrid runtime: production webpack client served with dev backend (ts-node + nodemon + logging)
- Then expose via Cloudflare Tunnel (`cloudflared`) at `https://sontocodemo.sharrief.com`

---

## Current Position

Phase: 02 (zrok-public-access) — EXECUTING
Plan: 1 of 2
**Phase:** 2
**Plan:** Not started
**Status:** Executing Phase 02
**Progress:** 0% (0 of 7 requirements mapped to completed phases)

---

## Performance Metrics

**Requirement Coverage:** 7/7 mapped

- Docker: DOCK-01, DOCK-02, DOCK-03
- Cloudflare Tunnel: ZROK-01, ZROK-02, ZROK-03, ZROK-04

**Phase Structure:** 2 phases (coarse granularity)

---

## Accumulated Context

### Key Decisions

| Decision | Rationale | Status |
|----------|-----------|--------|
| Hybrid prod-frontend / dev-backend | Production webpack reduces noise; dev backend keeps restart fast and logging rich | Pending implementation |
| Cloudflare Tunnel over zrok/ngrok | Stable custom domain, valid TLS, free tier, domain already on Cloudflare DNS | Pending implementation |
| Keep existing Dockerfile base | Audit first, patch rather than rewrite | Pending audit |

### Architecture Notes

- Monorepo full-stack TypeScript (Express + React 16 + MySQL + TypeORM 0.2)
- Controllers via routing-controllers decorators, repositories for data access
- Client: 4 independent Webpack bundles (dashboard, login, password reset, application)
- Real-time: socket.io for statement generation, background cron for request notifications
- Auth: SHA-256 + TOTP 2FA already implemented
- Database: MySQL in Docker, SSL profile controlled by `DB_SERVER` env var (azure/digitalocean/dreamhost/localdreamhost)

### Stack Essentials

**Server:** Express, routing-controllers, socket.io, passport, TypeORM, nodemailer, winston, cron
**Client:** React 16, Redux, SWR, Material-UI, Bootstrap, @react-pdf/renderer
**Build:** Webpack 5, ts-node, nodemon
**Database:** MySQL, TypeORM 0.2
**Infrastructure:** Docker, Docker Compose

### Tech Constraints

- Must preserve existing Express/TypeORM/MySQL/React architecture (no rewrites)
- Runtime mode: Production client bundle + dev/debug server (ts-node, nodemon, winston debug)
- Tunneling: Cloudflare Tunnel (`cloudflared`) — systemd service on host, routes `sontocodemo.sharrief.com` → `localhost:8901` → Docker container port 8080
- Database: MySQL in Docker, same schema as existing ORM entities

### Blockers / TODOs

**Phase 1 - Docker:**

- [ ] Audit existing Dockerfile (check base, dependencies, ports)
- [ ] Review docker-compose.yml and docker-compose.dev.yml for MySQL wiring
- [ ] Document all required environment variables (DB_*, COOKIE_SECRET, SESSION_NAME, SITE_URL, EMAIL_*, etc.)
- [ ] Verify hybrid runtime (webpack prod build + ts-node dev backend)
- [ ] Test MySQL connection and session store
- [ ] Verify webpack prod build exists and is served

**Phase 2 - Cloudflare Tunnel:**

- [ ] Install `cloudflared` via Cloudflare apt repo on Debian host
- [ ] Register tunnel as systemd service via `cloudflared service install <token>`
- [ ] Update docker-compose port mapping to `8901:8080`
- [ ] Update `.env.example` SITE_URL to `https://sontocodemo.sharrief.com`
- [ ] Verify `https://sontocodemo.sharrief.com` is publicly reachable

---

## Session Continuity

**Last Updated:** 2026-04-17 (Roadmap created)

**Next Steps:**

1. Review ROADMAP.md and REQUIREMENTS.md traceability
2. Run `/gsd-plan-phase 1` to decompose Phase 1 into executable plans
3. Begin Docker audit and environment variable documentation

**Assumptions:**

- Existing Dockerfile and docker-compose files are mostly correct (audit to verify)
- User has Docker and Docker Compose installed
- User has a Cloudflare account with the tunnel token available from the Zero Trust dashboard
- Host machine can run Docker containers (Linux, Mac, WSL2)

---

### Quick Tasks Completed

| # | Description | Date | Commit | Directory |
|---|-------------|------|--------|-----------|
| 260418-g2n | Add a scheduled daily database re-seed job | 2026-04-18 | e9aa4e4 | [260418-g2n-add-a-scheduled-daily-database-re-seed-j](./quick/260418-g2n-add-a-scheduled-daily-database-re-seed-j/) |
| 260418-gmh | Fix security issues CR-01 CR-02 CR-03 CR-07: bcrypt passwords/PINs, remove backdoor, cookie flags | 2026-04-18 | 2160f11 | [260418-gmh-fix-security-issues-cr-01-cr-02-cr-03-cr](./quick/260418-gmh-fix-security-issues-cr-01-cr-02-cr-03-cr/) |

---

*State initialized: 2026-04-17*
*Last activity: 2026-04-18 - Completed quick task 260418-gmh: Fix security issues CR-01 CR-02 CR-03 CR-07*
