# ROADMAP — sontocodemo

**Project:** Containerize & Expose via zrok
**Version:** v1
**Created:** 2026-04-17
**Granularity:** coarse

---

## Phases

- [ ] **Phase 1: Docker Containerization** - Audit Dockerfile, wire docker-compose with MySQL and env vars, verify hybrid runtime
- [ ] **Phase 2: zrok Public Access** - Install zrok, enable account, configure share with user confirmation, expose app to public URL

---

## Phase Details

### Phase 1: Docker Containerization

**Goal:** App runs reliably in Docker with production webpack client and dev backend, MySQL is configured and connected, all environment variables are documented and wired.

**Depends on:** Nothing (first phase)

**Requirements:** DOCK-01, DOCK-02, DOCK-03

**Success Criteria** (what must be TRUE):
1. Existing Dockerfile audited, builds successfully without errors
2. docker-compose.yml and docker-compose.dev.yml configure app container and MySQL container with all required environment variables
3. App container boots ts-node dev backend with nodemon restart and winston debug logging
4. Production webpack client bundle is served alongside the backend (hybrid mode working)
5. MySQL container is healthy and app can connect using configured credentials and SSL profile

**Plans:** TBD

---

### Phase 2: zrok Public Access

**Goal:** App is exposed to the public internet via a stable zrok tunnel, with user control over share lifecycle.

**Depends on:** Phase 1

**Requirements:** ZROK-01, ZROK-02, ZROK-03, ZROK-04

**Success Criteria** (what must be TRUE):
1. zrok binary is installed and available on the host machine
2. zrok is enabled with a valid account token (saved or persistent)
3. User is prompted to confirm zrok share execution before it runs
4. Public zrok URL is generated and routes traffic to the app container port (8080)
5. User can reach the app from the public internet via the zrok URL

**Plans:** TBD

---

## Progress

| Phase | Plans Complete | Status | Completed |
|-------|----------------|--------|-----------|
| 1. Docker Containerization | 0/? | Not started | — |
| 2. zrok Public Access | 0/? | Not started | — |

---

*Roadmap created: 2026-04-17*
