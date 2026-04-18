---
gsd_state_version: 1.0
milestone: v1.0
milestone_name: milestone
status: executing
last_updated: "2026-04-18T04:49:02.411Z"
progress:
  total_phases: 2
  completed_phases: 0
  total_plans: 2
  completed_plans: 0
  percent: 0
---

# STATE — sontocodemo

**Project:** Containerize & Expose via zrok
**Initialized:** 2026-04-17

---

## Project Reference

**Core Value:** The app runs reliably in Docker and is reachable from the public internet via a zrok tunnel — no cloud deployment required.

**Current Focus:** Phase 01 — docker-containerization

**What We're Solving:**

- Existing app (accounts, statements, trades, admin portal, onboarding) has partial Docker setup
- Need to verify Dockerfile, configure docker-compose with MySQL and all env vars
- Need to ensure hybrid runtime: production webpack client served with dev backend (ts-node + nodemon + logging)
- Then expose via zrok (tunnel tool of choice)

---

## Current Position

Phase: 01 (docker-containerization) — EXECUTING
Plan: 1 of 2
**Phase:** 1 (Docker Containerization)
**Plan:** TBD
**Status:** Executing Phase 01
**Progress:** 0% (0 of 7 requirements mapped to completed phases)

---

## Performance Metrics

**Requirement Coverage:** 7/7 mapped

- Docker: DOCK-01, DOCK-02, DOCK-03
- zrok: ZROK-01, ZROK-02, ZROK-03, ZROK-04

**Phase Structure:** 2 phases (coarse granularity)

---

## Accumulated Context

### Key Decisions

| Decision | Rationale | Status |
|----------|-----------|--------|
| Hybrid prod-frontend / dev-backend | Production webpack reduces noise; dev backend keeps restart fast and logging rich | Pending implementation |
| zrok over ngrok | User's explicit choice | Pending implementation |
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
- Tunneling: zrok (not ngrok or Cloudflare Tunnel)
- Database: MySQL in Docker, same schema as existing ORM entities

### Blockers / TODOs

**Phase 1 - Docker:**

- [ ] Audit existing Dockerfile (check base, dependencies, ports)
- [ ] Review docker-compose.yml and docker-compose.dev.yml for MySQL wiring
- [ ] Document all required environment variables (DB_*, COOKIE_SECRET, SESSION_NAME, SITE_URL, EMAIL_*, etc.)
- [ ] Verify hybrid runtime (webpack prod build + ts-node dev backend)
- [ ] Test MySQL connection and session store
- [ ] Verify webpack prod build exists and is served

**Phase 2 - zrok:**

- [ ] Research zrok installation method (binary download vs package manager)
- [ ] Design account token management (where to store, when to read)
- [ ] Build user confirmation flow (prompt before share)
- [ ] Wire up zrok share command with port 8080
- [ ] Verify public URL is reachable and routes correctly

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
- User has zrok account or can create one quickly
- Host machine can run Docker containers (Linux, Mac, WSL2)

---

*State initialized: 2026-04-17*
