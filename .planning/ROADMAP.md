# ROADMAP — sontocodemo

**Project:** Containerize & Expose via zrok
**Version:** v1
**Created:** 2026-04-17
**Granularity:** coarse

---

## Phases

- [ ] **Phase 1: Docker Containerization** - Audit Dockerfile, wire docker-compose with MySQL and env vars, verify hybrid runtime
- [ ] **Phase 2: Cloudflare Tunnel Public Access** - Update docker-compose port mapping, update SITE_URL, install cloudflared via apt, register as systemd service, verify public URL

---

## Phase Details

### Phase 1: Docker Containerization

**Goal:** App runs reliably in Docker with production webpack client and dev backend, MySQL is configured and connected, all environment variables are documented and wired.

**Depends on:** Nothing (first phase)

**Requirements:** DOCK-01, DOCK-02, DOCK-03

**Success Criteria** (what must be TRUE):
1. Existing Dockerfile audited, builds successfully without errors
2. docker-compose.yml configures app container and MySQL container with all required environment variables
3. App container boots ts-node dev backend with nodemon restart and winston debug logging
4. Production webpack client bundle is served alongside the backend (hybrid mode working)
5. MySQL container is healthy and app can connect using configured credentials and SSL profile

**Plans:** 2 plans

Plans:
- [x] 01-01-PLAN.md — Fix Dockerfile (node:20-alpine, nodemon CMD), audit .dockerignore, create .env.example
- [x] 01-02-PLAN.md — Fix docker-compose.yml (MySQL 8, healthcheck, depends_on, DB_SERVER, named build volume)

---

### Phase 2: Cloudflare Tunnel Public Access

**Goal:** App is exposed to the public internet via Cloudflare Tunnel at https://sontocodemo.sharrief.com, with the tunnel running as a persistent systemd service on the host.

**Note:** Phase originally named "zrok Public Access" — tool decision changed to Cloudflare Tunnel per D-01. ZROK-01 through ZROK-04 requirements are satisfied by Cloudflare Tunnel equivalents.

**Depends on:** Phase 1

**Requirements:** ZROK-01, ZROK-02, ZROK-03, ZROK-04

**Success Criteria** (what must be TRUE):
1. docker-compose.yml exposes host port 8901 (Cloudflare Tunnel backend) mapped to container port 8080
2. .env.example SITE_URL updated to https://sontocodemo.sharrief.com
3. cloudflared binary installed on host via Cloudflare official apt repository
4. cloudflared registered as a systemd service using the tunnel token (service starts on boot)
5. User can reach the app from the public internet at https://sontocodemo.sharrief.com

**Plans:** 2 plans

Plans:
- [x] 02-01-PLAN.md — Update docker-compose.yml port mapping (8901:8080) and .env.example SITE_URL
- [ ] 02-02-PLAN.md — Install cloudflared via apt, register systemd service, verify public URL end-to-end

---

## Progress

| Phase | Plans Complete | Status | Completed |
|-------|----------------|--------|-----------|
| 1. Docker Containerization | 2/2 | Complete | 2026-04-18 |
| 2. Cloudflare Tunnel Public Access | 0/2 | Not started | — |

---

*Roadmap created: 2026-04-17*
