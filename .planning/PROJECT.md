# sontocodemo — Containerize & Expose via zrok

## What This Is

A financial account management platform (accounts, statements, trades, transfers, admin portal, applicant onboarding) that currently runs locally. This initiative containerizes the existing application with Docker and exposes it to the internet using zrok, so it can be reached from a stable public URL.

## Core Value

The app runs reliably in Docker and is reachable from the public internet via a zrok tunnel — no cloud deployment required.

## Requirements

### Validated

- ✓ User authentication (SHA-256 + TOTP 2FA) — existing
- ✓ Account management and statement generation — existing
- ✓ Trade tracking and logging — existing
- ✓ Fund transfer requests with email notifications — existing
- ✓ Admin portal (accounts, trades, portfolio, transfers) — existing
- ✓ Account applicant onboarding flow — existing
- ✓ Real-time statement population via socket.io — existing
- ✓ Background request-watcher cron job — existing
- ✓ MySQL + TypeORM data layer — existing
- ✓ Partial Docker setup (Dockerfile, docker-compose files present) — existing

### Active

- [ ] Docker build verified and working end-to-end
- [ ] Hybrid runtime: production webpack bundle served by dev backend (ts-node + nodemon + winston debug logging)
- [ ] MySQL container configured and connected (env vars, SSL profile, session store)
- [ ] All required environment variables documented and wired into docker-compose
- [ ] zrok installed, enabled, and sharing the container port publicly
- [ ] Public zrok URL routes traffic correctly to the running app

### Out of Scope

- Cloud/PaaS deployment (ECS, K8s, Fly.io, etc.) — zrok tunnel covers public exposure
- Production hardening (SSL termination at origin, load balancing) — zrok handles TLS
- CI/CD pipeline — manual Docker workflow for now

## Context

- Existing Docker files (Dockerfile, docker-compose.yml, docker-compose.dev.yml) are present but have not been verified recently — need audit and possibly repair
- Stack: TypeScript, Express + routing-controllers, React 16, MySQL, TypeORM 0.2, socket.io 4, passport, nodemailer
- zrok: OpenZiti-based tunneling tool; needs install → enable (account token) → share (port)
- Hybrid mode rationale: production webpack build avoids HMR overhead while ts-node/nodemon keeps the backend fast to restart and logging verbose for debugging
- DB SSL cert profile controlled by `DB_SERVER` env var (azure / digitalocean / dreamhost / localdreamhost)

## Constraints

- **Tech stack**: Must preserve existing Express/TypeORM/MySQL/React architecture — no rewrites
- **Runtime mode**: Production client bundle + dev/debug server (ts-node, nodemon, winston debug)
- **Tunneling**: zrok (not ngrok or Cloudflare Tunnel) — starting from scratch install
- **Database**: MySQL in Docker, same schema as existing ORM entities

## Key Decisions

| Decision | Rationale | Outcome |
|----------|-----------|---------|
| Hybrid prod-frontend / dev-backend mode | Production webpack reduces noise; dev backend keeps restart fast and logging rich | — Pending |
| zrok over ngrok | User's explicit choice | — Pending |
| Keep existing Dockerfile base | Audit first, patch rather than rewrite if possible | — Pending |

---
*Last updated: 2026-04-17 after initialization*

## Evolution

This document evolves at phase transitions and milestone boundaries.

**After each phase transition** (via `/gsd-transition`):
1. Requirements invalidated? → Move to Out of Scope with reason
2. Requirements validated? → Move to Validated with phase reference
3. New requirements emerged? → Add to Active
4. Decisions to log? → Add to Key Decisions
5. "What This Is" still accurate? → Update if drifted

**After each milestone** (via `/gsd-complete-milestone`):
1. Full review of all sections
2. Core Value check — still the right priority?
3. Audit Out of Scope — reasons still valid?
4. Update Context with current state
