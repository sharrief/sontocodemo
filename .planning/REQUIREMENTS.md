# Requirements

**Project:** sontocodemo — Containerize & Expose via Cloudflare Tunnel
**Version:** v1
**Generated:** 2026-04-17

---

## v1 Requirements

### Docker

- [ ] **DOCK-01**: Existing Dockerfile is audited and builds successfully
- [ ] **DOCK-02**: docker-compose setup wires app container + MySQL container with all required environment variables documented and configured
- [ ] **DOCK-03**: Hybrid runtime configured — production webpack client bundle served alongside ts-node dev backend with nodemon restart and winston debug logging

### Cloudflare Tunnel

- [ ] **ZROK-01**: `cloudflared` binary installed on the host machine (via Cloudflare apt repository)
- [ ] **ZROK-02**: Tunnel registered and started as a systemd service via `cloudflared service install <token>`
- [ ] **ZROK-03**: User confirms intent by running `cloudflared service install` (the install command is the confirmation gate — no runtime prompt required)
- [ ] **ZROK-04**: `https://sontocodemo.sharrief.com` is publicly reachable and routes through the tunnel to the Docker container (host port 8901 → container port 8080)

---

## v2 (Deferred)

- Automated tunnel health monitoring (verify tunnel is up and alert if it drops) — v2 scope
- Cloudflare Access policies (auth layer at the edge) — separate phase if needed
- Environment-specific docker-compose overrides (staging, prod)
- Health check endpoints for Docker HEALTHCHECK directive

---

## Out of Scope

- Cloud/PaaS deployment (ECS, K8s, Fly.io) — Cloudflare Tunnel covers public exposure
- Production SSL termination at origin — Cloudflare handles TLS
- CI/CD pipeline — manual Docker workflow for now
- zrok, ngrok, or other tunnel tools — Cloudflare Tunnel is the explicit choice

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
