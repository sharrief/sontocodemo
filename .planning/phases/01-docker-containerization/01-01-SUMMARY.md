---
phase: 01-docker-containerization
plan: "01"
subsystem: docker
tags: [dockerfile, docker, env, configuration]
dependency_graph:
  requires: []
  provides: [Dockerfile, .env.example, .dockerignore]
  affects: [docker-compose.yml, docker-compose.dev.yml]
tech_stack:
  added: []
  patterns: [node:20-alpine base image, ENV NODE_ENV=development for devDependency install, nodemon hybrid runtime]
key_files:
  created:
    - .env.example
  modified:
    - Dockerfile
    - .dockerignore
decisions:
  - "Pin base image to node:20-alpine (LTS, reproducible, small) instead of node:current"
  - "Set ENV NODE_ENV=development in Dockerfile so npm install includes devDependencies (nodemon, ts-node)"
  - "CMD uses npm run dev:server (nodemon) for hybrid runtime — production webpack client + dev backend with auto-restart"
  - "DB_HOST=db in .env.example points to Docker service name, not localhost"
  - "DB_SERVER=localdreamhost in .env.example disables SSL for local Docker MySQL"
metrics:
  duration: "1m"
  completed_date: "2026-04-18"
  tasks_completed: 2
  files_changed: 3
---

# Phase 01 Plan 01: Dockerfile Audit and .env.example Summary

**One-liner:** Pinned Dockerfile to node:20-alpine with nodemon hybrid CMD and documented all 24 env vars from env.ts in .env.example.

## Tasks Completed

| Task | Name | Commit | Files |
|------|------|--------|-------|
| 1 | Fix Dockerfile — pin base image and set hybrid runtime CMD | 6d98b6e | Dockerfile |
| 2 | Audit .dockerignore and create .env.example | 9d8e95a | .dockerignore, .env.example |

## What Was Built

### Dockerfile

Fixed three issues in the existing Dockerfile:

1. **Base image**: `FROM node:current` -> `FROM node:20-alpine`. Node 20 is LTS; alpine keeps the image small; pinning ensures reproducible builds across environments.

2. **devDependency install**: Added `ENV NODE_ENV=development` after the FROM line. This ensures `npm install --legacy-peer-deps` includes devDependencies (nodemon, ts-node, typescript, etc.) which are needed at runtime in the hybrid dev-server mode.

3. **CMD**: `npm run start` (bare ts-node, no restart) -> `npm run dev:server` (nodemon per nodemon.json: wraps ts-node with watch on `src/server` and `shared` directories). This is the required hybrid runtime: production webpack client bundle + dev backend with file-watching and auto-restart.

### .dockerignore

Added three new exclusions to prevent secrets and pre-built artifacts from entering the image build context:

- `build/` — local webpack output; the Dockerfile rebuilds from source
- `.env*` — prevents any local .env files from being baked into image layers (T-01-01 threat mitigation)
- `lancedb/` — experimental vector DB directory not needed in container

### .env.example

Created `.env.example` at project root documenting all 24 environment variables from `src/server/lib/env.ts` plus `DB_ROOT_PASSWORD` (used by docker-compose MySQL container). Organized into groups: Runtime, Site, Session, Database, Email, Feature Flags, Observability, Client Build, Docker Compose.

Key values for local Docker development:
- `DB_SERVER=localdreamhost` — disables SSL for local MySQL container
- `DB_HOST=db` — Docker service name, not localhost

## Deviations from Plan

None - plan executed exactly as written.

## Threat Surface Scan

No new security-relevant surface introduced. The `.env*` exclusion in `.dockerignore` directly mitigates threat T-01-01 (secrets baked into image layers). `.env.example` contains only placeholder values (T-01-02: accepted, safe to commit).

## Self-Check

Verified files exist and commits are present.
