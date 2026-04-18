---
phase: 02-zrok-public-access
fixed_at: 2026-04-18T00:00:00Z
fix_scope: critical_warning
findings_in_scope: 2
fixed: 2
skipped: 0
iteration: 1
status: all_fixed
---

# Phase 02: Code Review Fix Report

**Fixed at:** 2026-04-18
**Source review:** .planning/phases/02-zrok-public-access/02-REVIEW.md
**Iteration:** 1

**Summary:**
- Findings in scope: 2
- Fixed: 2
- Skipped: 0

## Fixed Issues

### CR-01: Plaintext Database Password in Healthcheck Command

**Files modified:** `docker-compose.yml`
**Commit:** c808740
**Applied fix:** Changed the MySQL healthcheck `test` from `["CMD", "mysqladmin", "ping", ..., "--password=${DB_PASSWORD}"]` to `["CMD-SHELL", "MYSQL_PWD=\"$DB_PASSWORD\" mysqladmin ping -h localhost -u \"$DB_USER\" --silent"]`. The password is now passed via the `MYSQL_PWD` environment variable rather than as a command-line argument, eliminating its exposure in process listings and `docker inspect` output.

### WR-01: MySQL Port Exposed on All Interfaces

**Files modified:** `docker-compose.yml`
**Commit:** 0ce6fee
**Applied fix:** Changed the MySQL port binding from `"3306:3306"` (binds to `0.0.0.0:3306`) to `"127.0.0.1:3306:3306"` (binds to localhost only). The web service accesses the database via the internal `sontoco-network` Docker network, so external binding on all interfaces was unnecessary and increased attack surface.

---

_Fixed: 2026-04-18_
_Fixer: Claude (gsd-code-fixer)_
_Iteration: 1_
