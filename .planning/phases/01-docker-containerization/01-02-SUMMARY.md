---
phase: 01-docker-containerization
plan: "02"
subsystem: docker
tags: [docker-compose, mysql, healthcheck, depends_on, volumes]
dependency_graph:
  requires: [01-01]
  provides: [docker-compose.yml, Dockerfile.database]
  affects: [docker-build, docker-compose-up]
tech_stack:
  added: [mysql:8]
  patterns: [healthcheck with mysqladmin ping, depends_on condition service_healthy, named build volume to preserve webpack artifacts]
key_files:
  created: []
  modified:
    - Dockerfile.database
    - docker-compose.yml
decisions:
  - "MySQL 8 replaces MariaDB for schema compatibility with TypeORM entities (JSON handling, window functions)"
  - "DB_SERVER=localdreamhost set as explicit environment override on web service — wins over env_file, prevents accidental SSL against local MySQL"
  - "Named build volume preserves in-container webpack prod bundle against host volume mount overlay"
  - "No command override on web service — Dockerfile CMD npm run dev:server is correct"
  - "restart: unless-stopped on web service added to match db service behavior"
metrics:
  duration: "2m"
  completed_date: "2026-04-18"
  tasks_completed: 2
  files_changed: 2
---

# Phase 01 Plan 02: Docker Compose and Database Container Summary

**One-liner:** MySQL 8 Dockerfile.database with healthcheck-gated docker-compose.yml wiring DB_SERVER=localdreamhost SSL bypass and named build volume for webpack artifacts.

## Tasks Completed

| Task | Name | Commit | Files |
|------|------|--------|-------|
| 1 | Replace Dockerfile.database with MySQL 8 | 236bf6f | Dockerfile.database |
| 2 | Fix docker-compose.yml — healthcheck, depends_on, env vars, named volumes | 749ba89 | docker-compose.yml |

## What Was Built

### Dockerfile.database

Single-line replacement: `FROM mariadb:latest` -> `FROM mysql:8`.

MySQL 8 is required for compatibility with the TypeORM entities. MariaDB diverges from MySQL 8 in JSON column handling, window functions, and other areas. The MySQL 8 official image's entrypoint handles initialization via environment variables (MYSQL_ROOT_PASSWORD, MYSQL_DATABASE, MYSQL_USER, MYSQL_PASSWORD) and the /docker-entrypoint-initdb.d/ volume mount for seed SQL.

### docker-compose.yml

Five specific changes applied to the existing compose file:

1. **Healthcheck on db service**: `mysqladmin ping -h localhost -u ${DB_USER} --password=${DB_PASSWORD}` with `interval: 10s`, `timeout: 5s`, `retries: 5`, `start_period: 30s`. The 30s start_period gives MySQL time to initialize its data directory on first launch before the health probes begin counting failures.

2. **depends_on with condition: service_healthy on web service**: The app container will not start until MySQL successfully responds to mysqladmin ping. This eliminates TypeORM connection race conditions at startup (T-02-04 threat mitigation).

3. **Explicit DB_SERVER=localdreamhost environment override on web service**: Docker Compose merges `environment:` entries on top of `env_file:` entries — the explicit value always wins. This ensures `src/server/lib/db.ts` never activates the Azure or DigitalOcean SSL cert paths when running locally (T-02-06 threat mitigation).

4. **Named build volume**: Added `build:/home/node/app/build` to the web service volumes and `build:` to the top-level volumes section. Without this, the source volume mount (`.:/home/node/app`) would overlay the container's webpack prod output (built via `RUN npm run build` during `docker build`) with the host's empty or stale `build/` directory. The named volume preserves the in-container build artifacts so static files are served correctly.

5. **restart: unless-stopped on web service**: Added to match the existing db service behavior. Both containers auto-restart after unexpected crashes during local development.

No `command:` override was added to either service. The Dockerfile CMD (`npm run dev:server`) runs nodemon for the hybrid runtime mode. The MySQL 8 image uses its default entrypoint.

## Deviations from Plan

None - plan executed exactly as written.

## Threat Surface Scan

No new security-relevant surface introduced. Changes directly mitigate two STRIDE threats:
- T-02-04: healthcheck + depends_on prevents app from connecting before MySQL is ready
- T-02-06: explicit DB_SERVER=localdreamhost environment override prevents accidental SSL cert mismatch

## Known Stubs

None. Both files are complete configurations — no placeholder values or stub patterns.

## Self-Check: PASSED

- Dockerfile.database: `FROM mysql:8` confirmed (cat output)
- docker-compose.yml: all grep acceptance criteria satisfied — condition: service_healthy, DB_SERVER=localdreamhost, build:/home/node/app/build, restart: unless-stopped, node_modules:/home/node/app/node_modules
- Task 1 commit 236bf6f present in git log
- Task 2 commit 749ba89 present in git log
