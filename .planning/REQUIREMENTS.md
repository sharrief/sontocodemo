# Requirements

**Project:** sontocodemo — Containerize & Expose via zrok
**Version:** v1
**Generated:** 2026-04-17

---

## v1 Requirements

### Docker

- [ ] **DOCK-01**: Existing Dockerfile is audited and builds successfully
- [ ] **DOCK-02**: docker-compose setup wires app container + MySQL container with all required environment variables documented and configured
- [ ] **DOCK-03**: Hybrid runtime configured — production webpack client bundle served alongside ts-node dev backend with nodemon restart and winston debug logging

### zrok

- [ ] **ZROK-01**: zrok binary installed on the host machine
- [ ] **ZROK-02**: zrok enabled with a valid account token
- [ ] **ZROK-03**: User is prompted to confirm before zrok share is executed
- [ ] **ZROK-04**: zrok share running and exposing the app's container port publicly with a reachable URL

---

## v2 (Deferred)

- Automated zrok share startup (systemd unit or compose sidecar) — manual for now
- Environment-specific docker-compose overrides (staging, prod)
- Health check endpoints for Docker HEALTHCHECK directive

---

## Out of Scope

- Cloud/PaaS deployment (ECS, K8s, Fly.io) — zrok tunnel covers public exposure
- Production SSL termination at origin — zrok handles TLS
- CI/CD pipeline — manual Docker workflow for now
- ngrok or other tunnel tools — zrok is the explicit choice

---

## Traceability

| REQ-ID  | Phase | Status |
|---------|-------|--------|
| DOCK-01 | 1     | Pending |
| DOCK-02 | 1     | Pending |
| DOCK-03 | 1     | Pending |
| ZROK-01 | 2     | Pending |
| ZROK-02 | 2     | Pending |
| ZROK-03 | 2     | Pending |
| ZROK-04 | 2     | Pending |
