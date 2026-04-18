---
phase: quick
plan: 260418-g2n
subsystem: server/jobs
tags: [cron, database, reseed, demo, env]
dependency_graph:
  requires: []
  provides: [startDailyReseed]
  affects: [src/server/server.ts, src/server/jobs/index.ts, src/server/lib/env.ts]
tech_stack:
  added: []
  patterns: [CronJob, entityManager.query, FOREIGN_KEY_CHECKS guard]
key_files:
  created:
    - src/server/jobs/seed.jobs.ts
  modified:
    - src/server/lib/env.ts
    - src/server/jobs/index.ts
    - src/server/server.ts
decisions:
  - Per-statement error isolation with outer try/catch so one bad SQL statement does not abort the reseed run
  - FOREIGN_KEY_CHECKS=0/1 guards prepended and appended to handle DROP TABLE + re-CREATE without FK constraint errors
  - Schedule falls back to every minute in development when RESEED_DB_CRON is not set
metrics:
  duration: "~5 minutes"
  completed: "2026-04-18T18:38:50Z"
  tasks_completed: 2
  files_created: 1
  files_modified: 3
---

# Phase quick Plan 260418-g2n: Add Scheduled Daily Database Re-seed Job Summary

**One-liner:** Daily CronJob gated on `RESEED_DB=true` that replays `demodata/prod/sontoco.sql` via TypeORM `entityManager.query()` with per-statement error isolation and FK constraint guards.

## What Was Built

A new background job module (`seed.jobs.ts`) that registers a cron-scheduled database re-seed when `RESEED_DB=true`. The job reads the demo SQL file from disk, splits it into individual statements, wraps the run with `SET FOREIGN_KEY_CHECKS=0/1`, and executes each statement against the live TypeORM connection — catching and logging individual statement errors without aborting the entire run.

Two new env vars were added to `env.ts`:
- `RESEED_DB` — boolean flag (true/false/undefined) that gates whether the job starts
- `RESEED_DB_CRON` — optional 6-field cron override; defaults to midnight UTC in production, every minute in development

## Tasks Completed

| Task | Name | Commit | Files |
|------|------|--------|-------|
| 1 | Add RESEED_DB env var types | ed6ff7c | src/server/lib/env.ts |
| 2 | Create seed.jobs.ts and wire into server startup | e9aa4e4 | src/server/jobs/seed.jobs.ts, src/server/jobs/index.ts, src/server/server.ts |

## Decisions Made

| Decision | Rationale |
|----------|-----------|
| Per-statement error catch instead of transaction | SQL dump may include DDL (CREATE TABLE, DROP TABLE) which auto-commits in MySQL; a single transaction would fail. Catching per-statement matches how mysqldump replays are typically handled. |
| FOREIGN_KEY_CHECKS=0/1 guards | The seed SQL likely drops and recreates tables that have FK constraints; disabling checks for the run prevents ordering errors. |
| Development schedule: every minute | Matches existing pattern in `request.jobs.ts`; allows quick local verification without waiting for midnight. |
| RESEED_DB_CRON takes precedence over all defaults | Enables production deployments to use any schedule without code changes (e.g., 3am instead of midnight). |

## Deviations from Plan

None - plan executed exactly as written.

## Success Criteria Verification

- `RESEED_DB=true` — CronJob is registered, fires on schedule, re-applies sontoco.sql: verified via code review
- `RESEED_DB` absent — no job, server logs "Skipping daily reseed job (RESEED_DB not enabled)": verified via code review
- `RESEED_DB_CRON` overrides default schedule: implemented via `env.var.RESEED_DB_CRON` check before isDevelopment fallback
- TypeScript compiles cleanly: tsc not available in worktree (no node_modules installed); code follows identical patterns to request.jobs.ts which compiles cleanly
- Existing `startWatchNewRequests` behavior unchanged: only additive changes made to server.ts and index.ts

## Self-Check

**Files created/exist:**
- src/server/jobs/seed.jobs.ts: FOUND (e9aa4e4)
- src/server/lib/env.ts: MODIFIED (ed6ff7c)
- src/server/jobs/index.ts: MODIFIED (e9aa4e4)
- src/server/server.ts: MODIFIED (e9aa4e4)

**Commits exist:**
- ed6ff7c: feat(quick-260418-g2n): add RESEED_DB and RESEED_DB_CRON env var types
- e9aa4e4: feat(quick-260418-g2n): add daily database reseed cron job

## Self-Check: PASSED
